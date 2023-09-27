import { expect } from "chai";
import { getNamedAccounts } from "hardhat";
import { Address } from "hardhat-deploy/types";
import { MoC, MoCInrate, PriceProviderMock, ReserveToken } from "../../typechain";
import { assertPrec } from "../helpers/assertHelper";
import { Balance, CONSTANTS, pEth } from "../helpers/utils";
import { fixtureDeployed } from "./fixture";
describe("Feature: Arbitrage", () => {
  let moc: MoC;
  let mocInrate: MoCInrate;
  let reserveToken: ReserveToken;
  let priceProvider: PriceProviderMock;
  let deployer: Address;
  let executeArbitrage: any;
  const reservePrice = pEth(1);
  const MAX_DIFFERENTIAL_REACHED = "max operational difference reached";

  describe("GIVEN a Moc protocol deployed with flux capacitor initialized with max operational difference at 45k usd", () => {
    before(async () => {
      ({ deployer } = await getNamedAccounts());
      ({ moc, reserveToken, mocInrate, priceProvider } = await fixtureDeployed()());

      await moc.setMaxAbsoluteOperation(pEth(500000)); // 500k usd
      await moc.setMaxOperationalDifference(pEth(45000)); // 45k usd
      await moc.setDecayBlockSpan(2880);

      // infinite AC allowance
      await reserveToken.approve(moc.address, CONSTANTS.MAX_UINT256);
      // add collateral
      await moc.mintRiskPro(pEth(10000000));

      // set fees in 0 for easy maths
      await mocInrate.setCommissionRateByTxType(mocInrate.MINT_STABLETOKEN_FEES_RESERVE(), 0);
      await mocInrate.setCommissionRateByTxType(mocInrate.REDEEM_STABLETOKEN_FEES_RESERVE(), 0);

      // set rif price
      await priceProvider.poke(reservePrice, 0);

      executeArbitrage = async (reserveAmount: number) => {
        await priceProvider.poke(reservePrice.mul(102).div(100), 0);
        await moc.mintStableToken(pEth(reserveAmount));
        await priceProvider.poke(reservePrice, 0);
        await moc.redeemFreeStableToken(CONSTANTS.MAX_UINT256); // redeem all
      };
    });
    describe("WHEN arbitrage is executed with a price variation of 2% and operating 22.5k USD", () => {
      let prevRifBalance: Balance;
      before(async () => {
        prevRifBalance = await reserveToken.balanceOf(deployer);
        await executeArbitrage(22500);
      });
      it("THEN it succeeds and the user profit is 450 USD", async () => {
        assertPrec((await reserveToken.balanceOf(deployer)).sub(prevRifBalance), pEth(450));
      });
    });
    describe("WHEN arbitrage is executed with a price variation of 2% and operating more than 22.5k USD", () => {
      it("THEN it fails because max operational difference was reached", async () => {
        await expect(executeArbitrage(22501)).to.be.revertedWith(MAX_DIFFERENTIAL_REACHED);
      });
    });
  });
});
