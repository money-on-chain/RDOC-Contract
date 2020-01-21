const { deployContract, getConfig } = require('./changerHelper');
const changerAbi = require('../../build/contracts/MakeStoppable.json');

const input = {
  network: 'rskTestnet',
  contractToPause: '0x1741b241EDc88e34DC0a1Dd089f32DcA0ef47B9a'
};

const execute = async () => {
  deployContract(changerAbi, input.network, [input.contractToPause]);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
