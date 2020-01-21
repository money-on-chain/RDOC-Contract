const { getWeb3, getConfig } = require('./changerHelper');
const Stopper = require('../../build/contracts/Stopper.json');

const input = {
  network: 'rskTestnet',
  contractToBeUnpaused: '0x6C9499e991BC598219C29D16Ab0f7137759F0b09'
};

const execute = async () => {
  const web3 = getWeb3(input.network);
  const config = getConfig(input.network);
  const [owner] = await web3.eth.getAccounts();
  const stopperContract = await new web3.eth.Contract(Stopper.abi, config.stopper);
  console.log(
    `UNPausing ${input.contractToBeUnpaused} from ${stopperContract.address} using ${owner}`
  );
  return stopperContract.methods
    .unpause(input.contractToBeUnpaused)
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
