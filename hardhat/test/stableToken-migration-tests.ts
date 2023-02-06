import { Address } from "hardhat-deploy/dist/types";
import { ethers, getNamedAccounts } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ContractTransaction } from "ethers";
import { expect } from "chai";
import {
  MoC,
  MoCExchange_v020,
  ReserveToken,
  StableToken,
  StableTokenMigrationChanger,
  StableTokenMigrationChanger__factory,
  StableTokenV2,
  TokenMigrator,
  UpgradeDelegator,
  MoCExchange_v021__factory,
} from "../typechain";
import { fixtureDeployed } from "./fixture";
import { Balance, deployContract, pEth } from "./helpers/utils";
import { assertPrec } from "./helpers/assertHelper";

describe("Feature: Stable Token migration", () => {
  let mocMoc: MoC;
  let reserveToken: ReserveToken;
  let stableToken: StableToken;
  let stableTokenV2: StableTokenV2;
  let tokenMigrator: TokenMigrator;
  let mocExchangeProxy: MoCExchange_v020;
  let upgradeDelegator: UpgradeDelegator;
  let mocHelperAddress: Address;
  let alice: Address;
  let aliceSigner: SignerWithAddress;
  describe("GIVEN a Moc protocol deployed with collateral", () => {
    beforeEach(async () => {
      ({ alice } = await getNamedAccounts());
      ({
        mocHelperAddress,
        mocMoc,
        mocExchange_v020: mocExchangeProxy,
        upgradeDelegator,
        reserveToken,
        stableToken,
        stableTokenV2,
        tokenMigrator,
      } = await fixtureDeployed()());
      aliceSigner = await ethers.getSigner(alice);
      await reserveToken.approve(mocMoc.address, pEth(100000));
      await mocMoc.mintRiskPro(pEth(100000));
    });
    describe("AND alice has 1000000 StableToken", async () => {
      beforeEach(async () => {
        await reserveToken.connect(aliceSigner).approve(mocMoc.address, pEth(100));
        await mocMoc.connect(aliceSigner).mintStableToken(pEth(100));
        assertPrec(await stableToken.balanceOf(alice), pEth(1000000));
      });
      describe("WHEN alice redeems 10 StableTokenV1", async () => {
        let aliceReserveTokenBalanceBefore: Balance;
        let aliceStableTokenV1BalanceBefore: Balance;
        beforeEach(async () => {
          aliceReserveTokenBalanceBefore = await reserveToken.balanceOf(alice);
          aliceStableTokenV1BalanceBefore = await stableToken.balanceOf(alice);
          await mocMoc.connect(aliceSigner).redeemFreeStableToken(pEth(10));
        });
        it("THEN alice StableToken balance decrease by 10", async () => {
          const diff = aliceStableTokenV1BalanceBefore.sub(await stableToken.balanceOf(alice));
          assertPrec(diff, pEth(10));
        });
        it("THEN alice ReserveToken balance increase by 0.001", async () => {
          const diff = (await reserveToken.balanceOf(alice)).sub(aliceReserveTokenBalanceBefore);
          assertPrec(diff, pEth("0.001"));
        });
      });
      describe("AND mocExchange_v021, mocExchange and StableTokenMigrationChanger are deployed", async () => {
        let changer: StableTokenMigrationChanger;
        beforeEach(async () => {
          const MocExchange_v021Factory = await ethers.getContractFactory("MoCExchange_v021", {
            libraries: { MoCHelperLib: mocHelperAddress },
          });
          const mocEchange_v021 = await MocExchange_v021Factory.deploy();
          const MocExchangeFactory = await ethers.getContractFactory("MoCExchange", {
            libraries: { MoCHelperLib: mocHelperAddress },
          });
          const mocExchange = await MocExchangeFactory.deploy();
          changer = await deployContract("StableTokenMigrationChanger", StableTokenMigrationChanger__factory, [
            mocExchangeProxy.address,
            upgradeDelegator.address,
            mocEchange_v021.address,
            mocExchange.address,
            stableTokenV2.address,
            tokenMigrator.address,
          ]);
        });
        describe("WHEN changer is executed", () => {
          beforeEach(async () => {
            await changer.execute();
          });
          it("THEN StableTokenV1 and StableTokenV2 total supply are the same", async () => {
            assertPrec(await stableToken.totalSupply(), await stableTokenV2.totalSupply());
          });
          it("THEN TokenMigrator contract has all StableTokenV2 total supply", async () => {
            assertPrec(await stableTokenV2.balanceOf(tokenMigrator.address), await stableTokenV2.totalSupply());
          });
          describe("WHEN someone tries to call migrateStableToken in mocExchange", () => {
            it("THEN tx reverts because function is not available, only exist atomically during the upgrade", async () => {
              const mocExchange = MoCExchange_v021__factory.connect(
                mocExchangeProxy.address,
                ethers.provider.getSigner(),
              );
              await expect(mocExchange.migrateStableToken(stableTokenV2.address, tokenMigrator.address)).to.be.reverted;
            });
          });
          describe("WHEN alice tries to redeem StableTokenV1 before migrate them", async () => {
            let aliceReserveTokenBalanceBefore: Balance;
            beforeEach(async () => {
              aliceReserveTokenBalanceBefore = await reserveToken.balanceOf(alice);
              await mocMoc.connect(aliceSigner).redeemFreeStableToken(pEth(100));
            });
            it("THEN because alice StableToken balance is 0 she redeems nothing", async () => {
              assertPrec(await stableToken.balanceOf(alice), pEth(1000000));
              assertPrec(await reserveToken.balanceOf(alice), aliceReserveTokenBalanceBefore);
            });
          });
          describe("WHEN alice mints 1000000 StableToken again", () => {
            let aliceStableTokenV1BalanceBefore: Balance;
            let aliceStableTokenV2BalanceBefore: Balance;
            beforeEach(async () => {
              aliceStableTokenV1BalanceBefore = await stableToken.balanceOf(alice);
              aliceStableTokenV2BalanceBefore = await stableTokenV2.balanceOf(alice);
              await reserveToken.connect(aliceSigner).approve(mocMoc.address, pEth(100));
              await mocMoc.connect(aliceSigner).mintStableToken(pEth(100));
            });
            it("THEN alice StableTokenV1 balance doesn`t change", async () => {
              assertPrec(await stableToken.balanceOf(alice), aliceStableTokenV1BalanceBefore);
            });
            it("THEN alice receives 1000000 StableTokenV2", async () => {
              const diff = (await stableTokenV2.balanceOf(alice)).sub(aliceStableTokenV2BalanceBefore);
              assertPrec(diff, pEth(1000000));
            });
          });
          describe("AND alice migrates her StableTokens", () => {
            let aliceStableTokenV1BalanceBefore: Balance;
            let migratorStableTokenV1BalanceBefore: Balance;
            let migratorStableTokenV2BalanceBefore: Balance;
            let tx: ContractTransaction;
            beforeEach(async () => {
              aliceStableTokenV1BalanceBefore = await stableToken.balanceOf(alice);
              migratorStableTokenV1BalanceBefore = await stableToken.balanceOf(tokenMigrator.address);
              migratorStableTokenV2BalanceBefore = await stableTokenV2.balanceOf(tokenMigrator.address);
              await stableToken.connect(aliceSigner).approve(tokenMigrator.address, aliceStableTokenV1BalanceBefore);
              tx = await tokenMigrator.connect(aliceSigner).migrateToken();
            });
            it("THEN alice StableTokenV1 balance is 0", async () => {
              assertPrec(await stableToken.balanceOf(alice), 0);
            });
            it("THEN alice StableTokenV2 balance is updated with StableTokenV1 balance before", async () => {
              assertPrec(await stableTokenV2.balanceOf(alice), aliceStableTokenV1BalanceBefore);
            });
            it("THEN TokenMigrator StableTokenV1 balance increase alice balance", async () => {
              const diff = (await stableToken.balanceOf(tokenMigrator.address)).sub(migratorStableTokenV1BalanceBefore);
              assertPrec(diff, aliceStableTokenV1BalanceBefore);
            });
            it("THEN TokenMigrator StableTokenV2 balance decrease alice balance", async () => {
              const diff = migratorStableTokenV2BalanceBefore.sub(await stableTokenV2.balanceOf(tokenMigrator.address));
              assertPrec(diff, aliceStableTokenV1BalanceBefore);
            });
            it("THEN a TokenMigrated event is emitted", async function () {
              await expect(tx).to.emit(tokenMigrator, "TokenMigrated").withArgs(alice, aliceStableTokenV1BalanceBefore);
            });
            describe("WHEN alice tries to migrates StableTokensV1 again", () => {
              it("THEN tx reverts because doesn't have balance", async () => {
                await expect(tokenMigrator.connect(aliceSigner).migrateToken()).to.be.revertedWithCustomError(
                  tokenMigrator,
                  "InsufficientTokenV1Balance",
                );
              });
            });
          });
        });
      });
    });
  });
});
