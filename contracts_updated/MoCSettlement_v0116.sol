pragma solidity ^0.5.8;

import "./MoCSettlement_v0115.sol";

contract MoCSettlement_v0116 is MoCSettlement_v0115 {

  /************************************/
  /***** UPGRADE v0116       ***********/
  /************************************/

  event StableTokenMigrated(address oldStableTokenAddress_, address newStableTokenAddress_);

  /**
    @dev Migrates to a new stable token contract
    @param newStableTokenAddress_ new stable token contract address
  */
  function migrateStableToken(address newStableTokenAddress_) public {
    emit StableTokenMigrated(address(stableToken), newStableTokenAddress_);
    stableToken = StableToken(newStableTokenAddress_);
  }
}
