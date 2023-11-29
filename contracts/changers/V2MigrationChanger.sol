pragma solidity ^0.5.8;
pragma experimental ABIEncoderV2;

import "zos-lib/contracts/upgradeability/AdminUpgradeabilityProxy.sol";
import "moc-governance/contracts/Governance/ChangeContract.sol";
import "moc-governance/contracts/Upgradeability/UpgradeDelegator.sol";
import "../auxiliar/CommissionSplitter.sol";
import "../base/MoCConnector.sol";
import "../../contracts/V2_migration/MoC_Migrator.sol";
import "../../contracts/V2_migration/MoCExchange_Migrator.sol";
import "../../contracts/MoCState.sol";
import "../../contracts/MoCInrate.sol";


/**
  @title V2MigrationChanger
 */
contract V2MigrationChanger is ChangeContract {
  bytes32 constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

  struct UpgradesAddresses {
    AdminUpgradeabilityProxy proxy;
    address newImplementation;
  }
  UpgradeDelegator public upgradeDelegator;
  CommissionSplitter public commissionSplitter;
  IMoCV2 public mocV2;
  address public deprecatedImp;
  address[] public authorizedExecutors;

  // MoC
  AdminUpgradeabilityProxy public mocProxy;
  address public mocMigrator;
  // MocExchange
  AdminUpgradeabilityProxy public mocExchangeProxy;
  address public mocExchangeMigrator;
  // MocConnector
  AdminUpgradeabilityProxy public mocConnectorProxy;
  // MocState
  AdminUpgradeabilityProxy public mocStateProxy;
  // MocSettlement
  AdminUpgradeabilityProxy public mocSettlementProxy;
  // MocInrate
  AdminUpgradeabilityProxy public mocInrateProxy;
  // MocRiskProxManager
  AdminUpgradeabilityProxy public mocRiskProxManagerProxy;

  uint256 tpEma;
  uint256 nextEmaCalculation;
  uint256 nextTCInterestPayment;

  /**
    @notice Constructor
    @param _upgradeDelegator Address of the upgradeDelegator in charge of that proxy
    @param _commissionSplitter Address of the CommissionSplitter contract used to split commissions before
      the migration to transfer all MoC balance
    @param _mocV2 Address of the new MoC Core protocol
    @param _mocProxy MoC proxy address
    @param _mocMigrator MoC atomic implementation address to execute the migration
    @param _mocExchangeMigrator MoCExchange atomic implementation address to execute the migration
    @param _deprecatedImp deprectaed contract implementation address
    @param _authorizedExecutors array of authorized queue executors
  */
  constructor(
    UpgradeDelegator _upgradeDelegator,
    CommissionSplitter _commissionSplitter,
    IMoCV2 _mocV2,
    AdminUpgradeabilityProxy _mocProxy,
    address _mocMigrator,
    address _mocExchangeMigrator,
    address _deprecatedImp,
    address[] memory _authorizedExecutors
  ) public {
    upgradeDelegator = _upgradeDelegator;
    commissionSplitter = _commissionSplitter;
    mocV2 = IMoCV2(_mocV2);
    deprecatedImp = _deprecatedImp;
    authorizedExecutors = _authorizedExecutors;
    // MoC
    mocProxy = _mocProxy;
    mocMigrator = _mocMigrator;
    // MocConnector
    MoCConnector mocConnector = MoCConnector(address(MoC(address(_mocProxy)).connector()));
    mocConnectorProxy = castToAdminUpgradeabilityProxy(address(mocConnector));
    // MocExchange
    mocExchangeProxy = castToAdminUpgradeabilityProxy(mocConnector.mocExchange());
    mocExchangeMigrator = _mocExchangeMigrator;
    // MocState
    mocStateProxy = castToAdminUpgradeabilityProxy(mocConnector.mocState());
    // MocSettlement
    mocSettlementProxy = castToAdminUpgradeabilityProxy(mocConnector.mocSettlement());
    // MocInrate
    mocInrateProxy = castToAdminUpgradeabilityProxy(mocConnector.mocInrate());
    // MocRiskProxManager
    mocRiskProxManagerProxy = castToAdminUpgradeabilityProxy(mocConnector.riskProxManager());
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
    // MoC
    upgradeDelegator.upgrade(mocProxy, mocMigrator);
    // MocExchange
    upgradeDelegator.upgrade(mocExchangeProxy, mocExchangeMigrator);

    MoCConnector mocConnector = MoCConnector(address(mocConnectorProxy));
    uint256 qAC = IERC20(mocConnector.reserveToken()).balanceOf(address(mocProxy));
    uint256 qTC = IERC20(mocConnector.riskProToken()).totalSupply();
    uint256 qTP = IERC20(mocConnector.stableToken()).totalSupply();

    // Adds USDRIF Pegged Token to V2 protocol with same configuration
    MoCState mocState = MoCState(address(mocStateProxy));
    MoCInrate mocInrate = MoCInrate(address(mocInrateProxy));
    IMoCV2.PeggedTokenParams memory peggedTokenParams = IMoCV2.PeggedTokenParams({
      tpTokenAddress: address(mocConnector.stableToken()),
      priceProviderAddress: address(mocState.getPriceProvider()),
      tpCtarg: mocState.cobj(),
      tpMintFee: mocInrate.commissionRatesByTxType(mocInrate.MINT_STABLETOKEN_FEES_RESERVE()),
      tpRedeemFee: mocInrate.commissionRatesByTxType(mocInrate.REDEEM_STABLETOKEN_FEES_RESERVE()),
      tpEma: mocState.getLastEmaCalculation(),
      tpEmaSf: mocState.getSmoothingFactor()
    });
    mocV2.addPeggedToken(peggedTokenParams);

    mocV2.migrateFromV1(qAC, qTC, qTP, tpEma, nextEmaCalculation, nextTCInterestPayment);
    MoC_Migrator(address(mocProxy)).migrateToV2(address(mocV2));
    MoCExchange_Migrator(address(mocExchangeProxy)).migrateToV2(address(mocV2));
    // unpause MocV2 and set the real pauser address
    address pauser = MoC(address(mocProxy)).stopper();
    mocV2.setPauser(address(this));
    mocV2.unpause();
    mocV2.setPauser(pauser);

    IMocQueueV2 rocQueue = IMocQueueV2(mocV2.mocQueue());
    rocQueue.registerBucket(address(mocV2));
    for (uint256 i = 0; i < authorizedExecutors.length; i++) {
      rocQueue.grantRole(EXECUTOR_ROLE, authorizedExecutors[i]);
    }
    // MoC
    upgradeDelegator.upgrade(mocProxy, deprecatedImp);
    // MocExchange
    upgradeDelegator.upgrade(mocExchangeProxy, deprecatedImp);
    // MocConnector
    upgradeDelegator.upgrade(mocConnectorProxy, deprecatedImp);
    // MocState
    upgradeDelegator.upgrade(mocStateProxy, deprecatedImp);
    // MocSettlement
    upgradeDelegator.upgrade(mocSettlementProxy, deprecatedImp);
    // MocInrate
    upgradeDelegator.upgrade(mocInrateProxy, deprecatedImp);
    // MocRiskProxManager
    upgradeDelegator.upgrade(mocRiskProxManagerProxy, deprecatedImp);
  }

  /**
    @notice Intended to prepare the system for the upgrade
    @dev This function can be overriden by child changers to upgrade contracts that require some preparation before the upgrade
   */
  function _beforeUpgrade() internal {
    MoCState mocState = MoCState(address(mocStateProxy));
    MoCInrate mocInrate = MoCInrate(address(mocInrateProxy));
    // we need to get these values before the upgrade because mocState will be deprecated
    tpEma = mocState.getExponentalMovingAverage();
    nextEmaCalculation = mocState.lastEmaCalculation() + mocState.emaCalculationBlockSpan();
    nextTCInterestPayment = mocInrate.lastRiskProInterestBlock() + mocInrate.riskProInterestBlockSpan();
    // CommissionSplitter holds all the platform fees and then splits them one part for a custom address and another
    // is re-inyected to MoC protocol, so we need to split them to transfer all the balance after the upgrade
    commissionSplitter.split();
    // TODO: commissionSpliterV2 and V3 ??
    verifyMigrationCompatibility();
  }

  /**
    @notice Intended to do the final tweaks after the upgrade, for example initialize the contract
    @dev This function can be overriden by child changers to upgrade contracts that require some changes after the upgrade
   */
  function _afterUpgrade() internal {}

  /**
    @notice Verify that most important configuration params are the same for both protocol versions
   */
  function verifyMigrationCompatibility() public view returns (bool success) {
    MoCState mocState = MoCState(address(mocStateProxy));
    MoCInrate mocInrate = MoCInrate(address(mocInrateProxy));
    MoCConnector mocConnector = MoCConnector(address(mocConnectorProxy));
    // assert governor address
    require(address(mocState.governor()) == mocV2.governor(), "wrong param: governor address");
    // assert reserveToken address
    require(address(mocConnector.reserveToken()) == mocV2.acToken(), "wrong param: reserve token address");
    // assert riskProToken address
    require(address(mocConnector.riskProToken()) == mocV2.tcToken(), "wrong param: riskPro token address");
    // assert MoC Token price provider address
    require(address(mocState.getMoCPriceProvider()) == mocV2.feeTokenPriceProvider(), "wrong param: price provider address");
    // assert protected threshlod
    require(mocState.getProtected() == mocV2.protThrld(), "wrong param: protected threshold");
    // assert liquidation threshold
    require(mocState.liq() == mocV2.liqThrld(), "wrong param: liquidation threshold");
    require(mocInrate.riskProInterestAddress() == mocV2.tcInterestCollectorAddress(), "wrong param: TC interest collector address");
    require(mocInrate.riskProRate() == mocV2.tcInterestRate(), "wrong param: TC interest rate");
    require(mocInrate.riskProInterestBlockSpan() == mocV2.tcInterestPaymentBlockSpan(), "wrong param: TC interest block span");

    return true;
  }
}


