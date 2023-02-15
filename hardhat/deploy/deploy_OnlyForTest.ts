import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployFunc: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  // these deployment are used only for local test to initialize contracts
  if (hre.network.tags.local) {
    const { deployments, getNamedAccounts } = hre;
    const { deployer } = await getNamedAccounts();
    const { deploy } = deployments;

    const deployProxyAdminResult = await deploy("ProxyAdmin", {
      from: deployer,
    });
    console.log(`ProxyAdmin deployed at ${deployProxyAdminResult.address}`);

    const deployGovernorMockResult = await deploy("GovernorMock", {
      from: deployer,
    });
    console.log(`GovernorMock deployed at ${deployGovernorMockResult.address}`);

    const deployHelperLibResult = await deploy("MoCHelperLib", {
      from: deployer,
    });
    console.log(`MoCHelperLib deployed at ${deployHelperLibResult.address}`);

    const deployStableTokenResult = await deploy("StableToken", {
      from: deployer,
    });
    console.log(`StableToken deployed at ${deployStableTokenResult.address}`);

    const deployMoCExchange_v020Result = await deploy("MoCExchange_v020", {
      from: deployer,
      libraries: {
        MoCHelperLib: deployHelperLibResult.address,
      },
    });
    console.log(`MoCExchange_v020 deployed at ${deployMoCExchange_v020Result.address}`);

    const deployAdminUpgradeabilityProxyResult = await deploy("MoCExchangeProxy", {
      contract: "AdminUpgradeabilityProxy",
      args: [deployMoCExchange_v020Result.address, deployProxyAdminResult.address, "0x"],
      from: deployer,
    });
    console.log(`MoCExchangeProxy deployed at ${deployAdminUpgradeabilityProxyResult.address}`);
  }
  return hre.network.live; // prevents re execution on live networks
};
export default deployFunc;

deployFunc.id = "deployed_OnlyForTest"; // id required to prevent re-execution
deployFunc.tags = ["OnlyForTest"];
