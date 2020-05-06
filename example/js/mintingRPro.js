const Web3 = require('web3');
//You must compile the smart contracts or use the official ABIs of the //repository
const MocAbi = require('../../build/contracts/MoC.json');
const MoCStateAbi = require('../../build/contracts/MoCState.json');
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

const web3 = getWeb3('mocTestnet');
const gasPrice = getGasPrice('mocTestnet');

//Contract addresses on testnet
const mocContractAddress = '<contract-address>';
const mocStateAddress = '<contract-address>';
const reserveTokenAddress = '<contract-address>';

const execute = async () => {
  web3.eth.defaultGas = 2000000;
  /**
   * Loads an specified contract
   * @param {json ABI} abi
   * @param {localhost/testnet/mainnet} contractAddress
   */
  const getContract = async (abi, contractAddress) => new web3.eth.Contract(abi, contractAddress);

  /**
   * Transforms BigNumbers into
   * @param {*} number
   */

  // Loading moc contract
  const moc = await getContract(MocAbi.abi, mocContractAddress);
  if (!moc) {
    throw Error('Can not find MoC contract.');
  }

  // Loading mocState contract. It is necessary to compute max RIFP available to mint
  const mocState = await getContract(MoCStateAbi.abi, mocStateAddress);
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

  const mintRiskPro = async (rifAmount, allowanceAmount) => {
    const weiAmount = web3.utils.toWei(rifAmount, 'ether');
    await setAllowance(allowanceAmount);
    console.log(`Calling RPro minting with account: ${from} and amount: ${weiAmount}.`);
    const tx = moc.methods
      .mintRiskPro(weiAmount)
      .send({ from, gasPrice }, function (error, transactionHash) {
        if (error) console.log(error);
        if (transactionHash) console.log('txHash: '.concat(transactionHash));
      });

    return tx;
  };

  // Gets max RIFP available to mint
  const maxRiskProAvailable = await mocState.methods.maxMintRiskProAvalaible().call();
  const rifAmount = '0.0005';
  // before start minting RPro we need to set the allowance of RIF available to spend.
  const allowanceAmount = '0.001';

  console.log('Max Available RIFP: '.concat(maxRiskProAvailable.toString()));

  // Call mint
  await mintRiskPro(rifAmount, allowanceAmount);
};

execute()
  .then(() => console.log('Completed'))
  .catch((err) => {
    console.log('Error', err);
  });