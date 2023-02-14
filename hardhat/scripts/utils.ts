import { HardhatRuntimeEnvironment } from "hardhat/types/runtime";

export const deployUUPSArtifact = async ({
  hre,
  artifactBaseName,
  contract,
}: {
  hre: HardhatRuntimeEnvironment;
  artifactBaseName?: string;
  contract: string;
}) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;
  const gasLimit = getNetworkDeployParams(hre).gasLimit;
  artifactBaseName = artifactBaseName || contract;
  const deployImplResult = await deploy(`${artifactBaseName}Impl`, {
    contract,
    from: deployer,
    gasLimit,
  });
  console.log(`${contract}, as ${artifactBaseName} implementation deployed at ${deployImplResult.address}`);

  const deployProxyResult = await deploy(`${artifactBaseName}Proxy`, {
    contract: "ERC1967Proxy",
    from: deployer,
    gasLimit,
    args: [deployImplResult.address, "0x"],
  });
  console.log(`${artifactBaseName}Proxy ERC1967Proxy deployed at ${deployProxyResult.address}`);
};

export const getNetworkDeployParams = (hre: HardhatRuntimeEnvironment) => {
  const network = hre.network.name === "localhost" ? "hardhat" : hre.network.name;
  return hre.config.networks[network].deployParameters;
};
