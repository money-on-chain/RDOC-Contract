import { deployments, getNamedAccounts } from "hardhat";
import memoizee from "memoizee";
import { Address } from "hardhat-deploy/types";
import {
  CommissionSplitter,
  CommissionSplitter__factory,
  MoC_v020,
  MoC_v020__factory,
  MoCConnector_v020,
  MoCConnector_v020__factory,
  MoCInrate,
  MoCInrate__factory,
  MockGovernor__factory,
  MoCPriceProviderMock__factory,
  MoCRiskProxManager,
  MoCRiskProxManager__factory,
  MoCSettlement_v020,
  MoCSettlement_v020__factory,
  MoCState_v020,
  MoCState_v020__factory,
  MoCToken,
  MoCToken__factory,
  MoCVendors,
  MoCVendors__factory,
  PriceProviderMock__factory,
  ReserveToken,
  ReserveToken__factory,
  RiskProToken,
  RiskProToken__factory,
  StableToken,
  StableTokenV2,
  StableTokenV2__factory,
  StableToken__factory,
  Stopper,
  Stopper__factory,
  TokenMigrator,
  TokenMigrator__factory,
  UpgradeDelegator,
  UpgradeDelegator__factory,
  MoCExchange_v020,
  MoCExchange_v020__factory,
} from "../typechain";
import { deployContract, deployTransparentProxy, baseParams, pEth, deployUUPSProxy } from "./helpers/utils";

