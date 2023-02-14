import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { deployUUPSArtifact, getNetworkDeployParams } from "../scripts/utils";
import { StableTokenV2, StableTokenV2__factory } from "../typechain";

const deployFunc: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments } = hre;
  const signer = ethers.provider.getSigner();
  const { stableTokenV2Params, mocAddresses, gasLimit } = getNetworkDeployParams(hre);
  await deployUUPSArtifact({ hre, contract: "StableTokenV2" });
  const deployedStableTokenV2 = await deployments.getOrNull("StableTokenV2Proxy");
  if (!deployedStableTokenV2) throw new Error("No StableTokenV2Proxy deployed.");
  const stableTokenV2: StableTokenV2 = StableTokenV2__factory.connect(deployedStableTokenV2.address, signer);

  // TODO: in local env we could deploy contracts needed for initialization and use this deploy script for testing too
  await stableTokenV2.initialize(
    stableTokenV2Params.name,
    stableTokenV2Params.symbol,
    mocAddresses.mocExchange,
    mocAddresses.governor,
    { gasLimit },
  );
  return hre.network.live; // prevents re execution on live networks
};
export default deployFunc;

deployFunc.id = "deployed_StableTokenV2"; // id required to prevent re-execution
deployFunc.tags = ["StableTokenV2"];
