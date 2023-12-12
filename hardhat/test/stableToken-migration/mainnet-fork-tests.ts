import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import {
  MoC,
  ReserveToken,
  StableToken,
  StableTokenV2,
  TokenMigrator,
  MoC__factory,
  ReserveToken__factory,
  StableToken__factory,
  Governor__factory,
  Governor,
  StableTokenV2__factory,
  TokenMigrator__factory,
} from "../../typechain";
import { Balance, deployContract, deployUUPSProxy, pEth } from "../helpers/utils";
import { assertPrec } from "../helpers/assertHelper";
import { deployChanger } from "./deployMigrationChanger";
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const mocMainnetAddresses = require("../../../scripts/deploy/upgrade_v0.1.12/deployConfig-rdocMainnet.json");

describe("Feature: Stable Token migration - mainnet fork", () => {
  let mocProxy: MoC;
  let reserveToken: ReserveToken;
  let stableToken: StableToken;
  let governor: Governor;
  let stableTokenV2: StableTokenV2;
  let tokenMigrator: TokenMigrator;
  let governorOwnerSigner: SignerWithAddress;
  let rDocHolderSigner: SignerWithAddress;
  let signer: any;
  let holderReserveTokenBalanceBefore: Balance;
  let holderStableTokenBalanceBefore: Balance;
  const governorOwnerAddress = "0x65a5681bE95d212F0c90eAd40170D8277de81169";
  const rDocHolderAddress = "0x98F453D7d04cbc5A9759308E0a47f0DA471A8Df0";
  const gasPrice = 65820000;
  describe("GIVEN the MocRif protocol deployed in mainnet", () => {
    before(async () => {
      await helpers.reset("https://public-node.rsk.co", 5650800);
      signer = ethers.provider.getSigner();
      mocProxy = MoC__factory.connect(mocMainnetAddresses.proxyAddresses.MoC, signer);
      reserveToken = ReserveToken__factory.connect(mocMainnetAddresses.implementationAddresses.MocReserve, signer);
      governor = Governor__factory.connect("0x3b8853DF65AfBd94853E6D77ee0Ab5590F41bB08", signer);
      stableToken = StableToken__factory.connect("0x2d919F19D4892381D58edeBeca66D5642Cef1a1f", signer);

      stableTokenV2 = await deployUUPSProxy("StableTokenV2", StableTokenV2__factory);
      tokenMigrator = await deployContract("TokenMigrator", TokenMigrator__factory, [
        stableToken.address,
        stableTokenV2.address,
      ]);
      await stableTokenV2.initialize("TEST", "TEST", mocMainnetAddresses.proxyAddresses.MoCExchange, governor.address);

      await helpers.impersonateAccount(governorOwnerAddress);
      governorOwnerSigner = await ethers.getSigner(governorOwnerAddress);

      await helpers.impersonateAccount(rDocHolderAddress);
      rDocHolderSigner = await ethers.getSigner(rDocHolderAddress);

      await helpers.setBalance(rDocHolderAddress, pEth(10000000));
      await helpers.setBalance(governorOwnerAddress, pEth(10000000));

      holderReserveTokenBalanceBefore = await reserveToken.balanceOf(rDocHolderAddress);
      holderStableTokenBalanceBefore = await stableToken.balanceOf(rDocHolderAddress);

      // set baseFee to could send txs below the max gas price limit
      await helpers.setNextBlockBaseFeePerGas(gasPrice);
    });
    describe("WHEN holder tries migrate his StableToken before the upgrade", () => {
      it("THEN tx fails because TokenMigrator StableTokenV1 balance is 0", async () => {
        await stableToken.connect(rDocHolderSigner).approve(tokenMigrator.address, holderStableTokenBalanceBefore);
        await expect(tokenMigrator.connect(rDocHolderSigner).migrateToken()).to.be.revertedWith(
          "ERC20: transfer amount exceeds balance",
        );
      });
    });
    describe("AND StableTokenV2Changer is executed", async () => {
      before(async () => {
        const { changer } = await deployChanger(
          mocMainnetAddresses.implementationAddresses.UpgradeDelegator,
          mocMainnetAddresses.implementationAddresses.MoCHelperLib,
          mocProxy.address,
          stableTokenV2.address,
          tokenMigrator.address,
        );
        await governor.connect(governorOwnerSigner).executeChange(changer.address);
      });
      it("THEN StableToken V1 and V2 have the same total supply", async () => {
        assertPrec(await stableToken.totalSupply(), await stableTokenV2.totalSupply());
      });
      describe("WHEN holder tries to redeem StableTokenV1 before migrate them", () => {
        before(async () => {
          await mocProxy.connect(rDocHolderSigner).redeemFreeStableToken(pEth(1), { gasPrice });
        });
        it("THEN as holder StableToken balance is 0 he gets nothing", async () => {
          assertPrec(await stableToken.balanceOf(rDocHolderAddress), holderStableTokenBalanceBefore);
          assertPrec(await reserveToken.balanceOf(rDocHolderAddress), holderReserveTokenBalanceBefore);
        });
      });
      describe("AND holder migrates his StableTokens", () => {
        before(async () => {
          await stableToken.connect(rDocHolderSigner).approve(tokenMigrator.address, holderStableTokenBalanceBefore);
          await tokenMigrator.connect(rDocHolderSigner).migrateToken();
        });
        it("THEN holder StableTokenV1 balance is 0", async () => {
          assertPrec(await stableToken.balanceOf(rDocHolderAddress), 0);
        });
        it("THEN holder StableTokenV2 balance is updated with StableTokenV1 balance before", async () => {
          assertPrec(await stableTokenV2.balanceOf(rDocHolderAddress), holderStableTokenBalanceBefore);
        });
        describe("AND holder redeems 1 StableTokenV2", () => {
          before(async () => {
            await mocProxy.connect(rDocHolderSigner).redeemFreeStableToken(pEth(1), { gasPrice });
          });
          it("THEN holder StableTokenV2 balance decreases by 1", async () => {
            assertPrec(await stableTokenV2.balanceOf(rDocHolderAddress), holderStableTokenBalanceBefore.sub(pEth(1)));
          });
        });
      });
    });
  });
});
