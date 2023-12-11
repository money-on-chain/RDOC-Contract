import { deployments, getNamedAccounts } from "hardhat";
import memoizee from "memoizee";
import { Address } from "hardhat-deploy/types";
import {
  CommissionSplitter,
  CommissionSplitter__factory,
  MoC,
  MoC__factory,
  MoCConnector,
  MoCConnector__factory,
  MoCInrate,
  MoCInrate__factory,
  PriceProviderMock,
  MoCPriceProviderMock__factory,
  MoCRiskProxManager,
  MoCRiskProxManager__factory,
  MoCSettlement,
  MoCSettlement__factory,
  MoCState,
  MoCState__factory,
  MoCToken,
  MoCToken__factory,
  MoCVendors,
  MoCVendors__factory,
  PriceProviderMock__factory,
  ReserveToken,
  ReserveToken__factory,
  RiskProToken,
  RiskProToken__factory,
  StableTokenV2,
  StableTokenV2__factory,
  StopperV2,
  StopperV2__factory,
  UpgradeDelegator,
  UpgradeDelegator__factory,
  MoCExchange,
  MoCExchange__factory,
  ProxyAdmin__factory,
  ProxyAdmin,
  MocRif,
  MocQueue,
  GovernorMock,
  GovernorMock__factory,
} from "../../typechain";
import {
  deployContract,
  deployTransparentProxy,
  baseParams,
  pEth,
  deployMocRifV2,
  deployUUPSProxy,
  CONSTANTS,
} from "../helpers/utils";

