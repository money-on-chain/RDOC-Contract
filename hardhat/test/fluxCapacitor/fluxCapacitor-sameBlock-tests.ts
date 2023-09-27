import { mine } from "@nomicfoundation/hardhat-network-helpers";
import { network } from "hardhat";
import { MoC, MoCExchange, MoCInrate, ReserveToken } from "../../typechain";
import { assertPrec } from "../helpers/assertHelper";
import { CONSTANTS, pEth } from "../helpers/utils";
import { fixtureDeployed } from "./fixture";
describe("Feature: Flux Capacitor operations on same block", () => {
  let moc: MoC;
  let mocExchange: MoCExchange;
  let mocInrate: MoCInrate;
  let reserveToken: ReserveToken;

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
    describe("AND accumulators are initialized with 6000 AC", () => {
      beforeEach(async () => {
        await moc.mintStableToken(pEth(6000));
      });
      describe("AND blocks have elapsed at 50% of decay factor", () => {
        beforeEach(async () => {
          await mine(1439);
        });
        describe("WHEN user sends 2 mint txs in the same block, 1 AC and 6000 AC respectively", () => {
          beforeEach(async () => {
            // stop hardhat auto mine configuration
            await network.provider.send("evm_setAutomine", [false]);
            await moc.mintStableToken(pEth(1));
            await moc.mintStableToken(pEth(6000));
            // start hardhat auto mine configuration
            await network.provider.send("evm_setAutomine", [true]);
            // mine block manually
            await network.provider.send("evm_mine");
          });
          it("THEN both accumulators are updated to 9001", async () => {
            assertPrec(await mocExchange.absoluteAccumulator(), 9001);
            assertPrec(await mocExchange.differentialAccumulator(), 9001);
          });
        });
      });
    });
  });
});
