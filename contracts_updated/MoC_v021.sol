pragma solidity ^0.5.8;
import "./MoC_v020.sol";

contract MoC_v021 is MoC_v020 {

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
