import "@nomiclabs/hardhat-ethers";
import "hardhat-deploy";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  CommissionSplitter,
  CommissionSplitter__factory,
  MoC,
  MoCConnector,
  MoCConnector__factory,
  MoCExchange,
  MoCExchange__factory,
  MoCInrate,
  MoCInrate__factory,
  MoCSettlement,
  MoCSettlement__factory,
  MoCState,
  MoCState__factory,
  MoCToken,
  MoCToken__factory,
  MoCVendors,
  MoCVendors__factory,
  MoC__factory,
  ReserveToken,
  ReserveToken__factory,
  RiskProToken,
  RiskProToken__factory,
  StableToken,
  StableToken__factory,
} from "../typechain";

const config = {
  development: {
    reserveTokenAddress: "0x34320fA70799A3752eaDB338DB969Dc7536C9B91",
    riskProTokenAddress: "0xDC72ef43AfEb3D2d4B79d112B96F1679bf2061A3",
    stableTokenAddress: "0x2347b03b8bC723A3d66F49a91b3aDd79b1DefeB4",
    mocTokenAddress: "0x9AC7fE28967B30E3A4e6e03286d715b42B453D10",
    mocProxyAddress: "0x1a3e8C905046FF1A3aB2cD63a8F61D9489f30d3a",
    mocConnectorProxyAddress: "0x0A46600d68FeD5590199928745153e03F8f153Bf",
    mocExchangeProxyAddress: "0x1a3e8C905046FF1A3aB2cD63a8F61D9489f30d3a",
    mocSettlementProxyAddress: "0xb8a6beBa78c3E73f6A66DDacFaEB240ae22Ca709",
    moCInrateProxyAddress: "0x1DaB07c4FD07d6eE1359a5198ACa2DEe64F371f3",
    moCStateProxyAddress: "0x541F68a796Fe5ae3A381d2Aa5a50b975632e40A6",
    moCVendorsProxyAddress: "0x581C819c48ed1a6c716A736361001B53D54A0a80",
    mocCommissionSplitterProxyAddress: "0x4C42DBa2a88D4ecc97aA7F28Ced17b4e60523201",
  },
  devTestnet: {
    reserveTokenAddress: "0x34320fA70799A3752eaDB338DB969Dc7536C9B91",
    riskProTokenAddress: "0xDC72ef43AfEb3D2d4B79d112B96F1679bf2061A3",
    stableTokenAddress: "0x2347b03b8bC723A3d66F49a91b3aDd79b1DefeB4",
    mocTokenAddress: "0x9AC7fE28967B30E3A4e6e03286d715b42B453D10",
    mocProxyAddress: "0x1a3e8C905046FF1A3aB2cD63a8F61D9489f30d3a",
    mocConnectorProxyAddress: "0x0A46600d68FeD5590199928745153e03F8f153Bf",
    mocExchangeProxyAddress: "0x1a3e8C905046FF1A3aB2cD63a8F61D9489f30d3a",
    mocSettlementProxyAddress: "0xb8a6beBa78c3E73f6A66DDacFaEB240ae22Ca709",
    moCInrateProxyAddress: "0x1DaB07c4FD07d6eE1359a5198ACa2DEe64F371f3",
    moCStateProxyAddress: "0x541F68a796Fe5ae3A381d2Aa5a50b975632e40A6",
    moCVendorsProxyAddress: "0x581C819c48ed1a6c716A736361001B53D54A0a80",
    mocCommissionSplitterProxyAddress: "0x4C42DBa2a88D4ecc97aA7F28Ced17b4e60523201",
  },
  rdocMainnet: {
    reserveTokenAddress: "0x2AcC95758f8b5F583470ba265EB685a8F45fC9D5",
    riskProTokenAddress: "0xf4d27c56595Ed59B66cC7F03CFF5193e4bd74a61",
    stableTokenAddress: "0x2d919F19D4892381D58edeBeca66D5642Cef1a1f",
    mocTokenAddress: "0x9AC7fE28967B30E3A4e6e03286d715b42B453D10",
    mocProxyAddress: "0xCfF3fcaeC2352C672C38d77cb1a064B7D50ce7e1",
    mocConnectorProxyAddress: "0xA0e2554E525B34FD186C2C356C93d563541b02C0",
    mocExchangeProxyAddress: "0x9497d2AEcd0757Dd4fcb4d5F2131293570FaD305",
    mocSettlementProxyAddress: "0xb8a6beBa78c3E73f6A66DDacFaEB240ae22Ca709",
    moCInrateProxyAddress: "0x1DaB07c4FD07d6eE1359a5198ACa2DEe64F371f3",
    moCStateProxyAddress: "0x541F68a796Fe5ae3A381d2Aa5a50b975632e40A6",
    moCVendorsProxyAddress: "0x581C819c48ed1a6c716A736361001B53D54A0a80",
    mocCommissionSplitterProxyAddress: "0x4C42DBa2a88D4ecc97aA7F28Ced17b4e60523201",
  },
};

