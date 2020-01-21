/* eslint-disable import/no-unresolved */
const PriceProviderChanger = require('../../build/contracts/PriceProviderChanger.json');
const { deployContract } = require('./changerHelper');
const { getConfig } = require('../changers/changerHelper');

const input = {
  network: 'uatTestnet',
  priceProvider: '0x1bB72E2ebc03Bb5537E5C62A9825C816EdA2D955'
};

const execute = async () => {
  const { mocState } = getConfig(input.network);
  deployContract(PriceProviderChanger, input.network, [mocState, input.priceProvider]);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
