import { deployments, getNamedAccounts } from "hardhat";
import memoizee from "memoizee";
import { Address } from "hardhat-deploy/types";
import {
  CommissionSplitter,
  CommissionSplitter__factory,
  MoC,
  MoCConnector,
  MoCConnector__factory,
  MoCInrate,
  MoCInrate__factory,
  MockGovernor__factory,
  MoCPriceProviderMock__factory,
  MoCRiskProxManager,
  MoCRiskProxManager__factory,
  MoCSettlementMock,
  MoCSettlementMock__factory,
  MoCState,
  MoCStateMock__factory,
  MoCToken,
  MoCToken__factory,
  MoCVendors,
  MoCVendors__factory,
  MoC__factory,
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
} from "../typechain";
import { MoCExchangeOld__factory } from "../typechain/factories/contracts/MoCExchange_v020.sol/MoCExchangeOld__factory";
import { MoCExchangeOld } from "../typechain/contracts/MoCExchange_v020.sol/MoCExchangeOld";
import { deployContract, deployTransparentProxy, baseParams, pEth, deployUUPSProxy } from "./helpers/utils";

export const fixtureDeployed = memoizee(
  (): (() => Promise<{
    mocHelperAddress: Address;
    mocConnector: MoCConnector;
    mocMoc: MoC;
    mocState: MoCState;
    mocSettlement: MoCSettlementMock;
    mocInrate: MoCInrate;
    mocVendors: MoCVendors;
    mocExchangeOld: MoCExchangeOld;
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

      const mocConnector: MoCConnector = await deployTransparentProxy(
        "MoCConnector",
        proxyAdmin.address,
        MoCConnector__factory,
      );
      const mocMoc: MoC = await deployTransparentProxy("MoC", proxyAdmin.address, MoC__factory);
      const mocState: MoCState = await deployTransparentProxy(
        "MoCStateMock",
        proxyAdmin.address,
        MoCStateMock__factory,
        {
          libraries: { MoCHelperLib: mocHelperLib.address },
        },
      );
      const mocSettlement: MoCSettlementMock = await deployTransparentProxy(
        "MoCSettlementMock",
        proxyAdmin.address,
        MoCSettlementMock__factory,
      );
      const mocInrate: MoCInrate = await deployTransparentProxy("MoCInrate", proxyAdmin.address, MoCInrate__factory, {
        libraries: { MoCHelperLib: mocHelperLib.address },
      });
      const mocVendors: MoCVendors = await deployTransparentProxy(
        "MoCVendors",
        proxyAdmin.address,
        MoCVendors__factory,
      );
      const mocExchangeOld: MoCExchangeOld = await deployTransparentProxy(
        "MoCExchangeOld",
        proxyAdmin.address,
        MoCExchangeOld__factory,
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

      await mocConnector.initialize(
        mocMoc.address,
        stableToken.address,
        riskProToken.address,
        riskProxManager.address,
        mocState.address,
        mocSettlement.address,
        mocExchangeOld.address,
        mocInrate.address,
        deployer,
        reserveToken.address,
      );
      await mocMoc["initialize(address,address,address,bool)"](
        mocConnector.address,
        governorMock.address,
        stopper.address,
        baseParams.startStoppable,
      );
      await stopper.initialize(deployer);
      await mocExchangeOld.initialize(mocConnector.address);
      await mocState[
        "initialize((address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,address,address,address,bool,uint256))"
      ]({
        connectorAddress: mocConnector.address,
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
        mocMoc.address,
        deployer,
        baseParams.mocProportion,
        governorMock.address,
        reserveToken.address,
        mocToken.address,
        deployer,
      );
      await upgradeDelegator["initialize(address,address)"](governorMock.address, proxyAdmin.address);
      await mocVendors["initialize(address,address,address)"](
        mocConnector.address,
        governorMock.address,
        deployer /*vendorGuardian*/,
      );

      await reserveToken.claim(pEth(100000000000));
      await reserveToken.connect(await ethers.getSigner(alice)).claim(pEth(100000000000));
      await transferOwnershipAndMinting(riskProToken, mocExchangeOld.address);
      await transferOwnershipAndMinting(stableToken, mocExchangeOld.address);
      await transferPausingRole(riskProToken, mocMoc.address);
      await proxyAdmin.transferOwnership(upgradeDelegator.address);

      const stableTokenV2: StableTokenV2 = await deployUUPSProxy("StableTokenV2", StableTokenV2__factory);
      await stableTokenV2.initialize("USR", "USR", mocExchangeOld.address, governorMock.address);

      const tokenMigrator: TokenMigrator = await deployContract("TokenMigrator", TokenMigrator__factory, [
        stableToken.address,
        stableTokenV2.address,
      ]);

      return {
        mocHelperAddress: mocHelperLib.address,
        mocConnector,
        mocMoc,
        mocState,
        mocSettlement,
        mocInrate,
        mocVendors,
        mocExchangeOld,
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
