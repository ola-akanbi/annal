// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import {Test} from "forge-std/Test.sol";
import {IReactive} from "reactive-lib/interfaces/IReactive.sol";
import {ISystemContract} from "reactive-lib/interfaces/ISystemContract.sol";
import {IPayable} from "reactive-lib/interfaces/IPayable.sol";
import {AbstractPayer} from "reactive-lib/base/AbstractPayer.sol";
import {AbstractCallback} from "reactive-lib/base/AbstractCallback.sol";
import {AnnalReactive} from "../src/AnnalReactive.sol";
import {AnnalBook} from "../src/AnnalBook.sol";
import {LookalikeUSDC} from "../src/demo/LookalikeUSDC.sol";

/// @dev Stands in for Reactive's system contract at 0x8888…8888 inside the unit tests only.
///      It records subscriptions and callback requests so the tests can assert on them.
contract SystemRecorder {
    struct Sub {
        uint256 chainId;
        address contractAddr;
        uint256 topic0;
        uint256 topic1;
        uint256 topic2;
        uint256 topic3;
    }

    Sub[] public subs;
    ISystemContract.CallbackConfiguration_V_1_0[] internal _callbacks;

    function subscribe(uint256 c, address a, uint256 t0, uint256 t1, uint256 t2, uint256 t3) external {
        subs.push(Sub(c, a, t0, t1, t2, t3));
    }

    function requestCallbackV_1_0(ISystemContract.CallbackConfiguration_V_1_0 memory config) external {
        _callbacks.push(config);
    }

    function subCount() external view returns (uint256) {
        return subs.length;
    }

    function callbackCount() external view returns (uint256) {
        return _callbacks.length;
    }

    function callbackAt(uint256 i) external view returns (ISystemContract.CallbackConfiguration_V_1_0 memory) {
        return _callbacks[i];
    }

    function debt(address) external pure returns (uint256) {
        return 0;
    }
}

