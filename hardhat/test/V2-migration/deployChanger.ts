import { Address } from "hardhat-deploy/types";
import {
  MoCExchange_Migrator,
  MoCExchange__factory,
  MoC_Migrator,
  MoC__factory,
  V2MigrationChanger,
  V2MigrationChanger__factory,
  Deprecated,
  Deprecated__factory,
} from "../../typechain";
import { deployContract } from "../helpers/utils";

export const deployChanger = async (
  mocHelperAddress: Address,
  upgradeDelegator: Address,
  mocV2: Address,
  mocProxy: Address,
): Promise<{
  changer: V2MigrationChanger;
  mocMigrator: MoC_Migrator;
  mocExchangeMigrator: MoCExchange_Migrator;
  deprecated: Deprecated;
}> => {
  // deploy MoC Migrator
  const mocMigrator: MoC_Migrator = await deployContract("MoC_Migrator", MoC__factory, []);
  // deploy MoCExchange Migrator
  const mocExchangeMigrator: MoCExchange_Migrator = await deployContract(
    "MoCExchange_Migrator",
    MoCExchange__factory,
    [],
    {
      libraries: { MoCHelperLib: mocHelperAddress },
    },
  );
  // deploy Deprecated
  const deprecated: Deprecated = await deployContract("Deprecated", Deprecated__factory, []);
  const changer: V2MigrationChanger = await deployContract("V2MigrationChanger", V2MigrationChanger__factory, [
    upgradeDelegator,
    mocV2,
    mocProxy,
    mocMigrator.address,
    mocExchangeMigrator.address,
    deprecated.address,
  ]);
  return {
    changer,
    mocMigrator,
    mocExchangeMigrator,
    deprecated,
  };
};
