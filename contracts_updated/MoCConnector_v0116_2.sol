pragma solidity ^0.5.8;

import "../contracts/base/MoCConnector.sol";

/**
  @dev Provides access control between all MoC Contracts
 */
contract MoCConnector_v0116_2 is MoCConnector {

  /************************************/
  /***** UPGRADE v0116_2       ***********/
  /************************************/
  
  event StableTokenMigrated(address oldStableTokenAddress_, address newStableTokenAddress_);
  
  /**
    @dev Migrates to a new stable token contract
    @param newStableTokenAddress_ new stable token contract address
  */
  function migrateStableToken(address newStableTokenAddress_) public {
    emit StableTokenMigrated(stableToken, newStableTokenAddress_);
    // remove stableToken from the whitelist
    remove(stableToken);
    stableToken = newStableTokenAddress_;
  }
}
