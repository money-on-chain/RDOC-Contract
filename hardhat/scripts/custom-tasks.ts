import "@nomiclabs/hardhat-ethers";
import "hardhat-deploy";
import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  MoC,
  MoCConnector,
  MoCConnector__factory,
  MoC__factory,
  ReserveToken,
  ReserveToken__factory,
  RiskProToken,
  RiskProToken__factory,
  StableToken,
  StableTokenV2,
  StableTokenV2__factory,
  StableToken__factory,
  TokenMigrator,
  TokenMigrator__factory,
} from "../typechain";
import { waitForTxConfirmation } from "./utils";

function pEth(ethers: any, eth: string) {
  return ethers.utils.parseEther(eth).toString();
}

const config = {
  development: {
    reserveTokenAddress: "0x34320fA70799A3752eaDB338DB969Dc7536C9B91",
    riskProTokenAddress: "0xDC72ef43AfEb3D2d4B79d112B96F1679bf2061A3",
    stableTokenV1Address: "0x2347b03b8bC723A3d66F49a91b3aDd79b1DefeB4",
    mocProxyAddress: "0x1a3e8C905046FF1A3aB2cD63a8F61D9489f30d3a",
    mocConnectorProxyAddress: "0x0A46600d68FeD5590199928745153e03F8f153Bf",
  },
  devTestnet: {
    reserveTokenAddress: "0x34320fA70799A3752eaDB338DB969Dc7536C9B91",
    riskProTokenAddress: "0xDC72ef43AfEb3D2d4B79d112B96F1679bf2061A3",
    stableTokenV1Address: "0x2347b03b8bC723A3d66F49a91b3aDd79b1DefeB4",
    mocProxyAddress: "0x1a3e8C905046FF1A3aB2cD63a8F61D9489f30d3a",
    mocConnectorProxyAddress: "0x0A46600d68FeD5590199928745153e03F8f153Bf",
  },
};

const getContracts = async (
  hre: HardhatRuntimeEnvironment,
): Promise<{
  reserveToken: ReserveToken;
  riskProToken: RiskProToken;
  moc: MoC;
  mocConnector: MoCConnector;
  stableTokenV1: StableToken;
  stableTokenV2: StableTokenV2;
  tokenMigrator: TokenMigrator;
  actualStableToken: StableToken | StableTokenV2;
}> => {
  const { deployments, ethers } = hre;
  const mocAddresses = config[hre.network.name as keyof typeof config];
  const reserveToken = ReserveToken__factory.connect(mocAddresses.reserveTokenAddress, ethers.provider.getSigner());
  const riskProToken = RiskProToken__factory.connect(mocAddresses.riskProTokenAddress, ethers.provider.getSigner());
  const moc = MoC__factory.connect(mocAddresses.mocProxyAddress, ethers.provider.getSigner());
  const mocConnector = MoCConnector__factory.connect(
    mocAddresses.mocConnectorProxyAddress,
    ethers.provider.getSigner(),
  );
  const stableTokenV1 = StableToken__factory.connect(mocAddresses.stableTokenV1Address, ethers.provider.getSigner());

  const stableTokenV2Address = (await deployments.get("StableTokenV2Proxy")).address;
  const stableTokenV2 = StableTokenV2__factory.connect(stableTokenV2Address, ethers.provider.getSigner());
  const tokenMigratorAddress = (await deployments.get("TokenMigrator")).address;
  const tokenMigrator = TokenMigrator__factory.connect(tokenMigratorAddress, ethers.provider.getSigner());
  const actualStableTokenAddress = await mocConnector.stableToken();
  const actualStableToken = StableToken__factory.connect(actualStableTokenAddress, ethers.provider.getSigner());

  return {
    reserveToken,
    riskProToken,
    moc,
    mocConnector,
    stableTokenV1,
    stableTokenV2,
    tokenMigrator,
    actualStableToken,
  };
};

