const { getWeb3, getConfig } = require('./changerHelper');
const ChangerAbi = require('../../build/contracts/MocInrateChanger.json');

const input = {
  network: 'rskTestnet',
  riskProIntBlockSpan: 7 * 120,
  btxcTmin: 0,
  btxcTmax: 0.0002611578760678 * 10 ** 18,
  btxcPower: 1,
  newRiskProRate: 0.000047945 * 10 ** 18,
  newComRate: 0.002 * 10 ** 18,
  newCommissionsAddress: '',
  newRiskProInterestAddress: ''
};

const afterDeployReceipt = async (deployReceipt, web3, owner) => {
  const changer = await new web3.eth.Contract(ChangerAbi.abi, deployReceipt.contractAddress);

  console.log('Deploy Receipt received: ', deployReceipt);
  if (input.newRiskProInterestAddress) {
    console.log(
      `Setting riskpro interest address ${input.newRiskProInterestAddress} in ${deployReceipt.contractAddress}`
    );
    changer.methods
      .setRiskProInterestAddress(input.newRiskProInterestAddress)
      .send({ from: owner })
      .on('transactionHash', hash => console.log('RiskProAddresss TxHash:', hash))
      .on('confirmation', confirmationNumber =>
        console.log('RiskProAddresss Tx confirmation:', confirmationNumber)
      )
      .on('receipt', receipt => console.log('RiskProAddresss Tx receipt:', receipt))
      .on('error', console.error);
  }

  if (input.newCommissionsAddress) {
    console.log(
      `Setting commissions address ${input.newCommissionsAddress} in ${deployReceipt.contractAddress}`
    );

    changer.methods
      .setCommissionsAddress(input.newCommissionsAddress)
      .send({ from: owner })
      .on('transactionHash', hash => console.log('CommissionsAddress TxHash:', hash))
      .on('confirmation', confirmationNumber =>
        console.log('CommissionsAddress Tx confirmation:', confirmationNumber)
      )
      .on('receipt', receipt => console.log('CommissionsAddress Tx receipt:', receipt))
      .on('error', console.error);
  }
};

// IMPORTANT: Not intended to be used in a production like environment
// Designed to be useful in testing
const execute = async () => {
  console.log('Starting');
  const web3 = getWeb3(input.network);
  const config = getConfig(input.network);
  console.log('Asking for accounts');
  const [owner] = await web3.eth.getAccounts();
  const Changer = await new web3.eth.Contract(ChangerAbi.abi);
  console.log('deploying');
  await Changer.deploy({
    data: ChangerAbi.bytecode,
    arguments: [
      config.mocInrate,
      input.riskProIntBlockSpan,
      input.btxcTmin,
      input.btxcTmax,
      input.btxcPower,
      input.newRiskProRate,
      input.newComRate
    ]
  })
    .send({ from: owner })
    .on('transactionHash', hash => console.log('Deploy TxHash:', hash))
    .on('confirmation', confirmationNumber =>
      console.log('Deploy Tx confirmation:', confirmationNumber)
    )
    .on('receipt', receipt => afterDeployReceipt(receipt, web3, owner))
    .on('error', console.error);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
