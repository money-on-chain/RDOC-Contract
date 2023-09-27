import { Address } from "hardhat-deploy/types";
import {
  MoC_v0116_2__factory,
  MoC_v0116_2,
  MoCConnector_v0116_2__factory,
  StableTokenMigrationChanger,
  StableTokenMigrationChanger__factory,
  MoCConnector_v0116_2,
  MoCExchange_v0116_2,
  MoCExchange_v0116_2__factory,
  MoCState_v0116_2,
  MoCState_v0116_2__factory,
  MoCSettlement_v0116_2,
  MoCSettlement_v0116_2__factory,
} from "../../typechain";
import { deployContract } from "../helpers/utils";

export const deployChanger = async (
  upgradeDelegator: Address,
  mocHelper: Address,
  mocProxy: Address,
  stableTokenV2: Address,
  tokenMigrator: Address,
): Promise<{
  changer: StableTokenMigrationChanger;
}> => {
  // deploy MoC
  const moc_v0116_2: MoC_v0116_2 = await deployContract("MoC_v0116_2", MoC_v0116_2__factory, []);
  // deploy MoCConnector
  const mocConnector_v0116_2: MoCConnector_v0116_2 = await deployContract(
    "MoCConnector_v0116_2",
    MoCConnector_v0116_2__factory,
    [],
  );
  // deploy MoCExchange
  const mocExchange_v0116_2: MoCExchange_v0116_2 = await deployContract(
    "MoCExchange_v0116_2",
    MoCExchange_v0116_2__factory,
    [],
    {
      libraries: { MoCHelperLib: mocHelper },
    },
  );
  // deploy MoCState
  const mocState_v0116_2: MoCState_v0116_2 = await deployContract("MoCState_v0116_2", MoCState_v0116_2__factory, [], {
    libraries: { MoCHelperLib: mocHelper },
  });
  // deploy MoCSettlement
  const mocSettlement_v0116_2: MoCSettlement_v0116_2 = await deployContract(
    "MoCSettlement_v0116_2",
    MoCSettlement_v0116_2__factory,
    [],
  );

  const changer: StableTokenMigrationChanger = await deployContract(
    "StableTokenMigrationChanger",
    StableTokenMigrationChanger__factory,
    [
      upgradeDelegator,
      stableTokenV2,
      tokenMigrator,
      mocProxy,
      moc_v0116_2.address,
      mocConnector_v0116_2.address,
      mocExchange_v0116_2.address,
      mocState_v0116_2.address,
      mocSettlement_v0116_2.address,
    ],
  );
  return {
    changer,
  };
};
