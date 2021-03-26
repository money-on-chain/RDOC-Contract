# Example code redeeming RIFPros without Truffle

In the following example we will learn how to:

- Get the maximum amount of RIFPros available to redeem.
- Get RIFPros balance of an account.
- Redeem RIFPros.

We will use the **testnet** network.

First we create a new node project.

```
mkdir example-redeem-riskpro
cd example-redeem-riskpro
npm init
```

Let's add the necessary dependencies to run the project.

```
npm install --save web3
npm install --save truffle-hdwallet-provider
```

```js
const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
//You must compile the smart contracts or use the official ABIs of the repository
const MocAbi = require('../../build/contracts/MoC.json');
const MoCInrateAbi = require('../../build/contracts/MoCInrate.json');
const MoCStateAbi = require('../../build/contracts/MoCState.json');
const RiskProTokenAbi = require('../../build/contracts/RiskProToken.json');

//Config params to TestNet
const endpoint = 'https://public-node.testnet.rsk.co';
//a mnemonic is 12 words instead of a single private key to sign the //transactions
const mnemonic = 'chase chair crew elbow uncle awful cover asset cradle pet loud puzzle';
const provider = new HDWalletProvider(mnemonic, endpoint);
const web3 = new Web3(provider);

//Contract addresses on testnet
const mocContractAddress = '<contract-address>';
const mocInrateAddress = '<contract-address>';
const mocStateAddress = '<contract-address>';
const riskProTokenAddress = '<contract-address>';
const gasPrice = 60000000;

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

  // Loading mocInrate contract. It is necessary to compute commissions
  const mocInrate = await getContract(MoCInrateAbi.abi, mocInrateAddress);
  if (!mocInrate) {
    throw Error('Can not find MoC Inrate contract.');
  }

  // Loading mocState contract. It is necessary to compute absolute max RIFPRO
  const mocState = await getContract(MoCStateAbi.abi, mocStateAddress);
  if (!mocState) {
    throw Error('Can not find MoCState contract.');
  }

  // Loading RiskProToken contract. It is necessary to compute user balance
  const riskProToken = await getContract(RiskProTokenAbi.abi, riskProTokenAddress);

  const [from] = await web3.eth.getAccounts();

  const redeemRiskPro = async (riskProAmount, vendorAccount) => {
    const weiAmount = web3.utils.toWei(riskPAmount, 'ether');

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
  const riskProFinalAmount = Math.min(userAmount, getAbsoluteMaxRiskPro);
  console.log('=== User RIFPro balance: ', userAmount);
  console.log('=== Max amount of RIFPro to redeem ', riskProFinalAmount);

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
```
