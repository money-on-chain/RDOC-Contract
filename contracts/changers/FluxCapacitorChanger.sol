pragma solidity ^0.5.8;

import "zos-lib/contracts/upgradeability/AdminUpgradeabilityProxy.sol";
import "moc-governance/contracts/Governance/ChangeContract.sol";
import "moc-governance/contracts/Upgradeability/UpgradeDelegator.sol";
import "../MoC.sol";

/**
  @title FluxCapacitorChanger
  @notice This contract is an upgradeChanger to add a controll for the amount
  of reserve tokens used for mint and redeem operation
 */
contract FluxCapacitorChanger is ChangeContract {

  UpgradeDelegator public upgradeDelegator;

  AdminUpgradeabilityProxy public mocProxy;
  address public mocNewImplementation;

  AdminUpgradeabilityProxy public mocExchangeProxy;
  address public mocExchangeNewImplementation;

  AdminUpgradeabilityProxy public stopperProxy;
  address public stopperNewImplementation;

  uint256 public maxAbsoluteOperation;
  uint256 public maxOperationalDifference;
  uint256 public decayBlockSpan;

  /**
    @notice Constructor
    @param _upgradeDelegator Address of the upgradeDelegator in charge of that proxy
    @param _mocProxy Address of the MOC proxy to be upgraded
    @param _mocNewImplementation Address of the contract the MoC proxy will delegate to
    @param _mocExchangeNewImplementation Address of the contract the MoCExchange proxy will delegate to
    @param _stopperNewImplementation Address of the contract the Stopper proxy will delegate to
    @param _maxAbsoluteOperation max absolute operation allowed
    @param _maxOperationalDifference max operational difference allowed
    @param _decayBlockSpan decay block span
  */
  constructor(
    UpgradeDelegator _upgradeDelegator,
    AdminUpgradeabilityProxy _mocProxy,
    address _mocNewImplementation,
    address _mocExchangeNewImplementation,
    address _stopperNewImplementation,
    uint256 _maxAbsoluteOperation,
    uint256 _maxOperationalDifference,
    uint256 _decayBlockSpan
    ) public {
    upgradeDelegator = _upgradeDelegator;
    mocProxy = _mocProxy;
    mocNewImplementation = _mocNewImplementation;
    mocExchangeNewImplementation = _mocExchangeNewImplementation;
    stopperNewImplementation = _stopperNewImplementation;
    maxAbsoluteOperation = _maxAbsoluteOperation;
    maxOperationalDifference = _maxOperationalDifference;
    decayBlockSpan = _decayBlockSpan;
    // get stopper proxy address from MoC
    address _mocStopper = MoC(address(_mocProxy)).stopper();
    stopperProxy = castToAdminUpgradeabilityProxy(address(_mocStopper));
    // get mocExchange proxy address from MoC
    MoCConnector mocConnector = MoC(address(_mocProxy)).connector();
    address _mocExchangeProxy = mocConnector.mocExchange();
    mocExchangeProxy = castToAdminUpgradeabilityProxy(address(_mocExchangeProxy));
  }

  /**
   * @notice cast non payable address to AdminUpgradebilityProxy
   * @param _address address to cast
   */
  function castToAdminUpgradeabilityProxy(address _address) internal pure returns (AdminUpgradeabilityProxy proxy) {
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
    // upgrade MoC
    upgradeDelegator.upgrade(mocProxy, mocNewImplementation);
    // upgrade MoCExchange
    upgradeDelegator.upgrade(mocExchangeProxy, mocExchangeNewImplementation);
    // upgrade Stopper
    upgradeDelegator.upgrade(stopperProxy, stopperNewImplementation);
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
    // set flux capacitor parameters to MoC
    MoC(address(mocProxy)).setMaxAbsoluteOperation(maxAbsoluteOperation);
    MoC(address(mocProxy)).setMaxOperationalDifference(maxOperationalDifference);
    MoC(address(mocProxy)).setDecayBlockSpan(decayBlockSpan);
  }
}