pragma solidity ^0.5.8;
pragma experimental ABIEncoderV2;

import "zos-lib/contracts/upgradeability/AdminUpgradeabilityProxy.sol";
import "moc-governance/contracts/Governance/ChangeContract.sol";
import "moc-governance/contracts/Upgradeability/UpgradeDelegator.sol";
import "../../contracts_updated/MoC_v0116.sol";
import "../../contracts_updated/MoCConnector_v0116.sol";
import "../../contracts_updated/MoCExchange_v0116.sol";
import "../../contracts_updated/MoCState_v0116.sol";
import "../../contracts_updated/MoCSettlement_v0116.sol";


/**
  @title StableTokenMigrationChanger
 */
contract StableTokenMigrationChanger is ChangeContract {
  UpgradeDelegator public upgradeDelegator;
  address public stableTokenV2;
  address public tokenMigrator;

  // MoC
  AdminUpgradeabilityProxy public mocProxy;
  address public mocCurrentImp;
  address public mocAtomicImp;
  // MocConnector
  AdminUpgradeabilityProxy public mocConnectorProxy;
  address public mocConnectorCurrentImp;
  address public mocConnectorAtomicImp;
  // MocExchange
  AdminUpgradeabilityProxy public mocExchangeProxy;
  address public mocExchangeCurrentImp;
  address public mocExchangeAtomicImp;
  // MocState
  AdminUpgradeabilityProxy public mocStateProxy;
  address public mocStateCurrentImp;
  address public mocStateAtomicImp;
  // MocSettlement
  AdminUpgradeabilityProxy public mocSettlementProxy;
  address public mocSettlementCurrentImp;
  address public mocSettlementAtomicImp;

  // to avoid stack too deep error
  struct ConstructorParams {
    UpgradeDelegator upgradeDelegator;
    address stableTokenV2;
    address tokenMigrator;
    AdminUpgradeabilityProxy mocProxy;
    address mocAtomicImp;
    AdminUpgradeabilityProxy mocConnectorProxy;
    address mocConnectorAtomicImp;
    AdminUpgradeabilityProxy mocExchangeProxy;
    address mocExchangeAtomicImp;
    AdminUpgradeabilityProxy mocStateProxy;
    address mocStateAtomicImp;
    AdminUpgradeabilityProxy mocSettlementProxy;
    address mocSettlementAtomicImp;
  }

  /**
    @notice Constructor
    @param _constructorParams constructor parameters
      upgradeDelegator Address of the upgradeDelegator in charge of that proxy
      stableTokenV2 Address of the new Stable Token to migrate
      tokenMigrator Address of the Token Migrator contract who recives Stable Token V1 
        and makes the swaps to Stable Token V2
      mocProxy MoC proxy address
      mocAtomicImp MoC atomic implementation address
      mocConnectorProxy MoCConnector proxy address
      mocConnectorAtomicImp MoCConnector atomic implementation address
      mocExchangeProxy MoCExchange proxy address
      mocExchangeAtomicImp MoCExchange atomic implementation address
      mocStateProxy MoCState proxy address
      mocStateAtomicImp MoCState atomic implementation address
      mocSettlementProxy MoCSettlement proxy address
      mocSettlementAtomicImp MoCSettlement atomic implementation address
  */
  constructor(ConstructorParams memory _constructorParams) public {
    upgradeDelegator = _constructorParams.upgradeDelegator;
    stableTokenV2 = _constructorParams.stableTokenV2;
    tokenMigrator = _constructorParams.tokenMigrator;
    // MoC
    mocProxy = _constructorParams.mocProxy;
    mocCurrentImp = upgradeDelegator.getProxyImplementation(_constructorParams.mocProxy);
    mocAtomicImp = _constructorParams.mocAtomicImp;
    // MocConnector
    mocConnectorProxy = _constructorParams.mocConnectorProxy;
    mocConnectorCurrentImp = upgradeDelegator.getProxyImplementation(_constructorParams.mocConnectorProxy);
    mocConnectorAtomicImp = _constructorParams.mocConnectorAtomicImp;
    // MocExchange
    mocExchangeProxy = _constructorParams.mocExchangeProxy;
    mocExchangeCurrentImp = upgradeDelegator.getProxyImplementation(_constructorParams.mocExchangeProxy);
    mocExchangeAtomicImp = _constructorParams.mocExchangeAtomicImp;
    // MocState
    mocStateProxy = _constructorParams.mocStateProxy;
    mocStateCurrentImp = upgradeDelegator.getProxyImplementation(_constructorParams.mocStateProxy);
    mocStateAtomicImp = _constructorParams.mocStateAtomicImp;
    // MocSettlement
    mocSettlementProxy = _constructorParams.mocSettlementProxy;
    mocSettlementCurrentImp = upgradeDelegator.getProxyImplementation(_constructorParams.mocSettlementProxy);
    mocSettlementAtomicImp = _constructorParams.mocSettlementAtomicImp;
  }

  /**
    @notice Execute the changes.
    @dev Should be called by the governor, but this contract does not check that explicitly because it is not its responsability in
    the current architecture
    IMPORTANT: This function should not be overriden, you should only redefine the _beforeUpgrade and _afterUpgrade to use this template
   */
  function execute() external {
    _beforeUpgrade();
    _upgrade();
    _afterUpgrade();
  }

  /**
    @notice Upgrade the proxy to the newImplementation
    @dev IMPORTANT: This function should not be overriden
   */
  function _upgrade() internal {
    MoC_v0116(address(mocProxy)).migrateStableToken(stableTokenV2);
    MoCConnector_v0116(address(mocConnectorProxy)).migrateStableToken(stableTokenV2);
    MoCExchange_v0116(address(mocExchangeProxy)).migrateStableToken(stableTokenV2, tokenMigrator);
    MoCState_v0116(address(mocStateProxy)).migrateStableToken(stableTokenV2);
    MoCSettlement_v0116(address(mocSettlementProxy)).migrateStableToken(stableTokenV2);

    // upgrade again to the current implementation, we don't want that Atomicimplementation be alive more than
    // this atomic transaction
    // MoC
    upgradeDelegator.upgrade(mocProxy, mocCurrentImp);
    // MocConnector
    upgradeDelegator.upgrade(mocConnectorProxy, mocConnectorCurrentImp);
    // MocExchange
    upgradeDelegator.upgrade(mocExchangeProxy, mocExchangeCurrentImp);
    // MocState
    upgradeDelegator.upgrade(mocStateProxy, mocStateCurrentImp);
    // MocSettlement
    upgradeDelegator.upgrade(mocSettlementProxy, mocSettlementCurrentImp);
  }

  /**
    @notice Intended to prepare the system for the upgrade
    @dev This function can be overriden by child changers to upgrade contracts that require some preparation before the upgrade
   */
  function _beforeUpgrade() internal {
    // MoC
    upgradeDelegator.upgrade(mocProxy, mocAtomicImp);
    // MocConnector
    upgradeDelegator.upgrade(mocConnectorProxy, mocConnectorAtomicImp);
    // MocExchange
    upgradeDelegator.upgrade(mocExchangeProxy, mocExchangeAtomicImp);
    // MocState
    upgradeDelegator.upgrade(mocStateProxy, mocStateAtomicImp);
    // MocSettlement
    upgradeDelegator.upgrade(mocSettlementProxy, mocSettlementAtomicImp);
  }

  /**
    @notice Intended to do the final tweaks after the upgrade, for example initialize the contract
    @dev This function can be overriden by child changers to upgrade contracts that require some changes after the upgrade
   */
  function _afterUpgrade() internal {
    // verify that all proxies finish the process with the original implementation
    require(upgradeDelegator.getProxyImplementation(mocProxy) == mocCurrentImp, "Wrong MoC implementation");
    require(upgradeDelegator.getProxyImplementation(mocConnectorProxy) == mocConnectorCurrentImp, "Wrong MoCConnector implementation");
    require(upgradeDelegator.getProxyImplementation(mocExchangeProxy) == mocExchangeCurrentImp, "Wrong MoCExchange implementation");
    require(upgradeDelegator.getProxyImplementation(mocStateProxy) == mocStateCurrentImp, "Wrong MoCState implementation");
    require(upgradeDelegator.getProxyImplementation(mocSettlementProxy) == mocSettlementCurrentImp, "Wrong MoCSettlement implementation");
  }
}
