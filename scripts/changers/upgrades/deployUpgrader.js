const UpgraderTemplate = require('../../../build/contracts/UpgraderTemplate');
const { deployContract, getConfig } = require('../changerHelper');

const input = {
  network: 'rskTestnet',
  newImplementation: '0xe1d86BF929ef54c1b6baA199F51E13CEF1AC5dCB',
  proxy: '0x448edbB40cdad8e891A2175fa87b4Eb0c9b383A0'
};

const execute = async () => {
  const config = getConfig(input.network);
  deployContract(UpgraderTemplate, input.network, [
    input.proxy,
    config.upgradeDelegator,
    input.newImplementation
  ]);
};
execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
