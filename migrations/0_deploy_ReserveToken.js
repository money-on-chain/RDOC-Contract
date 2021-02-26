const utils = require('./utils');
const allConfigs = require('./configs/config');

module.exports = async (deployer, currentNetwork, [owner]) => {
  const { deployReserveToken } = await utils.makeUtils(
    artifacts,
    currentNetwork,
    allConfigs[currentNetwork],
    owner,
    deployer
  );
  return deployer.then(async () => deployReserveToken());
};
