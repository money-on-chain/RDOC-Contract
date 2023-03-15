import { HardhatRuntimeEnvironment } from "hardhat/types/runtime";
import { ContractReceipt, ContractTransaction } from "ethers";

export const waitForTxConfirmation = async (
  tx: Promise<ContractTransaction>,
  confirmations: number = 1,
): Promise<ContractReceipt> => {
  return (await tx).wait(confirmations);
};

export const deployUUPSArtifact = async ({
  hre,
  artifactBaseName,
  contract,
  initializeArgs,
}: {
  hre: HardhatRuntimeEnvironment;
  artifactBaseName?: string;
  contract: string;
  initializeArgs: string[];
}) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;
  const gasLimit = getNetworkDeployParams(hre).gasLimit;
  artifactBaseName = artifactBaseName || contract;
  const deployResult = await deploy(`${artifactBaseName}Proxy`, {
    contract,
    from: deployer,
    proxy: {
      proxyContract: "UUPS",
      execute: {
        init: {
          methodName: "initialize",
          args: initializeArgs,
        },
      },
    },
    gasLimit,
  });
  console.log(`${contract}, as ${artifactBaseName} implementation deployed at ${deployResult.implementation}`);
  console.log(`${artifactBaseName}Proxy ERC1967Proxy deployed at ${deployResult.address}`);
};

export const getNetworkDeployParams = (hre: HardhatRuntimeEnvironment) => {
  const network = hre.network.name === "localhost" ? "hardhat" : hre.network.name;
  return hre.config.networks[network].deployParameters;
};
