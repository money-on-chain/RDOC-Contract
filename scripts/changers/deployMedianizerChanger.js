const { deployContract, getConfig } = require('./changerHelper');
const changerAbi = require('../../build/contracts/MedianizerChanger.json');

const input = {
  network: 'rskTestnet'
};

const execute = async () => {
  const config = getConfig(input.network);
  deployContract(changerAbi, input.network, [config.mocState, config.oracle]);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
