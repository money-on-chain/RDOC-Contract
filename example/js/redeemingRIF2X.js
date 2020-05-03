const Web3 = require('web3');
//You must compile the smart contracts or use the official ABIs of the //repository
const MoC = require('../../build/contracts/MoC.json');
const MoCRiskProxManager = require('../../build/contracts/MoCRiskProxManager.json');
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

const web3 = getWeb3('rskTestnet');
const gasPrice = getGasPrice('rskTestnet');

//Contract addresses on testnet
const mocContractAddress = '<contract-address>';
const mocRiskProxManagerAddress = '<contract-address>';

const execute = async () => {
  web3.eth.defaultGas = 2000000;

  /**
   * Loads an specified contract
   * @param {ContractABI} abi
   * @param {String} contractAddress
   */
  const getContract = async (abi, contractAddress) => new web3.eth.Contract(abi, contractAddress);
  const strToBytes32 = bucket => web3.utils.asciiToHex(bucket, 32);
  const bucketX2 = 'X2';

  // Loading Moc contract
  const moc = await getContract(MoC.abi, mocContractAddress);
  if (!moc) {
    throw Error('Can not find MoC contract.');
  }

  // Loading MoCRiskProxManager contract. It is necessary to compute user RIF2X balance
  const mocRiskProxManager = await getContract(MoCRiskProxManager.abi, mocRiskProxManagerAddress);
  if (!mocRiskProxManager) {
    throw Error('Can not find MoCRiskProxManager contract.');
  }

  const [from] = await web3.eth.getAccounts();

  const redeemRif2x = async rif2xAmount => {
    const weiAmount = web3.utils.toWei(rif2xAmount, 'ether');

    console.log(`Calling redeem RIF2X with account: ${from}, amount: ${weiAmount}.`);
    moc.methods
      .redeemRiskProx(strToBytes32(bucketX2), weiAmount)
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

  const userBalance = await mocRiskProxManager.methods
    .riskProxBalanceOf(strToBytes32(bucketX2), from)
    .call();
  console.log('=== User BPROX2 Balance: '.concat(userBalance.toString()));

  const rif2xAmount = '0.00001';

  // Call redeem
  await redeemRif2x(rif2xAmount);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