export const fixtureDeployed = memoizee(
  (): (() => Promise<{
    mocHelperAddress: Address;
    moc_v020: MoC_v020;
    mocConnector_v020: MoCConnector_v020;
    mocExchange_v020: MoCExchange_v020;
    mocState_v020: MoCState_v020;
    mocSettlement_v020: MoCSettlement_v020;
    mocInrate: MoCInrate;
    mocVendors: MoCVendors;
    riskProxManager: MoCRiskProxManager;
    stopper: Stopper;
    mocCommissionSplitter: CommissionSplitter;
    upgradeDelegator: UpgradeDelegator;
    stableToken: StableToken;
    stableTokenV2: StableTokenV2;
    mocToken: MoCToken;
    riskProToken: RiskProToken;
    reserveToken: ReserveToken;
    tokenMigrator: TokenMigrator;
  }>) => {
    return deployments.createFixture(async ({ ethers }) => {
      const { deployer, alice } = await getNamedAccounts();
      const ProxyAdminFactory = await ethers.getContractFactory("ProxyAdmin");
      const proxyAdmin = await ProxyAdminFactory.deploy();

      const MocHelperLibFactory = await ethers.getContractFactory("MoCHelperLib");
      const mocHelperLib = await MocHelperLibFactory.deploy();

      const mocConnector_v020: MoCConnector_v020 = await deployTransparentProxy(
        "MoCConnector_v020",
        proxyAdmin.address,
        MoCConnector_v020__factory,
      );
      const moc_v020: MoC_v020 = await deployTransparentProxy("MoC_v020", proxyAdmin.address, MoC_v020__factory);
      const mocState_v020: MoCState_v020 = await deployTransparentProxy(
        "MoCState_v020",
        proxyAdmin.address,
        MoCState_v020__factory,
        {
          libraries: { MoCHelperLib: mocHelperLib.address },
        },
      );
      const mocSettlement_v020: MoCSettlement_v020 = await deployTransparentProxy(
        "MoCSettlement_v020",
        proxyAdmin.address,
        MoCSettlement_v020__factory,
      );
      const mocInrate: MoCInrate = await deployTransparentProxy("MoCInrate", proxyAdmin.address, MoCInrate__factory, {
        libraries: { MoCHelperLib: mocHelperLib.address },
      });
      const mocVendors: MoCVendors = await deployTransparentProxy(
        "MoCVendors",
        proxyAdmin.address,
        MoCVendors__factory,
      );
      const mocExchange_v020: MoCExchange_v020 = await deployTransparentProxy(
        "MoCExchange_v020",
        proxyAdmin.address,
        MoCExchange_v020__factory,
        {
          libraries: { MoCHelperLib: mocHelperLib.address },
        },
      );
      const riskProxManager: MoCRiskProxManager = await deployTransparentProxy(
        "MoCRiskProxManager",
        proxyAdmin.address,
        MoCRiskProxManager__factory,
      );
      const stopper: Stopper = await deployTransparentProxy("Stopper", proxyAdmin.address, Stopper__factory);
      const mocCommissionSplitter: CommissionSplitter = await deployTransparentProxy(
        "CommissionSplitter",
        proxyAdmin.address,
        CommissionSplitter__factory,
      );

      const stableToken: StableToken = await deployContract("StableToken", StableToken__factory, []);
      const mocToken: MoCToken = await deployContract("MoCToken", MoCToken__factory, []);
      const riskProToken: RiskProToken = await deployContract("RiskProToken", RiskProToken__factory, []);
      const reserveToken: ReserveToken = await deployContract("ReserveToken", ReserveToken__factory, []);
      const priceProvider = await deployContract("PriceProviderMock", PriceProviderMock__factory, [
        baseParams.reservePrice,
      ]);
      const mocPriceProvider = await deployContract("MoCPriceProviderMock", MoCPriceProviderMock__factory, [
        baseParams.mocPrice,
      ]);
      const governorMock = await deployContract("GovernorMock", MockGovernor__factory, []);
      const upgradeDelegator: UpgradeDelegator = await deployContract(
        "UpgradeDelegator",
        UpgradeDelegator__factory,
        [],
      );

      await mocConnector_v020.initialize(
        moc_v020.address,
        stableToken.address,
        riskProToken.address,
        riskProxManager.address,
        mocState_v020.address,
        mocSettlement_v020.address,
        mocExchange_v020.address,
        mocInrate.address,
        deployer,
        reserveToken.address,
      );
      await moc_v020["initialize(address,address,address,bool)"](
        mocConnector_v020.address,
        governorMock.address,
        stopper.address,
        baseParams.startStoppable,
      );
      await stopper.initialize(deployer);
      await mocExchange_v020.initialize(mocConnector_v020.address);
      await mocState_v020[
        "initialize((address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,address,address,address,bool,uint256))"
      ]({
        connectorAddress: mocConnector_v020.address,
        governor: governorMock.address,
        priceProvider: priceProvider.address,
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
        mocConnector_v020.address,
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
        mocConnector_v020.address,
        governorMock.address,
        baseParams.c0Cobj,
        baseParams.x2Cobj,
      );
      await mocSettlement_v020["initialize(address,address,uint256)"](
        mocConnector_v020.address,
        governorMock.address,
        baseParams.settlementBlockSpan,
      );
      await mocCommissionSplitter["initialize(address,address,uint256,address,address,address,address)"](
        moc_v020.address,
        deployer,
        baseParams.mocProportion,
        governorMock.address,
        reserveToken.address,
        mocToken.address,
        deployer,
      );
      await upgradeDelegator["initialize(address,address)"](governorMock.address, proxyAdmin.address);
      await mocVendors["initialize(address,address,address)"](
        mocConnector_v020.address,
        governorMock.address,
        deployer /*vendorGuardian*/,
      );

      await reserveToken.claim(pEth(100000000000));
      await reserveToken.connect(await ethers.getSigner(alice)).claim(pEth(100000000000));
      await transferOwnershipAndMinting(riskProToken, mocExchange_v020.address);
      await transferOwnershipAndMinting(stableToken, mocExchange_v020.address);
      await transferPausingRole(riskProToken, moc_v020.address);
      await proxyAdmin.transferOwnership(upgradeDelegator.address);

      const stableTokenV2: StableTokenV2 = await deployUUPSProxy("StableTokenV2", StableTokenV2__factory);
      await stableTokenV2.initialize("USR", "USR", mocExchange_v020.address, governorMock.address);

      const tokenMigrator: TokenMigrator = await deployContract("TokenMigrator", TokenMigrator__factory, [
        stableToken.address,
        stableTokenV2.address,
      ]);

      return {
        mocHelperAddress: mocHelperLib.address,
        moc_v020,
        mocConnector_v020,
        mocExchange_v020,
        mocState_v020,
        mocSettlement_v020,
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
        stableTokenV2,
        tokenMigrator,
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
