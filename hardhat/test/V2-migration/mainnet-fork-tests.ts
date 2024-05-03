import { ethers, getNamedAccounts } from "hardhat";
import { BigNumber } from "@ethersproject/bignumber";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Address } from "hardhat-deploy/types";
import { expect } from "chai";
import {
  MoC,
  MoCState,
  MoCSettlement,
  ReserveToken,
  StableToken,
  MocRif,
  MocQueue,
  MocCoreExpansion,
  MoC__factory,
  MoCState__factory,
  MoCSettlement__factory,
  ReserveToken__factory,
  StableToken__factory,
  Governor__factory,
  Governor,
  MoCToken__factory,
  MoCToken,
  RiskProToken__factory,
  RiskProToken,
  MoCInrate,
  MoCInrate__factory,
  TokenMigrator__factory,
  FCMaxAbsoluteOpProvider,
  FCMaxOpDifferenceProvider,
  StopperV2,
  StopperV2__factory,
  MocVendors,
  MoCVendors__factory,
  MoCConnector__factory,
  MoCConnector,
  CommissionSplitterV2__factory,
  CommissionSplitterV2,
  MoCVendors,
  MoCExchange,
  MoCExchange__factory,
  MoCRiskProxManager,
  MoCRiskProxManager__factory,
  NewCommissionSplitter,
  CommissionSplitterV3,
  CommissionSplitterV3__factory,
} from "../../typechain";
import { Balance, pEth, CONSTANTS, OperType, deployMocRifV2 } from "../helpers/utils";
import { assertPrec } from "../helpers/assertHelper";
import { deployChanger } from "./deployChanger";

const helpers = require("@nomicfoundation/hardhat-network-helpers");
const mocMainnetAddresses = require("../../../scripts/deploy/upgrade_v0.2.0/deployConfig-rdocMainnet.json");

