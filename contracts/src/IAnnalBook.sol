// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

/// @title IAnnalBook
/// @notice The callback surface of the Annal book. Both functions can only be reached through the
///         Reactive callback proxy on the book's chain, on behalf of the one authorised reactive contract.
///         The first argument of each is the reactive contract's address: Reactive Network overwrites it
///         with the requesting contract's address, so the sender passes `address(0)`.
interface IAnnalBook {
    /// @notice Confirms that the reactive contract now watches `owner` on every source chain.
    function confirmWatching(address reactive, address owner) external;

    /// @notice Writes one line: a USDC transfer to `owner`, copied field for field from the origin log.
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
    ) external;
}
