import { ContractTransaction } from "ethers";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import {
  MoC,
  MoC__factory,
  Governor__factory,
  Governor,
  StopperV2,
  StopperV2__factory,
  FluxCapacitorChanger,
  MoCExchange,
  MoCExchange__factory,
  ReserveToken,
  ReserveToken__factory,
  FluxCapacitorChanger__factory,
} from "../../../typechain";
import { pEth } from "../../helpers/utils";
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const mocMainnetConfig = require("../../../../scripts/deploy/upgrade_v0.1.16.1/deployConfig-rdocMainnet.json");

let moc: MoC;
let mocExchange: MoCExchange;
let reserveToken: ReserveToken;
let governor: Governor;
let governorOwnerSigner: SignerWithAddress;
let stopper: StopperV2;
let multisig: SignerWithAddress;
let rifHolder: SignerWithAddress;
let signer: any;
let snapshot: any;
const governorOwnerAddress = mocMainnetConfig.governorOwnerAddress;
const rifHolderAddress = "0xCfF3fcaeC2352C672C38d77cb1a064B7D50ce7e1";
const maxAbsoluteOperation = mocMainnetConfig.valuesToAssign.maxAbsoluteOperation;

describe("Feature: MoC FluxCapacitorChanger - mainnet fork", () => {
  describe("GIVEN a MoC protocol and FC changer deployed in mainnet", () => {
    before(async () => {
      snapshot = await helpers.takeSnapshot();
      signer = ethers.provider.getSigner();
      moc = MoC__factory.connect(mocMainnetConfig.proxyAddresses.MoC, signer);
      reserveToken = ReserveToken__factory.connect(await moc.reserveToken(), signer);
      governor = Governor__factory.connect(mocMainnetConfig.implementationAddresses.Governor, signer);
      stopper = StopperV2__factory.connect(await moc.stopper(), signer);
      await helpers.impersonateAccount(governorOwnerAddress);
      governorOwnerSigner = await ethers.getSigner(governorOwnerAddress);

      await helpers.impersonateAccount(rifHolderAddress);
      rifHolder = await ethers.getSigner(rifHolderAddress);

      const multisigAddress = await stopper.owner();
      await helpers.impersonateAccount(multisigAddress);
      multisig = await ethers.getSigner(multisigAddress);

      // set coinbase balances to send txs
      await helpers.setBalance(governorOwnerAddress, pEth(10000000));
      await helpers.setBalance(multisigAddress, pEth(10000000));
      await helpers.setBalance(rifHolderAddress, pEth(10000000));

      // set baseFee to could send txs below the max gas price limit
      await helpers.setNextBlockBaseFeePerGas(65820000);
    });
    after(async () => {
      await snapshot.restore();
    });
    describe("AND FluxCapacitorChanger is executed", async () => {
      let changer: FluxCapacitorChanger;
      before(async () => {
        // Real changer to be used on prod
        changer = FluxCapacitorChanger__factory.connect(mocMainnetConfig.changerAddresses.FluxCapacitorChanger, signer);
        mocExchange = MoCExchange__factory.connect(await changer.mocExchangeProxy(), signer);
        await governor.connect(governorOwnerSigner).executeChange(changer.address, { gasPrice: 65820000 });
      });
      describe("WHEN a holder tries to mint stable tokens above the max limit allowed", function () {
        it("THEN transaction reverts because max absolute operation reached", async function () {
          const tx = moc.connect(rifHolder).mintStableToken(pEth(maxAbsoluteOperation).add(1), { gasPrice: 65820000 });
          await expect(tx).to.be.revertedWith("max absolute operation reached");
        });
      });
      describe("WHEN a holder mints stable tokens below the max limit allowed", function () {
        let tx: ContractTransaction;
        before(async () => {
          await reserveToken.connect(rifHolder).approve(moc.address, pEth(maxAbsoluteOperation).mul(10));
          tx = await moc.connect(rifHolder).mintStableToken(pEth(maxAbsoluteOperation), { gasPrice: 65820000 });
        });
        it("THEN transaction succeeds and a StableTokenMint event is emitted", async function () {
          await expect(tx).to.emit(mocExchange, "StableTokenMint");
        });
      });
      describe("WHEN the stopper pause MoC protocol", function () {
        before(async () => {
          await stopper.connect(multisig).pause(moc.address);
        });
        it("THEN MoC is paused", async function () {
          expect(await moc.paused()).to.be.true;
        });
        describe("AND the stopper unpause MoC protocol", function () {
          before(async () => {
            await stopper.connect(multisig).unpause(moc.address);
          });
          it("THEN MoC is unpaused", async function () {
            expect(await moc.paused()).to.be.false;
          });
        });
      });
      describe("WHEN the stopper change max gas price on MoC protocol", function () {
        before(async () => {
          await stopper.connect(multisig).setMaxGasPrice(moc.address, 10);
        });
        it("THEN MoC max gas price is 10", async function () {
          expect(await moc.maxGasPrice()).to.be.equal(10);
        });
      });
      describe("WHEN the stopper change max absolute operation on MoC protocol", function () {
        before(async () => {
          await stopper.connect(multisig).setMaxAbsoluteOperation(moc.address, 11);
        });
        it("THEN MoC max absolute operation is 11", async function () {
          expect(await mocExchange.maxAbsoluteOperation()).to.be.equal(11);
        });
      });
      describe("WHEN the stopper change max operational difference on MoC protocol", function () {
        before(async () => {
          await stopper.connect(multisig).setMaxOperationalDifference(moc.address, 12);
        });
        it("THEN MoC max operational difference is 12", async function () {
          expect(await mocExchange.maxOperationalDifference()).to.be.equal(12);
        });
      });
      describe("WHEN the stopper change decay block span on MoC protocol", function () {
        before(async () => {
          await stopper.connect(multisig).setDecayBlockSpan(moc.address, 13);
        });
        it("THEN MoC decay block span is 13", async function () {
          expect(await mocExchange.decayBlockSpan()).to.be.equal(13);
        });
      });
    });
  });
});
