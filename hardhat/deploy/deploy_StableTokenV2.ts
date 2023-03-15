import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployUUPSArtifact, getNetworkDeployParams } from "../scripts/utils";

const deployFunc: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments } = hre;
  const { stableTokenV2Params, mocAddresses } = getNetworkDeployParams(hre);
  // for local test initialize with deployed contracts
  if (hre.network.tags.local) {
    const deployedMoCExchangeProxy = await deployments.getOrNull("MoCExchangeProxy");
    if (!deployedMoCExchangeProxy) throw new Error("No MoCExchangeProxy deployed.");
    mocAddresses.mocExchange = deployedMoCExchangeProxy.address;

    const deployedGovernorMock = await deployments.getOrNull("GovernorMock");
    if (!deployedGovernorMock) throw new Error("No GovernorMock deployed.");
    mocAddresses.governor = deployedGovernorMock.address;
  }

  await deployUUPSArtifact({
    hre,
    contract: "StableTokenV2",
    initializeArgs: [
      stableTokenV2Params.name,
      stableTokenV2Params.symbol,
      mocAddresses.mocExchange,
      mocAddresses.governor,
    ],
  });

  return hre.network.live; // prevents re execution on live networks
};
export default deployFunc;

deployFunc.id = "deployed_StableTokenV2"; // id required to prevent re-execution
deployFunc.tags = ["StableTokenV2"];
deployFunc.dependencies = ["OnlyForTest"];
