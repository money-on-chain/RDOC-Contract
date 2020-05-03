const Web3 = require('web3');
//You must compile the smart contracts or use the official ABIs of the //repository
const MocAbi = require('../../build/contracts/MoC.json');
const MoCStateAbi = require('../../build/contracts/MoCState.json');
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
const mocStateAddress = '<contract-address>';

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

  // Loading mocState contract. It is necessary to compute max RDoc available to mint
  const mocState = await getContract(MoCStateAbi.abi, mocStateAddress);
  if (!mocState) {
    throw Error('Can not find MoCState contract.');
  }

  const mintDoc = async rifAmount => {
    const [from] = await web3.eth.getAccounts();
    const weiAmount = web3.utils.toWei(rifAmount, 'ether');
    console.log(`Calling RDoc minting, account: ${from}, amount: ${weiAmount}.`);
    moc.methods
      .mintStableToken(weiAmount)
      .send({ from, value: totalBtcAmount, gasPrice }, function(error, transactionHash) {
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

  // Gets max BPRO available to mint
  const getAbsoluteMaxRDoc = await mocState.methods.absoluteMaxStableToken().call();
  const rifAmount = '0.00001';
  
  console.log('=== Max RDoc amount available to mint: ', getAbsoluteMaxRDoc.toString());
  console.log('=== RIFs that are gonna be minted:  ', rifAmount);

  // Call mint
  await mintDoc(rifAmount);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
