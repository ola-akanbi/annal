// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import {AbstractReactive} from "reactive-lib/base/AbstractReactive.sol";
import {ISystemContract} from "reactive-lib/interfaces/ISystemContract.sol";
import {IAnnalBook} from "./IAnnalBook.sol";

/// @title AnnalReactive
/// @notice Runs on Reactive Network. It has no owner and no admin function.
///         1. At deployment it subscribes to `BookOpened` on the book.
///         2. When a wallet opens a book, it subscribes to Circle USDC `Transfer` events *to that wallet*
///            on every source chain, then confirms on the book that it is watching.
///         3. Every matching transfer is copied, field for field, into the book through a callback.
///         Nothing else can make it write: the only inputs are origin-chain logs delivered by the system contract.
contract AnnalReactive is AbstractReactive {
    /// @dev keccak256("Transfer(address,address,uint256)")
    uint256 public constant TRANSFER_TOPIC = 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef;
    /// @dev keccak256("BookOpened(address)")
    uint256 public constant BOOK_OPENED_TOPIC = uint256(keccak256("BookOpened(address)"));
    /// @notice Gas forwarded to each callback on the book's chain.
    uint64 public constant CALLBACK_GAS_LIMIT = 400_000;

    /// @notice Chain the book lives on.
    uint256 public immutable BOOK_CHAIN_ID;
    /// @notice The book every line is written to.
    address public immutable BOOK;

    uint256[] private _sourceChainIds;
    address[] private _sourceTokens;

    /// @notice Wallets whose USDC transfers are being watched.
    mapping(address owner => bool) public watching;

    event Watching(address indexed owner);
    event Copied(address indexed owner, uint256 indexed originChainId, uint256 originTxHash, uint256 logIndex);

    error NoSources();
    error LengthMismatch();
    error ZeroBook();

    /// @param bookChainId Chain ID of the book's chain.
    /// @param book Address of the book (predicted before deployment; see docs/CONTEXT.md, "Deploy order").
    /// @param chainIds Source chain IDs, paired index for index with `tokens`.
    /// @param tokens The USDC contract on each source chain.
    constructor(uint256 bookChainId, address book, uint256[] memory chainIds, address[] memory tokens) payable {
        if (book == address(0)) revert ZeroBook();
        if (chainIds.length == 0) revert NoSources();
        if (chainIds.length != tokens.length) revert LengthMismatch();
        BOOK_CHAIN_ID = bookChainId;
        BOOK = book;
        _sourceChainIds = chainIds;
        _sourceTokens = tokens;
        SYSTEM.subscribe(bookChainId, book, BOOK_OPENED_TOPIC, REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
    }

    /// @notice Number of (chain, token) sources.
    function sourceCount() external view returns (uint256) {
        return _sourceChainIds.length;
    }

    /// @notice One source by index.
    function source(uint256 index) external view returns (uint256 chainId, address token) {
        return (_sourceChainIds[index], _sourceTokens[index]);
    }

    /// @notice Entry point for logs matching this contract's subscriptions. Only the system contract may call it.
    function react(LogRecord calldata log) external onlySystem {
        if (log.topic0 == BOOK_OPENED_TOPIC) {
            if (log.chainId == BOOK_CHAIN_ID && log.contractAddress == BOOK) {
                _watch(_topicAddress(log.topic1));
            }
            return;
        }
        if (log.topic0 == TRANSFER_TOPIC && _isSource(log.chainId, log.contractAddress)) {
            address owner = _topicAddress(log.topic2);
            if (!watching[owner]) return;
            _copy(owner, log);
        }
        // Anything else falls through. Reverting here would still be billed (docs/CONTEXT.md, Traps).
    }

    /// @notice Settles any debt to the system contract from this contract's own balance. Open to anyone,
    ///         so anyone can fund and revive it.
    function coverDebt() external {
        _coverDebt();
    }

    function _watch(address owner) private {
        if (watching[owner]) return;
        watching[owner] = true;
        emit Watching(owner);
        uint256 n = _sourceChainIds.length;
        for (uint256 i = 0; i < n; ++i) {
            // Bounded by the sources fixed at deployment (three); the callee is Reactive's system contract.
            // forge-lint: disable-start(calls-loop)
            SYSTEM.subscribe(
                _sourceChainIds[i],
                _sourceTokens[i],
                TRANSFER_TOPIC,
                REACTIVE_IGNORE,
                uint256(uint160(owner)),
                REACTIVE_IGNORE
            );
            // forge-lint: disable-end(calls-loop)
        }
        _callback(abi.encodeCall(IAnnalBook.confirmWatching, (address(0), owner)));
    }

    function _copy(address owner, LogRecord calldata log) private {
        uint256 amount = abi.decode(log.data, (uint256));
        emit Copied(owner, log.chainId, log.txHash, log.logIndex);
        _callback(
            abi.encodeCall(
                IAnnalBook.record,
                (
                    address(0),
                    owner,
                    _topicAddress(log.topic1),
                    amount,
                    log.chainId,
                    log.contractAddress,
                    log.blockNumber,
                    log.txHash,
                    log.logIndex
                )
            )
        );
    }

    function _callback(bytes memory payload) private {
        SYSTEM.requestCallbackV_1_0(
            ISystemContract.CallbackConfiguration_V_1_0({
                chainId: BOOK_CHAIN_ID, recipient: BOOK, gasLimit: CALLBACK_GAS_LIMIT, payload: payload
            })
        );
    }

    /// @dev An indexed `address` parameter occupies the low 20 bytes of its topic, left-padded with zeros.
    function _topicAddress(uint256 topic) private pure returns (address) {
        // forge-lint: disable-next-line(unsafe-typecast)
        return address(uint160(topic));
    }

    function _isSource(uint256 chainId, address token) private view returns (bool) {
        uint256 n = _sourceChainIds.length;
        for (uint256 i = 0; i < n; ++i) {
            if (_sourceChainIds[i] == chainId && _sourceTokens[i] == token) return true;
        }
        return false;
    }
}