contract AnnalTest is Test {
    address constant SYSTEM_ADDR = 0x8888888888888888888888888888888888888888;
    uint256 constant REACTIVE_IGNORE = 0xa65f96fc951c35ead38878e0f0b7a3c744a6f5ccc1476b313353ce31712313ad;
    uint256 constant TRANSFER = 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef;

    uint256 constant SEPOLIA = 11155111;
    uint256 constant BASE_SEPOLIA = 84532;
    uint256 constant UNICHAIN_SEPOLIA = 1301;
    address constant USDC_SEPOLIA = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;
    address constant USDC_BASE = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    address constant USDC_UNICHAIN = 0x31d0220469e10c4E71834a79b1f276d740d3768F;

    address proxy = makeAddr("callbackProxy");
    address freelancer = makeAddr("freelancer");
    address client = makeAddr("client");
    address fakeUsdc = makeAddr("fakeUsdc");

    SystemRecorder sys;
    AnnalReactive reactive;
    AnnalBook book;

    function setUp() public {
        vm.etch(SYSTEM_ADDR, address(new SystemRecorder()).code);
        sys = SystemRecorder(SYSTEM_ADDR);

        uint256[] memory chains = new uint256[](3);
        address[] memory tokens = new address[](3);
        (chains[0], tokens[0]) = (SEPOLIA, USDC_SEPOLIA);
        (chains[1], tokens[1]) = (BASE_SEPOLIA, USDC_BASE);
        (chains[2], tokens[2]) = (UNICHAIN_SEPOLIA, USDC_UNICHAIN);

        // Same trick as the real deployment: predict the book's address, deploy the reactive side first.
        address predictedBook = vm.computeCreateAddress(address(this), vm.getNonce(address(this)) + 1);
        reactive = new AnnalReactive(BASE_SEPOLIA, predictedBook, chains, tokens);
        book = new AnnalBook(IPayable(payable(proxy)), address(reactive), chains, tokens);
        assertEq(address(book), predictedBook, "book address prediction");
    }

    // ---------- helpers ----------

    function _log(uint256 chainId, address token, uint256 topic0, uint256 t1, uint256 t2, bytes memory data)
        internal
        pure
        returns (IReactive.LogRecord memory l)
    {
        l.chainId = chainId;
        l.contractAddress = token;
        l.topic0 = topic0;
        l.topic1 = t1;
        l.topic2 = t2;
        l.topic3 = 0;
        l.data = data;
        l.blockNumber = 1234;
        l.opCode = 3;
        l.blockHash = 0xb10c;
        l.txHash = uint256(keccak256(abi.encode(chainId, t1, t2, data)));
        l.logIndex = 7;
    }

    function _transferLog(uint256 chainId, address token, address from, address to, uint256 amount)
        internal
        pure
        returns (IReactive.LogRecord memory)
    {
        return _log(chainId, token, TRANSFER, uint256(uint160(from)), uint256(uint160(to)), abi.encode(amount));
    }

    function _openedLog(address owner) internal view returns (IReactive.LogRecord memory) {
        return _log(BASE_SEPOLIA, address(book), reactive.BOOK_OPENED_TOPIC(), uint256(uint160(owner)), 0, "");
    }

    /// Delivers the last requested callback the way the proxy does: from the proxy, with the
    /// reactive contract's address written over the first argument.
    function _deliverLastCallback() internal {
        ISystemContract.CallbackConfiguration_V_1_0 memory cb = sys.callbackAt(sys.callbackCount() - 1);
        assertEq(cb.chainId, BASE_SEPOLIA);
        assertEq(cb.recipient, address(book));
        bytes memory payload = cb.payload;
        address rc = address(reactive);
        assembly {
            mstore(add(payload, 36), rc)
        }
        vm.prank(proxy);
        (bool ok, bytes memory ret) = address(book).call(payload);
        if (!ok) {
            assembly {
                revert(add(ret, 32), mload(ret))
            }
        }
    }

    function _openAndWatch(address owner) internal {
        vm.prank(owner);
        book.open();
        IReactive.LogRecord memory opened = _openedLog(owner); // built first: it makes an external call
        vm.prank(SYSTEM_ADDR);
        reactive.react(opened);
        _deliverLastCallback();
    }

    // ---------- deployment ----------

    function test_constructor_subscribesToBookOpened() public view {
        assertEq(sys.subCount(), 1);
        (uint256 c, address a, uint256 t0, uint256 t1, uint256 t2, uint256 t3) = sys.subs(0);
        assertEq(c, BASE_SEPOLIA);
        assertEq(a, address(book));
        assertEq(t0, reactive.BOOK_OPENED_TOPIC());
        assertEq(t1, REACTIVE_IGNORE);
        assertEq(t2, REACTIVE_IGNORE);
        assertEq(t3, REACTIVE_IGNORE);
    }

    function test_bookOpenedTopic_matchesEvent() public view {
        assertEq(reactive.BOOK_OPENED_TOPIC(), uint256(AnnalBook.BookOpened.selector));
    }

    function test_constructor_rejectsBadSources() public {
        uint256[] memory chains = new uint256[](1);
        address[] memory none = new address[](0);
        vm.expectRevert(AnnalReactive.LengthMismatch.selector);
        new AnnalReactive(BASE_SEPOLIA, address(book), chains, none);
        vm.expectRevert(AnnalReactive.NoSources.selector);
        new AnnalReactive(BASE_SEPOLIA, address(book), new uint256[](0), none);
    }

    // ---------- opening a book ----------

    function test_open_thenReactiveWatchesEveryChain() public {
        _openAndWatch(freelancer);
        assertTrue(reactive.watching(freelancer));
        assertEq(sys.subCount(), 4); // BookOpened + one per source chain
        for (uint256 i = 1; i < 4; ++i) {
            (uint256 c, address a, uint256 t0, uint256 t1, uint256 t2, uint256 t3) = sys.subs(i);
            (uint256 sc, address st) = reactive.source(i - 1);
            assertEq(c, sc);
            assertEq(a, st);
            assertEq(t0, TRANSFER);
            assertEq(t1, REACTIVE_IGNORE);
            assertEq(t2, uint256(uint160(freelancer)));
            assertEq(t3, REACTIVE_IGNORE);
        }
        assertGt(book.watchingSince(freelancer), 0);
    }

    function test_open_twiceReverts() public {
        vm.startPrank(freelancer);
        book.open();
        vm.expectRevert(abi.encodeWithSelector(AnnalBook.AlreadyOpened.selector, freelancer));
        book.open();
        vm.stopPrank();
    }

    function test_bookOpened_fromAnotherContract_isIgnored() public {
        IReactive.LogRecord memory l = _openedLog(freelancer);
        l.contractAddress = makeAddr("impostorBook");
        vm.prank(SYSTEM_ADDR);
        reactive.react(l);
        assertFalse(reactive.watching(freelancer));
        assertEq(sys.callbackCount(), 0);
    }

    function test_reopenLog_doesNotSubscribeTwice() public {
        _openAndWatch(freelancer);
        IReactive.LogRecord memory again = _openedLog(freelancer);
        vm.prank(SYSTEM_ADDR);
        reactive.react(again);
        assertEq(sys.subCount(), 4);
    }

    // ---------- copying payments ----------

    function test_payment_onEachChain_becomesALine() public {
        _openAndWatch(freelancer);
        uint256[3] memory chains = [SEPOLIA, BASE_SEPOLIA, UNICHAIN_SEPOLIA];
        address[3] memory tokens = [USDC_SEPOLIA, USDC_BASE, USDC_UNICHAIN];
        for (uint256 i = 0; i < 3; ++i) {
            IReactive.LogRecord memory l = _transferLog(chains[i], tokens[i], client, freelancer, (i + 1) * 1e6);
            vm.prank(SYSTEM_ADDR);
            reactive.react(l);
            _deliverLastCallback();

            AnnalBook.Line memory line = book.lineAt(freelancer, i);
            assertEq(line.originChainId, chains[i]);
            assertEq(line.token, tokens[i]);
            assertEq(line.payer, client);
            assertEq(line.amount, (i + 1) * 1e6);
            assertEq(line.originTxHash, bytes32(l.txHash));
            assertEq(line.logIndex, l.logIndex);
            assertEq(line.originBlock, l.blockNumber);
        }
        assertEq(book.lineCount(freelancer), 3);
        assertEq(book.totalReceived(freelancer), 6e6);
    }

    function test_fakeUsdc_isNeverCopied() public {
        _openAndWatch(freelancer);
        uint256 before = sys.callbackCount();
        vm.prank(SYSTEM_ADDR);
        reactive.react(_transferLog(BASE_SEPOLIA, fakeUsdc, client, freelancer, 1_000_000e6));
        assertEq(sys.callbackCount(), before, "no callback for a token that isn't a source");
        assertEq(book.lineCount(freelancer), 0);
    }

    function test_realUsdc_onWrongChain_isNeverCopied() public {
        _openAndWatch(freelancer);
        uint256 before = sys.callbackCount();
        vm.prank(SYSTEM_ADDR);
        reactive.react(_transferLog(SEPOLIA, USDC_BASE, client, freelancer, 5e6));
        assertEq(sys.callbackCount(), before);
    }

    function test_paymentToUnwatchedWallet_isIgnored() public {
        uint256 before = sys.callbackCount();
        vm.prank(SYSTEM_ADDR);
        reactive.react(_transferLog(BASE_SEPOLIA, USDC_BASE, client, freelancer, 5e6));
        assertEq(sys.callbackCount(), before);
    }

    function test_react_onlySystem() public {
        vm.expectRevert(abi.encodeWithSelector(AbstractPayer.NotAuthorized.selector, address(this), SYSTEM_ADDR));
        reactive.react(_transferLog(BASE_SEPOLIA, USDC_BASE, client, freelancer, 5e6));
    }

    // ---------- nobody writes by hand ----------

    function test_record_directCall_isRefused() public {
        _openAndWatch(freelancer);
        vm.prank(freelancer);
        vm.expectRevert(abi.encodeWithSelector(AbstractPayer.NotAuthorized.selector, freelancer, proxy));
        book.record(address(reactive), freelancer, client, 1e12, BASE_SEPOLIA, USDC_BASE, 1, 0xabc, 0);
    }

    function test_record_throughProxy_fromAnotherReactive_isRefused() public {
        _openAndWatch(freelancer);
        address other = makeAddr("otherReactive");
        vm.prank(proxy);
        vm.expectRevert(
            abi.encodeWithSelector(AbstractCallback.CallbackNotAuthorized.selector, other, address(reactive))
        );
        book.record(other, freelancer, client, 1e12, BASE_SEPOLIA, USDC_BASE, 1, 0xabc, 0);
    }

    function test_record_unknownSource_isRefusedByTheBookToo() public {
        _openAndWatch(freelancer);
        vm.prank(proxy);
        vm.expectRevert(abi.encodeWithSelector(AnnalBook.UnknownSource.selector, BASE_SEPOLIA, fakeUsdc));
        book.record(address(reactive), freelancer, client, 1e12, BASE_SEPOLIA, fakeUsdc, 1, 0xabc, 0);
    }

    function test_record_forUnopenedBook_isRefused() public {
        vm.prank(proxy);
        vm.expectRevert(abi.encodeWithSelector(AnnalBook.NotOpened.selector, freelancer));
        book.record(address(reactive), freelancer, client, 1e6, BASE_SEPOLIA, USDC_BASE, 1, 0xabc, 0);
    }

    function test_confirmWatching_directCall_isRefused() public {
        vm.prank(freelancer);
        book.open();
        vm.prank(freelancer);
        vm.expectRevert(abi.encodeWithSelector(AbstractPayer.NotAuthorized.selector, freelancer, proxy));
        book.confirmWatching(address(reactive), freelancer);
    }

    function test_duplicateDelivery_writesOnce() public {
        _openAndWatch(freelancer);
        vm.prank(SYSTEM_ADDR);
        reactive.react(_transferLog(BASE_SEPOLIA, USDC_BASE, client, freelancer, 2e6));
        _deliverLastCallback();
        _deliverLastCallback();
        assertEq(book.lineCount(freelancer), 1);
        assertEq(book.totalReceived(freelancer), 2e6);
    }

    // ---------- reading ----------

    function test_lines_pagination() public {
        _openAndWatch(freelancer);
        for (uint256 i = 0; i < 5; ++i) {
            IReactive.LogRecord memory l = _transferLog(BASE_SEPOLIA, USDC_BASE, client, freelancer, 1e6 + i);
            l.logIndex = i;
            vm.prank(SYSTEM_ADDR);
            reactive.react(l);
            _deliverLastCallback();
        }
        assertEq(book.lines(freelancer, 0, 2).length, 2);
        assertEq(book.lines(freelancer, 4, 10).length, 1);
        assertEq(book.lines(freelancer, 5, 10).length, 0);
        assertEq(book.lines(freelancer, 1, 1)[0].amount, 1e6 + 1);
    }

    // ---------- fuzz ----------

    function testFuzz_anyAmountAndPayer_copiedExactly(address payer, uint256 amount, uint256 logIndex) public {
        logIndex = bound(logIndex, 0, type(uint32).max);
        _openAndWatch(freelancer);
        IReactive.LogRecord memory l = _transferLog(UNICHAIN_SEPOLIA, USDC_UNICHAIN, payer, freelancer, amount);
        l.logIndex = logIndex;
        vm.prank(SYSTEM_ADDR);
        reactive.react(l);
        _deliverLastCallback();
        AnnalBook.Line memory line = book.lineAt(freelancer, 0);
        assertEq(line.payer, payer);
        assertEq(line.amount, amount);
        assertEq(line.logIndex, logIndex);
    }
}

contract LookalikeUSDCTest is Test {
    function test_lookalike_copiesUsdcMetadata_andMoves() public {
        LookalikeUSDC t = new LookalikeUSDC();
        assertEq(t.symbol(), "USDC");
        assertEq(t.decimals(), 6);
        address a = makeAddr("a");
        address b = makeAddr("b");
        t.mint(a, 5e6);
        vm.prank(a);
        t.transfer(b, 2e6);
        assertEq(t.balanceOf(b), 2e6);
        vm.prank(b);
        vm.expectRevert(LookalikeUSDC.InsufficientBalance.selector);
        t.transfer(a, 3e6);
    }
}
