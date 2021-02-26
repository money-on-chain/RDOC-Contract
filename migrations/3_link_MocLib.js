const utils = require('./utils');

const MoCState = artifacts.require('./MoCState.sol');
const allConfigs = require('./configs/config');

module.exports = async (deployer, currentNetwork, [owner]) => {
  const { linkMocLib } = await utils.makeUtils(
    artifacts,
    currentNetwork,
    allConfigs[currentNetwork],
    owner,
    deployer
  );
  return deployer.then(async () => linkMocLib(MoCState));
};
