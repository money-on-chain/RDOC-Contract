import { deployments, getNamedAccounts } from "hardhat";
import memoizee from "memoizee";
import { Address } from "hardhat-deploy/types";
import {
  CommissionSplitter,
  CommissionSplitter__factory,
  MoC_v0115,
  MoC_v0115__factory,
  MoCConnector_v0115,
  MoCConnector_v0115__factory,
  MoCInrate,
  MoCInrate__factory,
  MoCPriceProviderMock__factory,
  MoCRiskProxManager,
  MoCRiskProxManager__factory,
  MoCSettlement_v0115,
  MoCSettlement_v0115__factory,
  MoCState_v0115,
  MoCState_v0115__factory,
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
  MoCExchange_v0115,
  MoCExchange_v0115__factory,
  ProxyAdmin__factory,
  ProxyAdmin,
} from "../typechain";
import { deployContract, deployTransparentProxy, baseParams, pEth } from "./helpers/utils";

export const fixtureDeployed = memoizee(
  (): (() => Promise<{
    mocHelperAddress: Address;
    moc_v0115: MoC_v0115;
    mocConnector_v0115: MoCConnector_v0115;
    mocExchange_v0115: MoCExchange_v0115;
    mocState_v0115: MoCState_v0115;
    mocSettlement_v0115: MoCSettlement_v0115;
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
      await deployments.fixture();
      const { deployer, alice } = await getNamedAccounts();
      const signer = await ethers.provider.getSigner();

      const deployedProxyAdmin = await deployments.getOrNull("ProxyAdmin");
      if (!deployedProxyAdmin) throw new Error("No ProxyAdmin deployed.");
      const proxyAdmin: ProxyAdmin = ProxyAdmin__factory.connect(deployedProxyAdmin.address, signer);

      const mocHelperLib = await deployments.getOrNull("MoCHelperLib");
      if (!mocHelperLib) throw new Error("No MoCHelperLib deployed.");

      const mocConnector_v0115: MoCConnector_v0115 = await deployTransparentProxy(
        "MoCConnector_v0115",
        proxyAdmin.address,
        MoCConnector_v0115__factory,
      );
      const moc_v0115: MoC_v0115 = await deployTransparentProxy("MoC_v0115", proxyAdmin.address, MoC_v0115__factory);
      const mocState_v0115: MoCState_v0115 = await deployTransparentProxy(
        "MoCState_v0115",
        proxyAdmin.address,
        MoCState_v0115__factory,
        {
          libraries: { MoCHelperLib: mocHelperLib.address },
        },
      );
      const mocSettlement_v0115: MoCSettlement_v0115 = await deployTransparentProxy(
        "MoCSettlement_v0115",
        proxyAdmin.address,
        MoCSettlement_v0115__factory,
      );
      const mocInrate: MoCInrate = await deployTransparentProxy("MoCInrate", proxyAdmin.address, MoCInrate__factory, {
        libraries: { MoCHelperLib: mocHelperLib.address },
      });
      const mocVendors: MoCVendors = await deployTransparentProxy(
        "MoCVendors",
        proxyAdmin.address,
        MoCVendors__factory,
      );

      const deployedMocExchange_v0115 = await deployments.getOrNull("MoCExchangeProxy");
      if (!deployedMocExchange_v0115) throw new Error("No MoCExchangeProxy deployed.");
      const mocExchange_v0115: MoCExchange_v0115 = MoCExchange_v0115__factory.connect(
        deployedMocExchange_v0115.address,
        signer,
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

      const deployedStableToken = await deployments.getOrNull("StableToken");
      if (!deployedStableToken) throw new Error("No StableToken deployed.");
      const stableToken: StableToken = StableToken__factory.connect(deployedStableToken.address, signer);

      const mocToken: MoCToken = await deployContract("MoCToken", MoCToken__factory, []);
      const riskProToken: RiskProToken = await deployContract("RiskProToken", RiskProToken__factory, []);
      const reserveToken: ReserveToken = await deployContract("ReserveToken", ReserveToken__factory, []);
      const priceProvider = await deployContract("PriceProviderMock", PriceProviderMock__factory, [
        baseParams.reservePrice,
      ]);
      const mocPriceProvider = await deployContract("MoCPriceProviderMock", MoCPriceProviderMock__factory, [
        baseParams.mocPrice,
      ]);

      const governorMock = await deployments.getOrNull("GovernorMock");
      if (!governorMock) throw new Error("No GovernorMock deployed.");

      const upgradeDelegator: UpgradeDelegator = await deployContract(
        "UpgradeDelegator",
        UpgradeDelegator__factory,
        [],
      );

      await mocConnector_v0115.initialize(
        moc_v0115.address,
        stableToken.address,
        riskProToken.address,
        riskProxManager.address,
        mocState_v0115.address,
        mocSettlement_v0115.address,
        mocExchange_v0115.address,
        mocInrate.address,
        deployer,
        reserveToken.address,
      );
      await moc_v0115["initialize(address,address,address,bool)"](
        mocConnector_v0115.address,
        governorMock.address,
        stopper.address,
        baseParams.startStoppable,
      );
      await stopper.initialize(deployer);
      await mocExchange_v0115.initialize(mocConnector_v0115.address);
      await mocState_v0115[
        "initialize((address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,address,address,address,bool,uint256))"
      ]({
        connectorAddress: mocConnector_v0115.address,
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
        mocConnector_v0115.address,
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
        mocConnector_v0115.address,
        governorMock.address,
        baseParams.c0Cobj,
        baseParams.x2Cobj,
      );
      await mocSettlement_v0115["initialize(address,address,uint256)"](
        mocConnector_v0115.address,
        governorMock.address,
        baseParams.settlementBlockSpan,
      );
      await mocCommissionSplitter["initialize(address,address,uint256,address,address,address,address)"](
        moc_v0115.address,
        deployer,
        baseParams.mocProportion,
        governorMock.address,
        reserveToken.address,
        mocToken.address,
        deployer,
      );
      await upgradeDelegator["initialize(address,address)"](governorMock.address, proxyAdmin.address);
      await mocVendors["initialize(address,address,address)"](
        mocConnector_v0115.address,
        governorMock.address,
        deployer /*vendorGuardian*/,
      );

      await reserveToken.claim(pEth(100000000000));
      await reserveToken.connect(await ethers.getSigner(alice)).claim(pEth(100000000000));
      await transferOwnershipAndMinting(riskProToken, mocExchange_v0115.address);
      await transferOwnershipAndMinting(stableToken, mocExchange_v0115.address);
      await transferPausingRole(riskProToken, moc_v0115.address);
      await proxyAdmin.transferOwnership(upgradeDelegator.address);

      const deployedStableTokenV2 = await deployments.getOrNull("StableTokenV2Proxy");
      if (!deployedStableTokenV2) throw new Error("No StableTokenV2Proxy deployed.");
      const stableTokenV2: StableTokenV2 = StableTokenV2__factory.connect(deployedStableTokenV2.address, signer);

      const deployedTokenMigrator = await deployments.getOrNull("TokenMigrator");
      if (!deployedTokenMigrator) throw new Error("No TokenMigrator deployed.");
      const tokenMigrator: TokenMigrator = TokenMigrator__factory.connect(deployedTokenMigrator.address, signer);

      return {
        mocHelperAddress: mocHelperLib.address,
        moc_v0115,
        mocConnector_v0115,
        mocExchange_v0115,
        mocState_v0115,
        mocSettlement_v0115,
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
