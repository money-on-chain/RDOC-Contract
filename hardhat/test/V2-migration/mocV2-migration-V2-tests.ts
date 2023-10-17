import { Address } from "hardhat-deploy/dist/types";
import { BigNumber } from "@ethersproject/bignumber";
import { ethers, getNamedAccounts } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import {
  MoC,
  ReserveToken,
  StableTokenV2,
  PriceProviderMock,
  UpgradeDelegator,
  RiskProToken,
  CommissionSplitter,
  MoCState,
  MocRif,
  MoCInrate,
} from "../../typechain";
import { pEth } from "../helpers/utils";
import { assertPrec } from "../helpers/assertHelper";
import { fixtureDeployed } from "./fixture";
import { deployChanger } from "./deployChanger";

describe("Feature: MoC V2 migration - V2 functionalities", () => {
  let mocHelperAddress: Address;
  let mocProxy: MoC;
  let mocStateProxy: MoCState;
  let reserveToken: ReserveToken;
  let stableToken: StableTokenV2;
  let stableTokenPriceProvider: PriceProviderMock;
  let riskProToken: RiskProToken;
  let upgradeDelegator: UpgradeDelegator;
  let alice: Address;
  let aliceSigner: SignerWithAddress;
  let mocRifV2: MocRif;
  let mocCommissionSplitter: CommissionSplitter;
  let mocInrateProxy: MoCInrate;
  describe("GIVEN a MoC Legacy protocol deployed", () => {
    beforeEach(async () => {
      ({ alice } = await getNamedAccounts());
      ({
        mocHelperAddress,
        moc: mocProxy,
        upgradeDelegator,
        reserveToken,
        stableToken,
        stableTokenPriceProvider,
        riskProToken,
        mocCommissionSplitter,
        mocState: mocStateProxy,
        mocInrate: mocInrateProxy,
        mocRifV2,
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
      describe("AND V2MigrationChanger is executed", () => {
        let coverageBefore: BigNumber;
        let riskProTokenPriceBefore: BigNumber;
        let riskProAvailableBefore: BigNumber;
        let stableTokenAvailableBefore: BigNumber;
        let tpEmaBefore: BigNumber;
        let nextEmaCalculationBefore: BigNumber;
        let nextTCInterestPaymentBefore: BigNumber;
        beforeEach(async () => {
          coverageBefore = await mocStateProxy.globalCoverage();
          riskProTokenPriceBefore = await mocStateProxy.riskProTecPrice();
          riskProAvailableBefore = await mocStateProxy.absoluteMaxRiskPro();
          tpEmaBefore = await mocStateProxy.getExponentalMovingAverage();
          stableTokenAvailableBefore = await mocStateProxy.absoluteMaxStableToken();
          nextEmaCalculationBefore = (await mocStateProxy.lastEmaCalculation()).add(
            await mocStateProxy.emaCalculationBlockSpan(),
          );
          nextTCInterestPaymentBefore = (await mocInrateProxy.lastRiskProInterestBlock()).add(
            await mocInrateProxy.riskProInterestBlockSpan(),
          );
          const { changer } = await deployChanger(
            mocHelperAddress,
            upgradeDelegator.address,
            mocCommissionSplitter.address,
            mocRifV2.address,
            mocProxy.address,
          );
          await changer.execute();
        });
        describe("WHEN check coverage", () => {
          it("THEN MocV1 and MocV2 coverage are the same", async () => {
            assertPrec(coverageBefore, await mocRifV2.getCglb());
          });
        });
        describe("WHEN check riskProToken price", () => {
          it("THEN MocV1 and MocV2 return the same", async () => {
            assertPrec(riskProTokenPriceBefore, await mocRifV2.getPTCac());
          });
        });
        describe("WHEN check riskProToken available to redeem", () => {
          it("THEN MocV1 and MocV2 have the same", async () => {
            assertPrec(riskProAvailableBefore, await mocRifV2.getTCAvailableToRedeem());
          });
        });
        describe("WHEN check StableToken available to mint", () => {
          it("THEN MocV1 and MocV2 have the same", async () => {
            assertPrec(stableTokenAvailableBefore, await mocRifV2.getTPAvailableToMint(0));
          });
        });
        describe("WHEN check TP Ema", () => {
          it("THEN MocV1 and MocV2 have the same", async () => {
            assertPrec(tpEmaBefore, (await mocRifV2.tpEma(0))[0]);
          });
        });
        describe("WHEN check next Ema calculation block", () => {
          it("THEN MocV1 and MocV2 have the same", async () => {
            assertPrec(nextEmaCalculationBefore, await mocRifV2.nextEmaCalculation());
          });
        });
        describe("WHEN check next TC interest payment block", () => {
          it("THEN MocV1 and MocV2 have the same", async () => {
            assertPrec(nextTCInterestPaymentBefore, await mocRifV2.nextTCInterestPayment());
          });
        });
        describe("WHEN alice mints 100 TC using MocV2", () => {
          beforeEach(async () => {
            await reserveToken.connect(aliceSigner).approve(mocRifV2.address, pEth(100000));
            await mocRifV2.connect(aliceSigner).mintTC(pEth(100), pEth(100000));
          });
          it("THEN alice riskProToken balance is 1000000(from V1) + 100(from V2)", async () => {
            assertPrec(await riskProToken.balanceOf(alice), 1000100);
          });
        });
        describe("WHEN alice redeems 100 TC using MocV2", () => {
          beforeEach(async () => {
            await mocRifV2.connect(aliceSigner).redeemTC(pEth(100), 0);
          });
          it("THEN alice riskProToken balance is 1000000(from V1) - 100(from V2)", async () => {
            assertPrec(await riskProToken.balanceOf(alice), 999900);
          });
        });
        describe("WHEN alice mints 100 TP using MocV2", () => {
          beforeEach(async () => {
            await reserveToken.connect(aliceSigner).approve(mocRifV2.address, pEth(100000));
            await mocRifV2.connect(aliceSigner).mintTP(0, pEth(100), pEth(100000));
          });
          it("THEN alice stableToken balance is 1000000(from V1) + 100(from V2)", async () => {
            assertPrec(await stableToken.balanceOf(alice), 1000100);
          });
        });
        describe("WHEN alice redeems 100 TP using MocV2", () => {
          beforeEach(async () => {
            await mocRifV2.connect(aliceSigner).redeemTP(0, pEth(100), 0);
          });
          it("THEN alice stableToken balance is 1000000(from V1) - 100(from V2)", async () => {
            assertPrec(await stableToken.balanceOf(alice), 999900);
          });
        });
        describe("AND reserveToken price falls a lot to make protocol be liquidated", () => {
          beforeEach(async () => {
            await stableTokenPriceProvider.poke(10, 0);
            await mocRifV2.setLiqEnabled(true);
            await mocRifV2.evalLiquidation();
          });
          it("THEN riskProToken is paused", async () => {
            expect(await riskProToken.paused()).to.be.true;
          });
        });
      });
    });
  });
});
