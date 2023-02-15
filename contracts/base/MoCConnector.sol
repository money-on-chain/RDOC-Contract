pragma solidity ^0.5.8;

import "zos-lib/contracts/Initializable.sol";

import "./MoCWhitelist.sol";

/**
  @dev Provides access control between all MoC Contracts
 */
contract MoCConnector is MoCWhitelist, Initializable {
  // References
  address payable public moc;
  address public stableToken;
  address public riskProToken;
  address public riskProxManager;
  address public mocState;
  /** DEPRECATED **/
  // solium-disable-next-line mixedcase
  address public DEPRECATED_mocConverter;
  address public mocSettlement;
  address public mocExchange;
  address public mocInrate;
  /** DEPRECATED mocBurnout **/
  address public mocBurnout;
  address public reserveToken;

  bool internal initialized;

  /**
    @dev Initializes the contract
    @param mocAddress MoC contract address
    @param stableTokenAddress Stable token contract address
    @param riskProAddress RiskPro token contract address
    @param riskProxAddress RiskProxManager contract address
    @param stateAddress MoCState contract address
    @param settlementAddress MoCSettlement contract address
    @param exchangeAddress MoCExchange contract address
    @param inrateAddress MoCInrate contract address
    @param burnoutBookAddress (DEPRECATED) MoCBurnout contract address. DO NOT USE.
    @param reserveTokenAddress Reserve token contract address
  */
  function initialize(
    address payable mocAddress,
    address stableTokenAddress,
    address riskProAddress,
    address riskProxAddress,
    address stateAddress,
    address settlementAddress,
    address exchangeAddress,
    address inrateAddress,
    address burnoutBookAddress,
    address reserveTokenAddress
  ) public initializer {
    moc = mocAddress;
    stableToken = stableTokenAddress;
    riskProToken = riskProAddress;
    riskProxManager = riskProxAddress;
    mocState = stateAddress;
    mocSettlement = settlementAddress;
    mocExchange = exchangeAddress;
    mocInrate = inrateAddress;
    mocBurnout = burnoutBookAddress;
    reserveToken = reserveTokenAddress;

    // Add to Whitelist
    add(mocAddress);
    add(stableTokenAddress);
    add(riskProAddress);
    add(riskProxAddress);
    add(stateAddress);
    add(settlementAddress);
    add(exchangeAddress);
    add(inrateAddress);
    add(burnoutBookAddress);
    add(reserveTokenAddress);
  }

  /************************************/
  /***** UPGRADE v021       ***********/
  /************************************/
  
  // DEPRECATED. 
  // This function was used atomically in upgrade v020 to migrate stableTokenV1 to stableTokenV2
  // After that, it is removed in this contract version to cannot be called more than once.
  //
  // event StableTokenMigrated(address oldStableTokenAddress_, address newStableTokenAddress_);
  //
  // /**
  //   @dev Migrates to a new stable token contract
  //   @param newStableTokenAddress_ new stable token contract address
  // */
  // function migrateStableToken(address newStableTokenAddress_) public {
  //   emit StableTokenMigrated(stableToken, newStableTokenAddress_);  
  //   stableToken = newStableTokenAddress_;
  // }
  
  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}
