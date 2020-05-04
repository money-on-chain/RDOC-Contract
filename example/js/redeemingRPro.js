const Web3 = require('web3');
//You must compile the smart contracts or use the official ABIs of the //repository
const Moc = require('../../build/contracts/MoC.json');
const MoCState = require('../../build/contracts/MoCState.json');
const RiskProToken = require('../../build/contracts/RiskProToken.json');
const truffleConfig = require('../../truffle');

/**
 * Get a provider from truffle.js file
 * @param {String} network
 */
const getDefaultProvider = network =>
  truffleConfig.networks[network].provider || truffleConfig.networks[network].endpoint;

/**
 * Get a gasPrice from truffle.js file
 * @param {String} network
 */
const getGasPrice = network => truffleConfig.networks[network].gasPrice || 60000000;

/**
 * Get a new web3 instance from truffle.js file
 */
const getWeb3 = network => {
  const provider = getDefaultProvider(network);
  return new Web3(provider, null, {
    transactionConfirmationBlocks: 1
  });
};

const web3 = getWeb3('mocTestnet');
const gasPrice = getGasPrice('mocTestnet');

//Contract addresses on testnet
const mocContractAddress = '<contract-address>';
const mocStateAddress = '<contract-address>';
const riskProTokenAddress = '<contract-address>';

const execute = async () => {
  web3.eth.defaultGas = 2000000;

  /**
   * Loads an specified contract
   * @param {ContractABI} abi
   * @param {String} contractAddress
   */
  const getContract = async (abi, contractAddress) => new web3.eth.Contract(abi, contractAddress);

  // Loading moc contract
  const moc = await getContract(Moc.abi, mocContractAddress);
  if (!moc) {
    throw Error('Can not find MoC contract.');
  }

  // Loading mocState contract. It is necessary to compute absolute max RPRO
  const mocState = await getContract(MoCState.abi, mocStateAddress);
  if (!mocState) {
    throw Error('Can not find MoCState contract.');
  }

  // Loading RiskProToken contract. It is necessary to compute user balance
  const riskProToken = await getContract(RiskProToken.abi, riskProTokenAddress);
  if (!riskProToken) {
    throw Error('Can not find RiskProToken contract.');
  }

  const [from] = await web3.eth.getAccounts();

  const redeemRPro = async rproAmount => {
    const weiAmount = web3.utils.toWei(rproAmount, 'ether');
    console.log(`Calling redeem RPro with account: ${from} and amount: ${weiAmount}.`);
    moc.methods
      .redeemRiskPro(weiAmount)
      .send({ from, gasPrice }, function(error, transactionHash) {
        if (error) console.log(error);
        if (transactionHash) console.log('txHash: '.concat(transactionHash));
      })
      .on('transactionHash', function(hash) {
        console.log('TxHash: '.concat(hash));
      })
      .on('receipt', function(receipt) {
        console.log(receipt);
      })
      .on('error', console.error);
  };

  const getAbsoluteMaxRpro = await mocState.methods.absoluteMaxRiskPro().call();
  const userAmount = await riskProToken.methods.balanceOf(from).call();

  console.log('=== Max amount of RPro to redeem: ', getAbsoluteMaxRpro.toString());
  console.log('=== User RPro Balance: ', userAmount.toString());

  const rproAmount = '0.00001';

  // Call redeem
  await redeemRPro(rproAmount);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