task("mint-ReserveTokens", "mint Reserve Token(only for local tests)")
  .addParam("wallet", "wallet ID", "0", types.string)
  .addParam("amount", "amount of Reserve Tokens to claim", "", types.string)
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;
    const { reserveToken } = await getContracts(hre);
    const sender = (await ethers.getSigners())[taskArgs.wallet];
    await waitForTxConfirmation(
      reserveToken.connect(sender).claim(pEth(ethers, taskArgs.amount), {
        gasLimit: 6800000,
      }),
    );
    console.log(`Reserve Token actual balance: ${await reserveToken.balanceOf(sender.address)}`);
  });

task("mint-RiskProTokens", "mint RiskPro Tokens")
  .addParam("wallet", "wallet ID", "0", types.string)
  .addParam("amount", "amount of Reserve Tokens to use for mint RiskPro Tokens", "", types.string)
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;
    const { reserveToken, riskProToken, moc } = await getContracts(hre);
    const sender = (await ethers.getSigners())[taskArgs.wallet];
    await waitForTxConfirmation(
      reserveToken.connect(sender).approve(moc.address, pEth(ethers, taskArgs.amount), {
        gasLimit: 6800000,
      }),
    );
    await waitForTxConfirmation(
      moc.connect(sender).mintRiskPro(pEth(ethers, taskArgs.amount), {
        gasLimit: 6800000,
      }),
    );
    console.log(`Reserve Token actual balance: ${await reserveToken.balanceOf(sender.address)}`);
    console.log(`RiskPro Token actual balance: ${await riskProToken.balanceOf(sender.address)}`);
  });

task("mint-StableTokens", "mint Stable Tokens")
  .addParam("wallet", "wallet ID", "0", types.string)
  .addParam("amount", "amount of Reserve Tokens to use for mint Stable Tokens", "", types.string)
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;
    const { reserveToken, moc, actualStableToken } = await getContracts(hre);
    const sender = (await ethers.getSigners())[taskArgs.wallet];
    await waitForTxConfirmation(
      reserveToken.connect(sender).approve(moc.address, pEth(ethers, taskArgs.amount), {
        gasLimit: 6800000,
      }),
    );
    await waitForTxConfirmation(
      moc.connect(sender).mintStableToken(pEth(ethers, taskArgs.amount), {
        gasLimit: 6800000,
      }),
    );
    console.log(`Reserve Token actual balance: ${await reserveToken.balanceOf(sender.address)}`);
    console.log(`Stable Token Token actual balance: ${await actualStableToken.balanceOf(sender.address)}`);
  });

task("redeem-StableTokens", "redeem Stable Tokens")
  .addParam("wallet", "wallet ID", "0", types.string)
  .addParam("amount", "amount of Stable Tokens to redeem", "", types.string)
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;
    const { reserveToken, moc, actualStableToken } = await getContracts(hre);
    const sender = (await ethers.getSigners())[taskArgs.wallet];
    await waitForTxConfirmation(
      moc.connect(sender).redeemFreeStableToken(pEth(ethers, taskArgs.amount), {
        gasLimit: 6800000,
      }),
    );
    console.log(`Reserve Token actual balance: ${await reserveToken.balanceOf(sender.address)}`);
    console.log(`Stable Token Token actual balance: ${await actualStableToken.balanceOf(sender.address)}`);
  });

task("migrate-StableTokens", "migrate Stable Tokens")
  .addParam("wallet", "wallet ID", "0", types.string)
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;
    const { tokenMigrator, stableTokenV1, stableTokenV2 } = await getContracts(hre);
    const sender = (await ethers.getSigners())[taskArgs.wallet];
    console.log(`Migrating Stable Token V1 amount: ${await stableTokenV1.balanceOf(sender.address)}`);
    await waitForTxConfirmation(
      stableTokenV1.connect(sender).approve(tokenMigrator.address, await stableTokenV1.balanceOf(sender.address)),
    );
    await waitForTxConfirmation(
      tokenMigrator.connect(sender).migrateToken({
        gasLimit: 6800000,
      }),
    );
    console.log(`Stable Token V1 Token actual balance: ${await stableTokenV1.balanceOf(sender.address)}`);
    console.log(`Stable Token V2 Token actual balance: ${await stableTokenV2.balanceOf(sender.address)}`);
  });
