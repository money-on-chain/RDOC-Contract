/* eslint-disable import/no-unresolved */
const CommissionSplitter = require('../../../build/contracts/CommissionSplitter.json');
const { deployContract, getConfig } = require('../changerHelper');

/**
 * Script for deploying a CommissionSplitter contract
 */
const input = {
  network: 'qaTestnet',
  commissionAddress: '',
  mocProportion: '500000000000000000'
};

const execute = async () => {
  const config = getConfig(input.network);
  deployContract(CommissionSplitter, input.network, [
    config.moc,
    input.commissionAddress,
    input.mocProportion,
    config.governor
  ]);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
