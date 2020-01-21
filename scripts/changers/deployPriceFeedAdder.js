const PriceFeederAdderAbi = require('../../build/contracts/PriceFeederAdder.json');
const { deployContract, getConfig } = require('./changerHelper');

const input = {
  network: 'rskTestnet',
  priceFeedOwner: '0x9FDCC75361c7E3B56A656e1a10D6a4446963b26e'
};

const execute = async () => {
  const config = getConfig(input.network);
  return deployContract(PriceFeederAdderAbi, input.network, [
    config.priceFactory,
    config.medianizer,
    input.priceFeedOwner
  ]);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
