const makeUtils = require('./utils');
const allConfigs = require('./configs/config');

module.exports = async (deployer, currentNetwork, [owner]) => {
  const { deployReserveToken } = await makeUtils(
    artifacts,
    currentNetwork,
    allConfigs[currentNetwork],
    owner,
    deployer
  );
  return deployer.then(async () => deployReserveToken());
};
