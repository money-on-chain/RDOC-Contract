import { ethers, getNamedAccounts } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Address } from "hardhat-deploy/types";
import { StableTokenV2, StableTokenV2__factory } from "../../typechain";
import { deployUUPSProxy, BURNER_ROLE, DEFAULT_ADMIN_ROLE, MINTER_ROLE } from "../helpers/utils";

describe("Feature: Moc Tokens Role Access restrictions", () => {
  let stableTokenV2: StableTokenV2;
  let deployer: Address, alice: Address, roleAdmin: Address;
  let aliceSigner: SignerWithAddress;
  let roleAdminSigner: SignerWithAddress;
  describe("GIVEN there is a StableTokenV2", () => {
    before(async () => {
      ({ alice, deployer, otherUser: roleAdmin } = await getNamedAccounts());
      const fakeGovernor = deployer; // Governor is not relevant for this tests
      stableTokenV2 = await deployUUPSProxy("StableTokenV2", StableTokenV2__factory);
      await stableTokenV2.initialize("USR", "USR", roleAdmin, fakeGovernor);
      aliceSigner = await ethers.getSigner(alice);
      roleAdminSigner = await ethers.getSigner(roleAdmin);
    });
    describe("WHEN a BURNER Role address invokes mint", () => {
      it("THEN it fails with the corresponding error", async () => {
        await stableTokenV2.connect(roleAdminSigner).revokeRole(MINTER_ROLE, alice);
        await stableTokenV2.connect(roleAdminSigner).grantRole(BURNER_ROLE, alice);
        await expect(stableTokenV2.connect(aliceSigner).mint(alice, 10)).to.be.revertedWith(
          `AccessControl: account ${alice.toLowerCase()} is missing role ${MINTER_ROLE}`,
        );
      });
    });
    describe("WHEN a MINTER Role address invokes burn", () => {
      it("THEN it fails with the corresponding error", async () => {
        await stableTokenV2.connect(roleAdminSigner).revokeRole(BURNER_ROLE, alice);
        await stableTokenV2.connect(roleAdminSigner).grantRole(MINTER_ROLE, alice);
        await expect(stableTokenV2.connect(aliceSigner).burn(alice, 10)).to.be.revertedWith(
          `AccessControl: account ${aliceSigner.address.toLowerCase()} is missing role ${BURNER_ROLE}`,
        );
      });
    });
    describe("WHEN deployer address invokes grantRole", () => {
      it("THEN it fails as it is not the roleAdmin", async () => {
        await expect(stableTokenV2.grantRole(MINTER_ROLE, deployer)).to.be.revertedWith(
          `AccessControl: account ${deployer.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`,
        );
      });
    });
  });
});
