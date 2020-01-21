const MoCRiskProxManagerUpdater = require('../../../build/contracts/MoCRiskProxManagerUpdater.json');
const { deployContract, getConfig } = require('../changerHelper');

const input = {
  network: 'qaTestnet',
  newImplementation: '0xE2CD535c45878D55C7Bff15647515C0Eb24Bb14D'
};

const execute = async () => {
  const config = getConfig(input.network);
  console.log(
    `Upgrading proxy bproxmanager ${config.mocRiskProxManager} to new implementation ${input.newImplementation} with delegator ${config.upgradeDelegator} `
  );
  return deployContract(MoCRiskProxManagerUpdater, input.network, [
    config.mocRiskProxManager,
    config.upgradeDelegator,
    input.newImplementation
  ]);
};
execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
