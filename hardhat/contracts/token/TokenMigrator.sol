// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title TokenMigrator
 * @notice This contract is used to migrate an ERC20 token from one
 * contract to another.
 * This contract holds the total amount of new token that can be migrated.
 * To migrate, tokens holder must approve for this contract their total balance of the legacy token.
 * The balance from the legacy token will be transfered from the user to the migrator, as it
 * is migrated (remaining there forever), and the exact amount of new tokens will be sent to the holder.
 */
contract TokenMigrator {
    using SafeERC20 for IERC20;

    error InsufficientLegacyTokenBalance();

    IERC20 public immutable legacyToken;
    IERC20 public immutable newToken;
    uint256 public _totalMigrated;

    /**
     * @notice emitted on migration
     * @param sender_ the caller of the migration
     * @param amount_ the amount being migrated
     */
    event TokenMigrated(address indexed sender_, address indexed user_, uint256 amount_);

    /**
     * @param legacyToken_ the address of the legacy token
     * @param newToken_ the address of the new token
     */
    constructor(IERC20 legacyToken_, IERC20 newToken_) {
        legacyToken = legacyToken_;
        newToken = newToken_;
    }

    /**
     * @notice executes the migration from legacy token to new token for `user_`.
     * `user_` must give legacy token allowance to this contract to transfer legacy token before
     *  executing this transaction.
     * The migration ratio is 1:1
     * @param user_ address who migrates the tokens
     */
    function _migrateToken(address user_) internal {
        uint256 amount = legacyToken.balanceOf(user_);
        if (amount == 0) revert InsufficientLegacyTokenBalance();
        _totalMigrated += amount;
        legacyToken.safeTransferFrom(user_, address(this), amount);
        newToken.safeTransfer(user_, amount);
        emit TokenMigrated(msg.sender, user_, amount);
    }

    /**
     * @notice executes the migration from legacyt oken to newToken for function caller.
     * Caller must give legacyt oken allowance to this contract to transfer legacyt oken before
     * executing this transaction.
     * The migration ratio is 1:1
     */
    function migrateToken() external {
        _migrateToken(msg.sender);
    }

    /**
     * @notice executes the migration from legacy token to new token for `user_`.
     * `user_` must give legacy token allowance to this contract to transfer legacy token before
     * executing this transaction.
     * The migration ratio is 1:1
     * @param user_ address who migrates the tokens
     */
    function migrateTokenFrom(address user_) external {
        _migrateToken(user_);
    }
}
