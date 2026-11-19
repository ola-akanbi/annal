// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import {AbstractCallback} from "reactive-lib/base/AbstractCallback.sol";
import {IPayable} from "reactive-lib/interfaces/IPayable.sol";
import {IAnnalBook} from "./IAnnalBook.sol";

/// @title AnnalBook
/// @notice One income book per wallet, across chains. It has no owner and no admin function.
///         A wallet can open its own book. It cannot write in it, and neither can anyone else: lines are
///         written only by the callback proxy, on behalf of the one reactive contract fixed at deployment,
///         and only for the (chain, token) sources fixed at deployment.
///         Every line keeps the origin chain, transaction hash and log index, so it can be checked
///         against the payment it was copied from.
contract AnnalBook is AbstractCallback, IAnnalBook {
    struct Line {
        address token;
        uint64 originChainId;
        uint32 logIndex;
        address payer;
        uint64 originBlock;
        uint32 writtenAt;
        uint256 amount;
        bytes32 originTxHash;
    }

    /// @notice When each wallet opened its book (0 = not opened).
    mapping(address owner => uint64) public openedAt;
    /// @notice When the reactive contract confirmed it watches each wallet (0 = not yet).
    mapping(address owner => uint64) public watchingSince;
    /// @notice Sum of every line's amount, per wallet. All sources are 6-decimal USDC.
    mapping(address owner => uint256) public totalReceived;
    /// @notice Whether a (chain, token) pair may appear in a line. Fixed at deployment.
    mapping(uint256 chainId => mapping(address token => bool)) public isSource;
    /// @notice Origin logs already written, keyed by keccak256(chainId, txHash, logIndex).
    mapping(bytes32 originKey => bool) public written;

    mapping(address owner => Line[]) private _lines;

    event BookOpened(address indexed owner);
    event WatchingConfirmed(address indexed owner);
    event LineWritten(
        address indexed owner,
        uint256 indexed index,
        uint256 indexed originChainId,
        bytes32 originTxHash,
        uint256 logIndex,
        address token,
        address payer,
        uint256 amount
    );
    event DuplicateIgnored(address indexed owner, uint256 originChainId, bytes32 originTxHash, uint256 logIndex);

    error AlreadyOpened(address owner);
    error NotOpened(address owner);
    error UnknownSource(uint256 chainId, address token);
    error LengthMismatch();
    error ValueTooLarge(uint256 value);

    /// @param callbackProxy The Reactive callback proxy on this chain.
    /// @param reactive The AnnalReactive contract on Reactive Network allowed to write.
    /// @param chainIds Source chain IDs, paired index for index with `tokens`.
    /// @param tokens The USDC contract on each source chain.
    constructor(IPayable callbackProxy, address reactive, uint256[] memory chainIds, address[] memory tokens)
        payable
        AbstractCallback(callbackProxy, reactive)
    {
        if (chainIds.length != tokens.length) revert LengthMismatch();
        for (uint256 i = 0; i < chainIds.length; ++i) {
            isSource[chainIds[i]][tokens[i]] = true;
        }
    }

    /// @notice Opens the caller's book. Reactive Network picks up the event and starts watching the caller.
    function open() external {
        if (openedAt[msg.sender] != 0) revert AlreadyOpened(msg.sender);
        openedAt[msg.sender] = _u64(block.timestamp);
        emit BookOpened(msg.sender);
    }

    /// @inheritdoc IAnnalBook
    function confirmWatching(address reactive, address owner)
        external
        onlyServiceProvider
        onlyCallbackSender(reactive)
    {
        if (openedAt[owner] == 0) revert NotOpened(owner);
        if (watchingSince[owner] == 0) {
            watchingSince[owner] = _u64(block.timestamp);
            emit WatchingConfirmed(owner);
        }
    }

    /// @inheritdoc IAnnalBook
    function record(
        address reactive,
        address owner,
        address payer,
        uint256 amount,
        uint256 originChainId,
        address token,
        uint256 originBlock,
        uint256 originTxHash,
        uint256 logIndex
    ) external onlyServiceProvider onlyCallbackSender(reactive) {
        if (openedAt[owner] == 0) revert NotOpened(owner);
        if (!isSource[originChainId][token]) revert UnknownSource(originChainId, token);
        _write(
            owner,
            Line({
                token: token,
                originChainId: _u64(originChainId),
                logIndex: _u32(logIndex),
                payer: payer,
                originBlock: _u64(originBlock),
                writtenAt: _u32(block.timestamp),
                amount: amount,
                originTxHash: bytes32(originTxHash)
            })
        );
    }

    function _write(address owner, Line memory line) private {
        bytes32 key = keccak256(abi.encode(uint256(line.originChainId), line.originTxHash, uint256(line.logIndex)));
        if (written[key]) {
            emit DuplicateIgnored(owner, line.originChainId, line.originTxHash, line.logIndex);
            return;
        }
        written[key] = true;
        uint256 index = _lines[owner].length;
        _lines[owner].push(line);
        totalReceived[owner] += line.amount;
        emit LineWritten(
            owner, index, line.originChainId, line.originTxHash, line.logIndex, line.token, line.payer, line.amount
        );
    }

    /// @notice Settles any debt to the callback proxy from this contract's own balance. Open to anyone.
    function coverDebt() external {
        _coverDebt();
    }

    /// @dev Narrowing with a check: a value that doesn't fit reverts instead of being silently truncated.
    function _u64(uint256 v) private pure returns (uint64) {
        if (v > type(uint64).max) revert ValueTooLarge(v);
        // forge-lint: disable-next-line(unsafe-typecast)
        return uint64(v);
    }

    function _u32(uint256 v) private pure returns (uint32) {
        if (v > type(uint32).max) revert ValueTooLarge(v);
        // forge-lint: disable-next-line(unsafe-typecast)
        return uint32(v);
    }

    /// @notice Number of lines in `owner`'s book.
    function lineCount(address owner) external view returns (uint256) {
        return _lines[owner].length;
    }

    /// @notice One line by index.
    function lineAt(address owner, uint256 index) external view returns (Line memory) {
        return _lines[owner][index];
    }

    /// @notice A page of lines, oldest first.
    function lines(address owner, uint256 offset, uint256 limit) external view returns (Line[] memory page) {
        Line[] storage all = _lines[owner];
        if (offset >= all.length) return new Line[](0);
        uint256 end = offset + limit;
        if (end > all.length) end = all.length;
        page = new Line[](end - offset);
        for (uint256 i = offset; i < end; ++i) {
            page[i - offset] = all[i];
        }
    }
}
