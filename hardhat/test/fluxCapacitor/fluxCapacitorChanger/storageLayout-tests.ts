import { ethers, upgrades } from "hardhat";
import { deployContract } from "../../helpers/utils";

describe("Feature: Check storage layout compatibility using openzeppelin hardhat upgrade ", () => {
  describe("GIVEN a MoC_v0116_1 protocol deployed", () => {
    describe("WHEN check storage layout compatibility with new MoC implementation version", () => {
      it("THEN it succeeds as there is not storage collision", async () => {
        const mocV0116_1 = await ethers.getContractFactory("MoC_v0116_1");
        const moc = await ethers.getContractFactory("MoC");
        await upgrades.validateUpgrade(mocV0116_1, moc);
      });
    });
  });
  describe("GIVEN a MoCExchange_v0116_1 protocol deployed", () => {
    describe("WHEN check storage layout compatibility with new MoC implementation version", () => {
      it("THEN it succeeds as there is not storage collision", async () => {
        const mocHelperLibAddress = await deployContract("MoCHelperLib", undefined, []);
        const mocExchangeV0116_1 = await ethers.getContractFactory("MoCExchange_v0116_1", {
          libraries: { MoCHelperLib: mocHelperLibAddress },
        });
        const mocExchange = await ethers.getContractFactory("MoCExchange", {
          libraries: { MoCHelperLib: mocHelperLibAddress },
        });
        await upgrades.validateUpgrade(mocExchangeV0116_1, mocExchange, {
          // https://github.com/OpenZeppelin/openzeppelin-upgrades/issues/52
          unsafeAllow: ["external-library-linking"],
        });
      });
    });
  });
});
