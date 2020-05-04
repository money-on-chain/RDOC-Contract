const Web3 = require('web3');
//You must compile the smart contracts or use the official ABIs of the //repository
const MoC = require('../../build/contracts/MoC.json');
const MocState = require('../../build/contracts/MoCState.json');
const StableToken = require('../../build/contracts/StableToken.json');
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
const mocAddress = '<contract-address>';
const mocStateAddress = '<contract-address>';
const stableTokenAddress = '<contract-address>';

const execute = async () => {
  web3.eth.defaultGas = 2000000;

  /**
   * Loads an specified contract
   * @param {ContractABI} abi
   * @param {String} contractAddress
   */
  const getContract = async (abi, contractAddress) => new web3.eth.Contract(abi, contractAddress);

  // Loading MoC contract
  const moc = await getContract(MoC.abi, mocAddress);
  if (!moc) {
    throw Error('Can not find MoC contract.');
  }

  // Loading mocState contract. It is necessary to compute freeRDoc
  const mocState = await getContract(MocState.abi, mocStateAddress);
  if (!mocState) {
    throw Error('Can not find MoCState contract.');
  }

  // Loading DocToken contract. It is necessary to compute user balance
  const stableToken = await getContract(StableToken.abi, stableTokenAddress);
  if (!stableToken) {
    throw Error('Can not find StableToken contract.');
  }

  const [from] = await web3.eth.getAccounts();

  const redeemFreeRDoc = async rDocAmount => {
    const weiAmount = web3.utils.toWei(rDocAmount, 'ether');

    console.log(`Calling redeem free RDoc, account: ${from}, amount: ${weiAmount}.`);
    moc.methods
      .redeemFreeStableToken(weiAmount)
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

  const rDocAmount = '10000';
  const freeRDoc = await mocState.methods.freeStableTokeneDoc().call();
  const userRDocBalance = await stableToken.methods.balanceOf(from).call();
  const finalDocAmount = Math.min(freeRDoc, userRDocBalance);
  console.log('=== User RDOC balance: ', userRDocBalance.toString());
  console.log('=== Free RDOC: ',freeRDoc.toString());
  console.log('=== Max Available RDOC to redeem: ', finalDocAmount.toString());

  // Call redeem
  await redeemFreeRDoc(rDocAmount);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
