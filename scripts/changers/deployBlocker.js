const moment = require('moment');

const { deployContract, getConfig } = require('./changerHelper');
const changerAbi = require('../../build/contracts/Blocker.json');

const input = {
  network: 'rskTestnet',
  secondsToUnblockIn: 60
};

const execute = async () => {
  const config = getConfig(input.network);
  deployContract(changerAbi, input.network, [
    config.governor,
    moment()
      .add(input.secondsToUnblockIn, 'seconds')
      .unix()
  ]);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
