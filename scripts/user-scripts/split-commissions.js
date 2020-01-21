/* eslint-disable import/no-unresolved */
const CommissionSplitter = require('../../build/contracts/CommissionSplitter.json');
const { getWeb3 } = require('../changers/changerHelper');

const input = {
  network: 'rskTestnet',
  commissionSplitter: '0x242b39e780cec60c8d905325c147991f51463eef'
};

const gasPrice = 60000000;
let Splitter;

const split = async from => {
  console.log(`Calling split function, from: ${from} on ${input.network}`);

  return Splitter.methods
    .split()
    .send({ from, gas: 1e6, gasPrice })
    .on('transactionHash', hash => console.log('TxHash:', hash))
    .on('confirmation', confirmationNumber => console.log('Tx confirmation:', confirmationNumber))
    .on('receipt', async receipt => {
      console.log('Tx receipt:', receipt);
    })
    .on('error', console.error);
};

const execute = async () => {
  const web3 = getWeb3(input.network);
  const [owner] = await web3.eth.getAccounts();
  Splitter = await new web3.eth.Contract(CommissionSplitter.abi, input.commissionSplitter);

  return split(owner);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
