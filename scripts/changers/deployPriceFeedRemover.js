const PriceFeederRemoverAbi = require('../../build/contracts/PriceFeederRemover.json');
const { deployContract, getConfig } = require('./changerHelper');

const input = {
  network: 'rskTestnet',
  priceFeedToRemove: '0x4907a2de73eee679ebff72d52ada8cfb4183c4e4'
};

const execute = async () => {
  const config = getConfig(input.network);
  return deployContract(PriceFeederRemoverAbi, input.network, [
    config.medianizer,
    input.priceFeedToRemove
  ]);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
