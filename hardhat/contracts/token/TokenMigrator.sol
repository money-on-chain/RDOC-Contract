// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenMigrator {
    error InsufficientTokenV1Balance();

    IERC20 public immutable tokenV1;
    IERC20 public immutable tokenV2;
    uint256 public _totalMigrated;

    /**
     * @notice emitted on migration
     * @param sender_ the caller of the migration
     * @param amount_ the amount being migrated
     */
    event TokenMigrated(address indexed sender_, address indexed user_, uint256 amount_);

    /**
     * @param tokenV1_ the address of the old token
     * @param tokenV2_ the address of the new token
     */
    constructor(IERC20 tokenV1_, IERC20 tokenV2_) {
        tokenV1 = tokenV1_;
        tokenV2 = tokenV2_;
    }

    /**
     * @notice executes the migration from Token V1 to Token V2 for `user_`.
     * `user_` must give Token V1 allowance to this contract to transfer Token V1 before executing this transaction.
     * The migration ratio is 1:1
     * @param user_ address who migrates the tokens
     */
    function _migrateToken(address user_) internal {
        uint256 amount = tokenV1.balanceOf(user_);
        if (amount == 0) revert InsufficientTokenV1Balance();
        _totalMigrated += amount;
        tokenV1.transferFrom(user_, address(this), amount);
        tokenV2.transfer(user_, amount);
        emit TokenMigrated(msg.sender, user_, amount);
    }

    /**
     * @notice executes the migration from Token V1 to Token V2 for function caller.
     * Caller must give Token V1 allowance to this contract to transfer Token V1 before executing this transaction.
     * The migration ratio is 1:1
     */
    function migrateToken() external {
        _migrateToken(msg.sender);
    }

    /**
     * @notice executes the migration from Token V1 to Token V2 for `user_`.
     * `user_` must give Token V1 allowance to this contract to transfer Token V1 before executing this transaction.
     * The migration ratio is 1:1
     * @param user_ address who migrates the tokens
     */
    function migrateTokenFrom(address user_) external {
        _migrateToken(user_);
    }
}
