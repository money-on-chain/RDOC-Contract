const MoCExchange = require('../../../build/contracts/MoCExchange.json');
const { deployContract, linkLibrary } = require('../changerHelper');

const input = {
  network: 'rskTestnet',
  linkedLibrary: '64549ad5092b0f580B5669C04Fc15C87270cBb64' // Must be without 0x
};

const execute = async () => {
  linkLibrary(MoCExchange, 'MoCHelperLib', input.linkedLibrary);
  deployContract(MoCExchange, input.network, []);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
