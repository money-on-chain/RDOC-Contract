const Web3 = require('web3');
//You must compile the smart contracts or use the official ABIs of the //repository
const Moc = require('../../build/contracts/MoC.json');
const MoCState = require('../../build/contracts/MoCState.json');
const ReserveToken = require('../../build/contracts/ReserveToken.json');
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

const web3 = getWeb3('development');
const gasPrice = getGasPrice('development');

//Contract addresses on testnet
const mocContractAddress = '0xbb0BD84997De57e7525E6DBE7500080B8CD4176d';
const mocStateAddress = '0x67Be008479198B1557376954383efDB0cEFE39Eb';
const reserveTokenAddress = '0x2C3D623a095d8A774a3445c0d43554BF709de4ca';

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

  // Loading moc contract
  const moc = await getContract(Moc.abi, mocContractAddress);
  if (!moc) {
    throw Error('Can not find MoC contract.');
  }

  // Loading mocState contract. It is necessary to compute max BPRO available to mint
  const mocState = await getContract(MoCState.abi, mocStateAddress);
  if (!mocState) {
    throw Error('Can not find MoCState contract.');
  }

  // Loading ReserveToken contract. It is necessary to set max available RIF to spend
  const reserveToken = await getContract(ReserveToken.abi, reserveTokenAddress);
  if (!reserveToken) {
    throw Error('Can not find ReserveToken contract.');
  }

  const [from] = await web3.eth.getAccounts();

  const setAllowance = async allowanceAmount =>{
    const weiAmount = web3.utils.toWei(allowanceAmount, 'ether');
    console.log(`Calling approve: ${weiAmount}, for address account: ${from}.`);
    await reserveToken.methods.approve(mocContractAddress, weiAmount).send({ from, gasPrice });
    const spendableBalance = await moc.methods.getAllowance(from).call();
    console.log(`Spendable balance for account ${from} is ${spendableBalance}`);
  }

  const mintRif2x = async (rifAmount, allowanceAmount) => {
    const weiAmount = web3.utils.toWei(rifAmount, 'ether');
    await setAllowance(allowanceAmount);
    console.log(`Calling mint RIF2X with ${rifAmount} RIFs with account: ${from}.`);
    moc.methods
      .mintRiskProx(strToBytes32(bucketX2), weiAmount)
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

  // before start minting RIF2X we need to set the allowance of RIF available to spend.
  const allowanceAmount = '0.001';
  const rifToMint = '0.00001';
  // Gets max RIF2X amount available to mint
  const maxRif2xToMint = await mocState.methods.maxRiskProx(strToBytes32(bucketX2)).call();
  console.log('=== Max Available RIF2X to mint: '.concat(maxRif2xToMint.toString()));

  // Call mint
  await mintRif2x(rifToMint,allowanceAmount);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
