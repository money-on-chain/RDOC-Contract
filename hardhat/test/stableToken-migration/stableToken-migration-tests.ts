import { Address } from "hardhat-deploy/dist/types";
import { ethers, getNamedAccounts, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ContractTransaction } from "ethers";
import { expect } from "chai";
import {
  MoC,
  MoCConnector,
  MoCExchange,
  MoCState,
  MoCSettlement,
  ReserveToken,
  StableToken,
  StableTokenMigrationChanger,
  StableTokenMigrationChanger__factory,
  StableTokenV2,
  TokenMigrator,
  UpgradeDelegator,
  MoCExchange_v0116_2__factory,
  MoCState_v0116_2__factory,
  MoCSettlement_v0116_2__factory,
  MoCConnector_v0116_2__factory,
  MoC_v0116_2__factory,
  AdminUpgradeabilityProxy__factory,
  MoC_v0116_2,
  MoCConnector_v0116_2,
  MoCExchange_v0116_2,
  MoCState_v0116_2,
  MoCSettlement_v0116_2,
} from "../../typechain";
import { Balance, deployContract, pEth } from "../helpers/utils";
import { assertPrec } from "../helpers/assertHelper";
import { fixtureDeployed } from "./fixture";

describe("Feature: Stable Token migration", () => {
  let mocProxy: MoC;
  let mocConnectorProxy: MoCConnector;
  let mocExchangeProxy: MoCExchange;
  let mocStateProxy: MoCState;
  let mocSettlementProxy: MoCSettlement;
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
  let moc_v0116_2Factory: any;
  let mocFactory: any;
  let mocConnector_v0116_2Factory: any;
  let mocConnectorFactory: any;
  let mocExchange_v0116_2Factory: any;
  let mocExchangeFactory: any;
  let mocState_v0116_2Factory: any;
  let mocStateFactory: any;
  let mocSettlement_v0116_2Factory: any;
  let mocSettlementFactory: any;
  describe("GIVEN a Moc protocol deployed with collateral", () => {
    beforeEach(async () => {
      ({ deployer, alice } = await getNamedAccounts());
      ({
        mocHelperAddress,
        moc: mocProxy,
        mocConnector: mocConnectorProxy,
        mocExchange: mocExchangeProxy,
        mocState: mocStateProxy,
        mocSettlement: mocSettlementProxy,
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
        moc_v0116_2Factory,
        mocFactory,
        mocConnector_v0116_2Factory,
        mocConnectorFactory,
        mocExchange_v0116_2Factory,
        mocExchangeFactory,
        mocState_v0116_2Factory,
        mocStateFactory,
        mocSettlement_v0116_2Factory,
        mocSettlementFactory,
      ] = await Promise.all([
        ethers.getContractFactory("MoC_v0116_2"),
        ethers.getContractFactory("MoC"),
        ethers.getContractFactory("MoCConnector_v0116_2"),
        ethers.getContractFactory("MoCConnector"),

        ethers.getContractFactory("MoCExchange_v0116_2", {
          libraries: { MoCHelperLib: mocHelperAddress },
        }),
        ethers.getContractFactory("MoCExchange", {
          libraries: { MoCHelperLib: mocHelperAddress },
        }),
        ethers.getContractFactory("MoCState_v0116_2", {
          libraries: { MoCHelperLib: mocHelperAddress },
        }),
        ethers.getContractFactory("MoCState", {
          libraries: { MoCHelperLib: mocHelperAddress },
        }),
        ethers.getContractFactory("MoCSettlement_v0116_2"),
        ethers.getContractFactory("MoCSettlement"),
      ]);
    });
    describe("WHEN validate MoC contract upgrades", () => {
      it("THEN upgrade MoC to MoC_v0116_2 is compatible", async () => {
        // forces the import of an existing proxy to be used with this plugin
        await upgrades.forceImport(mocProxy.address, mocFactory);
        // validates an implementation
        await upgrades.validateImplementation(moc_v0116_2Factory);
        // compares the current implementation to the new implementation to check for storage layout compatibility errors
        await upgrades.validateUpgrade(mocProxy.address, moc_v0116_2Factory);
      });
      it("THEN upgrade MoC_v0116_2 to MoC is compatible", async () => {
        // forces the import of an existing proxy to be used with this plugin
        await upgrades.forceImport(mocProxy.address, moc_v0116_2Factory);
        // validates an implementation
        await upgrades.validateImplementation(mocFactory);
        // compares the current implementation to the new implementation to check for storage layout compatibility errors
        await upgrades.validateUpgrade(mocProxy.address, mocFactory);
      });
    });
    describe("WHEN validate MoCConnector contract upgrades", () => {
      it("THEN upgrade MoCConnector to MoCConnector_v0116_2 is compatible", async () => {
        // forces the import of an existing proxy to be used with this plugin
        await upgrades.forceImport(mocConnectorProxy.address, mocConnectorFactory);
        // validates an implementation
        await upgrades.validateImplementation(mocConnector_v0116_2Factory);
        // compares the current implementation to the new implementation to check for storage layout compatibility errors
        await upgrades.validateUpgrade(mocConnectorProxy.address, mocConnector_v0116_2Factory);
      });
      it("THEN upgrade MoCConnector_v0116_2 to MoCConnector is compatible", async () => {
        // forces the import of an existing proxy to be used with this plugin
        await upgrades.forceImport(mocConnectorProxy.address, mocConnector_v0116_2Factory);
        // validates an implementation
        await upgrades.validateImplementation(mocConnectorFactory);
        // compares the current implementation to the new implementation to check for storage layout compatibility errors
        await upgrades.validateUpgrade(mocConnectorProxy.address, mocConnectorFactory);
      });
    });
    describe("WHEN validate MoCExchange contract upgrades", () => {
      it("THEN upgrade MoCExchange to MoCExchange_v0116_2 is compatible", async () => {
        // forces the import of an existing proxy to be used with this plugin
        await upgrades.forceImport(mocExchangeProxy.address, mocExchangeFactory);
        // validates an implementation
        await upgrades.validateImplementation(mocExchange_v0116_2Factory, {
          // https://github.com/OpenZeppelin/openzeppelin-upgrades/issues/52
          unsafeAllow: ["external-library-linking"],
        });
        // compares the current implementation to the new implementation to check for storage layout compatibility errors
        await upgrades.validateUpgrade(mocExchangeProxy.address, mocExchange_v0116_2Factory, {
          // https://github.com/OpenZeppelin/openzeppelin-upgrades/issues/52
          unsafeAllow: ["external-library-linking"],
        });
      });
      it("THEN upgrade MoCExchange_v0116_2 to MoCExchange is compatible", async () => {
        // forces the import of an existing proxy to be used with this plugin
        await upgrades.forceImport(mocExchangeProxy.address, mocExchange_v0116_2Factory);
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
      it("THEN upgrade MoCState to MoCState_v0116_2 is compatible", async () => {
        // forces the import of an existing proxy to be used with this plugin
        await upgrades.forceImport(mocStateProxy.address, mocStateFactory);
        // validates an implementation
        await upgrades.validateImplementation(mocState_v0116_2Factory, {
          // https://github.com/OpenZeppelin/openzeppelin-upgrades/issues/52
          unsafeAllow: ["external-library-linking"],
        });
        // compares the current implementation to the new implementation to check for storage layout compatibility errors
        await upgrades.validateUpgrade(mocStateProxy.address, mocState_v0116_2Factory, {
          // https://github.com/OpenZeppelin/openzeppelin-upgrades/issues/52
          unsafeAllow: ["external-library-linking"],
        });
      });
      it("THEN upgrade MoCState_v0116_2 to MoCState is compatible", async () => {
        // forces the import of an existing proxy to be used with this plugin
        await upgrades.forceImport(mocStateProxy.address, mocState_v0116_2Factory);
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
      it("THEN upgrade MoCSettlement to MoCSettlement_v0116_2 is compatible", async () => {
        // forces the import of an existing proxy to be used with this plugin
        await upgrades.forceImport(mocSettlementProxy.address, mocSettlementFactory);
        // validates an implementation
        await upgrades.validateImplementation(mocSettlement_v0116_2Factory);
        // compares the current implementation to the new implementation to check for storage layout compatibility errors
        // FIXME: this test fails with this msg: Error: An unexpected condition occurred. Please report this at https://zpl.in/upgrades/report
        //await upgrades.validateUpgrade(mocSettlementProxy.address, mocSettlement_v0116_2Factory);
      });
      it("THEN upgrade MoCSettlement_v0116_2 to MoCSettlement is compatible", async () => {
        // forces the import of an existing proxy to be used with this plugin
        await upgrades.forceImport(mocSettlementProxy.address, mocSettlement_v0116_2Factory);
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
      describe("AND alice makes a redeem StableTokenV1 request for 100 tokens", () => {
        beforeEach(async () => {
          await reserveToken.connect(aliceSigner).approve(mocProxy.address, pEth(100));
          await mocProxy.connect(aliceSigner).redeemStableTokenRequest(pEth(100));
        });
        describe("WHEN settlement is executed", () => {
          let aliceStableTokenV1BalanceBefore: Balance;
          beforeEach(async () => {
            aliceStableTokenV1BalanceBefore = await stableToken.balanceOf(alice);
            await mocProxy.runSettlement(100);
          });
          it("THEN alice StableTokenV1 balance decrease by 100", async () => {
            const diff = aliceStableTokenV1BalanceBefore.sub(await stableToken.balanceOf(alice));
            assertPrec(diff, 100);
          });
        });
        describe("AND StableTokenV2Changer is executed", () => {
          let changer: StableTokenMigrationChanger;
          let mocImp: Address;
          let mocConnectorImp: Address;
          let mocExchangeImp: Address;
          let mocStateImp: Address;
          let mocSettlementImp: Address;
          let moc_v0116_2: MoC_v0116_2;
          let mocConnector_v0116_2: MoCConnector_v0116_2;
          let mocExchange_v0116_2: MoCExchange_v0116_2;
          let mocState_v0116_2: MoCState_v0116_2;
          let mocSettlement_v0116_2: MoCSettlement_v0116_2;
          beforeEach(async () => {
            [mocImp, mocConnectorImp, mocExchangeImp, mocStateImp, mocSettlementImp] = await Promise.all(
              [mocProxy, mocConnectorProxy, mocExchangeProxy, mocStateProxy, mocSettlementProxy].map(proxy =>
                upgradeDelegator.getProxyImplementation(proxy.address),
              ),
            );
            // deploy MoC
            moc_v0116_2 = await moc_v0116_2Factory.deploy();
            // deploy MoCConnector
            mocConnector_v0116_2 = await mocConnector_v0116_2Factory.deploy();
            // deploy MoCExchange
            mocExchange_v0116_2 = await mocExchange_v0116_2Factory.deploy();
            // deploy MoCState
            mocState_v0116_2 = await mocState_v0116_2Factory.deploy();
            // deploy MoCSettlement
            mocSettlement_v0116_2 = await mocSettlement_v0116_2Factory.deploy();

            changer = await deployContract("StableTokenMigrationChanger", StableTokenMigrationChanger__factory, [
              upgradeDelegator.address,
              stableTokenV2.address,
              tokenMigrator.address,
              mocProxy.address,
              moc_v0116_2.address,
              mocConnector_v0116_2.address,
              mocExchange_v0116_2.address,
              mocState_v0116_2.address,
              mocSettlement_v0116_2.address,
            ]);
          });
          describe("WHEN changer is executed", () => {
            let tx: ContractTransaction;
            beforeEach(async () => {
              tx = await changer.execute();
            });
            describe("WHEN check Moc Upgrade events", () => {
              it("THEN 2 Upgrade events are emitted with Moc v0116_2 and MoC implementation addresses", async () => {
                const mocProxyAsAdminUpgradeabilityProxy = AdminUpgradeabilityProxy__factory.connect(
                  mocProxy.address,
                  signer,
                );
                await expect(tx).to.emit(mocProxyAsAdminUpgradeabilityProxy, "Upgraded").withArgs(moc_v0116_2.address);
                await expect(tx).to.emit(mocProxyAsAdminUpgradeabilityProxy, "Upgraded").withArgs(mocImp);
              });
            });
            describe("WHEN check MocConnector Upgrade events", () => {
              it("THEN 2 Upgrade events are emitted with MocConnector v0116_2 and MocConnector implementation addresses", async () => {
                const mocConnectorProxyAsAdminUpgradeabilityProxy = AdminUpgradeabilityProxy__factory.connect(
                  mocConnectorProxy.address,
                  signer,
                );
                await expect(tx)
                  .to.emit(mocConnectorProxyAsAdminUpgradeabilityProxy, "Upgraded")
                  .withArgs(mocConnector_v0116_2.address);
                await expect(tx)
                  .to.emit(mocConnectorProxyAsAdminUpgradeabilityProxy, "Upgraded")
                  .withArgs(mocConnectorImp);
              });
            });
            describe("WHEN check MocExchange Upgrade events", () => {
              it("THEN 2 Upgrade events are emitted with MocExchange v0116_2 and MocExchange implementation addresses ", async () => {
                const mocExchangeProxyAsAdminUpgradeabilityProxy = AdminUpgradeabilityProxy__factory.connect(
                  mocExchangeProxy.address,
                  signer,
                );
                await expect(tx)
                  .to.emit(mocExchangeProxyAsAdminUpgradeabilityProxy, "Upgraded")
                  .withArgs(mocExchange_v0116_2.address);
                await expect(tx)
                  .to.emit(mocExchangeProxyAsAdminUpgradeabilityProxy, "Upgraded")
                  .withArgs(mocExchangeImp);
              });
            });
            describe("WHEN check MocState Upgrade events", () => {
              it("THEN 2 Upgrade events are emitted with MocState v0116_2 and MocState implementation addresses", async () => {
                const mocStateProxyAsAdminUpgradeabilityProxy = AdminUpgradeabilityProxy__factory.connect(
                  mocStateProxy.address,
                  signer,
                );
                await expect(tx)
                  .to.emit(mocStateProxyAsAdminUpgradeabilityProxy, "Upgraded")
                  .withArgs(mocState_v0116_2.address);
                await expect(tx).to.emit(mocStateProxyAsAdminUpgradeabilityProxy, "Upgraded").withArgs(mocStateImp);
              });
            });
            describe("WHEN check MocSettlement Upgrade events", () => {
              it("THEN 2 Upgrade events are emitted with MocSettlement v0116_2 and MoCSettlement implementation addresses", async () => {
                const mocSettlementProxyAsAdminUpgradeabilityProxy = AdminUpgradeabilityProxy__factory.connect(
                  mocSettlementProxy.address,
                  signer,
                );
                await expect(tx)
                  .to.emit(mocSettlementProxyAsAdminUpgradeabilityProxy, "Upgraded")
                  .withArgs(mocSettlement_v0116_2.address);
                await expect(tx)
                  .to.emit(mocSettlementProxyAsAdminUpgradeabilityProxy, "Upgraded")
                  .withArgs(mocSettlementImp);
              });
            });
            it("THEN a StableTokenMigrated event is emitted by MoC", async () => {
              const mocProxyAsMoC_v0116_2 = MoC_v0116_2__factory.connect(mocProxy.address, signer);
              await expect(tx)
                .to.emit(mocProxyAsMoC_v0116_2, "StableTokenMigrated")
                .withArgs(stableToken.address, stableTokenV2.address);
            });
            it("THEN a StableTokenMigrated event is emitted by MoCConnector", async () => {
              const mocProxyAsMoCConnector_v0116_2 = MoCConnector_v0116_2__factory.connect(
                mocConnectorProxy.address,
                signer,
              );
              await expect(tx)
                .to.emit(mocProxyAsMoCConnector_v0116_2, "StableTokenMigrated")
                .withArgs(stableToken.address, stableTokenV2.address);
            });
            it("THEN a StableTokenMigrated event is emitted by MoCExchange", async () => {
              const mocProxyAsMoCExchange_v0116_2 = MoCExchange_v0116_2__factory.connect(
                mocExchangeProxy.address,
                signer,
              );
              await expect(tx)
                .to.emit(mocProxyAsMoCExchange_v0116_2, "StableTokenMigrated")
                .withArgs(stableToken.address, stableTokenV2.address);
            });
            it("THEN a StableTokenMigrated event is emitted by MoCState", async () => {
              const mocProxyAsMoCState_v0116_2 = MoCState_v0116_2__factory.connect(mocStateProxy.address, signer);
              await expect(tx)
                .to.emit(mocProxyAsMoCState_v0116_2, "StableTokenMigrated")
                .withArgs(stableToken.address, stableTokenV2.address);
            });
            it("THEN a StableTokenMigrated event is emitted by MoCSettlement", async () => {
              const mocProxyAsMoCSettlement_v0116_2 = MoCSettlement_v0116_2__factory.connect(
                mocSettlementProxy.address,
                signer,
              );
              await expect(tx)
                .to.emit(mocProxyAsMoCSettlement_v0116_2, "StableTokenMigrated")
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
                const mocProxyAsMoC_v0116_2 = MoC_v0116_2__factory.connect(mocProxy.address, signer);
                await expect(mocProxyAsMoC_v0116_2.migrateStableToken(stableTokenV2.address)).to.be
                  .revertedWithoutReason;
              });
            });
            describe("WHEN someone tries to call migrateStableToken in mocConnector", () => {
              it("THEN tx reverts because function is not available, it only existed atomically during the upgrade", async () => {
                const mocProxyAsMoCConnector_v0116_2 = MoCConnector_v0116_2__factory.connect(
                  mocConnectorProxy.address,
                  signer,
                );
                await expect(mocProxyAsMoCConnector_v0116_2.migrateStableToken(stableTokenV2.address)).to.be
                  .revertedWithoutReason;
              });
            });
            describe("WHEN someone tries to call migrateStableToken in mocExchange", () => {
              it("THEN tx reverts because function is not available, it only existed atomically during the upgrade", async () => {
                const mocProxyAsMoCExchange_v0116_2 = MoCExchange_v0116_2__factory.connect(
                  mocExchangeProxy.address,
                  signer,
                );
                await expect(
                  mocProxyAsMoCExchange_v0116_2.migrateStableToken(stableTokenV2.address, tokenMigrator.address),
                ).to.be.revertedWithoutReason;
              });
            });
            describe("WHEN someone tries to call migrateStableToken in mocState", () => {
              it("THEN tx reverts because function is not available, it only existed atomically during the upgrade", async () => {
                const mocProxyAsMoCState_v0116_2 = MoCState_v0116_2__factory.connect(mocStateProxy.address, signer);
                await expect(mocProxyAsMoCState_v0116_2.migrateStableToken(stableTokenV2.address)).to.be
                  .revertedWithoutReason;
              });
            });
            describe("WHEN someone tries to call migrateStableToken in mocSettlement", () => {
              it("THEN tx reverts because function is not available, it only existed atomically during the upgrade", async () => {
                const mocProxyAsMoCSettlement_v0116_2 = MoCSettlement_v0116_2__factory.connect(
                  mocSettlementProxy.address,
                  signer,
                );
                await expect(mocProxyAsMoCSettlement_v0116_2.migrateStableToken(stableTokenV2.address)).to.be
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
            describe("WHEN settlement is executed after the upgrade but before alice has migrated her tokens", () => {
              let aliceStableTokenV1BalanceBefore: Balance;
              let aliceStableTokenV2BalanceBefore: Balance;
              beforeEach(async () => {
                aliceStableTokenV1BalanceBefore = await stableToken.balanceOf(alice);
                aliceStableTokenV2BalanceBefore = await stableTokenV2.balanceOf(alice);
                await mocProxy.runSettlement(100);
              });
              it("THEN alice StableTokenV1 balance doesn't change because she hasn't migrated her tokens yet", async () => {
                assertPrec(await stableToken.balanceOf(alice), aliceStableTokenV1BalanceBefore);
              });
              it("THEN alice StableTokenV2 balance doesn't change because she hasn't migrated her tokens yet", async () => {
                assertPrec(await stableTokenV2.balanceOf(alice), aliceStableTokenV2BalanceBefore);
              });
              it("THEN alice StableToken to redeem in the queue is 0", async () => {
                assertPrec(await mocSettlementProxy.stableTokenAmountToRedeem(alice), 0);
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
              it("THEN alice StableTokenV1 balance doesn't change", async () => {
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
                await expect(tokenMigrator.migrateTokenFrom(alice)).to.be.revertedWith(
                  "SafeMath: subtraction overflow",
                );
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
                const diff = migratorStableTokenV2BalanceBefore.sub(
                  await stableTokenV2.balanceOf(tokenMigrator.address),
                );
                assertPrec(diff, aliceStableTokenV1BalanceBefore);
              });
              it("THEN a TokenMigrated event is emitted", async () => {
                await expect(tx)
                  .to.emit(tokenMigrator, "TokenMigrated")
                  .withArgs(alice, alice, aliceStableTokenV1BalanceBefore);
              });
              describe("WHEN alice redeems 10 StableTokenV2", () => {
                let aliceReserveTokenBalanceBefore: Balance;
                let aliceStableTokenV2BalanceBefore: Balance;
                beforeEach(async () => {
                  aliceReserveTokenBalanceBefore = await reserveToken.balanceOf(alice);
                  aliceStableTokenV2BalanceBefore = await stableTokenV2.balanceOf(alice);
                  await mocProxy.connect(aliceSigner).redeemFreeStableToken(pEth(10));
                });
                it("THEN alice StableTokenV2 balance decrease by 10", async () => {
                  const diff = aliceStableTokenV2BalanceBefore.sub(await stableTokenV2.balanceOf(alice));
                  assertPrec(diff, pEth(10));
                });
                it("THEN alice ReserveToken balance increase by 0.001", async () => {
                  const diff = (await reserveToken.balanceOf(alice)).sub(aliceReserveTokenBalanceBefore);
                  assertPrec(diff, pEth("0.001"));
                });
              });
              describe("WHEN settlement is executed after the upgrade and that alice has migrated her tokens", () => {
                let aliceStableTokenV2BalanceBefore: Balance;
                beforeEach(async () => {
                  aliceStableTokenV2BalanceBefore = await stableTokenV2.balanceOf(alice);
                  await mocProxy.runSettlement(100);
                });
                it("THEN alice StableTokenV2 balance decrease by 100 because the req was pending before the upgrade", async () => {
                  const diff = aliceStableTokenV2BalanceBefore.sub(await stableTokenV2.balanceOf(alice));
                  assertPrec(diff, 100);
                });
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
                await stableToken
                  .connect(aliceSigner)
                  .approve(tokenMigrator.address, await stableToken.balanceOf(alice));
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
});
