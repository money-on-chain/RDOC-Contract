pragma solidity ^0.5.8;
pragma experimental ABIEncoderV2;

import "../contracts/MoCState.sol";

contract MoCState_v0116_2 is MoCState {

  /************************************/
  /***** UPGRADE v0116_2       ***********/
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
