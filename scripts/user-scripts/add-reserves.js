/* eslint-disable import/no-unresolved */
/* eslint-disable no-console */
const ERC20 = require('../../build/contracts/ERC20.json');
const MoC = require('../../build/contracts/MoC.json');
const { getWeb3 } = require('../changers/changerHelper');

const input = {
  network: 'rskTestnet',
  reserveTokenAddress: '0x19F64674D8A5B4E652319F5e239eFd3bc969A1fE',
  moc: '0x1790e2ac82B2E9f319689DE237abF98Cf983735a',
  amount: '1000000000000000000'
};

let ReserveToken;
let MoCContract;
const gasPrice = 60000000;

const depositReserve = async from => {
  console.log(`Depositing tokens to reserve, from: ${from} on ${input.network}`);

  return MoCContract.methods
    .addReserves(input.amount)
    .send({ from, gas: 1e6, gasPrice })
    .on('transactionHash', hash => console.log('TxHash:', hash))
    .on('confirmation', confirmationNumber => console.log('Tx confirmation:', confirmationNumber))
    .on('receipt', async receipt => {
      console.log('Tx receipt:', receipt);
    })
    .on('error', console.error);
};

const approveAndDeposit = async from => {
  console.log(`Approving MoC (${input.moc}) to spend:${input.amount} from fromAccount`);
  return ReserveToken.methods
    .approve(input.moc, input.amount)
    .send({ from, gas: 1e6, gasPrice })
    .on('transactionHash', hash => console.log('TxHash:', hash))
    .on('confirmation', confirmationNumber => console.log('Tx confirmation:', confirmationNumber))
    .on('receipt', async receipt => {
      console.log('Tx receipt:', receipt);
      await depositReserve(from);
    })
    .on('error', console.error);
};

const execute = async () => {
  const web3 = getWeb3(input.network);
  const [owner] = await web3.eth.getAccounts();
  ReserveToken = await new web3.eth.Contract(ERC20.abi, input.reserveTokenAddress);
  MoCContract = await new web3.eth.Contract(MoC.abi, input.moc);

  return approveAndDeposit(owner);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
