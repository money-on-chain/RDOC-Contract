pragma solidity ^0.5.8;
pragma experimental ABIEncoderV2;

import "./MoCState_v0115.sol";

contract MoCState_v0116 is MoCState_v0115 {

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
    stableToken = IERC20(newStableTokenAddress_);
  }
}
