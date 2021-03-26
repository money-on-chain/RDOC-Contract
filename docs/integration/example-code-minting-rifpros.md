# Example code minting RIFPros

In the following example we will show how to invoke the mintRiskProVendors function of the RIF On Chain contract in **testnet** with **truffle**.

You can find code examples into _/examples_ dir.

```js
const BigNumber = require('bignumber.js');
const Web3 = require('web3');
//You must compile the smart contracts or use the official ABIs of the repository
const MocAbi = require('../../build/contracts/MoC.json');
const MoCInrateAbi = require('../../build/contracts/MoCInrate.json');
const MoCExchangeAbi = require('../../build/contracts/MoCExchange.json');
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
const mocInrateAddress = '<contract-address>';
const mocExchangeAddress = '<contract-address>';
const mocStateAddress = '<contract-address>';
const reserveTokenAddress = '<contract-address>';

const execute = async () => {
  web3.eth.defaultGas = 2000000;

  /**
   * Loads an specified contract
   * @param {ContractABI} abi
   * @param {String} contractAddress
   */
  const getContract = async (abi, contractAddress) => new web3.eth.Contract(abi, contractAddress);

  /**
   * Transforms BigNumbers into
   * @param {BigNumber} number
   */
  const toContract = number => new BigNumber(number).toFixed(0);

  // Loading moc contract
  const moc = await getContract(MocAbi.abi, mocContractAddress);
  if (!moc) {
    throw Error('Can not find MoC contract.');
  }

  // Loading mocInrate contract. It is necessary to get fees for transaction types
  const mocInrate = await getContract(MoCInrateAbi.abi, mocInrateAddress);
  if (!mocInrate) {
    throw Error('Can not find MoC Inrate contract.');
  }

  // Loading mocExchange contract. It is necessary to compute commissions and vendor markup
  const mocExchange = await getContract(MoCExchangeAbi.abi, mocExchangeAddress);
  if (!mocExchange) {
    throw Error('Can not find MoC Exchange contract.');
  }

  // Loading mocState contract. It is necessary to compute max RIFPro available to mint
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

  const mintRiskPro = async (rifAmount, allowanceAmount, vendorAccount) => {
    const weiAmount = web3.utils.toWei(rifAmount, 'ether');
    await setAllowance(allowanceAmount);
    let reserveTokenCommission;
    let mocCommission;
    let reserveTokenMarkup;
    let mocMarkup;
    // Set transaction types
    const txTypeFeesReserveToken = await mocInrate.methods.MINT_RISKPRO_FEES_RESERVE();
    const txTypeFeesMOC = await mocInrate.methods.MINT_RISKPRO_FEES_MOC();
    // Compute fees
    const params = {
      account: from,
      amount: toContractBN(weiAmount).toString(),
      txTypeFeesMOC: txTypeFeesMOC.toString(),
      txTypeFeesReserveToken: txTypeFeesReserveToken.toString(),
      vendorAccount
    };

    ({
      reserveTokenCommission,
      mocCommission,
      reserveTokenMarkup,
      mocMarkup
    } = await mocExchange.methods.calculateCommissionsWithPrices(params, { from }));
    // Computes totalReserveTokenAmount to call mintRiskProVendors
    const totalReserveTokenAmount = toContract(reserveTokenCommission.plus(reserveTokenMarkup).plus(weiAmount));
    console.log(`Calling RiskPro minting with account: ${from} and amount: ${weiAmount}.`);
    moc.methods
      .mintRiskProVendors(weiAmount, vendorAccount)
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

  const riskProPriceInReserveToken = await mocState.methods.riskProTecPrice().call();
  console.log('=== RIFPRO in RIF: '.concat(riskProPriceInReserveToken.toString()));
  const rifAmount = '0.00001';
  const vendorAccount = '<vendor-address>';
  // before start minting RPro we need to set the allowance of RIF available to spend.
  const allowanceAmount = '0.001';

  // Call mint
  await mintRiskPro(rifAmount, allowanceAmount, vendorAccount);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
```
