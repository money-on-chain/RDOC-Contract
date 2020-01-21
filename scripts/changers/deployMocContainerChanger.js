const { getWeb3, getConfig } = require('./changerHelper');
const changerAbi = require('../../build/contracts/MoCBucketContainerChanger.json');

const input = {
  network: 'uatTestnet',
  cobjc0: (6 * 10 ** 18).toString(),
  cobjx2: (6 * 10 ** 18).toString()
};

// IMPORTANT: Not intended to be used in a production like environment
// Designed to be useful in testing
const execute = async () => {
  console.log('Starting');
  const web3 = getWeb3(input.network);
  const config = getConfig(input.network);
  console.log('Asking for accounts');
  const [owner] = await web3.eth.getAccounts();
  const Changer = await new web3.eth.Contract(changerAbi.abi);
  console.log('deploying');
  return Changer.deploy({
    data: changerAbi.bytecode,
    arguments: [config.mocRiskProxManager, input.cobjc0, input.cobjx2]
  })
    .send({ from: owner })
    .on('transactionHash', hash => console.log('TxHash:', hash))
    .on('confirmation', confirmationNumber => console.log('Tx confirmation:', confirmationNumber))
    .on('receipt', receipt => console.log('Tx receipt:', receipt))
    .on('error', console.error);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