describe("Feature: MoC V2 migration - mainnet fork", () => {
  let mocProxy: MoC;
  let mocConnector: MoCConnector;
  let mocStateProxy: MoCState;
  let mocSettlementProxy: MoCSettlement;
  let mocVendors: MoCVendors;
  let mocExchange: MoCExchange;
  let mocRiskProManager: MoCRiskProxManager;
  let reserveToken: ReserveToken;
  let mocInrateProxy: MoCInrate;
  let stableToken: StableToken;
  let riskProToken: RiskProToken;
  let mocToken: MoCToken;
  let governor: Governor;
  let mocRifV2: MocRif;
  let mocQueue: MocQueue;
  let stopper: StopperV2;
  let deployer: Address;
  let commissionSplitterV2: CommissionSplitterV2;
  let commissionSplitterV3: CommissionSplitterV3;
  let governorOwnerSigner: SignerWithAddress;
  let holderSigner: SignerWithAddress;
  let multisig: SignerWithAddress;
  let signer: any;
  let holderStableTokenBalanceBefore: Balance;
  let holderRifProTokenBalanceBefore: Balance;
  let vendorReserveTokenBalanceBefore: Balance;
  let feesSplitter: NewCommissionSplitter;
  let tcInterestsSplitter: NewCommissionSplitter;
  const governorOwnerAddress = "0x65a5681bE95d212F0c90eAd40170D8277de81169";
  const holderAddress = "0xFD5c1C3d086a9CC0f21beaB6ddE3900C9351FC59";
  const vendor = "0xC61820bFB8F87391d62Cd3976dDc1d35e0cf7128";
  const expectRevertContractDeprecated = (it: any) =>
    expect(it).to.be.revertedWith("contract deprecated. Protocol migrated to V2");

  describe("GIVEN the MocRif protocol deployed in mainnet", () => {
    before(async () => {
      await helpers.reset("https://public-node.rsk.co", 6262060);
      ({ deployer } = await getNamedAccounts());
      signer = ethers.provider.getSigner();
      mocConnector = MoCConnector__factory.connect(mocMainnetAddresses.v1ProxyAddresses.MoCConnector, signer);
      mocProxy = MoC__factory.connect(mocMainnetAddresses.v1ProxyAddresses.MoC, signer);
      mocStateProxy = MoCState__factory.connect(mocMainnetAddresses.v1ProxyAddresses.MoCState, signer);
      mocSettlementProxy = MoCSettlement__factory.connect(mocMainnetAddresses.v1ProxyAddresses.MoCSettlement, signer);
      commissionSplitterV2 = CommissionSplitterV2__factory.connect(
        mocMainnetAddresses.v1ProxyAddresses.CommissionSplitter,
        signer,
      );
      mocExchange = MoCExchange__factory.connect(mocMainnetAddresses.v1ProxyAddresses.MoCExchange, signer);
      mocRiskProManager = MoCRiskProxManager__factory.connect(
        mocMainnetAddresses.v1ProxyAddresses.MoCRiskProxManager,
        signer,
      );
      mocVendors = MoCVendors__factory.connect(await mocStateProxy.getMoCVendors(), signer);
      mocInrateProxy = MoCInrate__factory.connect(mocMainnetAddresses.v1ProxyAddresses.MoCInrate, signer);
      reserveToken = ReserveToken__factory.connect(await mocConnector.reserveToken(), signer);
      mocToken = MoCToken__factory.connect(await commissionSplitterV2.tokenGovern(), signer);
      governor = Governor__factory.connect(await mocProxy.governor(), signer);
      stopper = StopperV2__factory.connect(await mocProxy.stopper(), signer);
      commissionSplitterV3 = CommissionSplitterV3__factory.connect(
        await mocInrateProxy.getRiskProInterestAddress(),
        signer,
      );

      stableToken = StableToken__factory.connect(await mocConnector.stableToken(), signer);
      riskProToken = RiskProToken__factory.connect(await mocConnector.riskProToken(), signer);

      // deploy MocV2
      let mocCoreExpansion: MocCoreExpansion;
      let maxAbsoluteOpProvider: FCMaxAbsoluteOpProvider;
      let maxOpDiffProvider: FCMaxOpDifferenceProvider;
      let mocVendorsV2: MocVendors;
      ({
        mocRifV2,
        mocCoreExpansion,
        mocQueue,
        mocVendorsV2,
        maxAbsoluteOpProvider,
        maxOpDiffProvider,
        feesSplitter,
        tcInterestsSplitter,
      } = await deployMocRifV2(stopper.address));

      await mocRifV2.initialize({
        initializeCoreParams: {
          initializeBaseBucketParams: {
            mocQueueAddress: mocQueue.address,
            feeTokenAddress: mocToken.address,
            feeTokenPriceProviderAddress: mocMainnetAddresses.implementationAddresses.MoCPriceProvider,
            tcTokenAddress: riskProToken.address,
            mocFeeFlowAddress: feesSplitter.address,
            mocAppreciationBeneficiaryAddress: deployer,
            protThrld: await mocStateProxy.getProtected(),
            liqThrld: await mocStateProxy.getLiq(),
            feeRetainer: pEth(0.25), // 25%,
            tcMintFee: pEth(0.002), // 0.2%
            tcRedeemFee: pEth(0.002), // 0.2%
            swapTPforTPFee: pEth(0.002), // 0.2%
            swapTPforTCFee: pEth(0.002), // 0.2%
            swapTCforTPFee: pEth(0.002), // 0.2%
            redeemTCandTPFee: pEth(0.002), // 0.2%
            mintTCandTPFee: pEth(0.002), // 0.2%
            feeTokenPct: pEth(0.75), // 75%
            successFee: 0, // 0%
            appreciationFactor: 0,
            bes: await mocSettlementProxy.getBlockSpan(),
            tcInterestCollectorAddress: tcInterestsSplitter.address,
            tcInterestRate: await mocInrateProxy.getRiskProRate(),
            tcInterestPaymentBlockSpan: await mocInrateProxy.getRiskProInterestBlockSpan(),
            maxAbsoluteOpProviderAddress: maxAbsoluteOpProvider.address,
            maxOpDiffProviderAddress: maxOpDiffProvider.address,
            decayBlockSpan: 720,
            allowDifferentRecipient: false,
          },
          governorAddress: governor.address,
          pauserAddress: stopper.address,
          mocCoreExpansion: mocCoreExpansion.address,
          emaCalculationBlockSpan: await mocStateProxy.getEmaCalculationBlockSpan(),
          mocVendors: mocVendorsV2.address,
        },
        acTokenAddress: reserveToken.address!,
      });

      await mocVendorsV2.initialize(deployer, governor.address, stopper.address);
      // set 0.1% markup to vendor
      await mocVendorsV2.setVendorMarkup(vendor, pEth(0.001));

      // initialize mocQueue
      const minOperWaitingBlck = 1;
      const maxOperPerBlock = 10;
      const execFeeParams = {
        tcMintExecFee: CONSTANTS.EXEC_FEE,
        tcRedeemExecFee: CONSTANTS.EXEC_FEE,
        tpMintExecFee: CONSTANTS.EXEC_FEE,
        tpRedeemExecFee: CONSTANTS.EXEC_FEE,
        mintTCandTPExecFee: CONSTANTS.EXEC_FEE,
        redeemTCandTPExecFee: CONSTANTS.EXEC_FEE,
        swapTPforTPExecFee: CONSTANTS.EXEC_FEE,
        swapTPforTCExecFee: CONSTANTS.EXEC_FEE,
        swapTCforTPExecFee: CONSTANTS.EXEC_FEE,
      };
      await mocQueue.initialize(governor.address, stopper.address, minOperWaitingBlck, maxOperPerBlock, execFeeParams);

      await feesSplitter.initialize(
        governor.address,
        reserveToken.address!,
        mocToken.address,
        await commissionSplitterV2.outputAddress_2(), // recipient1
        await commissionSplitterV2.outputAddress_3(), // recipient2
        pEth(2).div(3), // 66.66%
        await commissionSplitterV2.outputTokenGovernAddress_1(), // recipient1
        await commissionSplitterV2.outputTokenGovernAddress_2(), // recipient2
        pEth(0.5), // 50%
      );

      await tcInterestsSplitter.initialize(
        governor.address,
        reserveToken.address!,
        mocToken.address,
        await commissionSplitterV3.outputAddress_1(), // recipient1
        await commissionSplitterV3.outputAddress_2(), // recipient2
        pEth(0.5), // 50%
        await commissionSplitterV2.outputTokenGovernAddress_1(), // recipient1 (NOT USED)
        await commissionSplitterV2.outputTokenGovernAddress_2(), // recipient2 (NOT USED)
        pEth(0.5), // 50%
      );

      await helpers.impersonateAccount(governorOwnerAddress);
      governorOwnerSigner = await ethers.getSigner(governorOwnerAddress);

      await helpers.impersonateAccount(holderAddress);
      holderSigner = await ethers.getSigner(holderAddress);

      const multisigAddress = await stopper.owner();
      await helpers.impersonateAccount(multisigAddress);
      multisig = await ethers.getSigner(multisigAddress);

      await helpers.setBalance(holderAddress, pEth(10000000));
      await helpers.setBalance(governorOwnerAddress, pEth(10000000));
      await helpers.setBalance(multisigAddress, pEth(10000000));

      await stopper.connect(multisig).setMaxAbsoluteOperation(maxAbsoluteOpProvider.address, CONSTANTS.MAX_UINT256);
      await stopper.connect(multisig).setMaxOperationalDifference(maxOpDiffProvider.address, CONSTANTS.MAX_UINT256);
    });
    describe("AND V2MigrationChanger is executed", async () => {
      let coverageBefore: BigNumber;
      let riskProTokenPriceBefore: BigNumber;
      let riskProAvailableBefore: BigNumber;
      let stableTokenAvailableBefore: BigNumber;
      let reserveTokenPriceBefore: BigNumber;
      let tpEmaBefore: BigNumber;
      let nextEmaCalculationBefore: BigNumber;
      let nextTCInterestPaymentBefore: BigNumber;
      let tcInterestAmountBefore: BigNumber;
      before(async () => {
        // take a snapshot of the current state of the blockchain
        // store the operations results to compare them after the upgrade
        const snapshot = await helpers.takeSnapshot();
        // we clean interests and commission to use all the collateral to calc metrics before the upgrade
        await commissionSplitterV2.split();
        await commissionSplitterV3.split();
        coverageBefore = await mocStateProxy.globalCoverage();
        riskProTokenPriceBefore = await mocStateProxy.riskProTecPrice();
        riskProAvailableBefore = await mocStateProxy.absoluteMaxRiskPro();
        reserveTokenPriceBefore = await mocStateProxy.getReserveTokenPrice();
        tpEmaBefore = await mocStateProxy.getExponentalMovingAverage();
        stableTokenAvailableBefore = await mocStateProxy.absoluteMaxStableToken();
        nextEmaCalculationBefore = (await mocStateProxy.lastEmaCalculation()).add(
          await mocStateProxy.emaCalculationBlockSpan(),
        );
        nextTCInterestPaymentBefore = (await mocInrateProxy.lastRiskProInterestBlock()).add(
          await mocInrateProxy.riskProInterestBlockSpan(),
        );

        const tcInterestCollectorBalance = await reserveToken.balanceOf(commissionSplitterV3.address);
        await helpers.mine(nextTCInterestPaymentBefore);
        await mocProxy.payRiskProHoldersInterestPayment();
        tcInterestAmountBefore = (await reserveToken.balanceOf(commissionSplitterV3.address)).sub(
          tcInterestCollectorBalance,
        );
        // restore to the state of the snapshot
        await snapshot.restore();

        const { changer } = await deployChanger(
          mocMainnetAddresses.implementationAddresses.MoCHelperLib,
          mocMainnetAddresses.implementationAddresses.UpgradeDelegator,
          mocRifV2.address,
          mocProxy.address,
        );
        await governor.connect(governorOwnerSigner).executeChange(changer.address);
      });
      // MocV1 had 15101 Reserve Tokens locked in the contract that were not used as collateral, so after
      // migrating to MocV2 metrics are a little bigger
      // ReserveTokensLocked = (await reserveToken.balanceOf(mocProxy.address)).sub(await mocStateProxy.reserves())
      describe("WHEN check coverage", () => {
        it("THEN MocV2 coverage is 0.002 bigger because MocV1 had 15101 Reserve Tokens locked in the contract", async () => {
          assertPrec((await mocRifV2.getCglb()).sub(coverageBefore), "0.002455829957870151");
        });
      });
      describe("WHEN check riskProToken price", () => {
        it("THEN MocV2 price is 0.00009 bigger because MocV1 had 15101 Reserve Tokens locked in the contract", async () => {
          assertPrec((await mocRifV2.getPTCac()).sub(riskProTokenPriceBefore), "0.000093984483004832");
        });
      });
      describe("WHEN check riskProToken available to redeem", () => {
        it("THEN MocV2 riskProToken available are 4799 more because MocV1 had 15101 Reserve Tokens locked in the contract", async () => {
          assertPrec((await mocRifV2.getTCAvailableToRedeem()).sub(riskProAvailableBefore), "4799.001471739824973024");
        });
      });
      describe("WHEN check StableToken available to mint", () => {
        it("THEN MocV2 StableToken available are 592 more because MocV1 had 15101 Reserve Tokens locked in the contract", async () => {
          assertPrec(
            (await mocRifV2.getTPAvailableToMint(stableToken.address)).sub(stableTokenAvailableBefore),
            "592.479916645634044884",
          );
        });
      });
      describe("WHEN check next TC interest payment block", () => {
        it("THEN MocV1 and MocV2 have the same", async () => {
          assertPrec(nextTCInterestPaymentBefore, await mocRifV2.nextTCInterestPayment());
        });
      });
      describe("WHEN TC interest payment is executed", () => {
        let tcInterestAmount: BigNumber;
        before(async () => {
          const tcInterestCollectorBalance = await reserveToken.balanceOf(tcInterestsSplitter.address);
          await helpers.mine(nextTCInterestPaymentBefore);
          await mocRifV2.tcHoldersInterestPayment();
          tcInterestAmount = (await reserveToken.balanceOf(tcInterestsSplitter.address)).sub(
            tcInterestCollectorBalance,
          );
        });
        it("THEN TC interest payments available are 2.96 more because MocV1 had 15101 Reserve Tokens locked in the contract", async () => {
          // TC interest rate = 0.01962%
          assertPrec(tcInterestAmount.sub(tcInterestAmountBefore), "2.962930568676730742");
        });
        describe("AND tcInterestsSplitter split is executed", () => {
          before(async () => {
            await tcInterestsSplitter.split();
          });
          it("THEN tcInterestsSplitter balance is 0", async () => {
            assertPrec(await reserveToken.balanceOf(tcInterestsSplitter.address), 0);
          });
        });
      });
      describe("WHEN check Reserve Token price", () => {
        it("THEN MocV1 and MocV2 have the same", async () => {
          assertPrec(reserveTokenPriceBefore, await mocRifV2.getPACtp(stableToken.address));
        });
      });
      describe("WHEN check TP Ema", () => {
        it("THEN MocV1 and MocV2 have the same", async () => {
          assertPrec(tpEmaBefore, (await mocRifV2.tpEma(0))[0]);
        });
      });
      describe("WHEN check next Ema calculation block", () => {
        it("THEN MocV1 and MocV2 have the same", async () => {
          assertPrec(nextEmaCalculationBefore, await mocRifV2.nextEmaCalculation());
        });
      });
      describe("WHEN check MocV1 contracts balances", () => {
        it("THEN they all are in 0", async () => {
          for (const contract of [
            mocProxy,
            mocExchange,
            mocRiskProManager,
            commissionSplitterV2,
            commissionSplitterV3,
            mocConnector,
            mocInrateProxy,
            mocSettlementProxy,
            mocStateProxy,
            mocVendors,
          ]) {
            assertPrec(await reserveToken.balanceOf(contract.address), 0, `Reserve Token - ${contract.address}`);
            assertPrec(await stableToken.balanceOf(contract.address), 0, `Stable Token - ${contract.address}`);
            assertPrec(await riskProToken.balanceOf(contract.address), 0, `RiskPro Token - ${contract.address}`);
            if (contract.address != mocVendors.address)
              // skip MoCVendors because has Vendors Moc stakes
              assertPrec(await mocToken.balanceOf(contract.address), 0, `Moc Token - ${contract.address}`);
          }
        });
      });
      describe("WHEN holder mints 1 TC using MocV2", () => {
        before(async () => {
          holderRifProTokenBalanceBefore = await riskProToken.balanceOf(holderAddress);
          await reserveToken.connect(holderSigner).approve(mocRifV2.address, pEth(10));
          await mocRifV2.connect(holderSigner).mintTC(pEth(1), pEth(10), holderAddress, CONSTANTS.ZERO_ADDRESS, {
            value: await mocQueue.execFee(OperType.mintTC),
          });
          await helpers.mine(await mocQueue.minOperWaitingBlk());
          await mocQueue.execute(deployer);
        });
        it("THEN holder riskProToken increases by 1", async () => {
          assertPrec((await riskProToken.balanceOf(holderAddress)).sub(holderRifProTokenBalanceBefore), 1);
        });
        it("THEN feesSplitter ReserveToken increases by 0.00117 (0.2% of pTCac - 25% for feeRetainer)", async () => {
          // await mocRifV2.getPTCac() = 0.783413065958603130
          assertPrec(await reserveToken.balanceOf(feesSplitter.address), "0.001175119598937905");
        });
        describe("AND feesSplitter split is executed", () => {
          before(async () => {
            await feesSplitter.split();
          });
          it("THEN feesSplitter balance is 0", async () => {
            assertPrec(await reserveToken.balanceOf(feesSplitter.address), 0);
          });
        });
      });
      describe("WHEN holder mints 1 TC via vendor using MocV2", () => {
        before(async () => {
          holderRifProTokenBalanceBefore = await riskProToken.balanceOf(holderAddress);
          vendorReserveTokenBalanceBefore = await reserveToken.balanceOf(vendor);
          await reserveToken.connect(holderSigner).approve(mocRifV2.address, pEth(10));
          await helpers.mine(await mocQueue.minOperWaitingBlk());
          await mocRifV2
            .connect(holderSigner)
            .mintTC(pEth(1), pEth(10), holderAddress, vendor, { value: await mocQueue.execFee(OperType.mintTC) });
          await helpers.mine(await mocQueue.minOperWaitingBlk());
          await mocQueue.execute(deployer);
        });
        it("THEN holder riskProToken increases by 1", async () => {
          assertPrec((await riskProToken.balanceOf(holderAddress)).sub(holderRifProTokenBalanceBefore), 1);
        });
        it("THEN vendor reserve token increases by 0.0007 (0.1% of pTCac)", async () => {
          // await mocRifV2.getPTCac() = 0.783413065961040910
          assertPrec(
            (await reserveToken.balanceOf(vendor)).sub(vendorReserveTokenBalanceBefore),
            "0.000783413065961040",
          );
        });
      });
      describe("WHEN holder redeems 1 TC using MocV2", () => {
        before(async () => {
          holderRifProTokenBalanceBefore = await riskProToken.balanceOf(holderAddress);
          await riskProToken.connect(holderSigner).approve(mocRifV2.address, pEth(1));
          await mocRifV2.connect(holderSigner).redeemTC(pEth(1), 0, holderAddress, CONSTANTS.ZERO_ADDRESS, {
            value: await mocQueue.execFee(OperType.redeemTC),
          });
          await helpers.mine(await mocQueue.minOperWaitingBlk());
          await mocQueue.execute(deployer);
        });
        it("THEN holder riskProToken balance decrease by 1", async () => {
          assertPrec(holderRifProTokenBalanceBefore.sub(await riskProToken.balanceOf(holderAddress)), 1);
        });
      });
      describe("WHEN holder redeems 1 TC via vendor using MocV2", () => {
        before(async () => {
          holderRifProTokenBalanceBefore = await riskProToken.balanceOf(holderAddress);
          vendorReserveTokenBalanceBefore = await reserveToken.balanceOf(vendor);
          await riskProToken.connect(holderSigner).approve(mocRifV2.address, pEth(1));
          await mocRifV2
            .connect(holderSigner)
            .redeemTC(pEth(1), 0, holderAddress, vendor, { value: await mocQueue.execFee(OperType.redeemTC) });
          await helpers.mine(await mocQueue.minOperWaitingBlk());
          await mocQueue.execute(deployer);
        });
        it("THEN holder riskProToken balance decrease by 1", async () => {
          assertPrec(holderRifProTokenBalanceBefore.sub(await riskProToken.balanceOf(holderAddress)), 1);
        });
        it("THEN vendor reserve token increases by 0.0007 (0.1% of pTCac)", async () => {
          // await mocRifV2.getPTCac() = 0.783413065965916470
          assertPrec(
            (await reserveToken.balanceOf(vendor)).sub(vendorReserveTokenBalanceBefore),
            "0.000783413065965916",
          );
        });
      });
      describe("WHEN holder mints 1 TP using MocV2", () => {
        before(async () => {
          holderStableTokenBalanceBefore = await stableToken.balanceOf(holderAddress);
          await reserveToken.connect(holderSigner).approve(mocRifV2.address, pEth(1000));
          await mocRifV2
            .connect(holderSigner)
            .mintTP(stableToken.address, pEth(1), pEth(1000), holderAddress, CONSTANTS.ZERO_ADDRESS, {
              value: await mocQueue.execFee(OperType.mintTP),
            });
          await helpers.mine(await mocQueue.minOperWaitingBlk());
          await mocQueue.execute(deployer);
        });
        it("THEN holder stableToken balance increase by 1", async () => {
          assertPrec((await stableToken.balanceOf(holderAddress)).sub(holderStableTokenBalanceBefore), 1);
        });
      });
      describe("WHEN holder mints 1 TP via vendor using MocV2", () => {
        before(async () => {
          holderStableTokenBalanceBefore = await stableToken.balanceOf(holderAddress);
          vendorReserveTokenBalanceBefore = await reserveToken.balanceOf(vendor);
          await reserveToken.connect(holderSigner).approve(mocRifV2.address, pEth(1000));
          await mocRifV2.connect(holderSigner).mintTP(stableToken.address, pEth(1), pEth(1000), holderAddress, vendor, {
            value: await mocQueue.execFee(OperType.mintTP),
          });
          await helpers.mine(await mocQueue.minOperWaitingBlk());
          await mocQueue.execute(deployer);
        });
        it("THEN holder stableToken balance increase by 1", async () => {
          assertPrec((await stableToken.balanceOf(holderAddress)).sub(holderStableTokenBalanceBefore), 1);
        });
        it("THEN vendor reserve token increases by 0.005 (0.1% of 1/pACtp)", async () => {
          // await mocRifV2.getPACtp(stableToken.address) = 0.200000000000000000
          assertPrec(
            (await reserveToken.balanceOf(vendor)).sub(vendorReserveTokenBalanceBefore),
            "0.005000000000000000",
          );
        });
      });
      describe("WHEN holder redeems 1 TP using MocV2", () => {
        before(async () => {
          holderStableTokenBalanceBefore = await stableToken.balanceOf(holderAddress);
          await stableToken.connect(holderSigner).approve(mocRifV2.address, pEth(1));
          await mocRifV2
            .connect(holderSigner)
            .redeemTP(stableToken.address, pEth(1), 0, holderAddress, CONSTANTS.ZERO_ADDRESS, {
              value: await mocQueue.execFee(OperType.redeemTP),
            });
          await helpers.mine(await mocQueue.minOperWaitingBlk());
          await mocQueue.execute(deployer);
        });
        it("THEN alice stableToken balance decrease by 1", async () => {
          assertPrec(holderStableTokenBalanceBefore.sub(await stableToken.balanceOf(holderAddress)), 1);
        });
      });
      describe("WHEN holder redeems 1 TP via vendor using MocV2", () => {
        before(async () => {
          holderStableTokenBalanceBefore = await stableToken.balanceOf(holderAddress);
          vendorReserveTokenBalanceBefore = await reserveToken.balanceOf(vendor);
          await stableToken.connect(holderSigner).approve(mocRifV2.address, pEth(1));
          await mocRifV2.connect(holderSigner).redeemTP(stableToken.address, pEth(1), 0, holderAddress, vendor, {
            value: await mocQueue.execFee(OperType.redeemTP),
          });
          await helpers.mine(await mocQueue.minOperWaitingBlk());
          await mocQueue.execute(deployer);
        });
        it("THEN alice stableToken balance decrease by 1", async () => {
          assertPrec(holderStableTokenBalanceBefore.sub(await stableToken.balanceOf(holderAddress)), 1);
        });
        it("THEN vendor reserve token increases by 0.005 (0.1% of 1/pACtp)", async () => {
          // await mocRifV2.getPACtp(stableToken.address) = 0.200000000000000000
          assertPrec(
            (await reserveToken.balanceOf(vendor)).sub(vendorReserveTokenBalanceBefore),
            "0.005000000000000000",
          );
        });
      });
      describe("WHEN alice tries to mint 10 RiskPro in Moc V1", () => {
        it("THEN tx reverts because MoC contract is deprecated", async () => {
          await reserveToken.connect(holderSigner).approve(mocProxy.address, pEth(10));
          await expectRevertContractDeprecated(mocProxy.connect(holderSigner).mintRiskPro(pEth(10)));
        });
      });
      describe("WHEN alice tries to mint 10 RiskPro via vendor in Moc V1", () => {
        it("THEN tx reverts because MoC contract is deprecated", async () => {
          await reserveToken.connect(holderSigner).approve(mocProxy.address, pEth(10));
          await expectRevertContractDeprecated(mocProxy.connect(holderSigner).mintRiskProVendors(pEth(10), vendor));
        });
      });
      describe("WHEN alice tries to redeem 10 RiskPro in Moc V1", () => {
        it("THEN tx reverts because MoC contract is deprecated", async () => {
          await riskProToken.connect(holderSigner).approve(mocProxy.address, pEth(10));
          await expectRevertContractDeprecated(mocProxy.connect(holderSigner).redeemRiskPro(pEth(10)));
        });
      });
      describe("WHEN alice tries to redeem 10 RiskPro via vendor in Moc V1", () => {
        it("THEN tx reverts because MoC contract is deprecated", async () => {
          await riskProToken.connect(holderSigner).approve(mocProxy.address, pEth(10));
          await expectRevertContractDeprecated(mocProxy.connect(holderSigner).redeemRiskProVendors(pEth(10), vendor));
        });
      });
      describe("WHEN alice tries to mint 10 Stable tokens in Moc V1", () => {
        it("THEN tx reverts because MoC contract is deprecated", async () => {
          await reserveToken.connect(holderSigner).approve(mocProxy.address, pEth(10));
          await expectRevertContractDeprecated(mocProxy.connect(holderSigner).mintStableToken(pEth(10)));
        });
      });
      describe("WHEN alice tries to mint 10 Stable tokens via vendor in Moc V1", () => {
        it("THEN tx reverts because MoC contract is deprecated", async () => {
          await reserveToken.connect(holderSigner).approve(mocProxy.address, pEth(10));
          await expectRevertContractDeprecated(mocProxy.connect(holderSigner).mintStableTokenVendors(pEth(10), vendor));
        });
      });
      describe("WHEN alice tries to redeem 10 Stable tokens in Moc V1", () => {
        it("THEN tx reverts because MoC contract is deprecated", async () => {
          await stableToken.connect(holderSigner).approve(mocProxy.address, pEth(10));
          await expectRevertContractDeprecated(mocProxy.connect(holderSigner).redeemFreeStableToken(pEth(10)));
        });
      });
      describe("WHEN alice tries to redeem 10 Stable tokens via vendor in Moc V1", () => {
        it("THEN tx reverts because MoC contract is deprecated", async () => {
          await stableToken.connect(holderSigner).approve(mocProxy.address, pEth(10));
          await expectRevertContractDeprecated(
            mocProxy.connect(holderSigner).redeemFreeStableTokenVendors(pEth(10), vendor),
          );
        });
      });
      describe("WHEN 10 AC are injected to Moc V1", () => {
        it("THEN tx reverts because MoC contract is deprecated", async () => {
          await reserveToken.approve(mocProxy.address, pEth(10));
          await expectRevertContractDeprecated(mocProxy.addReserves(pEth(10)));
        });
      });
      describe("AND given a Stable token V1 holder who haven't migrate their tokens yet", () => {
        let stableTokenV1HolderSigner: SignerWithAddress;
        const stableTokenV1Holder = "0x17D96F1f093Ea12f596881e8167B415c1b1005b1";
        const stableTokenV1 = StableToken__factory.connect("0x2d919F19D4892381D58edeBeca66D5642Cef1a1f", signer);
        let stableTokenV1BalanceBefore: Balance;
        let stableTokenV2BalanceBefore: Balance;
        before(async () => {
          await helpers.impersonateAccount(stableTokenV1Holder);
          stableTokenV1HolderSigner = await ethers.getSigner(stableTokenV1Holder);

          await helpers.setBalance(stableTokenV1Holder, pEth(10000000));
          stableTokenV1BalanceBefore = await stableTokenV1
            .connect(stableTokenV1HolderSigner)
            .balanceOf(stableTokenV1Holder);
          stableTokenV2BalanceBefore = await stableToken
            .connect(stableTokenV1HolderSigner)
            .balanceOf(stableTokenV1Holder);

          // assert initial condition
          expect(stableTokenV1BalanceBefore).to.be.greaterThan(0);
          assertPrec(stableTokenV2BalanceBefore, 0);
        });
        describe("WHEN he tries to redeem them in Moc V2", () => {
          before(async () => {
            await stableTokenV1
              .connect(stableTokenV1HolderSigner)
              .approve(mocRifV2.address, stableTokenV1BalanceBefore);
            await mocRifV2
              .connect(stableTokenV1HolderSigner)
              .redeemTP(
                stableTokenV1.address,
                stableTokenV1BalanceBefore,
                0,
                stableTokenV1Holder,
                CONSTANTS.ZERO_ADDRESS,
                { value: await mocQueue.execFee(OperType.redeemTP) },
              );
            await helpers.mine(await mocQueue.minOperWaitingBlk());
            await mocQueue.execute(deployer);
          });
          it("THEN balances didn't change because operation was rejected", async () => {
            const stableTokenV1BalanceAfter = await stableTokenV1
              .connect(stableTokenV1HolderSigner)
              .balanceOf(stableTokenV1Holder);
            const stableTokenV2BalanceAfter = await stableToken
              .connect(stableTokenV1HolderSigner)
              .balanceOf(stableTokenV1Holder);
            assertPrec(stableTokenV1BalanceBefore, stableTokenV1BalanceAfter);
            assertPrec(stableTokenV2BalanceBefore, stableTokenV2BalanceAfter);
          });
          describe("AND he migrates them", () => {
            before(async () => {
              const tokenMigratorAddress = "0x4AC78A51F67bDBC9FcB813d041914B2de37E87D7";
              await stableTokenV1
                .connect(stableTokenV1HolderSigner)
                .approve(tokenMigratorAddress, stableTokenV1BalanceBefore);
              await TokenMigrator__factory.connect(tokenMigratorAddress, signer)
                .connect(stableTokenV1HolderSigner)
                .migrateToken();
            });
            describe("WHEN he redeems them in Moc V2", () => {
              before(async () => {
                await stableToken
                  .connect(stableTokenV1HolderSigner)
                  .approve(mocRifV2.address, stableTokenV1BalanceBefore);
                await helpers.mine(await mocQueue.minOperWaitingBlk());
                await mocRifV2
                  .connect(stableTokenV1HolderSigner)
                  .redeemTP(
                    stableToken.address,
                    stableTokenV1BalanceBefore,
                    0,
                    stableTokenV1Holder,
                    CONSTANTS.ZERO_ADDRESS,
                    { value: await mocQueue.execFee(OperType.redeemTP) },
                  );
                await mocQueue.execute(deployer);
              });
              it("THEN both stable tokens balance are 0 because operation succeeds", async () => {
                const stableTokenV1BalanceAfter = await stableTokenV1
                  .connect(stableTokenV1HolderSigner)
                  .balanceOf(stableTokenV1Holder);
                const stableTokenV2BalanceAfter = await stableToken
                  .connect(stableTokenV1HolderSigner)
                  .balanceOf(stableTokenV1Holder);
                assertPrec(0, stableTokenV1BalanceAfter);
                assertPrec(0, stableTokenV2BalanceAfter);
              });
            });
          });
        });
      });
    });
  });
});
