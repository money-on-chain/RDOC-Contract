import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { getNetworkDeployParams } from "../scripts/utils";

const deployFunc: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { mocAddresses, gasLimit } = getNetworkDeployParams(hre);
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;
  const deployedStableTokenV2 = await deployments.getOrNull("StableTokenV2Proxy");
  if (!deployedStableTokenV2) throw new Error("No StableTokenV2Proxy deployed.");

  // for local test initialize with deployed contracts
  if (hre.network.tags.local) {
    const deployedStableToken = await deployments.getOrNull("StableToken");
    if (!deployedStableToken) throw new Error("No StableToken deployed.");
    mocAddresses.stableTokenV1 = deployedStableToken.address;
  }
  const deployImplResult = await deploy("TokenMigrator", {
    contract: "TokenMigrator",
    args: [mocAddresses.stableTokenV1, deployedStableTokenV2.address],
    from: deployer,
    gasLimit,
  });
  console.log(`TokenMigrator deployed at ${deployImplResult.address}`);
  return hre.network.live; // prevents re execution on live networks
};
export default deployFunc;

deployFunc.id = "deployed_TokenMigrator"; // id required to prevent re-execution
deployFunc.tags = ["TokenMigrator"];
deployFunc.dependencies = ["OnlyForTest", "StableTokenV2"];
