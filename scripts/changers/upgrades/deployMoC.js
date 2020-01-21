const MoC = require('../../../build/contracts/MoC.json');
const { deployContract, linkLibrary } = require('../changerHelper');

const input = {
  network: 'rskTestnet',
  linkedLibrary: '64549ad5092b0f580B5669C04Fc15C87270cBb64' // Must be without 0x
};

const execute = async () => {
  linkLibrary(MoC, 'MoCHelperLib', input.linkedLibrary);
  console.log(MoC.bytecode);
  deployContract(MoC, input.network, []);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
