import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { deployUUPSArtifact, getNetworkDeployParams, waitForTxConfirmation } from "../scripts/utils";
import { StableTokenV2, StableTokenV2__factory } from "../typechain";

const deployFunc: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments } = hre;
  const signer = ethers.provider.getSigner();
  const { stableTokenV2Params, mocAddresses, gasLimit } = getNetworkDeployParams(hre);
  await deployUUPSArtifact({ hre, contract: "StableTokenV2" });
  const deployedStableTokenV2 = await deployments.getOrNull("StableTokenV2Proxy");
  if (!deployedStableTokenV2) throw new Error("No StableTokenV2Proxy deployed.");
  const stableTokenV2: StableTokenV2 = StableTokenV2__factory.connect(deployedStableTokenV2.address, signer);

  // for local test initialize with deployed contracts
  if (hre.network.tags.local) {
    const deployedMoCExchangeProxy = await deployments.getOrNull("MoCExchangeProxy");
    if (!deployedMoCExchangeProxy) throw new Error("No MoCExchangeProxy deployed.");
    mocAddresses.mocExchange = deployedMoCExchangeProxy.address;

    const deployedGovernorMock = await deployments.getOrNull("GovernorMock");
    if (!deployedGovernorMock) throw new Error("No GovernorMock deployed.");
    mocAddresses.governor = deployedGovernorMock.address;
  }

  await waitForTxConfirmation(
    stableTokenV2.initialize(
      stableTokenV2Params.name,
      stableTokenV2Params.symbol,
      mocAddresses.mocExchange,
      mocAddresses.governor,
      { gasLimit },
    ),
  );
  return hre.network.live; // prevents re execution on live networks
};
export default deployFunc;

deployFunc.id = "deployed_StableTokenV2"; // id required to prevent re-execution
deployFunc.tags = ["StableTokenV2"];
deployFunc.dependencies = ["OnlyForTest"];
