import "@nomiclabs/hardhat-ethers";
import "hardhat-deploy";
import { task, types } from "hardhat/config";
import {
  MoCConnector__factory,
  MoC__factory,
  ReserveToken__factory,
  RiskProToken__factory,
  StableTokenV2__factory,
  StableToken__factory,
  TokenMigrator__factory,
} from "../typechain";

// TODO: after truffle deployment, copy the deployConfig file and get addresses from there according to the corresponding actual network
// addresses deployed on localhost, put yours here
const reserveTokenAddress = "0x24E3743409f6cdBCA7D4c986f2295533Ab64391A";
const riskProTokenAddress = "0xc4Ca0Db0022ddC0DD790BD7CBc5D537EC0CC6048";
const stableTokenV1Address = "0x95a51870C1F502baFdFC25c5a1224a2322ea968C";
const mocProxyAddress = "0xcDfda25161745BF5b1C701CCA186C0FADc6e5393";
const mocConnectorProxyAddress = "0x5dC0B7377613Ec5c65dC53291AaB837e9F5885Df";

task("mint-ReserveTokens", "mint Reserve Token(only for local tests)")
  .addParam("amount", "amount of Reserve Tokens to claim", "", types.string)
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;
    const reserveToken = ReserveToken__factory.connect(reserveTokenAddress, ethers.provider.getSigner());
    await reserveToken.claim(taskArgs.amount, {
      gasLimit: 6800000,
    });
    const [sender] = await ethers.getSigners();
    console.log(`Reserve Token actual balance: ${await reserveToken.balanceOf(sender.address)}`);
  });

task("mint-RiskProTokens", "mint RiskPro Tokens")
  .addParam("amount", "amount of Reserve Tokens to use for mint RiskPro Tokens", "", types.string)
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;
    const moc = MoC__factory.connect(mocProxyAddress, ethers.provider.getSigner());
    const reserveToken = ReserveToken__factory.connect(reserveTokenAddress, ethers.provider.getSigner());
    const riskProToken = RiskProToken__factory.connect(riskProTokenAddress, ethers.provider.getSigner());
    await reserveToken.approve(mocProxyAddress, taskArgs.amount, {
      gasLimit: 6800000,
    });
    await moc.mintRiskPro(taskArgs.amount, {
      gasLimit: 6800000,
    });
    const [sender] = await ethers.getSigners();
    console.log(`Reserve Token actual balance: ${await reserveToken.balanceOf(sender.address)}`);
    console.log(`RiskPro Token actual balance: ${await riskProToken.balanceOf(sender.address)}`);
  });

task("mint-StableTokens", "mint Stable Tokens")
  .addParam("amount", "amount of Reserve Tokens to use for mint Stable Tokens", "", types.string)
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;
    const moc = MoC__factory.connect(mocProxyAddress, ethers.provider.getSigner());
    const mocConnector = MoCConnector__factory.connect(mocConnectorProxyAddress, ethers.provider.getSigner());
    const reserveToken = ReserveToken__factory.connect(reserveTokenAddress, ethers.provider.getSigner());
    const stableTokenAddress = await mocConnector.stableToken();
    const stableToken = StableToken__factory.connect(stableTokenAddress, ethers.provider.getSigner());
    await reserveToken.approve(mocProxyAddress, taskArgs.amount, {
      gasLimit: 6800000,
    });
    await moc.mintStableToken(taskArgs.amount, {
      gasLimit: 6800000,
    });
    const [sender] = await ethers.getSigners();
    console.log(`Reserve Token actual balance: ${await reserveToken.balanceOf(sender.address)}`);
    console.log(`Stable Token Token actual balance: ${await stableToken.balanceOf(sender.address)}`);
  });

task("redeem-StableTokens", "redeem Stable Tokens")
  .addParam("amount", "amount of Stable Tokens to redeem", "", types.string)
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;
    const moc = MoC__factory.connect(mocProxyAddress, ethers.provider.getSigner());
    const mocConnector = MoCConnector__factory.connect(mocConnectorProxyAddress, ethers.provider.getSigner());
    const stableTokenAddress = await mocConnector.stableToken();
    const reserveToken = ReserveToken__factory.connect(reserveTokenAddress, ethers.provider.getSigner());
    const stableToken = StableToken__factory.connect(stableTokenAddress, ethers.provider.getSigner());
    await moc.redeemFreeStableToken(taskArgs.amount, {
      gasLimit: 6800000,
    });
    const [sender] = await ethers.getSigners();
    console.log(`Reserve Token actual balance: ${await reserveToken.balanceOf(sender.address)}`);
    console.log(`Stable Token Token actual balance: ${await stableToken.balanceOf(sender.address)}`);
  });

task("migrate-StableTokens", "migrate Stable Tokens").setAction(async (taskArgs, hre) => {
  const { deployments, ethers } = hre;
  const stableTokenV2Address = (await deployments.get("StableTokenV2Proxy")).address;
  const tokenMigratorAddress = (await deployments.get("TokenMigrator")).address;
  const stableTokenV1 = StableToken__factory.connect(stableTokenV1Address, ethers.provider.getSigner());
  const stableTokenV2 = StableTokenV2__factory.connect(stableTokenV2Address, ethers.provider.getSigner());
  const tokenMigrator = TokenMigrator__factory.connect(tokenMigratorAddress, ethers.provider.getSigner());
  const [sender] = await ethers.getSigners();
  console.log(`Migrating Stable Token V1 amount: ${await stableTokenV1.balanceOf(sender.address)}`);
  await stableTokenV1.approve(tokenMigratorAddress, await stableTokenV1.balanceOf(sender.address));
  console.log(await tokenMigrator.tokenV1());
  console.log(await tokenMigrator.tokenV2());
  await tokenMigrator.migrateToken({
    gasLimit: 6800000,
  });
  console.log(`Stable Token V1 Token actual balance: ${await stableTokenV1.balanceOf(sender.address)}`);
  console.log(`Stable Token V2 Token actual balance: ${await stableTokenV2.balanceOf(sender.address)}`);
});
