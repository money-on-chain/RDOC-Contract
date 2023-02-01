pragma solidity ^0.5.8;
pragma experimental ABIEncoderV2;

import "../contracts/MoCExchange.sol";

contract MoCExchange_v0116 is MoCExchange {
  using Math for uint256;
  using SafeMath for uint256;

  /************************************/
  /***** UPGRADE v0116       ***********/
  /************************************/
  
  event StableTokenMigrated(address oldStableTokenAddress_, address newStableTokenAddress_);
  
  /**
    @dev Migrates to a new stable token contract
      Mints the new tokens to bridge contract in the same amount of the total supply of the old ones,
      so that they can later be exchanged.
      This contract must have minter and burner roles set on it
    @param newStableTokenAddress_ new stable token contract address
    @param bridgeAddress_ contract that will receive the new tokens and be able to distribute them
  */
  function migrateStableToken(address newStableTokenAddress_, address bridgeAddress_) public {
    uint256 totalSupply = stableToken.totalSupply();
    emit StableTokenMigrated(address(stableToken), newStableTokenAddress_);
    stableToken = StableToken(newStableTokenAddress_);
    stableToken.mint(bridgeAddress_, totalSupply);
  }
}