interface IMoCV2 {
  struct PeggedTokenParams {
    // Pegged Token contract address to add
    address tpTokenAddress;
    // priceProviderAddress Pegged Token price provider contract address
    address priceProviderAddress;
    // Pegged Token target coverage [PREC]
    uint256 tpCtarg;
    // additional fee pct applied on mint [PREC]
    uint256 tpMintFee;
    // additional fee pct applied on redeem [PREC]
    uint256 tpRedeemFee;
    // initial Pegged Token exponential moving average [PREC]
    uint256 tpEma;
    // Pegged Token smoothing factor [PREC]
    uint256 tpEmaSf;
  }

  function migrateFromV1(uint256 qAC_, uint256 qTC_, uint256 qTP_, uint256 tpEma_, uint256 nextEmaCalculation_, uint256 nextTCInterestPayment_)
    external;

  function governor() external view returns (address governor);

  function acToken() external view returns (address tcToken);

  function tcToken() external view returns (address tcToken);

  function tpTokens(uint256 index_) external view returns (address tpToken);

  function mocQueue() external view returns (address mocQueue);

  function pegContainer(uint256 index_) external view returns (uint256 nTP, address priceProvider);

  function feeTokenPriceProvider() external view returns (address feeTokenpriceProvider);

  function protThrld() external view returns (uint256 protThrld);

  function liqThrld() external view returns (uint256 liqThrld);

  function tpCtarg(uint256 index_) external view returns (uint256 tpCtarg);

  function tpEma(uint256 index_) external view returns (uint256 ema, uint256 sf);

  function getCglb() external view returns (uint256 cglob);

  function getPTCac() external view returns (uint256 pTCac);

  function pauser() external view returns (address pauser);

  function setPauser(address newPauser_) external;

  function unpause() external;

  function tcInterestCollectorAddress() external view returns (address tcInterestCollectorAddress);

  function tcInterestRate() external view returns (uint256 tcInterestRate);

  function tcInterestPaymentBlockSpan() external view returns (uint256 tcInterestPaymentBlockSpan);

  function addPeggedToken(PeggedTokenParams calldata peggedTokenParams_) external;
}


interface IMocQueueV2 {
  function registerBucket(address bucket_) external;

  function grantRole(bytes32 role, address account) external;
}
