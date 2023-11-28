import { Address } from "hardhat-deploy/dist/types";
import { ethers, getNamedAccounts } from "hardhat";
import { ContractTransaction } from "ethers";
import { expect } from "chai";
import {
  MoC,
  MoCExchange,
  StableTokenV2,
  V2MigrationChanger,
  UpgradeDelegator,
  AdminUpgradeabilityProxy__factory,
  RiskProToken,
  CommissionSplitter,
  MoCConnector,
  MocRif,
  MoCState,
  MoCRiskProxManager,
  MoCSettlement,
  MoCInrate,
  Deprecated,
  MoC_Migrator__factory,
  MoCExchange_Migrator__factory,
  MoC_Migrator,
  MoCExchange_Migrator,
} from "../../typechain";
import { BURNER_ROLE, DEFAULT_ADMIN_ROLE, MINTER_ROLE } from "../helpers/utils";
import { fixtureDeployed } from "./fixture";
import { deployChanger } from "./deployChanger";

describe("Feature: MoC V2 migration - upgrades", () => {
  let mocHelperAddress: Address;
  let mocProxy: MoC;
  let mocExchangeProxy: MoCExchange;
  let mocStateProxy: MoCState;
  let stableToken: StableTokenV2;
  let riskProToken: RiskProToken;
  let upgradeDelegator: UpgradeDelegator;
  let deployer: Address;
  let mocRifV2: MocRif;
  let signer: any;
  let mocCommissionSplitter: CommissionSplitter;
  let mocConnectorProxy: MoCConnector;
  let mocInrateProxy: MoCInrate;
  let mocRiskProxManagerProxy: MoCRiskProxManager;
  let mocSettlementProxy: MoCSettlement;
  describe("GIVEN a MoC Legacy protocol deployed", () => {
    before(async () => {
      ({ deployer } = await getNamedAccounts());
      ({
        mocHelperAddress,
        moc: mocProxy,
        mocExchange: mocExchangeProxy,
        mocState: mocStateProxy,
        mocConnector: mocConnectorProxy,
        mocInrate: mocInrateProxy,
        riskProxManager: mocRiskProxManagerProxy,
        mocSettlement: mocSettlementProxy,
        upgradeDelegator,
        stableToken,
        riskProToken,
        mocCommissionSplitter,
        mocRifV2,
      } = await fixtureDeployed()());
      signer = ethers.provider.getSigner();
    });
    describe("AND V2MigrationChanger is executed", () => {
      let mocMigrator: MoC_Migrator;
      let mocExchangeMigrator: MoCExchange_Migrator;
      let deprecated: Deprecated;
      let tx: ContractTransaction;
      let changer: V2MigrationChanger;
      let mocV1Pauser: Address;
      before(async () => {
        mocV1Pauser = await mocProxy.stopper();
        ({ mocMigrator, mocExchangeMigrator, deprecated, changer } = await deployChanger(
          mocHelperAddress,
          upgradeDelegator.address,
          mocCommissionSplitter.address,
          mocRifV2.address,
          mocProxy.address,
          [deployer],
        ));
        tx = await changer.execute();
      });
      describe("WHEN check Moc Upgrade events", () => {
        it("THEN Upgrade event is emitted with Moc implementation addresses ", async () => {
          const mocProxyAsAdminUpgradeabilityProxy = AdminUpgradeabilityProxy__factory.connect(
            mocProxy.address,
            signer,
          );
          await expect(tx).to.emit(mocProxyAsAdminUpgradeabilityProxy, "Upgraded").withArgs(mocMigrator.address);
        });
        it("THEN Upgrade event is emitted with Deprecated implementation addresses ", async () => {
          const mocProxyAsAdminUpgradeabilityProxy = AdminUpgradeabilityProxy__factory.connect(
            mocProxy.address,
            signer,
          );
          await expect(tx).to.emit(mocProxyAsAdminUpgradeabilityProxy, "Upgraded").withArgs(deprecated.address);
        });
      });
      describe("WHEN check MocExchange Upgrade events", () => {
        it("THEN Upgrade event is emitted with MocExchange implementation addresses ", async () => {
          const mocExchangeProxyAsAdminUpgradeabilityProxy = AdminUpgradeabilityProxy__factory.connect(
            mocExchangeProxy.address,
            signer,
          );
          await expect(tx)
            .to.emit(mocExchangeProxyAsAdminUpgradeabilityProxy, "Upgraded")
            .withArgs(mocExchangeMigrator.address);
        });
        it("THEN Upgrade event is emitted with Deprecated implementation addresses ", async () => {
          const mocExchangeProxyAsAdminUpgradeabilityProxy = AdminUpgradeabilityProxy__factory.connect(
            mocExchangeProxy.address,
            signer,
          );
          await expect(tx).to.emit(mocExchangeProxyAsAdminUpgradeabilityProxy, "Upgraded").withArgs(deprecated.address);
        });
      });
      describe("WHEN check MocState Upgrade events", () => {
        it("THEN Upgrade event is emitted with deprecated implementation addresses ", async () => {
          const mocStateProxyAsAdminUpgradeabilityProxy = AdminUpgradeabilityProxy__factory.connect(
            mocStateProxy.address,
            signer,
          );
          await expect(tx).to.emit(mocStateProxyAsAdminUpgradeabilityProxy, "Upgraded").withArgs(deprecated.address);
        });
      });
      describe("WHEN check MocConnector Upgrade events", () => {
        it("THEN Upgrade event is emitted with Deprecated implementation addresses ", async () => {
          const mocConnectorProxyAsAdminUpgradeabilityProxy = AdminUpgradeabilityProxy__factory.connect(
            mocConnectorProxy.address,
            signer,
          );
          await expect(tx)
            .to.emit(mocConnectorProxyAsAdminUpgradeabilityProxy, "Upgraded")
            .withArgs(deprecated.address);
        });
      });
      describe("WHEN check MocSettlement Upgrade events", () => {
        it("THEN Upgrade event is emitted with Deprecated implementation addresses ", async () => {
          const mocSettlementProxyAsAdminUpgradeabilityProxy = AdminUpgradeabilityProxy__factory.connect(
            mocSettlementProxy.address,
            signer,
          );
          await expect(tx)
            .to.emit(mocSettlementProxyAsAdminUpgradeabilityProxy, "Upgraded")
            .withArgs(deprecated.address);
        });
      });
      describe("WHEN check MocInrate Upgrade events", () => {
        it("THEN Upgrade event is emitted with Deprecated implementation addresses ", async () => {
          const mocInrateProxyAsAdminUpgradeabilityProxy = AdminUpgradeabilityProxy__factory.connect(
            mocInrateProxy.address,
            signer,
          );
          await expect(tx).to.emit(mocInrateProxyAsAdminUpgradeabilityProxy, "Upgraded").withArgs(deprecated.address);
        });
      });
      describe("WHEN check MocRiskProxManager Upgrade events", () => {
        it("THEN Upgrade event is emitted with Deprecated implementation addresses ", async () => {
          const mocRiskProxManagerProxyAsAdminUpgradeabilityProxy = AdminUpgradeabilityProxy__factory.connect(
            mocRiskProxManagerProxy.address,
            signer,
          );
          await expect(tx)
            .to.emit(mocRiskProxManagerProxyAsAdminUpgradeabilityProxy, "Upgraded")
            .withArgs(deprecated.address);
        });
      });
      describe("WHEN check RiskProToken ownership and roles", () => {
        it("THEN MocV2 is the owner", async () => {
          expect(await riskProToken.owner()).to.be.equal(mocRifV2.address);
        });
        it("THEN MocExchange is not a minter but MocV2 yes", async () => {
          expect(await riskProToken.isMinter(mocExchangeProxy.address)).to.be.false;
          expect(await riskProToken.isMinter(mocRifV2.address)).to.be.true;
        });
        it("THEN Moc is not a pauser but MocV2 yes", async () => {
          expect(await riskProToken.isPauser(mocExchangeProxy.address)).to.be.false;
          expect(await riskProToken.isPauser(mocRifV2.address)).to.be.true;
        });
      });
      describe("WHEN check StableToken roles", () => {
        it("THEN MocExchange is not a minter but MocV2 yes", async () => {
          expect(await stableToken.hasRole(MINTER_ROLE, mocExchangeProxy.address)).to.be.false;
          expect(await stableToken.hasRole(MINTER_ROLE, mocRifV2.address)).to.be.true;
        });
        it("THEN MocExchange is not a burner but MocV2 yes", async () => {
          expect(await stableToken.hasRole(BURNER_ROLE, mocExchangeProxy.address)).to.be.false;
          expect(await stableToken.hasRole(BURNER_ROLE, mocRifV2.address)).to.be.true;
        });
        it("THEN MocExchange is not admin but MocV2 yes", async () => {
          expect(await stableToken.hasRole(DEFAULT_ADMIN_ROLE, mocExchangeProxy.address)).to.be.false;
          expect(await stableToken.hasRole(DEFAULT_ADMIN_ROLE, mocRifV2.address)).to.be.true;
        });
      });
      describe("WHEN check MocV2 pauser", () => {
        it("THEN pauser address is MocV1 stopper instead of the temp pauser", async () => {
          expect(await mocRifV2.pauser()).to.be.equal(mocV1Pauser);
        });
      });
      describe("WHEN executes the changer again", () => {
        it("THEN tx reverts because contracts are already migrated", async () => {
          await expect(changer.execute()).to.be.reverted;
        });
      });
      describe("WHEN call migrateToV2 on Moc again", () => {
        it("THEN tx reverts because contracts are already migrated", async () => {
          const mocProxyAsMoc = MoC_Migrator__factory.connect(mocProxy.address, signer);
          await expect(mocProxyAsMoc.migrateToV2(deployer)).to.be.revertedWith(
            "contract deprecated. Protocol migrated to V2",
          );
        });
      });
      describe("WHEN call migrateToV2 on MocExchange again", () => {
        it("THEN tx reverts because contracts are already migrated", async () => {
          const mocExchangeProxyAsMocExchange = MoCExchange_Migrator__factory.connect(mocExchangeProxy.address, signer);
          await expect(mocExchangeProxyAsMocExchange.migrateToV2(deployer)).to.be.revertedWith(
            "contract deprecated. Protocol migrated to V2",
          );
        });
      });
    });
  });
});
