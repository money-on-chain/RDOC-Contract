/* eslint-disable no-console */
const MoCStateMock = artifacts.require('./mocks/MoCStateMock.sol');
const MoCSettlementMock = artifacts.require('./mocks/MoCSettlementMock.sol');
const StableToken = artifacts.require('./token/StableToken.sol');
const RiskProToken = artifacts.require('./token/RiskProToken.sol');
const MoCLib = artifacts.require('./MoCHelperLib.sol');
const makeUtils = require('./utils');
const allConfigs = require('./configs/config');

module.exports = async (deployer, currentNetwork, [owner]) => {
  const {
    linkMocLib,
    deployUpgradable,
    deployMocLibMock,
    deployOracleMock,
    deployGovernorContract,
    deployProxyAdminContract,
    deployStopperContract,
    deployUpgradeDelegatorContract,
    deployMoCOracleMock,
    deployMoCHelperLibHarness
  } = await makeUtils(artifacts, currentNetwork, allConfigs[currentNetwork], owner, deployer);
  // Workaround to get the link working on tests
  if (currentNetwork === 'development' || currentNetwork === 'coverage') {
    return deployer.then(async () => {
      console.log('Deploying Dev only 1');
      await Promise.all([
        deployMocLibMock(),
        deployOracleMock(),
        deployGovernorContract(),
        deployMoCOracleMock()
      ]);
      console.log('Deploying Dev only Proxy Admin');
      await deployProxyAdminContract();
      console.log('Deploying Dev only Stopper and delegator');
      await Promise.all([deployStopperContract(), deployUpgradeDelegatorContract()]);
      console.log('Deploying Dev only MoCStateMock');
      await linkMocLib(MoCStateMock);
      console.log('Deploying Dev only Tokens');
      await Promise.all([deployer.deploy(StableToken), deployer.deploy(RiskProToken)]);
      console.log('Deploying Dev only MoCLib');
      deployer.deploy(MoCLib);
      console.log('Deploying Dev only MoCHelperLibHarness');
      await deployMoCHelperLibHarness();

      console.log('Deploying Dev only deployUpgradable');
      // eslint-disable-next-line promise/always-return
      for (let index = 1; index <= 9; index++) {
        // eslint-disable-next-line no-await-in-loop
        await deployUpgradable(MoCSettlementMock, MoCStateMock, index);
      }
    });
  }
};
