pragma solidity ^0.5.8;

import "./MoCConnector_v020.sol";

/**
  @dev Provides access control between all MoC Contracts
 */
contract MoCConnector_v021 is MoCConnector_v020 {

  /************************************/
  /***** UPGRADE v021       ***********/
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
