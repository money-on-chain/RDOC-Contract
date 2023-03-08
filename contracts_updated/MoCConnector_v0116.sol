pragma solidity ^0.5.8;

import "./MoCConnector_v0115.sol";

/**
  @dev Provides access control between all MoC Contracts
 */
contract MoCConnector_v0116 is MoCConnector_v0115 {

  /************************************/
  /***** UPGRADE v0116       ***********/
  /************************************/
  
  event StableTokenMigrated(address oldStableTokenAddress_, address newStableTokenAddress_);
  
  /**
    @dev Migrates to a new stable token contract
    @param newStableTokenAddress_ new stable token contract address
  */
  function migrateStableToken(address newStableTokenAddress_) public {
    emit StableTokenMigrated(stableToken, newStableTokenAddress_);
    stableToken = newStableTokenAddress_;
  }
}
