// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenMigrator {
    IERC20 public immutable tokenV1;
    IERC20 public immutable tokenV2;
    uint256 public _totalMigrated;

    /**
     * @notice emitted on migration
     * @param sender_ the caller of the migration
     * @param amount_ the amount being migrated
     */
    event TokenMigrated(address indexed sender_, uint256 amount_);

    /**
     * @param tokenV1_ the address of the old token
     * @param tokenV2_ the address of the new token
     */
    constructor(IERC20 tokenV1_, IERC20 tokenV2_) {
        tokenV1 = tokenV1_;
        tokenV2 = tokenV2_;
    }

    /**
     * @notice executes the migration from Token V1 to Token V2.
     * Users need to give allowance to this contract to transfer Token V1 before executing this transaction.
     * The migration ratio is 1:1
     * @param amount_ the amount of Token V1 to be migrated
     */
    function migrateToken(uint256 amount_) external {
        _totalMigrated += amount_;
        tokenV1.transferFrom(msg.sender, address(this), amount_);
        tokenV2.transfer(msg.sender, amount_);
        emit TokenMigrated(msg.sender, amount_);
    }
}
