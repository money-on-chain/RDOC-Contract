/* eslint-disable no-console */
/* eslint-disable import/no-unresolved */
const ReserveTokenAbi = require('../../build/contracts/ReserveToken.json');
const { getWeb3 } = require('../changers/changerHelper');

const input = {
  network: 'scriptsDev',
  reserveTokenAddress: '0xAA027FD5A2d6aAfADae89f265Fe48CB2E13e6F39',
  destinationAccount: '0xd51128F302755666c42e3920d72FF2FE632856a9',
  amountToClaim: '100000000000000000000000'
};

let ReserveToken;

const claimAndTransfer = async owner => {
  console.log(`Claiming balance, owner: ${owner}} on ${input.network}`);

  return ReserveToken.methods
    .claim(input.amountToClaim)
    .send({ from: owner, gas: 1e6 })
    .on('transactionHash', hash => console.log('TxHash:', hash))
    .on('confirmation', confirmationNumber => console.log('Tx confirmation:', confirmationNumber))
    .on('receipt', async receipt => {
      console.log('Tx receipt:', receipt);
      await transfer(owner);
    })
    .on('error', console.error);
};

const transfer = async from => {
  console.log(`Transfering balance to destinationAccount: ${input.destinationAccount}`);
  return ReserveToken.methods
    .transfer(input.destinationAccount, input.amountToClaim)
    .send({ from, gas: 1e6 })
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
  ReserveToken = await new web3.eth.Contract(ReserveTokenAbi.abi, input.reserveTokenAddress);

  return claimAndTransfer(owner);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
