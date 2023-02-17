pragma solidity ^0.5.8;

import "./MoCSettlement_v020.sol";

contract MoCSettlement_v021 is MoCSettlement_v020 {

  /************************************/
  /***** UPGRADE v021       ***********/
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
