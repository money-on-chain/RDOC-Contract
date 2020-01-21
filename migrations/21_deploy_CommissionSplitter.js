const makeUtils = require('./utils');
const allConfigs = require('./configs/config');

const MoCSettlement = artifacts.require('./MoCSettlement.sol');
const MoCState = artifacts.require('./MoCState.sol');

module.exports = async (deployer, currentNetwork, [owner]) => {
  const { createInstances, deployCommissionSplitter } = await makeUtils(
    artifacts,
    currentNetwork,
    allConfigs[currentNetwork],
    owner,
    deployer
  );

  return deployer.then(async () => {
    await createInstances(MoCSettlement, MoCState);
    return deployCommissionSplitter();
  });
};
