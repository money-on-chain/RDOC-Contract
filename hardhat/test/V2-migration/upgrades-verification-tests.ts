import { Address } from "hardhat-deploy/dist/types";
import { ethers, upgrades } from "hardhat";
import { MoC, MoCExchange } from "../../typechain";
import { fixtureDeployed } from "./fixture";

describe("Feature: MoC V2 migration - upgrades verifications", () => {
  let mocProxy: MoC;
  let mocExchangeProxy: MoCExchange;
  let mocHelperAddress: Address;
  let mocFactory: any;
  let mocMigratorFactory: any;
  let mocExchangeFactory: any;
  let mocExchangeMigratorFactory: any;
  describe("GIVEN a MoC Legacy protocol deployed", () => {
    before(async () => {
      ({ mocHelperAddress, moc: mocProxy, mocExchange: mocExchangeProxy } = await fixtureDeployed()());

      [mocFactory, mocMigratorFactory, mocExchangeFactory, mocExchangeMigratorFactory] = await Promise.all([
        ethers.getContractFactory("MoC"),
        ethers.getContractFactory("MoC_Migrator"),
        ethers.getContractFactory("MoCExchange", {
          libraries: { MoCHelperLib: mocHelperAddress },
        }),
        ethers.getContractFactory("MoCExchange_Migrator", {
          libraries: { MoCHelperLib: mocHelperAddress },
        }),
      ]);
    });

    describe("WHEN validate MoC contract upgrades", () => {
      it("THEN upgrade MoC to MoC_Migrator is compatible", async () => {
        // forces the import of an existing proxy to be used with this plugin
        await upgrades.forceImport(mocProxy.address, mocFactory);
        // validates an implementation
        await upgrades.validateImplementation(mocFactory);
        // compares the current implementation to the new implementation to check for storage layout compatibility errors
        await upgrades.validateUpgrade(mocProxy.address, mocMigratorFactory);
      });
    });
    describe("WHEN validate MoCExchange contract upgrades", () => {
      it("THEN upgrade MoCExchange to MoCExchange_Migrator is compatible", async () => {
        // forces the import of an existing proxy to be used with this plugin
        await upgrades.forceImport(mocExchangeProxy.address, mocExchangeFactory);
        // validates an implementation
        await upgrades.validateImplementation(mocExchangeFactory, {
          unsafeAllowLinkedLibraries: true,
        });
        // compares the current implementation to the new implementation to check for storage layout compatibility errors
        await upgrades.validateUpgrade(mocExchangeProxy.address, mocExchangeMigratorFactory, {
          unsafeAllowLinkedLibraries: true,
        });
      });
    });
  });
});