const getContracts = async (
  hre: HardhatRuntimeEnvironment,
): Promise<{
  reserveToken: ReserveToken;
  riskProToken: RiskProToken;
  stableToken: StableToken;
  mocToken: MoCToken;
  moc: MoC;
  mocConnector: MoCConnector;
  mocExchange: MoCExchange;
  mocSettlement: MoCSettlement;
  mocInrate: MoCInrate;
  mocState: MoCState;
  mocVendors: MoCVendors;
  mocCommissionSplitter: CommissionSplitter;
}> => {
  const { ethers } = hre;
  const mocAddresses = config[hre.network.name as keyof typeof config];
  const reserveToken = ReserveToken__factory.connect(mocAddresses.reserveTokenAddress, ethers.provider.getSigner());
  const riskProToken = RiskProToken__factory.connect(mocAddresses.riskProTokenAddress, ethers.provider.getSigner());
  const stableToken = StableToken__factory.connect(mocAddresses.stableTokenAddress, ethers.provider.getSigner());
  const mocToken = MoCToken__factory.connect(mocAddresses.mocTokenAddress, ethers.provider.getSigner());
  const moc = MoC__factory.connect(mocAddresses.mocProxyAddress, ethers.provider.getSigner());
  const mocConnector = MoCConnector__factory.connect(
    mocAddresses.mocConnectorProxyAddress,
    ethers.provider.getSigner(),
  );
  const mocExchange = MoCExchange__factory.connect(mocAddresses.mocExchangeProxyAddress, ethers.provider.getSigner());
  const mocSettlement = MoCSettlement__factory.connect(
    mocAddresses.mocSettlementProxyAddress,
    ethers.provider.getSigner(),
  );
  const mocInrate = MoCInrate__factory.connect(mocAddresses.moCInrateProxyAddress, ethers.provider.getSigner());
  const mocState = MoCState__factory.connect(mocAddresses.moCStateProxyAddress, ethers.provider.getSigner());
  const mocVendors = MoCVendors__factory.connect(mocAddresses.moCVendorsProxyAddress, ethers.provider.getSigner());
  const mocCommissionSplitter = CommissionSplitter__factory.connect(
    mocAddresses.mocCommissionSplitterProxyAddress,
    ethers.provider.getSigner(),
  );

  return {
    reserveToken,
    riskProToken,
    stableToken,
    mocToken,
    moc,
    mocConnector,
    mocExchange,
    mocSettlement,
    mocInrate,
    mocState,
    mocVendors,
    mocCommissionSplitter,
  };
};

task("print-balances", "print all Moc Legacy contracts balances").setAction(async (taskArgs, hre) => {
  const { ethers } = hre;
  const {
    moc,
    mocConnector,
    mocExchange,
    mocSettlement,
    mocInrate,
    mocState,
    mocVendors,
    mocCommissionSplitter,
    reserveToken,
    riskProToken,
    stableToken,
    mocToken,
  } = await getContracts(hre);
  await Promise.all(
    [moc, mocConnector, mocExchange, mocSettlement, mocInrate, mocState, mocVendors, mocCommissionSplitter].map(
      async value => {
        console.log(`Reserve Token ${value.address} actual balance: ${await reserveToken.balanceOf(value.address)}`);
        console.log(`RiskPro Token ${value.address} actual balance: ${await riskProToken.balanceOf(value.address)}`);
        console.log(`StableToken Token ${value.address} actual balance: ${await stableToken.balanceOf(value.address)}`);
        console.log(`MoC Token ${value.address} actual balance: ${await mocToken.balanceOf(value.address)}`);
        console.log(`rBTC ${value.address} actual balance: ${await ethers.provider.getBalance(value.address)}`);
      },
    ),
  );
});
