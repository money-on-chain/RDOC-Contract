# Example code redeeming USDRIF Request

In the following example we will show how to invoke redeemStableTokenRequest using RIF On Chain contract. This method can receive any amount of USDRIF to redeem, but this will be processed on the next settlement. Check the [USDRIF redeemption section](redeeming-rdocs.md) for more details.

We will use **truffle** and **testnet** network.
You can find code examples into _/examples_ dir.

First we create a new node project.

```
mkdir example-redeem-rdoc-request
cd example-redeem-rdoc-request
npm init
```

Let's add the necessary dependencies to run the project.

```
npm install --save web3
```

**Example**

```js
const Web3 = require('web3');
//You must compile the smart contracts or use the official ABIs of the repository
const MoC = require('../../build/contracts/MoC.json');
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

//Loading MoC address on testnet
const mocAddress = '<contract-address>';

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

  const redeemStableTokenRequest = async docAmount => {
    const [from] = await web3.eth.getAccounts();
    const weiAmount = web3.utils.toWei(docAmount, 'ether');

    console.log(`Calling redeem Doc request, account: ${from}, amount: ${weiAmount}.`);
    moc.methods
      .redeemStableTokenRequest(weiAmount)
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

  const docAmount = '10000';

  // Call redeem
  await redeemStableTokenRequest(docAmount);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
```
