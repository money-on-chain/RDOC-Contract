import { time, mine } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { MoC, MoCExchange, MoCInrate, ReserveToken } from "../../typechain";
import { assertPrec } from "../helpers/assertHelper";
import { CONSTANTS, pEth } from "../helpers/utils";
import { fixtureDeployed } from "./fixture";
describe("Feature: Flux Capacitor functionality", () => {
  let moc: MoC;
  let mocExchange: MoCExchange;
  let mocInrate: MoCInrate;
  let reserveToken: ReserveToken;
  let lastOperationBlockNumber: Number;
  const MAX_ABSOLUTE_REACHED = "max absolute operation reached";
  const MAX_DIFFERENTIAL_REACHED = "max operational difference reached";

  describe("GIVEN a Moc protocol deployed with flux capacitor initialized", () => {
    beforeEach(async () => {
      ({ moc, mocExchange, reserveToken, mocInrate } = await fixtureDeployed()());

      await moc.setMaxAbsoluteOperation(pEth(10000));
      await moc.setMaxOperationalDifference(pEth(5000));
      await moc.setDecayBlockSpan(2880);

      // infinite AC allowance
      await reserveToken.approve(moc.address, CONSTANTS.MAX_UINT256);
      // add collateral
      await moc.mintRiskPro(pEth(10000000));

      // set fees in 0 for easy maths
      await mocInrate.setCommissionRateByTxType(mocInrate.MINT_STABLETOKEN_FEES_RESERVE(), 0);
      await mocInrate.setCommissionRateByTxType(mocInrate.REDEEM_STABLETOKEN_FEES_RESERVE(), 0);
    });
    describe("WHEN 10001 AC are used to mint Stable Token", () => {
      it("THEN fails because max absolute operation was reached ", async () => {
        await expect(moc.mintStableToken(pEth(10001))).to.be.revertedWith(MAX_ABSOLUTE_REACHED);
      });
    });
    describe("WHEN 6000 AC are used to mint Stable Token", () => {
      beforeEach(async () => {
        await moc.mintStableToken(pEth(6000));
        lastOperationBlockNumber = await time.latestBlock();
      });
      it("THEN absolute and differential accumulators are in 6000", async () => {
        assertPrec(await mocExchange.absoluteAccumulator(), 6000);
        assertPrec(await mocExchange.differentialAccumulator(), 6000);
      });
      it("THEN last operation block is update", async () => {
        expect(await mocExchange.lastOperationBlockNumber()).to.be.equal(lastOperationBlockNumber);
      });
      it("THEN there are 4000 AC allowed to mint and 2500 AC allowed to redeem", async () => {
        assertPrec(await mocExchange.lastMaxReserveAllowedToMint(), 4000);
        assertPrec(await mocExchange.lastMaxReserveAllowedToRedeem(), 2500);
      });
      describe("WHEN 2501 AC are redeemed from Stable Token", () => {
        it("THEN fails because max operational difference was reached ", async () => {
          await expect(moc.redeemFreeStableToken(pEth(25000001))).to.be.revertedWith(MAX_DIFFERENTIAL_REACHED);
        });
      });
      describe("AND 4000 AC more are used to mint Stable Token", () => {
        beforeEach(async () => {
          // absolute = (6000 * (1 - 1/2880) + 4000) = 9997.91
          // differential = (6000 * (1 - 1/2880) + 4000) = 9997.91
          await moc.mintStableToken(pEth(4000));
        });
        describe("WHEN 5.6 AC are redeemed from Stable Token", () => {
          // absolute = 9997.91 * (1 - 1/2880) = 9994.45
          // differential = 9997.91 * (1 - 1/2880) = 9994.45
          it("THEN fails because max absolute operation was reached ", async () => {
            await expect(moc.redeemFreeStableToken(pEth(56000))).to.be.revertedWith(MAX_ABSOLUTE_REACHED);
          });
        });
      });
      describe("AND 288 block are mined, 10% of decay factor", () => {
        beforeEach(async () => {
          await mine(287);
        });
        describe("WHEN 2000 AC are redeemed from Stable Token", () => {
          beforeEach(async () => {
            await moc.redeemFreeStableToken(pEth(20000000));
          });
          it("THEN absolute accumulator is 7400 and differential accumulator is 3400", async () => {
            // absolute = (6000 * 0.9) + 2000
            // differential = (6000 * 0.9) - 2000
            assertPrec(await mocExchange.absoluteAccumulator(), 7400);
            assertPrec(await mocExchange.differentialAccumulator(), 3400);
          });
          it("THEN there are 2600 AC allowed to mint and 500 AC allowed to redeem", async () => {
            assertPrec(await mocExchange.lastMaxReserveAllowedToMint(), 2600);
            assertPrec(await mocExchange.lastMaxReserveAllowedToRedeem(), 500);
          });
          describe("AND maxOperationalDifference is set to 2000 AC, below actual accumulators value", () => {
            beforeEach(async () => {
              await moc.setMaxOperationalDifference(pEth(2000));
            });
            it("THEN there are 0 AC allowed to mint or redeem", async () => {
              assertPrec(await mocExchange.lastMaxReserveAllowedToMint(), 0);
              assertPrec(await mocExchange.lastMaxReserveAllowedToRedeem(), 0);
            });
          });
        });
      });
      describe("AND 2880 block are mined, 100% of decay factor", () => {
        beforeEach(async () => {
          await mine(2880);
        });
        it("THEN absolute and differential accumulators were reset", async () => {
          assertPrec(await mocExchange.lastMaxReserveAllowedToMint(), 10000);
          assertPrec(await mocExchange.lastMaxReserveAllowedToRedeem(), 10000);
        });
        describe("WHEN 2000 AC are redeemed from Stable Token", () => {
          beforeEach(async () => {
            await moc.redeemFreeStableToken(pEth(20000000));
          });
          it("THEN absolute accumulator is 2000 and differential accumulator is -2000", async () => {
            // absolute = 2000
            // differential = -2000
            assertPrec(await mocExchange.absoluteAccumulator(), 2000);
            assertPrec(await mocExchange.differentialAccumulator(), -2000);
          });
          it("THEN there are 8000 AC allowed to mint or redeem", async () => {
            assertPrec(await mocExchange.lastMaxReserveAllowedToMint(), 8000);
            assertPrec(await mocExchange.lastMaxReserveAllowedToRedeem(), 8000);
          });
        });
        describe("WHEN 3000 AC are redeemed from Stable Token", () => {
          beforeEach(async () => {
            await moc.redeemFreeStableToken(pEth(30000000));
          });
          it("THEN absolute accumulator is 3000 and differential accumulator is -3000", async () => {
            // absolute = 3000
            // differential = -3000
            assertPrec(await mocExchange.absoluteAccumulator(), 3000);
            assertPrec(await mocExchange.differentialAccumulator(), -3000);
          });
          it("THEN there are 2500 AC allowed to mint and 7000 AC allowed to redeem", async () => {
            assertPrec(await mocExchange.lastMaxReserveAllowedToMint(), 2500);
            assertPrec(await mocExchange.lastMaxReserveAllowedToRedeem(), 7000);
          });
        });
      });
      describe("AND maxAbsoluteOperation is set to 2000 AC, below actual accumulators value", () => {
        beforeEach(async () => {
          await moc.setMaxAbsoluteOperation(pEth(2000));
        });
        it("THEN there are 0 AC allowed to mint or redeem", async () => {
          assertPrec(await mocExchange.lastMaxReserveAllowedToMint(), 0);
          assertPrec(await mocExchange.lastMaxReserveAllowedToRedeem(), 0);
        });
      });
    });
  });
});
