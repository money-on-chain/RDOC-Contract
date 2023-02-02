import { Address } from "hardhat-deploy/dist/types";
import { ethers, getNamedAccounts } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  MoC,
  MoCExchangeOld,
  ReserveToken,
  StableToken,
  StableTokenMigrationChanger,
  StableTokenMigrationChanger__factory,
  StableTokenV2,
  TokenMigrator,
  UpgradeDelegator,
} from "../typechain";
import { fixtureDeployed } from "./fixture";
import { deployContract, pEth } from "./helpers/utils";
import { assertPrec } from "./helpers/assertHelper";

describe("Feature: Stable Token migration", () => {
  let mocMoc: MoC;
  let reserveToken: ReserveToken;
  let stableToken: StableToken;
  let stableTokenV2: StableTokenV2;
  let tokenMigrator: TokenMigrator;
  let mocExchangeOld: MoCExchangeOld;
  let upgradeDelegator: UpgradeDelegator;
  let mocHelperAddress: Address;
  let alice: Address;
  let aliceSigner: SignerWithAddress;
  describe("GIVEN a Moc protocol deployed with collateral", () => {
    beforeEach(async () => {
      ({ alice } = await getNamedAccounts());
      ({
        mocHelperAddress,
        mocMoc,
        mocExchangeOld,
        upgradeDelegator,
        reserveToken,
        stableToken,
        stableTokenV2,
        tokenMigrator,
      } = await fixtureDeployed()());
      aliceSigner = await ethers.getSigner(alice);
      await reserveToken.approve(mocMoc.address, pEth(100000));
      await mocMoc.mintRiskPro(pEth(100000));
    });
    describe("AND alice has 100 stable tokens", async () => {
      beforeEach(async () => {
        await reserveToken.connect(aliceSigner).approve(mocMoc.address, pEth(100));
        await mocMoc.connect(aliceSigner).mintStableToken(pEth(100));
        // TODO: why i sent 100 and receive 1000000?
        assertPrec(await stableToken.balanceOf(alice), pEth(1000000));
      });
      describe("AND mocExchangeV2 and StableTokenMigrationChanger are deployed", async () => {
        let changer: StableTokenMigrationChanger;
        beforeEach(async () => {
          const MocImplementationFactory = await ethers.getContractFactory("MoCExchange", {
            libraries: { MoCHelperLib: mocHelperAddress },
          });
          const mocEchangeV2 = await MocImplementationFactory.deploy();
          changer = await deployContract("StableTokenMigrationChanger", StableTokenMigrationChanger__factory, [
            mocExchangeOld.address,
            upgradeDelegator.address,
            mocEchangeV2.address,
            stableTokenV2.address,
            tokenMigrator.address,
          ]);
        });
        describe("WHEN changer is executed", () => {
          beforeEach(async () => {
            await changer.execute();
          });
          it("WHEN alice tries to redeem StableTokenV1 before migrate them", async () => {
            await mocMoc.redeemFreeStableToken(pEth(100));
            assertPrec(await stableToken.balanceOf(alice), pEth(1000000));
          });
        });
      });
    });
  });
});
