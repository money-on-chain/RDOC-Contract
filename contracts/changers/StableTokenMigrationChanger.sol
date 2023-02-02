pragma solidity ^0.5.8;

import "zos-lib/contracts/upgradeability/AdminUpgradeabilityProxy.sol";
import "moc-governance/contracts/Governance/ChangeContract.sol";
import "moc-governance/contracts/Upgradeability/UpgradeDelegator.sol";
import "../MoCExchange.sol";

/**
  @title StableTokenMigrationChanger
 */
contract StableTokenMigrationChanger is ChangeContract {

  AdminUpgradeabilityProxy public proxy;
  UpgradeDelegator public upgradeDelegator;
  address public currentImplementation;
  address public newImplementation;
  address public stableTokenV2;
  address public bridgeAddress;

  /**
    @notice Constructor
    @param _proxy Address of the proxy to be upgraded
    @param _upgradeDelegator Address of the upgradeDelegator in charge of that proxy
    @param _newImplementation Address of the contract the proxy will delegate to
  */
  constructor(
    AdminUpgradeabilityProxy _proxy,
    UpgradeDelegator _upgradeDelegator, 
    address _newImplementation,
    address _stableTokenV2Address,
    address _bridgeAddress
  ) public {
    proxy = _proxy;
    upgradeDelegator = _upgradeDelegator;
    currentImplementation = upgradeDelegator.getProxyImplementation(_proxy);
    newImplementation = _newImplementation;
    stableTokenV2 = _stableTokenV2Address;
    bridgeAddress = _bridgeAddress;
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
    upgradeDelegator.upgrade(proxy, newImplementation);
  }

  /**
    @notice Intended to prepare the system for the upgrade
    @dev This function can be overriden by child changers to upgrade contracts that require some preparation before the upgrade
   */
  function _beforeUpgrade() internal {
  }

  /**
    @notice Intended to do the final tweaks after the upgrade, for example initialize the contract
    @dev This function can be overriden by child changers to upgrade contracts that require some changes after the upgrade
   */
  function _afterUpgrade() internal {
    MoCExchange(address(proxy)).migrateStableToken(stableTokenV2, bridgeAddress);
    // rollback to the current implementation, we don't want that new implementation be alive more than in
    // this atomic transaction
    upgradeDelegator.upgrade(proxy, currentImplementation);
  }
}
