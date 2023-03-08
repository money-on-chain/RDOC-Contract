pragma solidity ^0.5.8;
import "./MoC_v0115.sol";

contract MoC_v0116 is MoC_v0115 {

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
