import { Address } from "hardhat-deploy/dist/types";
import { BigNumber } from "@ethersproject/bignumber";
import { ethers, getNamedAccounts } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import {
  MoC,
  ReserveToken,
  StableTokenV2,
  UpgradeDelegator,
  RiskProToken,
  MoCState,
  MocRif,
  MocQueue,
  IChangeContract,
} from "../../typechain";
import { CONSTANTS, pEth } from "../helpers/utils";
import { assertPrec } from "../helpers/assertHelper";
import { fixtureDeployed } from "./fixture";
import { deployChanger } from "./deployChanger";

describe("Feature: MoC V2 migration - V2 functionalities", () => {
  let mocHelperAddress: Address;
  let mocProxy: MoC;
  let mocStateProxy: MoCState;
  let reserveToken: ReserveToken;
  let stableToken: StableTokenV2;
  let riskProToken: RiskProToken;
  let upgradeDelegator: UpgradeDelegator;
  let alice: Address;
  let bob: Address;
  let deployer: Address;
  let aliceSigner: SignerWithAddress;
  let mocRifV2: MocRif;
  let mocQueue: MocQueue;
  describe("GIVEN a MoC Legacy protocol deployed and long V2 migration", () => {
    beforeEach(async () => {
      ({ alice, bob, deployer } = await getNamedAccounts());
      ({
        mocHelperAddress,
        moc: mocProxy,
        upgradeDelegator,
        reserveToken,
        stableToken,
        riskProToken,
        mocState: mocStateProxy,
        mocRifV2,
        mocQueue,
      } = await fixtureDeployed()());
      aliceSigner = await ethers.getSigner(alice);
    });

    describe("AND alice has 1000000 riskProTokens and 1000000 StableToken", () => {
      beforeEach(async () => {
        await reserveToken.connect(aliceSigner).approve(mocProxy.address, pEth(1000000000));
        await mocProxy.connect(aliceSigner).mintRiskPro(pEth(1000000));
        assertPrec(await riskProToken.balanceOf(alice), pEth(1000000));
        await mocProxy.connect(aliceSigner).mintStableToken(pEth(100));
        assertPrec(await stableToken.balanceOf(alice), pEth(1000000));
      });
      describe("AND V2MigrationChanger is initialized", () => {
        let coverageBefore: BigNumber;
        let riskProAvailableBefore: BigNumber;
        let stableTokenAvailableBefore: BigNumber;
        let tpEmaBefore: BigNumber;
        let changer: IChangeContract;
        beforeEach(async () => {
          coverageBefore = await mocStateProxy.globalCoverage();
          riskProAvailableBefore = await mocStateProxy.absoluteMaxRiskPro();
          tpEmaBefore = await mocStateProxy.getExponentalMovingAverage();
          stableTokenAvailableBefore = await mocStateProxy.absoluteMaxStableToken();

          ({ changer } = await deployChanger(
            mocHelperAddress,
            upgradeDelegator.address,
            mocRifV2.address,
            mocProxy.address,
          ));
        });
        describe("AND Bob injects 2 collateral on V2 before changer is executed", () => {
          const qACInjected = pEth(2);
          beforeEach(async () => {
            await reserveToken.connect(await ethers.getSigner(bob)).transfer(mocRifV2.address, qACInjected);
            await mocRifV2.refreshACBalance();
            await changer.execute();
          });
          describe("WHEN check coverage", () => {
            it("THEN MocV1 coverage to be lower than MocV2", async () => {
              expect((await mocRifV2.getCglb()).sub(coverageBefore)).to.be.greaterThan(0);
            });
          });
          it("THEN MocV2 riskProToken available to redeem is more that MocV2 had", async () => {
            expect((await mocRifV2.getTCAvailableToRedeem()).sub(riskProAvailableBefore)).to.be.greaterThan(0);
          });
          it("THEN MocV2 StableToken available to mint is more than what MocV1 had", async () => {
            const availableToMint = await mocRifV2.getTPAvailableToMint(stableToken.address);
            expect(availableToMint.sub(stableTokenAvailableBefore)).to.be.greaterThan(0);
          });
          it("THEN MocV1 and MocV2 have the same tpEMA", async () => {
            assertPrec(tpEmaBefore, (await mocRifV2.tpEma(0))[0]);
          });
          describe("WHEN alice mints 100 TC using MocV2", () => {
            beforeEach(async () => {
              await reserveToken.connect(aliceSigner).approve(mocRifV2.address, pEth(100000));
              await mocRifV2
                .connect(aliceSigner)
                .mintTC(pEth(100), pEth(100000), alice, CONSTANTS.ZERO_ADDRESS, { value: CONSTANTS.EXEC_FEE });
              await mocQueue.execute(deployer);
            });
            it("THEN alice riskProToken balance is 1000000(from V1) + 100(from V2)", async () => {
              assertPrec(await riskProToken.balanceOf(alice), 1000100);
            });
          });
          describe("WHEN alice redeems 100 TC using MocV2", () => {
            beforeEach(async () => {
              await riskProToken.connect(aliceSigner).approve(mocRifV2.address, pEth(100));
              await mocRifV2
                .connect(aliceSigner)
                .redeemTC(pEth(100), 0, alice, CONSTANTS.ZERO_ADDRESS, { value: CONSTANTS.EXEC_FEE });
              await mocQueue.execute(deployer);
            });
            it("THEN alice riskProToken balance is 1000000(from V1) - 100(from V2)", async () => {
              assertPrec(await riskProToken.balanceOf(alice), 999900);
            });
          });
          describe("WHEN alice mints 100 TP using MocV2", () => {
            beforeEach(async () => {
              await reserveToken.connect(aliceSigner).approve(mocRifV2.address, pEth(100000));
              await mocRifV2
                .connect(aliceSigner)
                .mintTP(stableToken.address, pEth(100), pEth(100000), alice, CONSTANTS.ZERO_ADDRESS, {
                  value: CONSTANTS.EXEC_FEE,
                });
              await mocQueue.execute(deployer);
            });
            it("THEN alice stableToken balance is 1000000(from V1) + 100(from V2)", async () => {
              assertPrec(await stableToken.balanceOf(alice), 1000100);
            });
          });
          describe("WHEN alice redeems 100 TP using MocV2", () => {
            beforeEach(async () => {
              await stableToken.connect(aliceSigner).approve(mocRifV2.address, pEth(100));
              await mocRifV2
                .connect(aliceSigner)
                .redeemTP(stableToken.address, pEth(100), 0, alice, CONSTANTS.ZERO_ADDRESS, {
                  value: CONSTANTS.EXEC_FEE,
                });
              await mocQueue.execute(deployer);
            });
            it("THEN alice stableToken balance is 1000000(from V1) - 100(from V2)", async () => {
              assertPrec(await stableToken.balanceOf(alice), 999900);
            });
          });
        });
      });
    });
  });
});
