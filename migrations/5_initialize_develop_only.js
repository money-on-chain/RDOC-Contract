/* eslint-disable no-console */
const MoCStateMock = artifacts.require('./mocks/MoCStateMock.sol');
const MoCSettlementMock = artifacts.require('./mocks/MoCSettlementMock.sol');

const makeUtils = require('./utils');

const allConfigs = require('./configs/config');

module.exports = async (deployer, currentNetwork, [owner]) => {
  const {
    createInstances,
    transferStableTokenRoles,
    transferRiskProRoles,
    transferRiskProPausingRole,
    initializeContracts
  } = await makeUtils(artifacts, currentNetwork, allConfigs[currentNetwork], owner, deployer);
  // Workaround to get the link working on tests
  if (currentNetwork === 'development' || currentNetwork === 'coverage') {
    return deployer.then(async () => {
      console.log('Init Dev only createInstances');
      await createInstances(MoCSettlementMock, MoCStateMock);
      console.log('Init Dev only transferStableTokenRoles');
      await transferStableTokenRoles();
      console.log('Init Dev only transferRiskProRoles');
      await transferRiskProRoles();
      console.log('Init Dev only transferRiskProPausingRole');
      await transferRiskProPausingRole();
      console.log('Init Dev only initializeContracts');
      return initializeContracts();
    });
  }
};
