pragma solidity ^0.5.8;
pragma experimental ABIEncoderV2;

import "zos-lib/contracts/upgradeability/AdminUpgradeabilityProxy.sol";
import "moc-governance/contracts/Governance/ChangeContract.sol";
import "moc-governance/contracts/Upgradeability/UpgradeDelegator.sol";
import "../auxiliar/CommissionSplitterV2.sol";
import "../auxiliar/CommissionSplitterV3.sol";
import "../base/MoCConnector.sol";
import "../../contracts/V2_migration/MoC_Migrator.sol";
import "../../contracts/V2_migration/MoCExchange_Migrator.sol";
import "../../contracts/MoCState.sol";
import "../../contracts/MoCInrate.sol";

/**
  @title V2MigrationChanger
 */
contract V2MigrationChanger is ChangeContract {
  uint256 public constant PRECISION = 10 ** 18;
  struct UpgradesAddresses {
    AdminUpgradeabilityProxy proxy;
    address newImplementation;
  }
  UpgradeDelegator public upgradeDelegator;
  CommissionSplitterV2 public commissionSplitterV2Proxy;
  CommissionSplitterV3 public commissionSplitterV3Proxy;
  IMoCV2 public mocV2;
  INewCommissionSplitter public feesSplitterProxy;
  INewCommissionSplitter public tcInterestsSplitterProxy;
  address public deprecatedImp;
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

  uint256 public nextEmaCalculation;
  uint256 public nextTCInterestPayment;

  /**
    @notice Constructor
    @param _upgradeDelegator Address of the upgradeDelegator in charge of that proxy
    @param _mocV2 Address of the new MoC Core protocol
    @param _mocProxy MoC proxy address
    @param _mocMigrator MoC atomic implementation address to execute the migration
    @param _mocExchangeMigrator MoCExchange atomic implementation address to execute the migration
    @param _deprecatedImp deprectaed contract implementation address
  */
  constructor(
    UpgradeDelegator _upgradeDelegator,
    IMoCV2 _mocV2,
    AdminUpgradeabilityProxy _mocProxy,
    address _mocMigrator,
    address _mocExchangeMigrator,
    address _deprecatedImp
  ) public {
    upgradeDelegator = _upgradeDelegator;
    mocV2 = IMoCV2(_mocV2);
    feesSplitterProxy = INewCommissionSplitter(mocV2.mocFeeFlowAddress());
    tcInterestsSplitterProxy = INewCommissionSplitter(mocV2.tcInterestCollectorAddress());
    deprecatedImp = _deprecatedImp;
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
    // CommissionSplitterV2
    commissionSplitterV2Proxy = CommissionSplitterV2(MoCInrate(address(mocInrateProxy)).commissionsAddress());
    // CommissionSplitterV3
    commissionSplitterV3Proxy = CommissionSplitterV3(MoCInrate(address(mocInrateProxy)).riskProInterestAddress());
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
      tpEma: mocState.getExponentalMovingAverage(),
      tpEmaSf: mocState.getSmoothingFactor()
    });
    mocV2.addPeggedToken(peggedTokenParams);

    mocV2.migrateFromV1(qAC, qTC, qTP, nextEmaCalculation, nextTCInterestPayment);
    MoC_Migrator(address(mocProxy)).migrateToV2(address(mocV2));
    MoCExchange_Migrator(address(mocExchangeProxy)).migrateToV2(address(mocV2));

    IMocQueueV2 rocQueue = IMocQueueV2(mocV2.mocQueue());
    rocQueue.registerBucket(address(mocV2));

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
    nextEmaCalculation = mocState.lastEmaCalculation() + mocState.emaCalculationBlockSpan();
    nextTCInterestPayment = mocInrate.lastRiskProInterestBlock() + mocInrate.riskProInterestBlockSpan();
    // CommissionSplitter holds all the platform fees and then splits them one part for a custom address and another
    // is re-inyected to MoC protocol, so we need to split them to transfer all the balance after the upgrade
    commissionSplitterV2Proxy.split();
    commissionSplitterV3Proxy.split();

    verifyMigrationCompatibility();
    validateCommissionSplittersSetups();
    validateFeeRetainer();
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
    // assert pauser address
    require(MoC(address(mocProxy)).stopper() == mocV2.pauser(), "wrong param: pauser address");
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
    // assert riskProRate
    require(mocInrate.riskProRate() == mocV2.tcInterestRate(), "wrong param: TC interest rate");
    // assert riskProInterestBlockSpan
    require(mocInrate.riskProInterestBlockSpan() == mocV2.tcInterestPaymentBlockSpan(), "wrong param: TC interest block span");
    // don't assert comissionSpliter address because it will be a new contract on V2
    // require(address(commissionSplitter) == mocV2.mocFeeFlowAddress(), "wrong param: commission splitter address");
    // don't assert riskProInterestAddress because it will be a new contract on V2
    // require(mocInrate.riskProInterestAddress() == mocV2.tcInterestCollectorAddress(), "wrong param: TC interest collector address");

    return true;
  }

  /**
    @notice Verify that new CommissionSplitters setups are the same than V1
   */
  function validateCommissionSplittersSetups() public view returns (bool success) {
    /////////////////////////////////////////
    // feesSplitterProxy verifications /////
    ///////////////////////////////////////
    require(feesSplitterProxy.governor() == mocV2.governor(), "wrong param: governor address");
    require(feesSplitterProxy.acToken() == address(commissionSplitterV2Proxy.reserveToken()), "wrong param: reserve token address");
    // recipient1 is not used anymore and is replaced with the fee retainer
    require(feesSplitterProxy.acTokenAddressRecipient1() == commissionSplitterV2Proxy.outputAddress_2(), "wrong param: recipient1 address");
    require(feesSplitterProxy.acTokenAddressRecipient2() == commissionSplitterV2Proxy.outputAddress_3(), "wrong param: recipient2 address");

    require(feesSplitterProxy.feeToken() == address(commissionSplitterV2Proxy.tokenGovern()), "wrong param: moc token address");
    require(
      feesSplitterProxy.feeTokenAddressRecipient1() == commissionSplitterV2Proxy.outputTokenGovernAddress_1(),
      "wrong param: recipient1 address"
    );
    require(
      feesSplitterProxy.feeTokenAddressRecipient2() == commissionSplitterV2Proxy.outputTokenGovernAddress_2(),
      "wrong param: recipient2 address"
    );
    require(
      feesSplitterProxy.feeTokenPctToRecipient1() == commissionSplitterV2Proxy.outputProportionTokenGovern_1(),
      "wrong param: output proportion"
    );

    ////////////////////////////////////////////////
    // tcInterestsSplitterProxy verifications /////
    //////////////////////////////////////////////
    require(tcInterestsSplitterProxy.governor() == mocV2.governor(), "wrong param: governor address");
    require(tcInterestsSplitterProxy.acToken() == address(commissionSplitterV3Proxy.reserveToken()), "wrong param: reserve token address");
    require(
      tcInterestsSplitterProxy.acTokenAddressRecipient1() == commissionSplitterV3Proxy.outputAddress_1(),
      "wrong param: recipient1 address"
    );
    require(
      tcInterestsSplitterProxy.acTokenAddressRecipient2() == commissionSplitterV3Proxy.outputAddress_2(),
      "wrong param: recipient2 address"
    );
    require(
      tcInterestsSplitterProxy.acTokenPctToRecipient1() == commissionSplitterV3Proxy.outputProportion_1(),
      "wrong param: output proportion"
    );
    // for feeToken we only need to check the token because the splitter ask for its balance but is not used
    require(tcInterestsSplitterProxy.feeToken() == address(commissionSplitterV2Proxy.tokenGovern()), "wrong param: moc token address");
    return true;
  }

  /**
    @notice Verify that fee retainer is correct and the other proportion for fees splitter is mapped ok
   */
  function validateFeeRetainer() public view returns (bool success) {
    uint256 outputProportion1 = commissionSplitterV2Proxy.outputProportion_1();
    uint256 outputProportion2 = commissionSplitterV2Proxy.outputProportion_2();
    // we need to map the new percentages
    // 100% = A + B + C
    // 100% - A = B + C => B' + C' is the new 100%
    // 100% = (B / 100% - A) + (C / 100% - A)

    // [PREC]
    require(mocV2.feeRetainer() == outputProportion1, "wrong param: fee retainer");
    // [PREC] = ([PREC] * [PREC]) / ([PREC] - [PREC])
    require(
      feesSplitterProxy.acTokenPctToRecipient1() == (outputProportion2 * PRECISION) / (PRECISION - outputProportion1),
      "wrong param: output proportion"
    );
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

  function migrateFromV1(uint256 qAC_, uint256 qTC_, uint256 qTP_, uint256 nextEmaCalculation_, uint256 nextTCInterestPayment_) external;

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

  function feeRetainer() external view returns (uint256 feeRetainer);

  function getCglb() external view returns (uint256 cglob);

  function getPTCac() external view returns (uint256 pTCac);

  function pauser() external view returns (address pauser);

  function setPauser(address newPauser_) external;

  function unpause() external;

  function tcInterestCollectorAddress() external view returns (address tcInterestCollectorAddress);

  function mocFeeFlowAddress() external view returns (address mocFeeFlowAddress);

  function tcInterestRate() external view returns (uint256 tcInterestRate);

  function tcInterestPaymentBlockSpan() external view returns (uint256 tcInterestPaymentBlockSpan);

  function addPeggedToken(PeggedTokenParams calldata peggedTokenParams_) external;
}

interface IMocQueueV2 {
  function registerBucket(address bucket_) external;
}

interface INewCommissionSplitter {
  function acToken() external view returns (address);

  function acTokenAddressRecipient1() external view returns (address);

  function acTokenAddressRecipient2() external view returns (address);

  function acTokenPctToRecipient1() external view returns (uint256);

  function feeToken() external view returns (address);

  function feeTokenAddressRecipient1() external view returns (address);

  function feeTokenAddressRecipient2() external view returns (address);

  function feeTokenPctToRecipient1() external view returns (uint256);

  function governor() external view returns (address);
}
