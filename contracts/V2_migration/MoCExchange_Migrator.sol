pragma solidity ^0.5.8;
pragma experimental ABIEncoderV2;

import "../MoCExchange.sol";

contract MoCExchange_Migrator is MoCExchange {

  function migrateToV2(address mocV2Address_) external {
    // transfer riskProToken ownership and minter role
    riskProToken.transferOwnership(mocV2Address_);
    riskProToken.addMinter(mocV2Address_);
    riskProToken.renounceMinter();
    // transfer stableToken roles
    IStableTokenV2(address(stableToken)).transferAllRoles(mocV2Address_);
  }
}

interface IStableTokenV2 {
  /**
     * @dev Grants all `roles` to `account` while sender renounces to all ``role``
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     * - no one else must have any other role
     *
     * May emit a {RoleGranted x3, RoleRevoked x3} event.
     */
    function transferAllRoles(address account) external;
}