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
  GovernorMock__factory,
  MoCToken__factory,
  MoCToken,
  RiskProToken__factory,
  RiskProToken,
  CommissionSplitter__factory,
  CommissionSplitter,
  MoCInrate,
  MoCInrate__factory,
  TokenMigrator__factory,
  FCMaxAbsoluteOpProvider,
  FCMaxOpDifferenceProvider,
  StopperV2,
  StopperV2__factory,
  MocVendors,
} from "../../typechain";
import { Balance, deployContract, deployMocRifV2, pEth, CONSTANTS } from "../helpers/utils";
import { assertPrec } from "../helpers/assertHelper";
import { deployChanger } from "./deployChanger";

const helpers = require("@nomicfoundation/hardhat-network-helpers");
const mocMainnetAddresses = require("../../../scripts/deploy/upgrade_v0.1.12/deployConfig-rdocMainnet.json");

describe("Feature: MoC V2 migration - mainnet fork", () => {
  let mocProxy: MoC;
  let mocStateProxy: MoCState;
  let mocSettlementProxy: MoCSettlement;
  let mocCommissionSplitter: CommissionSplitter;
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
  let governorOwnerSigner: SignerWithAddress;
  let holderSigner: SignerWithAddress;
  let multisig: SignerWithAddress;
  let signer: any;
  let holderStableTokenBalanceBefore: Balance;
  let holderRifProTokenBalanceBefore: Balance;
  let vendorReserveTokenBalanceBefore: Balance;
  const governorOwnerAddress = "0x65a5681bE95d212F0c90eAd40170D8277de81169";
  const holderAddress = "0xFD5c1C3d086a9CC0f21beaB6ddE3900C9351FC59";
  const vendor = "0xd249E2275A6ed216432f167c3393f6F72e09eF49";
  const expectRevertContractDeprecated = (it: any) =>
    expect(it).to.be.revertedWith("contract deprecated. Protocol migrated to V2");

  describe("GIVEN the MocRif protocol deployed in mainnet", () => {
    before(async () => {
      await helpers.reset("https://public-node.rsk.co", 5731100);
      ({ deployer } = await getNamedAccounts());
      signer = ethers.provider.getSigner();
      mocProxy = MoC__factory.connect(mocMainnetAddresses.proxyAddresses.MoC, signer);
      mocStateProxy = MoCState__factory.connect(mocMainnetAddresses.proxyAddresses.MoCState, signer);
      mocSettlementProxy = MoCSettlement__factory.connect(mocMainnetAddresses.proxyAddresses.MoCSettlement, signer);
      mocCommissionSplitter = CommissionSplitter__factory.connect(
        mocMainnetAddresses.proxyAddresses.CommissionSplitter,
        signer,
      );
      mocInrateProxy = MoCInrate__factory.connect(mocMainnetAddresses.proxyAddresses.MoCInrate, signer);
      reserveToken = ReserveToken__factory.connect(mocMainnetAddresses.implementationAddresses.MocReserve, signer);
      mocToken = MoCToken__factory.connect(mocMainnetAddresses.implementationAddresses.MoCToken, signer);
      governor = Governor__factory.connect("0x3b8853DF65AfBd94853E6D77ee0Ab5590F41bB08", signer);
      stopper = StopperV2__factory.connect("0x51072aC8Fe05Fcfdc14e02Bb3a0C7499Ad9eF140", signer);
      stableToken = StableToken__factory.connect("0x3A15461d8aE0F0Fb5Fa2629e9DA7D66A794a6e37", signer);
      riskProToken = RiskProToken__factory.connect("0xf4d27c56595Ed59B66cC7F03CFF5193e4bd74a61", signer);
      // deploy MocV2
      let mocCoreExpansion: MocCoreExpansion;
      let maxAbsoluteOpProvider: FCMaxAbsoluteOpProvider;
      let maxOpDiffProvider: FCMaxOpDifferenceProvider;
      let mocVendorsV2: MocVendors;
      ({ mocRifV2, mocCoreExpansion, mocQueue, mocVendorsV2, maxAbsoluteOpProvider, maxOpDiffProvider } =
        await deployMocRifV2(stopper.address));
      const governorMock = await deployContract("GovernorMock", GovernorMock__factory, []);

      await mocRifV2.initialize({
        initializeCoreParams: {
          initializeBaseBucketParams: {
            feeTokenAddress: mocToken.address,
            feeTokenPriceProviderAddress: mocMainnetAddresses.implementationAddresses.MoCPriceProvider,
            tcTokenAddress: riskProToken.address,
            mocFeeFlowAddress: deployer,
            mocAppreciationBeneficiaryAddress: deployer,
            protThrld: await mocStateProxy.getProtected(),
            liqThrld: await mocStateProxy.getLiq(),
            feeRetainer: 0,
            tcMintFee: pEth(0.1), // 10%
            tcRedeemFee: pEth(0.1), // 10%
            swapTPforTPFee: pEth(0.1), // 10%
            swapTPforTCFee: pEth(0.1), // 10%
            swapTCforTPFee: pEth(0.1), // 10%
            redeemTCandTPFee: pEth(0.1), // 10%
            mintTCandTPFee: pEth(0.1), // 10%
            feeTokenPct: pEth(0.1), // 10%
            successFee: pEth(0.1), // 10%
            appreciationFactor: 0,
            bes: await mocSettlementProxy.getBlockSpan(),
            tcInterestCollectorAddress: await mocInrateProxy.getRiskProInterestAddress(),
            tcInterestRate: await mocInrateProxy.getRiskProRate(),
            tcInterestPaymentBlockSpan: await mocInrateProxy.getRiskProInterestBlockSpan(),
            maxAbsoluteOpProviderAddress: maxAbsoluteOpProvider.address,
            maxOpDiffProviderAddress: maxOpDiffProvider.address,
            decayBlockSpan: 720,
          },
          governorAddress: governorMock.address,
          pauserAddress: deployer,
          mocCoreExpansion: mocCoreExpansion.address,
          emaCalculationBlockSpan: await mocStateProxy.getEmaCalculationBlockSpan(),
          mocVendors: mocVendorsV2.address,
        },
        acTokenAddress: reserveToken.address!,
        mocQueue: mocQueue.address,
      });

      await mocVendorsV2.initialize(deployer, governorMock.address, deployer);
      // set 10% markup to vendor
      await mocVendorsV2.setVendorMarkup(vendor, pEth(0.1));

      // pause MocRifV2
      await mocRifV2.pause();

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
      await mocQueue.initialize(governorMock.address, deployer, minOperWaitingBlck, maxOperPerBlock, execFeeParams);

      // add Legacy stableToken in MocV2
      await mocRifV2.addPeggedToken({
        tpTokenAddress: stableToken.address,
        priceProviderAddress: await mocStateProxy.getPriceProvider(),
        tpCtarg: await mocStateProxy.cobj(),
        tpMintFee: pEth(0.1), // 10%,
        tpRedeemFee: pEth(0.1), // 10%,
        tpEma: await mocStateProxy.getExponentalMovingAverage(),
        tpEmaSf: await mocStateProxy.getSmoothingFactor(),
      });
      await mocRifV2.changeGovernor(governor.address);

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
      let tpEmaBefore: BigNumber;
      let nextEmaCalculationBefore: BigNumber;
      let nextTCInterestPaymentBefore: BigNumber;
      before(async () => {
        // we clean interests and commission to use all the collateral to calc metrics before the upgrade
        await helpers.mine(await mocSettlementProxy.nextSettlementBlock());
        await mocProxy.dailyInratePayment();
        await mocProxy.runSettlement(100);
        await mocCommissionSplitter.split();
        coverageBefore = await mocStateProxy.globalCoverage();
        riskProTokenPriceBefore = await mocStateProxy.riskProTecPrice();
        riskProAvailableBefore = await mocStateProxy.absoluteMaxRiskPro();
        tpEmaBefore = await mocStateProxy.getExponentalMovingAverage();
        stableTokenAvailableBefore = await mocStateProxy.absoluteMaxStableToken();
        nextEmaCalculationBefore = (await mocStateProxy.lastEmaCalculation()).add(
          await mocStateProxy.emaCalculationBlockSpan(),
        );
        nextTCInterestPaymentBefore = (await mocInrateProxy.lastRiskProInterestBlock()).add(
          await mocInrateProxy.riskProInterestBlockSpan(),
        );
        const { changer } = await deployChanger(
          mocMainnetAddresses.implementationAddresses.MoCHelperLib,
          mocMainnetAddresses.implementationAddresses.UpgradeDelegator,
          mocCommissionSplitter.address,
          mocRifV2.address,
          mocProxy.address,
          [deployer],
        );
        await governor.connect(governorOwnerSigner).executeChange(changer.address);
      });
      // MocV1 had 4205 Reserve Tokens locked in the contract that were not used as collateral, so after
      // migrating to MocV2 metrics are a little bigger
      // ReserveTokensLocked = (await reserveToken.balanceOf(mocProxy.address)).sub(await mocStateProxy.reserves())
      describe("WHEN check coverage", () => {
        it("THEN MocV2 coverage is 0.0002 bigger because MocV1 had 4205 Reserve Tokens locked in the contract", async () => {
          assertPrec((await mocRifV2.getCglb()).sub(coverageBefore), "0.000268414769016002");
        });
      });
      describe("WHEN check riskProToken price", () => {
        it("THEN MocV2 price is 0.00002 bigger because MocV1 had 4205 Reserve Tokens locked in the contract", async () => {
          assertPrec((await mocRifV2.getPTCac()).sub(riskProTokenPriceBefore), "0.000022853806639427");
        });
      });
      describe("WHEN check riskProToken available to redeem", () => {
        it("THEN MocV2 riskProToken available are 2897 more because MocV1 had 4205 Reserve Tokens locked in the contract", async () => {
          assertPrec((await mocRifV2.getTCAvailableToRedeem()).sub(riskProAvailableBefore), "2897.087966209834439678");
        });
      });
      describe("WHEN check StableToken available to mint", () => {
        it("THEN MocV2 StableToken available are 64 more because MocV1 had 4205 Reserve Tokens locked in the contract", async () => {
          assertPrec(
            (await mocRifV2.getTPAvailableToMint(stableToken.address)).sub(stableTokenAvailableBefore),
            "64.944497974448767349",
          );
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
      describe("WHEN check next TC interest payment block", () => {
        it("THEN MocV1 and MocV2 have the same", async () => {
          assertPrec(nextTCInterestPaymentBefore, await mocRifV2.nextTCInterestPayment());
        });
      });
      describe("WHEN check MocV1 contracts balances", () => {
        it("THEN they all are in 0", async () => {
          for (const key in mocMainnetAddresses.proxyAddresses) {
            assertPrec(
              await reserveToken.balanceOf(mocMainnetAddresses.proxyAddresses[key]),
              0,
              `Reserve Token - ${key}`,
            );
            assertPrec(
              await stableToken.balanceOf(mocMainnetAddresses.proxyAddresses[key]),
              0,
              `Stable Token - ${key}`,
            );
            assertPrec(
              await riskProToken.balanceOf(mocMainnetAddresses.proxyAddresses[key]),
              0,
              `RiskPro Token - ${key}`,
            );
            if (key != "MoCVendors")
              // skip MoCVendors because has Vendors Moc stakes
              assertPrec(await mocToken.balanceOf(mocMainnetAddresses.proxyAddresses[key]), 0, `Moc Token - ${key}`);
          }
        });
      });
      describe("WHEN holder mints 1 TC using MocV2", () => {
        before(async () => {
          holderRifProTokenBalanceBefore = await riskProToken.balanceOf(holderAddress);
          await reserveToken.connect(holderSigner).approve(mocRifV2.address, pEth(10));
          await mocRifV2.connect(holderSigner).mintTC(pEth(1), pEth(10), { value: CONSTANTS.EXEC_FEE });
          await mocQueue.execute(deployer);
        });
        it("THEN holder riskProToken increases by 1", async () => {
          assertPrec((await riskProToken.balanceOf(holderAddress)).sub(holderRifProTokenBalanceBefore), 1);
        });
      });
      describe("WHEN holder mints 1 TC via vendor using MocV2", () => {
        before(async () => {
          holderRifProTokenBalanceBefore = await riskProToken.balanceOf(holderAddress);
          vendorReserveTokenBalanceBefore = await reserveToken.balanceOf(vendor);
          await reserveToken.connect(holderSigner).approve(mocRifV2.address, pEth(10));
          await mocRifV2
            .connect(holderSigner)
            .mintTCViaVendor(pEth(1), pEth(10), vendor, { value: CONSTANTS.EXEC_FEE });
          await mocQueue.execute(deployer);
        });
        it("THEN holder riskProToken increases by 1", async () => {
          assertPrec((await riskProToken.balanceOf(holderAddress)).sub(holderRifProTokenBalanceBefore), 1);
        });
        it("THEN vendor reserve token increases by 0.07 (10% of pTCac)", async () => {
          // await mocRifV2.getPTCac() = 0.745749854285149551
          assertPrec(
            (await reserveToken.balanceOf(vendor)).sub(vendorReserveTokenBalanceBefore),
            "0.074574985428514955",
          );
        });
      });
      describe("WHEN holder redeems 1 TC using MocV2", () => {
        before(async () => {
          holderRifProTokenBalanceBefore = await riskProToken.balanceOf(holderAddress);
          await riskProToken.connect(holderSigner).approve(mocRifV2.address, pEth(1));
          await mocRifV2.connect(holderSigner).redeemTC(pEth(1), 0, { value: CONSTANTS.EXEC_FEE });
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
          await mocRifV2.connect(holderSigner).redeemTCViaVendor(pEth(1), 0, vendor, { value: CONSTANTS.EXEC_FEE });
          await mocQueue.execute(deployer);
        });
        it("THEN holder riskProToken balance decrease by 1", async () => {
          assertPrec(holderRifProTokenBalanceBefore.sub(await riskProToken.balanceOf(holderAddress)), 1);
        });
        it("THEN vendor reserve token increases by 0.07 (10% of pTCac)", async () => {
          // await mocRifV2.getPTCac() = 0.745749854285149551
          assertPrec(
            (await reserveToken.balanceOf(vendor)).sub(vendorReserveTokenBalanceBefore),
            "0.074574985428514955",
          );
        });
      });
      describe("WHEN holder mints 1 TP using MocV2", () => {
        before(async () => {
          holderStableTokenBalanceBefore = await stableToken.balanceOf(holderAddress);
          await reserveToken.connect(holderSigner).approve(mocRifV2.address, pEth(1000));
          await mocRifV2
            .connect(holderSigner)
            .mintTP(stableToken.address, pEth(1), pEth(1000), { value: CONSTANTS.EXEC_FEE });
          await mocQueue.execute(deployer);
        });
        it("THEN holder stableToken balance increase by 1", async () => {
          assertPrec((await stableToken.balanceOf(holderAddress)).sub(holderStableTokenBalanceBefore), 1);
        });
      });
      describe("WHEN holder mints 1 TP via vendor susing MocV2", () => {
        before(async () => {
          holderStableTokenBalanceBefore = await stableToken.balanceOf(holderAddress);
          vendorReserveTokenBalanceBefore = await reserveToken.balanceOf(vendor);
          await reserveToken.connect(holderSigner).approve(mocRifV2.address, pEth(1000));
          await mocRifV2
            .connect(holderSigner)
            .mintTPViaVendor(stableToken.address, pEth(1), pEth(1000), vendor, { value: CONSTANTS.EXEC_FEE });
          await mocQueue.execute(deployer);
        });
        it("THEN holder stableToken balance increase by 1", async () => {
          assertPrec((await stableToken.balanceOf(holderAddress)).sub(holderStableTokenBalanceBefore), 1);
        });
        it("THEN vendor reserve token increases by 1.43 (10% of 1/pACtp)", async () => {
          // await mocRifV2.getPACtp(stableToken.address) = 0.069500000000000000
          assertPrec(
            (await reserveToken.balanceOf(vendor)).sub(vendorReserveTokenBalanceBefore),
            "1.438848920863309352",
          );
        });
      });
      describe("WHEN holder redeems 1 TP using MocV2", () => {
        before(async () => {
          holderStableTokenBalanceBefore = await stableToken.balanceOf(holderAddress);
          await stableToken.connect(holderSigner).approve(mocRifV2.address, pEth(1));
          await mocRifV2.connect(holderSigner).redeemTP(stableToken.address, pEth(1), 0, { value: CONSTANTS.EXEC_FEE });
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
          await mocRifV2
            .connect(holderSigner)
            .redeemTPViaVendor(stableToken.address, pEth(1), 0, vendor, { value: CONSTANTS.EXEC_FEE });
          await mocQueue.execute(deployer);
        });
        it("THEN alice stableToken balance decrease by 1", async () => {
          assertPrec(holderStableTokenBalanceBefore.sub(await stableToken.balanceOf(holderAddress)), 1);
        });
        it("THEN vendor reserve token increases by 1.43 (10% of 1/pACtp)", async () => {
          // await mocRifV2.getPACtp(stableToken.address) = 0.069500000000000000
          assertPrec(
            (await reserveToken.balanceOf(vendor)).sub(vendorReserveTokenBalanceBefore),
            "1.438848920863309352",
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
        const stableTokenV1Holder = "0xD07d569322a93a47B62D71203e21f0AFf8246099";
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
              .redeemTP(stableTokenV1.address, stableTokenV1BalanceBefore, 0, { value: CONSTANTS.EXEC_FEE });
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
                await mocRifV2
                  .connect(stableTokenV1HolderSigner)
                  .redeemTP(stableToken.address, stableTokenV1BalanceBefore, 0, { value: CONSTANTS.EXEC_FEE });
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
