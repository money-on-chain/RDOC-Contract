import { MoC, MoCExchange, MoCInrate, ReserveToken } from "../../typechain";
import { assertPrec } from "../helpers/assertHelper";
import { CONSTANTS, pEth } from "../helpers/utils";
import { fixtureDeployed } from "./fixture";
describe("Feature: Flux Capacitor using fees", () => {
  let moc: MoC;
  let mocExchange: MoCExchange;
  let mocInrate: MoCInrate;
  let reserveToken: ReserveToken;

  describe("GIVEN a Moc protocol deployed with flux capacitor initialized", () => {
    before(async () => {
      ({ moc, mocExchange, reserveToken, mocInrate } = await fixtureDeployed()());

      await moc.setMaxAbsoluteOperation(pEth(10000));
      await moc.setMaxOperationalDifference(pEth(5000));
      await moc.setDecayBlockSpan(2880);

      // infinite AC allowance
      await reserveToken.approve(moc.address, CONSTANTS.MAX_UINT256);
      // add collateral
      await moc.mintRiskPro(pEth(10000000));

      await mocInrate.setCommissionRateByTxType(mocInrate.MINT_STABLETOKEN_FEES_RESERVE(), pEth(0.1));
      await mocInrate.setCommissionRateByTxType(mocInrate.REDEEM_STABLETOKEN_FEES_RESERVE(), pEth(0.1));
    });
    describe("WHEN 6000 AC are used to mint Stable Token", () => {
      before(async () => {
        await moc.mintStableToken(pEth(6000));
      });
      it("THEN absolute and differential accumulators are in 6000, fees are not taken into account", async () => {
        assertPrec(await mocExchange.absoluteAccumulator(), 6000);
        assertPrec(await mocExchange.differentialAccumulator(), 6000);
      });
      describe("WHEN 1000 AC are redeemed from Stable Token", () => {
        before(async () => {
          // reserve price = 10000
          // redeem fee = 0.1
          // 1000 * 10000 * 0.9
          await moc.redeemFreeStableToken(pEth(10000000));
        });
        it("THEN absolute accumulator is 8897 and differential accumulator is 5097, fees are not taken into account", async () => {
          // absolute = ((1 - (1/2880)) * 6000) + 900
          // differential = ((1 - (1/2880)) * 6000) - 900
          assertPrec(await mocExchange.absoluteAccumulator(), "6897.916666666666668000");
          assertPrec(await mocExchange.differentialAccumulator(), "5097.916666666666668000");
        });
      });
    });
  });
});
