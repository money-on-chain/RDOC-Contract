import { Address } from "hardhat-deploy/dist/types";
import { ethers, getNamedAccounts, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ContractTransaction } from "ethers";
import { expect } from "chai";
import {
  MoC_v020,
  MoCConnector_v020,
  MoCExchange_v020,
  MoCState_v020,
  MoCSettlement_v020,
  ReserveToken,
  StableToken,
  StableTokenMigrationChanger,
  StableTokenMigrationChanger__factory,
  StableTokenV2,
  TokenMigrator,
  UpgradeDelegator,
  MoCExchange_v021__factory,
  MoCState_v021__factory,
  MoCSettlement_v021__factory,
  MoCConnector_v021__factory,
  MoC_v021__factory,
  MoC,
  AdminUpgradeabilityProxy__factory,
  MoC_v021,
  MoCConnector_v021,
  MoCConnector,
  MoCExchange_v021,
  MoCExchange,
  MoCState_v021,
  MoCState,
  MoCSettlement_v021,
  MoCSettlement,
} from "../typechain";
import { fixtureDeployed } from "./fixture";
import { Balance, deployContract, pEth } from "./helpers/utils";
import { assertPrec } from "./helpers/assertHelper";

describe("Feature: Stable Token migration", () => {
  let mocProxy: MoC_v020;
  let mocConnectorProxy: MoCConnector_v020;
  let mocExchangeProxy: MoCExchange_v020;
  let mocStateProxy: MoCState_v020;
  let mocSettlementProxy: MoCSettlement_v020;
  let reserveToken: ReserveToken;
  let stableToken: StableToken;
  let stableTokenV2: StableTokenV2;
  let tokenMigrator: TokenMigrator;
  let upgradeDelegator: UpgradeDelegator;
  let mocHelperAddress: Address;
  let deployer: Address;
  let alice: Address;
  let aliceSigner: SignerWithAddress;
  let signer: any;
  let moc_v020Factory: any;
  let moc_v021Factory: any;
  let mocFactory: any;
  let mocConnector_v020Factory: any;
  let mocConnector_v021Factory: any;
  let mocConnectorFactory: any;
  let mocExchange_v020Factory: any;
  let mocExchange_v021Factory: any;
  let mocExchangeFactory: any;
  let mocState_v020Factory: any;
  let mocState_v021Factory: any;
  let mocStateFactory: any;
  let mocSettlement_v020Factory: any;
  let mocSettlement_v021Factory: any;
  let mocSettlementFactory: any;
  describe("GIVEN a Moc protocol deployed with collateral", () => {
    beforeEach(async () => {
      ({ deployer, alice } = await getNamedAccounts());
      ({
        mocHelperAddress,
        moc_v020: mocProxy,
        mocConnector_v020: mocConnectorProxy,
        mocExchange_v020: mocExchangeProxy,
        mocState_v020: mocStateProxy,
        mocSettlement_v020: mocSettlementProxy,
        upgradeDelegator,
        reserveToken,
        stableToken,
        stableTokenV2,
        tokenMigrator,
      } = await fixtureDeployed()());
      aliceSigner = await ethers.getSigner(alice);
      signer = await ethers.provider.getSigner();
      await reserveToken.approve(mocProxy.address, pEth(100000));
      await mocProxy.mintRiskPro(pEth(100000));

      [
        moc_v020Factory,
        moc_v021Factory,
        mocFactory,
        mocConnector_v020Factory,
        mocConnector_v021Factory,
        mocConnectorFactory,
        mocExchange_v020Factory,
        mocExchange_v021Factory,
        mocExchangeFactory,
        mocState_v020Factory,
        mocState_v021Factory,
        mocStateFactory,
        mocSettlement_v020Factory,
        mocSettlement_v021Factory,
        mocSettlementFactory,
      ] = await Promise.all([
        ethers.getContractFactory("MoC_v020"),
        ethers.getContractFactory("MoC_v021"),
        ethers.getContractFactory("MoC"),
        ethers.getContractFactory("MoCConnector_v020"),
        ethers.getContractFactory("MoCConnector_v021"),
        ethers.getContractFactory("MoCConnector"),
        ethers.getContractFactory("MoCExchange_v020", {
          libraries: { MoCHelperLib: mocHelperAddress },
        }),
        ethers.getContractFactory("MoCExchange_v021", {
          libraries: { MoCHelperLib: mocHelperAddress },
        }),
        ethers.getContractFactory("MoCExchange", {
          libraries: { MoCHelperLib: mocHelperAddress },
        }),
        ethers.getContractFactory("MoCState_v020", {
          libraries: { MoCHelperLib: mocHelperAddress },
        }),
        ethers.getContractFactory("MoCState_v021", {
          libraries: { MoCHelperLib: mocHelperAddress },
        }),
        ethers.getContractFactory("MoCState", {
          libraries: { MoCHelperLib: mocHelperAddress },
        }),
        ethers.getContractFactory("MoCSettlement_v020"),
        ethers.getContractFactory("MoCSettlement_v021"),
        ethers.getContractFactory("MoCSettlement"),
      ]);
    });
    describe("WHEN validate MoC contract upgrades", () => {
      it("THEN upgrade MoC_v020 to MoC_v021 is compatible", async () => {
        // forces the import of an existing proxy to be used with this plugin
        await upgrades.forceImport(mocProxy.address, moc_v020Factory);
        // validates an implementation
        await upgrades.validateImplementation(moc_v021Factory);
        // compares the current implementation to the new implementation to check for storage layout compatibility errors
        await upgrades.validateUpgrade(mocProxy.address, moc_v021Factory);
      });
      it("THEN upgrade MoC_v021 to MoC is compatible", async () => {
        // forces the import of an existing proxy to be used with this plugin
        await upgrades.forceImport(mocProxy.address, moc_v021Factory);
        // validates an implementation
        await upgrades.validateImplementation(mocFactory);
        // compares the current implementation to the new implementation to check for storage layout compatibility errors
        await upgrades.validateUpgrade(mocProxy.address, mocFactory);
      });
    });
    describe("WHEN validate MoCConnector contract upgrades", () => {
      it("THEN upgrade MoCConnector_v020 to MoCConnector_v021 is compatible", async () => {
        // forces the import of an existing proxy to be used with this plugin
        await upgrades.forceImport(mocConnectorProxy.address, mocConnector_v020Factory);
        // validates an implementation
        await upgrades.validateImplementation(mocConnector_v021Factory);
        // compares the current implementation to the new implementation to check for storage layout compatibility errors
        await upgrades.validateUpgrade(mocConnectorProxy.address, mocConnector_v021Factory);
      });
      it("THEN upgrade MoCConnector_v021 to MoCConnector is compatible", async () => {
        // forces the import of an existing proxy to be used with this plugin
        await upgrades.forceImport(mocConnectorProxy.address, mocConnector_v021Factory);
        // validates an implementation
        await upgrades.validateImplementation(mocConnectorFactory);
        // compares the current implementation to the new implementation to check for storage layout compatibility errors
        await upgrades.validateUpgrade(mocConnectorProxy.address, mocConnectorFactory);
      });
    });
    describe("WHEN validate MoCExchange contract upgrades", () => {
      it("THEN upgrade MoCExchange_v020 to MoCExchange_v021 is compatible", async () => {
        // forces the import of an existing proxy to be used with this plugin
        await upgrades.forceImport(mocExchangeProxy.address, mocExchange_v020Factory);
        // validates an implementation
        await upgrades.validateImplementation(mocExchange_v021Factory, {
          // https://github.com/OpenZeppelin/openzeppelin-upgrades/issues/52
          unsafeAllow: ["external-library-linking"],
        });
        // compares the current implementation to the new implementation to check for storage layout compatibility errors
        await upgrades.validateUpgrade(mocExchangeProxy.address, mocExchange_v021Factory, {
          // https://github.com/OpenZeppelin/openzeppelin-upgrades/issues/52
          unsafeAllow: ["external-library-linking"],
        });
      });
      it("THEN upgrade MoCExchange_v021 to MoCExchange is compatible", async () => {
        // forces the import of an existing proxy to be used with this plugin
        await upgrades.forceImport(mocExchangeProxy.address, mocExchange_v021Factory);
        // validates an implementation
        await upgrades.validateImplementation(mocExchangeFactory, {
          // https://github.com/OpenZeppelin/openzeppelin-upgrades/issues/52
          unsafeAllow: ["external-library-linking"],
        });
        // compares the current implementation to the new implementation to check for storage layout compatibility errors
        await upgrades.validateUpgrade(mocExchangeProxy.address, mocExchangeFactory, {
          // https://github.com/OpenZeppelin/openzeppelin-upgrades/issues/52
          unsafeAllow: ["external-library-linking"],
        });
      });
    });
    describe("WHEN validate MoCState contract upgrades", () => {
      it("THEN upgrade MoCState_v020 to MoCState_v021 is compatible", async () => {
        // forces the import of an existing proxy to be used with this plugin
        await upgrades.forceImport(mocStateProxy.address, mocState_v020Factory);
        // validates an implementation
        await upgrades.validateImplementation(mocState_v021Factory, {
          // https://github.com/OpenZeppelin/openzeppelin-upgrades/issues/52
          unsafeAllow: ["external-library-linking"],
        });
        // compares the current implementation to the new implementation to check for storage layout compatibility errors
        await upgrades.validateUpgrade(mocStateProxy.address, mocState_v021Factory, {
          // https://github.com/OpenZeppelin/openzeppelin-upgrades/issues/52
          unsafeAllow: ["external-library-linking"],
        });
      });
      it("THEN upgrade MoCState_v021 to MoCState is compatible", async () => {
        // forces the import of an existing proxy to be used with this plugin
        await upgrades.forceImport(mocStateProxy.address, mocState_v021Factory);
        // validates an implementation
        await upgrades.validateImplementation(mocStateFactory, {
          // https://github.com/OpenZeppelin/openzeppelin-upgrades/issues/52
          unsafeAllow: ["external-library-linking"],
        });
        // compares the current implementation to the new implementation to check for storage layout compatibility errors
        await upgrades.validateUpgrade(mocStateProxy.address, mocStateFactory, {
          // https://github.com/OpenZeppelin/openzeppelin-upgrades/issues/52
          unsafeAllow: ["external-library-linking"],
        });
      });
    });
    describe("WHEN validate MoCSettlement contract upgrades", () => {
      it("THEN upgrade MoCSettlement_v020 to MoCSettlement_v021 is compatible", async () => {
        // forces the import of an existing proxy to be used with this plugin
        await upgrades.forceImport(mocSettlementProxy.address, mocSettlement_v020Factory);
        // validates an implementation
        await upgrades.validateImplementation(mocSettlement_v021Factory);
        // compares the current implementation to the new implementation to check for storage layout compatibility errors
        // FIXME: this test fails with this msg: Error: An unexpected condition occurred. Please report this at https://zpl.in/upgrades/report
        //await upgrades.validateUpgrade(mocSettlementProxy.address, mocSettlement_v021Factory);
      });
      it("THEN upgrade MoCSettlement_v021 to MoCSettlement is compatible", async () => {
        // forces the import of an existing proxy to be used with this plugin
        await upgrades.forceImport(mocSettlementProxy.address, mocSettlement_v021Factory);
        // validates an implementation
        await upgrades.validateImplementation(mocSettlementFactory);
        // compares the current implementation to the new implementation to check for storage layout compatibility errors
        // FIXME: this test fails with this msg: Error: An unexpected condition occurred. Please report this at https://zpl.in/upgrades/report
        //await upgrades.validateUpgrade(mocSettlementProxy.address, mocSettlementFactory);
      });
    });
    describe("AND alice has 1000000 StableToken", () => {
      beforeEach(async () => {
        await reserveToken.connect(aliceSigner).approve(mocProxy.address, pEth(100));
        await mocProxy.connect(aliceSigner).mintStableToken(pEth(100));
        assertPrec(await stableToken.balanceOf(alice), pEth(1000000));
      });
      describe("WHEN alice redeems 10 StableTokenV1", () => {
        let aliceReserveTokenBalanceBefore: Balance;
        let aliceStableTokenV1BalanceBefore: Balance;
        beforeEach(async () => {
          aliceReserveTokenBalanceBefore = await reserveToken.balanceOf(alice);
          aliceStableTokenV1BalanceBefore = await stableToken.balanceOf(alice);
          await mocProxy.connect(aliceSigner).redeemFreeStableToken(pEth(10));
        });
        it("THEN alice StableToken balance decrease by 10", async () => {
          const diff = aliceStableTokenV1BalanceBefore.sub(await stableToken.balanceOf(alice));
          assertPrec(diff, pEth(10));
        });
        it("THEN alice ReserveToken balance increase by 0.001", async () => {
          const diff = (await reserveToken.balanceOf(alice)).sub(aliceReserveTokenBalanceBefore);
          assertPrec(diff, pEth("0.001"));
        });
      });
      describe("AND MoC v021, MoC and StableTokenMigrationChanger are deployed", () => {
        let changer: StableTokenMigrationChanger;
        let moc_v021: MoC_v021;
        let moc: MoC;
        let mocConnector_v021: MoCConnector_v021;
        let mocConnector: MoCConnector;
        let mocExchange_v021: MoCExchange_v021;
        let mocExchange: MoCExchange;
        let mocState_v021: MoCState_v021;
        let mocState: MoCState;
        let mocSettlement_v021: MoCSettlement_v021;
        let mocSettlement: MoCSettlement;
        beforeEach(async () => {
          // deploy MoC
          moc_v021 = await moc_v021Factory.deploy();
          moc = await mocFactory.deploy();

          // deploy MoCConnector
          mocConnector_v021 = await mocConnector_v021Factory.deploy();
          mocConnector = await mocConnectorFactory.deploy();

          // deploy MoCExchange
          mocExchange_v021 = await mocExchange_v021Factory.deploy();
          mocExchange = await mocExchangeFactory.deploy();

          // deploy MoCState
          mocState_v021 = await mocState_v021Factory.deploy();
          mocState = await mocStateFactory.deploy();

          // deploy MoCSettlement
          mocSettlement_v021 = await mocSettlement_v021Factory.deploy();
          mocSettlement = await mocSettlementFactory.deploy();

          changer = await deployContract("StableTokenMigrationChanger", StableTokenMigrationChanger__factory, [
            upgradeDelegator.address,
            stableTokenV2.address,
            tokenMigrator.address,
            [
              {
                proxy: mocProxy.address,
                middleTermImplementation: moc_v021.address,
                newImplementation: moc.address,
              },
              {
                proxy: mocConnectorProxy.address,
                middleTermImplementation: mocConnector_v021.address,
                newImplementation: mocConnector.address,
              },
              {
                proxy: mocExchangeProxy.address,
                middleTermImplementation: mocExchange_v021.address,
                newImplementation: mocExchange.address,
              },
              {
                proxy: mocStateProxy.address,
                middleTermImplementation: mocState_v021.address,
                newImplementation: mocState.address,
              },
              {
                proxy: mocSettlementProxy.address,
                middleTermImplementation: mocSettlement_v021.address,
                newImplementation: mocSettlement.address,
              },
            ],
          ]);
        });
        describe("WHEN changer is executed", () => {
          let tx: ContractTransaction;
          beforeEach(async () => {
            tx = await changer.execute();
          });
          describe("WHEN check Moc Upgrade events", () => {
            it("THEN 2 Upgrade events are emitted with Moc v021 and MoC implementation addresses", async () => {
              const mocProxyAsAdminUpgradeabilityProxy = AdminUpgradeabilityProxy__factory.connect(
                mocProxy.address,
                signer,
              );
              await expect(tx).to.emit(mocProxyAsAdminUpgradeabilityProxy, "Upgraded").withArgs(moc_v021.address);
              await expect(tx).to.emit(mocProxyAsAdminUpgradeabilityProxy, "Upgraded").withArgs(moc.address);
            });
          });
          describe("WHEN check MocConnector Upgrade events", () => {
            it("THEN 2 Upgrade events are emitted with MocConnector v021 and MocConnector implementation addresses", async () => {
              const mocConnectorProxyAsAdminUpgradeabilityProxy = AdminUpgradeabilityProxy__factory.connect(
                mocConnectorProxy.address,
                signer,
              );
              await expect(tx)
                .to.emit(mocConnectorProxyAsAdminUpgradeabilityProxy, "Upgraded")
                .withArgs(mocConnector_v021.address);
              await expect(tx)
                .to.emit(mocConnectorProxyAsAdminUpgradeabilityProxy, "Upgraded")
                .withArgs(mocConnector.address);
            });
          });
          describe("WHEN check MocExchange Upgrade events", () => {
            it("THEN 2 Upgrade events are emitted with MocExchange v021 and MocExchange implementation addresses ", async () => {
              const mocExchangeProxyAsAdminUpgradeabilityProxy = AdminUpgradeabilityProxy__factory.connect(
                mocExchangeProxy.address,
                signer,
              );
              await expect(tx)
                .to.emit(mocExchangeProxyAsAdminUpgradeabilityProxy, "Upgraded")
                .withArgs(mocExchange_v021.address);
              await expect(tx)
                .to.emit(mocExchangeProxyAsAdminUpgradeabilityProxy, "Upgraded")
                .withArgs(mocExchange.address);
            });
          });
          describe("WHEN check MocState Upgrade events", () => {
            it("THEN 2 Upgrade events are emitted with MocState v021 and MocState implementation addresses", async () => {
              const mocStateProxyAsAdminUpgradeabilityProxy = AdminUpgradeabilityProxy__factory.connect(
                mocStateProxy.address,
                signer,
              );
              await expect(tx)
                .to.emit(mocStateProxyAsAdminUpgradeabilityProxy, "Upgraded")
                .withArgs(mocState_v021.address);
              await expect(tx).to.emit(mocStateProxyAsAdminUpgradeabilityProxy, "Upgraded").withArgs(mocState.address);
            });
          });
          describe("WHEN check MocSettlement Upgrade events", () => {
            it("THEN 2 Upgrade events are emitted with MocSettlement v021 and MoCSettlement implementation addresses", async () => {
              const mocSettlementProxyAsAdminUpgradeabilityProxy = AdminUpgradeabilityProxy__factory.connect(
                mocSettlementProxy.address,
                signer,
              );
              await expect(tx)
                .to.emit(mocSettlementProxyAsAdminUpgradeabilityProxy, "Upgraded")
                .withArgs(mocSettlement_v021.address);
              await expect(tx)
                .to.emit(mocSettlementProxyAsAdminUpgradeabilityProxy, "Upgraded")
                .withArgs(mocSettlement.address);
            });
          });
          it("THEN a StableTokenMigrated event is emitted by MoC", async () => {
            const mocProxyAsMoC_v021 = MoC_v021__factory.connect(mocProxy.address, signer);
            await expect(tx)
              .to.emit(mocProxyAsMoC_v021, "StableTokenMigrated")
              .withArgs(stableToken.address, stableTokenV2.address);
          });
          it("THEN a StableTokenMigrated event is emitted by MoCConnector", async () => {
            const mocProxyAsMoCConnector_v021 = MoCConnector_v021__factory.connect(mocConnectorProxy.address, signer);
            await expect(tx)
              .to.emit(mocProxyAsMoCConnector_v021, "StableTokenMigrated")
              .withArgs(stableToken.address, stableTokenV2.address);
          });
          it("THEN a StableTokenMigrated event is emitted by MoCExchange", async () => {
            const mocProxyAsMoCExchange_v021 = MoCExchange_v021__factory.connect(mocExchangeProxy.address, signer);
            await expect(tx)
              .to.emit(mocProxyAsMoCExchange_v021, "StableTokenMigrated")
              .withArgs(stableToken.address, stableTokenV2.address);
          });
          it("THEN a StableTokenMigrated event is emitted by MoCState", async () => {
            const mocProxyAsMoCState_v021 = MoCState_v021__factory.connect(mocStateProxy.address, signer);
            await expect(tx)
              .to.emit(mocProxyAsMoCState_v021, "StableTokenMigrated")
              .withArgs(stableToken.address, stableTokenV2.address);
          });
          it("THEN a StableTokenMigrated event is emitted by MoCSettlement", async () => {
            const mocProxyAsMoCSettlement_v021 = MoCSettlement_v021__factory.connect(
              mocSettlementProxy.address,
              signer,
            );
            await expect(tx)
              .to.emit(mocProxyAsMoCSettlement_v021, "StableTokenMigrated")
              .withArgs(stableToken.address, stableTokenV2.address);
          });
          it("THEN StableTokenV1 and StableTokenV2 total supply are the same", async () => {
            assertPrec(await stableToken.totalSupply(), await stableTokenV2.totalSupply());
          });
          it("THEN TokenMigrator contract has all StableTokenV2 total supply", async () => {
            assertPrec(await stableTokenV2.balanceOf(tokenMigrator.address), await stableTokenV2.totalSupply());
          });
          it("THEN mocConnector getter returns stableTokenV2 address", async () => {
            expect(await mocConnectorProxy.stableToken()).to.be.equal(stableTokenV2.address);
          });
          describe("WHEN someone tries to call migrateStableToken in moc", () => {
            it("THEN tx reverts because function is not available, it only existed atomically during the upgrade", async () => {
              const mocProxyAsMoC_v021 = MoC_v021__factory.connect(mocProxy.address, signer);
              await expect(mocProxyAsMoC_v021.migrateStableToken(stableTokenV2.address)).to.be.revertedWithoutReason;
            });
          });
          describe("WHEN someone tries to call migrateStableToken in mocConnector", () => {
            it("THEN tx reverts because function is not available, it only existed atomically during the upgrade", async () => {
              const mocProxyAsMoCConnector_v021 = MoCConnector_v021__factory.connect(mocConnectorProxy.address, signer);
              await expect(mocProxyAsMoCConnector_v021.migrateStableToken(stableTokenV2.address)).to.be
                .revertedWithoutReason;
            });
          });
          describe("WHEN someone tries to call migrateStableToken in mocExchange", () => {
            it("THEN tx reverts because function is not available, it only existed atomically during the upgrade", async () => {
              const mocProxyAsMoCExchange_v021 = MoCExchange_v021__factory.connect(mocExchangeProxy.address, signer);
              await expect(mocProxyAsMoCExchange_v021.migrateStableToken(stableTokenV2.address, tokenMigrator.address))
                .to.be.revertedWithoutReason;
            });
          });
          describe("WHEN someone tries to call migrateStableToken in mocState", () => {
            it("THEN tx reverts because function is not available, it only existed atomically during the upgrade", async () => {
              const mocProxyAsMoCState_v021 = MoCState_v021__factory.connect(mocStateProxy.address, signer);
              await expect(mocProxyAsMoCState_v021.migrateStableToken(stableTokenV2.address)).to.be
                .revertedWithoutReason;
            });
          });
          describe("WHEN someone tries to call migrateStableToken in mocSettlement", () => {
            it("THEN tx reverts because function is not available, it only existed atomically during the upgrade", async () => {
              const mocProxyAsMoCSettlement_v021 = MoCSettlement_v021__factory.connect(
                mocSettlementProxy.address,
                signer,
              );
              await expect(mocProxyAsMoCSettlement_v021.migrateStableToken(stableTokenV2.address)).to.be
                .revertedWithoutReason;
            });
          });
          describe("WHEN alice tries to redeem StableTokenV1 before migrate them", () => {
            let aliceReserveTokenBalanceBefore: Balance;
            beforeEach(async () => {
              aliceReserveTokenBalanceBefore = await reserveToken.balanceOf(alice);
              await mocProxy.connect(aliceSigner).redeemFreeStableToken(pEth(100));
            });
            it("THEN as Alice StableToken balance is 0 she gets nothing", async () => {
              assertPrec(await stableToken.balanceOf(alice), pEth(1000000));
              assertPrec(await reserveToken.balanceOf(alice), aliceReserveTokenBalanceBefore);
            });
          });
          describe("WHEN alice mints 1000000 StableToken again", () => {
            let aliceStableTokenV1BalanceBefore: Balance;
            let aliceStableTokenV2BalanceBefore: Balance;
            beforeEach(async () => {
              aliceStableTokenV1BalanceBefore = await stableToken.balanceOf(alice);
              aliceStableTokenV2BalanceBefore = await stableTokenV2.balanceOf(alice);
              await reserveToken.connect(aliceSigner).approve(mocProxy.address, pEth(100));
              await mocProxy.connect(aliceSigner).mintStableToken(pEth(100));
            });
            it("THEN alice StableTokenV1 balance doesn`t change", async () => {
              assertPrec(await stableToken.balanceOf(alice), aliceStableTokenV1BalanceBefore);
            });
            it("THEN alice receives 1000000 StableTokenV2", async () => {
              const diff = (await stableTokenV2.balanceOf(alice)).sub(aliceStableTokenV2BalanceBefore);
              assertPrec(diff, pEth(1000000));
            });
            it("THEN mocState getter returns stableTokenV2 totalSupply", async () => {
              expect(await mocStateProxy.stableTokenTotalSupply()).to.be.equal(await stableTokenV2.totalSupply());
            });
          });
          describe("WHEN alice tries to migrate her StableTokens without sending TokenV1 approve", () => {
            it("THEN tx reverts because insufficient allowance", async () => {
              await expect(tokenMigrator.connect(aliceSigner).migrateToken()).to.be.revertedWith(
                "SafeMath: subtraction overflow",
              );
            });
          });
          describe("WHEN someone else tries to migrate alice StableTokens with less allowance", () => {
            it("THEN tx reverts because insufficient allowance", async () => {
              await stableToken
                .connect(aliceSigner)
                .approve(tokenMigrator.address, (await stableToken.balanceOf(alice)).sub(1));
              await expect(tokenMigrator.migrateTokenFrom(alice)).to.be.revertedWith("SafeMath: subtraction overflow");
            });
          });
          describe("AND alice migrates her StableTokens", () => {
            let aliceStableTokenV1BalanceBefore: Balance;
            let migratorStableTokenV2BalanceBefore: Balance;
            let mocStableTokenTotalSupplyBefore: Balance;
            let tx: ContractTransaction;
            beforeEach(async () => {
              aliceStableTokenV1BalanceBefore = await stableToken.balanceOf(alice);
              migratorStableTokenV2BalanceBefore = await stableTokenV2.balanceOf(tokenMigrator.address);
              mocStableTokenTotalSupplyBefore = await mocStateProxy.stableTokenTotalSupply();
              await stableToken.connect(aliceSigner).approve(tokenMigrator.address, aliceStableTokenV1BalanceBefore);
              tx = await tokenMigrator.connect(aliceSigner).migrateToken();
            });
            it("THEN mocState StableToken total supply doesn't change", async () => {
              assertPrec(mocStableTokenTotalSupplyBefore, await mocStateProxy.stableTokenTotalSupply());
            });
            it("THEN alice StableTokenV1 balance is 0", async () => {
              assertPrec(await stableToken.balanceOf(alice), 0);
            });
            it("THEN alice StableTokenV2 balance is updated with StableTokenV1 balance before", async () => {
              assertPrec(await stableTokenV2.balanceOf(alice), aliceStableTokenV1BalanceBefore);
            });
            it("THEN TokenMigrator StableTokenV1 balance increase by Alice's migrated amount", async () => {
              assertPrec(await stableToken.balanceOf(tokenMigrator.address), aliceStableTokenV1BalanceBefore);
            });
            it("THEN TokenMigrator StableTokenV2 balance decrease by Alice's migrated amount", async () => {
              const diff = migratorStableTokenV2BalanceBefore.sub(await stableTokenV2.balanceOf(tokenMigrator.address));
              assertPrec(diff, aliceStableTokenV1BalanceBefore);
            });
            it("THEN a TokenMigrated event is emitted", async () => {
              await expect(tx)
                .to.emit(tokenMigrator, "TokenMigrated")
                .withArgs(alice, alice, aliceStableTokenV1BalanceBefore);
            });
            describe("WHEN alice tries to migrates StableTokensV1 again", () => {
              it("THEN tx reverts because doesn't have balance", async () => {
                await expect(tokenMigrator.connect(aliceSigner).migrateToken()).to.be.revertedWithCustomError(
                  tokenMigrator,
                  "InsufficientLegacyTokenBalance",
                );
              });
            });
          });
          describe("AND someone else migrates alice StableTokens", () => {
            let tx: ContractTransaction;
            beforeEach(async () => {
              await stableToken.connect(aliceSigner).approve(tokenMigrator.address, await stableToken.balanceOf(alice));
              tx = await tokenMigrator.migrateTokenFrom(alice);
            });
            it("THEN a TokenMigrated event is emitted", async () => {
              await expect(tx)
                .to.emit(tokenMigrator, "TokenMigrated")
                .withArgs(deployer, alice, await stableTokenV2.balanceOf(alice));
            });
            describe("WHEN alice tries to migrates StableTokensV1 again", () => {
              it("THEN tx reverts because doesn't have balance", async () => {
                await expect(tokenMigrator.connect(aliceSigner).migrateToken()).to.be.revertedWithCustomError(
                  tokenMigrator,
                  "InsufficientLegacyTokenBalance",
                );
              });
            });
          });
        });
      });
    });
  });
});