export const fixtureDeployed = memoizee(
  (): (() => Promise<{
    mocHelperAddress: Address;
    moc: MoC;
    mocConnector: MoCConnector;
    mocExchange: MoCExchange;
    mocState: MoCState;
    mocSettlement: MoCSettlement;
    mocInrate: MoCInrate;
    mocVendors: MoCVendors;
    riskProxManager: MoCRiskProxManager;
    stopper: StopperV2;
    mocCommissionSplitter: CommissionSplitter;
    upgradeDelegator: UpgradeDelegator;
    stableToken: StableTokenV2;
    mocToken: MoCToken;
    riskProToken: RiskProToken;
    reserveToken: ReserveToken;
    stableTokenPriceProvider: PriceProviderMock;
    mocRifV2: MocRif;
    mocQueue: MocQueue;
  }>) => {
    return deployments.createFixture(async ({ ethers }) => {
      await deployments.fixture();
      const { deployer, alice, bob, vendor } = await getNamedAccounts();

      const proxyAdmin: ProxyAdmin = await deployContract("ProxyAdmin", ProxyAdmin__factory, []);

      const mocHelperLib = await (await ethers.getContractFactory("MoCHelperLib")).deploy();

      const mocConnector: MoCConnector = await deployTransparentProxy(
        "MoCConnector",
        proxyAdmin.address,
        MoCConnector__factory,
      );
      const moc: MoC = await deployTransparentProxy("MoC", proxyAdmin.address, MoC__factory);
      const mocState: MoCState = await deployTransparentProxy("MoCState", proxyAdmin.address, MoCState__factory, {
        libraries: { MoCHelperLib: mocHelperLib.address },
      });
      const mocSettlement: MoCSettlement = await deployTransparentProxy(
        "MoCSettlement",
        proxyAdmin.address,
        MoCSettlement__factory,
      );
      const mocInrate: MoCInrate = await deployTransparentProxy("MoCInrate", proxyAdmin.address, MoCInrate__factory, {
        libraries: { MoCHelperLib: mocHelperLib.address },
      });
      const mocVendors: MoCVendors = await deployTransparentProxy(
        "MoCVendors",
        proxyAdmin.address,
        MoCVendors__factory,
      );

      const mocExchange: MoCExchange = await deployTransparentProxy(
        "MoCExchange",
        proxyAdmin.address,
        MoCExchange__factory,
        {
          libraries: { MoCHelperLib: mocHelperLib.address },
        },
      );

      const riskProxManager: MoCRiskProxManager = await deployTransparentProxy(
        "MoCRiskProxManager",
        proxyAdmin.address,
        MoCRiskProxManager__factory,
      );
      const stopper: StopperV2 = await deployTransparentProxy("StopperV2", proxyAdmin.address, StopperV2__factory);
      const mocCommissionSplitter: CommissionSplitter = await deployTransparentProxy(
        "CommissionSplitter",
        proxyAdmin.address,
        CommissionSplitter__factory,
      );

      const stableToken: StableTokenV2 = await deployUUPSProxy("StableTokenV2", StableTokenV2__factory);

      const mocToken: MoCToken = await deployContract("MoCToken", MoCToken__factory, []);
      const riskProToken: RiskProToken = await deployContract("RiskProToken", RiskProToken__factory, []);
      const reserveToken: ReserveToken = await deployContract("ReserveToken", ReserveToken__factory, []);
      const stableTokenPriceProvider: PriceProviderMock = await deployContract(
        "PriceProviderMock",
        PriceProviderMock__factory,
        [baseParams.reservePrice],
      );
      const mocPriceProvider = await deployContract("MoCPriceProviderMock", MoCPriceProviderMock__factory, [
        baseParams.mocPrice,
      ]);

      const governorMock: GovernorMock = await deployContract("GovernorMock", GovernorMock__factory, []);

      const upgradeDelegator: UpgradeDelegator = await deployContract(
        "UpgradeDelegator",
        UpgradeDelegator__factory,
        [],
      );

      await stableToken.initialize("StableTokenV2", "ST2", mocExchange.address, governorMock.address);

      await mocConnector.initialize(
        moc.address,
        stableToken.address,
        riskProToken.address,
        riskProxManager.address,
        mocState.address,
        mocSettlement.address,
        mocExchange.address,
        mocInrate.address,
        deployer,
        reserveToken.address,
      );
      await moc["initialize(address,address,address,bool,uint256)"](
        mocConnector.address,
        governorMock.address,
        stopper.address,
        baseParams.startStoppable,
        21000000000, // max gas price
      );
      await stopper.initialize(deployer);
      await mocExchange.initialize(mocConnector.address);
      await mocState[
        "initialize((address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,address,address,address,bool,uint256))"
      ]({
        connectorAddress: mocConnector.address,
        governor: governorMock.address,
        priceProvider: stableTokenPriceProvider.address,
        liq: baseParams.liq, // mocPrecision
        utpdu: baseParams.utpdu, // mocPrecision
        maxDiscRate: baseParams.maxDiscountRate, // mocPrecision
        dayBlockSpan: baseParams.dayBlockSpan, // no Precision
        ema: baseParams.reservePrice,
        smoothFactor: baseParams.smoothingFactor,
        emaBlockSpan: baseParams.emaBlockSpan,
        maxMintRiskPro: baseParams.maxMintRiskPro,
        mocPriceProvider: mocPriceProvider.address,
        mocTokenAddress: mocToken.address,
        mocVendorsAddress: mocVendors.address,
        liquidationEnabled: baseParams.liquidationEnabled,
        protected: baseParams._protected,
      });
      await mocInrate[
        "initialize(address,address,uint256,uint256,uint256,uint256,uint256,address,address,uint256,uint256,uint256)"
      ](
        mocConnector.address,
        governorMock.address,
        baseParams.riskProxTmin,
        baseParams.riskProxPower,
        baseParams.riskProxTmax,
        baseParams.riskProRate,
        baseParams.dayBlockSpan * 7,
        deployer,
        mocCommissionSplitter.address,
        // commissionRate,
        baseParams.stableTmin,
        baseParams.stablePower,
        baseParams.stableTmax,
      );

      await riskProxManager["initialize(address,address,uint256,uint256)"](
        mocConnector.address,
        governorMock.address,
        baseParams.c0Cobj,
        baseParams.x2Cobj,
      );
      await mocSettlement["initialize(address,address,uint256)"](
        mocConnector.address,
        governorMock.address,
        baseParams.settlementBlockSpan,
      );
      await mocCommissionSplitter["initialize(address,address,uint256,address,address,address,address)"](
        moc.address,
        deployer,
        baseParams.mocProportion,
        governorMock.address,
        reserveToken.address,
        mocToken.address,
        deployer,
      );
      await upgradeDelegator["initialize(address,address)"](governorMock.address, proxyAdmin.address);
      const vendorGuardian = deployer;
      await mocVendors["initialize(address,address,address)"](
        mocConnector.address,
        governorMock.address,
        vendorGuardian,
      );

      await reserveToken.claim(pEth(100000000000));
      await reserveToken.connect(await ethers.getSigner(alice)).claim(pEth(100000000000));
      await reserveToken.connect(await ethers.getSigner(bob)).claim(pEth(100000000000));

      await transferOwnershipAndMinting(riskProToken, mocExchange.address);
      await transferPausingRole(riskProToken, moc.address);
      await proxyAdmin.transferOwnership(upgradeDelegator.address);

      // After Moc and MocExchange had been initialized
      await moc.setMaxAbsoluteOperation(pEth(1000000));
      await moc.setMaxOperationalDifference(pEth(500000));
      await moc.setDecayBlockSpan(720);

      // deploy MocV2
      const { mocRifV2, mocCoreExpansion, mocQueue, mocVendorsV2, maxAbsoluteOpProvider, maxOpDiffProvider } =
        await deployMocRifV2(stopper.address);

      await mocRifV2.initialize({
        initializeCoreParams: {
          initializeBaseBucketParams: {
            feeTokenAddress: mocToken.address,
            feeTokenPriceProviderAddress: mocPriceProvider.address,
            tcTokenAddress: riskProToken.address,
            mocFeeFlowAddress: deployer,
            mocAppreciationBeneficiaryAddress: deployer,
            protThrld: baseParams._protected,
            liqThrld: baseParams.liq,
            feeRetainer: 0,
            tcMintFee: pEth(0.1), // 10%
            tcRedeemFee: pEth(0.1), // 10%
            swapTPforTPFee: pEth(0.1), // 10%
            swapTPforTCFee: pEth(0.1), // 10%
            swapTCforTPFee: pEth(0.1), // 10%
            redeemTCandTPFee: pEth(0.1), // 10%
            mintTCandTPFee: pEth(0.1), // 10%
            feeTokenPct: pEth(0.1), // 10%
            successFee: pEth(0.1), // 10%
            appreciationFactor: 0,
            bes: baseParams.settlementBlockSpan,
            tcInterestCollectorAddress: deployer,
            tcInterestRate: baseParams.riskProRate,
            tcInterestPaymentBlockSpan: baseParams.dayBlockSpan * 7,
            maxAbsoluteOpProviderAddress: maxAbsoluteOpProvider.address,
            maxOpDiffProviderAddress: maxOpDiffProvider.address,
            decayBlockSpan: 720,
          },
          governorAddress: governorMock.address,
          pauserAddress: stopper.address,
          mocCoreExpansion: mocCoreExpansion.address,
          emaCalculationBlockSpan: baseParams.emaBlockSpan,
          mocVendors: mocVendorsV2.address,
        },
        acTokenAddress: reserveToken.address!,
        mocQueue: mocQueue.address,
      });

      // initialize mocQueue
      const minOperWaitingBlck = 1;
      const maxOperPerBlock = 10;
      const execFeeParams = {
        tcMintExecFee: CONSTANTS.EXEC_FEE,
        tcRedeemExecFee: CONSTANTS.EXEC_FEE,
        tpMintExecFee: CONSTANTS.EXEC_FEE,
        tpRedeemExecFee: CONSTANTS.EXEC_FEE,
        mintTCandTPExecFee: CONSTANTS.EXEC_FEE,
        redeemTCandTPExecFee: CONSTANTS.EXEC_FEE,
        swapTPforTPExecFee: CONSTANTS.EXEC_FEE,
        swapTPforTCExecFee: CONSTANTS.EXEC_FEE,
        swapTCforTPExecFee: CONSTANTS.EXEC_FEE,
      };
      await mocQueue.initialize(
        governorMock.address,
        stopper.address,
        minOperWaitingBlck,
        maxOperPerBlock,
        execFeeParams,
      );

      await mocVendorsV2.initialize(vendorGuardian, governorMock.address, stopper.address);
      // set 5% markup to vendor
      await mocVendorsV2.setVendorMarkup(vendor, pEth(0.05));

      await stopper.setMaxAbsoluteOperation(maxAbsoluteOpProvider.address, CONSTANTS.MAX_UINT256);

      await stopper.setMaxOperationalDifference(maxOpDiffProvider.address, CONSTANTS.MAX_UINT256);

      return {
        mocHelperAddress: mocHelperLib.address,
        moc,
        mocConnector,
        mocExchange,
        mocState,
        mocSettlement,
        mocInrate,
        mocVendors,
        riskProxManager,
        stopper,
        mocCommissionSplitter,
        upgradeDelegator,
        stableToken,
        mocToken,
        riskProToken,
        reserveToken,
        stableTokenPriceProvider,
        mocRifV2,
        mocQueue,
      };
    });
  },
);

const transferOwnershipAndMinting = async (token: any, address: string) => {
  await token.transferOwnership(address);
  await token.addMinter(address);
  await token.renounceMinter();
};

const transferPausingRole = async (token: any, address: string) => {
  await token.addPauser(address);
  await token.renouncePauser();
};
