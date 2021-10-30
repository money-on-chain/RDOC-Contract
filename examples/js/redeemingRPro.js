const Web3 = require('web3');
//You must compile the smart contracts or use the official ABIs of the repository
const MocAbi = require('../../build/contracts/MoC.json');
const MoCStateAbi = require('../../build/contracts/MoCState.json');
const RiskProTokenAbi = require('../../build/contracts/RiskProToken.json');
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
const mocInrateAddress = '<contract-address>';
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
  const moc = await getContract(MocAbi.abi, mocContractAddress);
  if (!moc) {
    throw Error('Can not find MoC contract.');
  }

  // Loading mocState contract. It is necessary to compute absolute max RIFPros
  const mocState = await getContract(MoCStateAbi.abi, mocStateAddress);
  if (!mocState) {
    throw Error('Can not find MoCState contract.');
  }

  // Loading RiskProToken contract. It is necessary to compute user balance
  const riskProToken = await getContract(RiskProTokenAbi.abi, riskProTokenAddress);
  if (!riskProToken) {
    throw Error('Can not find RiskProToken contract.');
  }

  const [from] = await web3.eth.getAccounts();

  const redeemRiskPro = async (riskProAmount, vendorAccount) => {
    const weiAmount = web3.utils.toWei(riskProAmount, 'ether');

    console.log(`Calling redeem RIFPro with account: ${from} and amount: ${weiAmount}.`);
    moc.methods
      .redeemRiskProVendors(weiAmount, vendorAccount)
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

  const getAbsoluteMaxRiskPro = await mocState.methods.absoluteMaxRiskPro().call();
  const userAmount = await riskProToken.methods.balanceOf(from).call();

  console.log('=== Max amount of RIFPro to redeem: ', getAbsoluteMaxRiskPro.toString());
  console.log('=== User RIFPro Balance: ', userAmount.toString());

  const riskProAmount = '0.00001';
  const vendorAccount = '<vendor-address>';

  // Call redeem
  await redeemRiskPro(riskProAmount, vendorAccount);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });