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

  /**
    @notice Constructor
    @param _upgradeDelegator Address of the upgradeDelegator in charge of that proxy
    @param _stableTokenV2 Address of the new Stable Token to migrate
    @param _tokenMigrator Address of the Token Migrator contract who recives Stable Token V1 
        and makes the swaps to Stable Token V2
    @param _mocProxy MoC proxy address
    @param _mocAtomicImp MoC atomic implementation address
    @param _mocConnectorAtomicImp MoCConnector atomic implementation address
    @param _mocExchangeAtomicImp MoCExchange atomic implementation address
    @param _mocStateAtomicImp MoCState atomic implementation address
    @param _mocSettlementAtomicImp MoCSettlement atomic implementation address
  */
  constructor(
    UpgradeDelegator _upgradeDelegator,
    address _stableTokenV2,
    address _tokenMigrator,
    AdminUpgradeabilityProxy _mocProxy,
    address _mocAtomicImp,
    address _mocConnectorAtomicImp,
    address _mocExchangeAtomicImp,
    address _mocStateAtomicImp,
    address _mocSettlementAtomicImp) public {
    upgradeDelegator = _upgradeDelegator;
    stableTokenV2 = _stableTokenV2;
    tokenMigrator = _tokenMigrator;
    // MoC
    mocProxy = _mocProxy;
    mocCurrentImp = upgradeDelegator.getProxyImplementation(_mocProxy);
    mocAtomicImp = _mocAtomicImp;
    // MocConnector
    MoCConnector mocConnector = MoC(address(_mocProxy)).connector();
    mocConnectorProxy = castToAdminUpgradeabilityProxy(address(mocConnector));
    mocConnectorCurrentImp = upgradeDelegator.getProxyImplementation(mocConnectorProxy);
    mocConnectorAtomicImp = _mocConnectorAtomicImp;
    // MocExchange
    mocExchangeProxy = castToAdminUpgradeabilityProxy(mocConnector.mocExchange());
    mocExchangeCurrentImp = upgradeDelegator.getProxyImplementation(mocExchangeProxy);
    mocExchangeAtomicImp = _mocExchangeAtomicImp;
    // MocState
    mocStateProxy = castToAdminUpgradeabilityProxy(mocConnector.mocState());
    mocStateCurrentImp = upgradeDelegator.getProxyImplementation(mocStateProxy);
    mocStateAtomicImp = _mocStateAtomicImp;
    // MocSettlement
    mocSettlementProxy = castToAdminUpgradeabilityProxy(mocConnector.mocSettlement());
    mocSettlementCurrentImp = upgradeDelegator.getProxyImplementation(mocSettlementProxy);
    mocSettlementAtomicImp = _mocSettlementAtomicImp;
  }

  /**
   * @notice cast non payable address to AdminUpgradebilityProxy
   * @param _address address to cast
   */
  function castToAdminUpgradeabilityProxy(address _address) internal returns (AdminUpgradeabilityProxy proxy) {
    return AdminUpgradeabilityProxy(address(uint160(_address)));
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
