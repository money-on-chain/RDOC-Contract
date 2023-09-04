import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { GovernorMock, MoC, MoCExchange, StopperV2 } from "../../typechain";
import { fixtureDeployed } from "../fixture";
describe("Feature: Flux Capacitor setters", () => {
  let moc: MoC;
  let mocExchange: MoCExchange;
  let governorMock: GovernorMock;
  let stopper: StopperV2;
  describe("GIVEN a Moc protocol deployed", () => {
    before(async () => {
      ({ moc, mocExchange, governorMock, stopper } = await fixtureDeployed()());
    });
    describe("WHEN setMaxAbsoluteOperation is invoke on MoCExchange", () => {
      it("THEN it fails because caller is not a whitelisted address", async () => {
        await expect(mocExchange.setMaxAbsoluteOperation(1)).to.be.revertedWith("Address is not whitelisted");
      });
    });
    describe("WHEN setMaxOperationalDifference is invoke on MoCExchange", () => {
      it("THEN it fails because caller is not a whitelisted address", async () => {
        await expect(mocExchange.setMaxOperationalDifference(1)).to.be.revertedWith("Address is not whitelisted");
      });
    });
    describe("WHEN setDecayBlockSpan is invoke on MoCExchange", () => {
      it("THEN it fails because caller is not a whitelisted address", async () => {
        await expect(mocExchange.setDecayBlockSpan(1)).to.be.revertedWith("Address is not whitelisted");
      });
    });
    describe("GIVEN the Governor has not authorized the change", () => {
      before(async () => {
        await governorMock.setIsAuthorized(false);
      });
      describe("WHEN setMaxAbsoluteOperation is invoke on MoC", () => {
        it("THEN it fails because caller is not an authorized changer or the stopper", async () => {
          await expect(moc.setMaxAbsoluteOperation(1)).to.be.revertedWith("not authorized changer or stopper");
        });
      });
      describe("WHEN setMaxOperationalDifference is invoke on MoC", () => {
        it("THEN it fails because caller is not an authorized changer or the stopper", async () => {
          await expect(moc.setMaxOperationalDifference(1)).to.be.revertedWith("not authorized changer or stopper");
        });
      });
      describe("WHEN setDecayBlockSpan is invoke on MoC", () => {
        it("THEN it fails because caller is not an authorized changer or the stopper", async () => {
          await expect(moc.setDecayBlockSpan(1)).to.be.revertedWith("not authorized changer or stopper");
        });
      });
      describe("WHEN the stopper invokes setMaxAbsoluteOperation", () => {
        before(async () => {
          await stopper.setMaxAbsoluteOperation(moc.address, 1);
        });
        it("THEN maxAbsoluteOperation is updated on MoCExchnage", async () => {
          expect(await mocExchange.maxAbsoluteOperation()).to.be.equal(1);
        });
      });
      describe("WHEN the stopper invokes setMaxOperationalDifference", () => {
        before(async () => {
          await stopper.setMaxOperationalDifference(moc.address, 2);
        });
        it("THEN maxOperationalDifference is updated on MoCExchnage", async () => {
          expect(await mocExchange.maxOperationalDifference()).to.be.equal(2);
        });
      });
      describe("WHEN the stopper invokes setDecayBlockSpan", () => {
        let lastOperationBlockNumber: number;
        before(async () => {
          await stopper.setDecayBlockSpan(moc.address, 3);
          lastOperationBlockNumber = await time.latestBlock();
        });
        it("THEN decayBlockSpan is updated on MoCExchnage", async () => {
          expect(await mocExchange.decayBlockSpan()).to.be.equal(3);
        });
        it("THEN last operation block number is initialized as is the first call", async () => {
          expect(await mocExchange.lastOperationBlockNumber()).to.be.equal(lastOperationBlockNumber);
        });
        describe("AND setDecayBlockSpan is invoked again", () => {
          before(async () => {
            await stopper.setDecayBlockSpan(moc.address, 4);
          });
          it("THEN decayBlockSpan is updated on MoCExchnage", async () => {
            expect(await mocExchange.decayBlockSpan()).to.be.equal(4);
          });
          it("THEN last operation block number didn't change", async () => {
            expect(await mocExchange.lastOperationBlockNumber()).to.be.equal(lastOperationBlockNumber);
          });
        });
      });
    });
    describe("GIVEN the Governor has authorized the change", () => {
      before(async () => {
        await governorMock.setIsAuthorized(true);
      });
      describe("WHEN setMaxAbsoluteOperation is invoke on MoC", () => {
        before(async () => {
          await moc.setMaxAbsoluteOperation(1);
        });
        it("THEN maxAbsoluteOperation is updated on MoCExchnage", async () => {
          expect(await mocExchange.maxAbsoluteOperation()).to.be.equal(1);
        });
      });
      describe("WHEN setMaxOperationalDifference is invoke on MoC", () => {
        before(async () => {
          await moc.setMaxOperationalDifference(2);
        });
        it("THEN maxOperationalDifference is updated on MoCExchnage", async () => {
          expect(await mocExchange.maxOperationalDifference()).to.be.equal(2);
        });
      });
      describe("WHEN setDecayBlockSpan is invoke on MoC", () => {
        before(async () => {
          await moc.setDecayBlockSpan(3);
        });
        it("THEN decayBlockSpan is updated on MoCExchnage", async () => {
          expect(await mocExchange.decayBlockSpan()).to.be.equal(3);
        });
      });
    });
  });
});
