import { Address } from "hardhat-deploy/dist/types";
import { ethers, getNamedAccounts } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import {
  MoC,
  ReserveToken,
  StableTokenV2,
  UpgradeDelegator,
  RiskProToken,
  CommissionSplitter,
  MoCInrate,
  MocRif,
} from "../../typechain";
import { Balance, pEth } from "../helpers/utils";
import { assertPrec } from "../helpers/assertHelper";
import { fixtureDeployed } from "./fixture";
import { deployChanger } from "./deployChanger";

describe("Feature: MoC V2 migration - V1 functionalities", () => {
  let mocHelperAddress: Address;
  let mocProxy: MoC;
  let reserveToken: ReserveToken;
  let stableToken: StableTokenV2;
  let riskProToken: RiskProToken;
  let upgradeDelegator: UpgradeDelegator;
  let deployer: Address;
  let alice: Address;
  let aliceSigner: SignerWithAddress;
  let vendor: Address;
  let mocRifV2: MocRif;
  let mocCommissionSplitter: CommissionSplitter;
  let mocInrate: MoCInrate;
  const expectRevertContractDeprecated = (it: any) =>
    expect(it).to.be.revertedWith("contract deprecated. Protocol migrated to V2");

  describe("GIVEN a MoC Legacy protocol deployed", () => {
    before(async () => {
      ({ deployer, alice, vendor } = await getNamedAccounts());
      ({
        mocHelperAddress,
        moc: mocProxy,
        upgradeDelegator,
        reserveToken,
        stableToken,
        riskProToken,
        mocCommissionSplitter,
        mocInrate,
        mocRifV2,
      } = await fixtureDeployed()());
      aliceSigner = await ethers.getSigner(alice);

      // set 10% of commission when mints risk pro, so CommissionSplitter gets some tokens to split
      await mocInrate.setCommissionRateByTxType(1, pEth("0.1"));
    });

    describe("AND alice has 1000000 riskProTokens and 1000000 StableToken", () => {
      before(async () => {
        await reserveToken.connect(aliceSigner).approve(mocProxy.address, pEth(1000000000));
        await mocProxy.connect(aliceSigner).mintRiskPro(pEth(1000000));
        assertPrec(await riskProToken.balanceOf(alice), pEth(1000000));
        await mocProxy.connect(aliceSigner).mintStableToken(pEth(100));
        assertPrec(await stableToken.balanceOf(alice), pEth(1000000));
      });
      describe("AND V2MigrationChanger is executed", () => {
        let mocReserveBalanceBefore: Balance;
        let mocCommission: Balance;
        before(async () => {
          mocReserveBalanceBefore = await reserveToken.balanceOf(mocProxy.address);
          const commissionBalanceBefore = await reserveToken.balanceOf(mocCommissionSplitter.address);
          // 1% of commissions are sent to MoC
          mocCommission = commissionBalanceBefore.div(100);
          const { changer } = await deployChanger(
            mocHelperAddress,
            upgradeDelegator.address,
            mocCommissionSplitter.address,
            mocRifV2.address,
            mocProxy.address,
            [deployer],
          );
          await changer.execute();
        });
        describe("WHEN check Reserve Token balance", () => {
          it("THEN Moc Legacy has 0 tokens", async () => {
            expect(await reserveToken.balanceOf(mocProxy.address)).to.be.equal(0);
          });
          it("THEN Moc Commission Splitter has 0 tokens", async () => {
            expect(await reserveToken.balanceOf(mocCommissionSplitter.address)).to.be.equal(0);
          });
          it("THEN MocV2 has all the Moc Legacy tokens", async () => {
            expect(await reserveToken.balanceOf(mocRifV2.address)).to.be.equal(
              mocReserveBalanceBefore.add(mocCommission),
            );
          });
        });
        describe("WHEN alice tries to mint 10 RiskPro in MoC V1", () => {
          it("THEN tx reverts because MoC contract is deprecated", async () => {
            await reserveToken.connect(aliceSigner).approve(mocProxy.address, pEth(10));
            await expectRevertContractDeprecated(mocProxy.connect(aliceSigner).mintRiskPro(pEth(10)));
          });
        });
        describe("WHEN alice tries to mint 10 RiskPro via vendor in MoC V1", () => {
          it("THEN tx reverts because MoC contract is deprecated", async () => {
            await reserveToken.connect(aliceSigner).approve(mocProxy.address, pEth(10));
            await expectRevertContractDeprecated(mocProxy.connect(aliceSigner).mintRiskProVendors(pEth(10), vendor));
          });
        });
        describe("WHEN alice tries to redeem 10 RiskPro in Moc V1", () => {
          it("THEN tx reverts because MoC contract is deprecated", async () => {
            await riskProToken.connect(aliceSigner).approve(mocProxy.address, pEth(10));
            await expectRevertContractDeprecated(mocProxy.connect(aliceSigner).redeemRiskPro(pEth(10)));
          });
        });
        describe("WHEN alice tries to redeem 10 RiskPro via vendor in Moc V1", () => {
          it("THEN tx reverts because MoC contract is deprecated", async () => {
            await riskProToken.connect(aliceSigner).approve(mocProxy.address, pEth(10));
            await expectRevertContractDeprecated(mocProxy.connect(aliceSigner).redeemRiskProVendors(pEth(10), vendor));
          });
        });
        describe("WHEN alice tries to mint 10 Stable tokens in Moc V1", () => {
          it("THEN tx reverts because MoC contract is deprecated", async () => {
            await reserveToken.connect(aliceSigner).approve(mocProxy.address, pEth(10));
            await expectRevertContractDeprecated(mocProxy.connect(aliceSigner).mintStableToken(pEth(10)));
          });
        });
        describe("WHEN alice tries to mint 10 Stable tokens via vendor in Moc V1", () => {
          it("THEN tx reverts because MoC contract is deprecated", async () => {
            await reserveToken.connect(aliceSigner).approve(mocProxy.address, pEth(10));
            await expectRevertContractDeprecated(
              mocProxy.connect(aliceSigner).mintStableTokenVendors(pEth(10), vendor),
            );
          });
        });
        describe("WHEN alice tries to redeem 10 Stable tokens in Moc V1", () => {
          it("THEN tx reverts because MoC contract is deprecated", async () => {
            await stableToken.connect(aliceSigner).approve(mocProxy.address, pEth(10));
            await expectRevertContractDeprecated(mocProxy.connect(aliceSigner).redeemFreeStableToken(pEth(10)));
          });
        });
        describe("WHEN alice tries to redeem 10 Stable tokens via vendor in Moc V1", () => {
          it("THEN tx reverts because MoC contract is deprecated", async () => {
            await stableToken.connect(aliceSigner).approve(mocProxy.address, pEth(10));
            await expectRevertContractDeprecated(
              mocProxy.connect(aliceSigner).redeemFreeStableTokenVendors(pEth(10), vendor),
            );
          });
        });
        describe("WHEN 10 AC are injected to Moc V1", () => {
          it("THEN tx reverts because MoC contract is deprecated", async () => {
            await reserveToken.approve(mocProxy.address, pEth(10));
            await expectRevertContractDeprecated(mocProxy.addReserves(pEth(10)));
          });
        });
      });
    });
  });
});
