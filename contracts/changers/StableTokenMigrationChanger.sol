pragma solidity ^0.5.8;
pragma experimental ABIEncoderV2;

import "zos-lib/contracts/upgradeability/AdminUpgradeabilityProxy.sol";
import "moc-governance/contracts/Governance/ChangeContract.sol";
import "moc-governance/contracts/Upgradeability/UpgradeDelegator.sol";
import "../MoC_v021.sol";
import "../base/MoCConnector_v021.sol";
import "../MoCExchange_v021.sol";
import "../MoCState_v021.sol";
import "../MoCSettlement_v021.sol";

// import contracts v020 required to be compiled for testings
import "../../contracts_updated/MoC_v020.sol";
import "../../contracts_updated/MoCConnector_v020.sol";
import "../../contracts_updated/MoCExchange_v020.sol";
import "../../contracts_updated/MoCState_v020.sol";
import "../../contracts_updated/MoCSettlement_v020.sol";


/**
  @title StableTokenMigrationChanger
 */
contract StableTokenMigrationChanger is ChangeContract {
  struct UpgradesAddresses {
    AdminUpgradeabilityProxy proxy;
    address middleTermImplementation;
    address newImplementation;
  }
  UpgradeDelegator public upgradeDelegator;
  address public stableTokenV2;
  address public bridgeAddress;

  // 0: MoC
  // 1: MocConnector
  // 2: MocExchange
  // 3: MocState
  // 4: MocSettlement
  UpgradesAddresses[5] public upgradesAddresses; 

  /**
    @notice Constructor
    @param _upgradeDelegator Address of the upgradeDelegator in charge of that proxy
  */
  constructor(
    UpgradeDelegator _upgradeDelegator,
    address _stableTokenV2Address,
    address _bridgeAddress,
    UpgradesAddresses[5] memory _upgradesAddresses
  ) public {
    upgradeDelegator = _upgradeDelegator;
    stableTokenV2 = _stableTokenV2Address;
    bridgeAddress = _bridgeAddress;
   
    // 0: MoC
    upgradesAddresses[0] = _upgradesAddresses[0];
    // 1: MocConnector
    upgradesAddresses[1] = _upgradesAddresses[1];
    // 2: MocExchange
    upgradesAddresses[2] = _upgradesAddresses[2];
    // 3: MocState
    upgradesAddresses[3] = _upgradesAddresses[3];
    // 4: MocSettlement
    upgradesAddresses[4] = _upgradesAddresses[4];
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
    // 0: MoC
    upgradeDelegator.upgrade(upgradesAddresses[0].proxy, upgradesAddresses[0].middleTermImplementation);
    // 1: MocConnector
    upgradeDelegator.upgrade(upgradesAddresses[1].proxy, upgradesAddresses[1].middleTermImplementation);
    // 2: MocExchange
    upgradeDelegator.upgrade(upgradesAddresses[2].proxy, upgradesAddresses[2].middleTermImplementation);
    // 3: MocState
    upgradeDelegator.upgrade(upgradesAddresses[3].proxy, upgradesAddresses[3].middleTermImplementation);
    // 4: MocSettlement
    upgradeDelegator.upgrade(upgradesAddresses[4].proxy, upgradesAddresses[4].middleTermImplementation);
  }

  /**
    @notice Intended to prepare the system for the upgrade
    @dev This function can be overriden by child changers to upgrade contracts that require some preparation before the upgrade
   */
  function _beforeUpgrade() internal {}

  /**
    @notice Intended to do the final tweaks after the upgrade, for example initialize the contract
    @dev This function can be overriden by child changers to upgrade contracts that require some changes after the upgrade
   */
  function _afterUpgrade() internal { 
    MoC_v021(address(upgradesAddresses[0].proxy)).migrateStableToken(stableTokenV2);
    MoCConnector_v021(address(upgradesAddresses[1].proxy)).migrateStableToken(stableTokenV2);
    MoCExchange_v021(address(upgradesAddresses[2].proxy)).migrateStableToken(stableTokenV2, bridgeAddress);
    MoCState_v021(address(upgradesAddresses[3].proxy)).migrateStableToken(stableTokenV2);
    MoCSettlement_v021(address(upgradesAddresses[4].proxy)).migrateStableToken(stableTokenV2);
    // upgrade again to a new implementation, we don't want that middle term implementation be alive more than
    // this atomic transaction
    // 0: MoC
    upgradeDelegator.upgrade(upgradesAddresses[0].proxy, upgradesAddresses[0].newImplementation);
    // 1: MocConnector
    upgradeDelegator.upgrade(upgradesAddresses[1].proxy, upgradesAddresses[1].newImplementation);
    // 2: MocExchange
    upgradeDelegator.upgrade(upgradesAddresses[2].proxy, upgradesAddresses[2].newImplementation);
    // 3: MocState
    upgradeDelegator.upgrade(upgradesAddresses[3].proxy, upgradesAddresses[3].newImplementation);
    // 4: MocSettlement
    upgradeDelegator.upgrade(upgradesAddresses[4].proxy, upgradesAddresses[4].newImplementation);
  }
}
