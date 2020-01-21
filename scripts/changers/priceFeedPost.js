const { getWeb3, getNetworkHost, getConfig } = require('./changerHelper');
const ReserveTokenPriceFeedAbi = require('../../build/contracts/ReserveTokenPriceFeed.json');
const { toContract } = require('../../utils/numberHelper');

const input = {
  network: 'rskTestnet',
  ownerPk: '...', // mnemonic || pk
  priceFeedAddress: '0xe147e38be533e9e16a2b27948fc19d7386dda6a4',
  price: 7000
};

const execute = async () => {
  const date = new Date();
  date.setTime(date.getTime() + 4 * 60 * 60 * 1000); // 4 hours
  const expirationTimeSeconds = date.getTime() / 1000;

  const web3 = getWeb3(undefined, { pk: input.ownerPk, host: getNetworkHost(input.network) });
  const config = getConfig(input.network);
  const [owner] = await web3.eth.getAccounts();
  const reserveTokenPriceToSet = (input.price * 10 ** 18).toString();
  const ReserveTokenPriceFeed = await new web3.eth.Contract(
    ReserveTokenPriceFeedAbi.abi,
    input.priceFeedAddress
  );
  console.log('setting Price Feed price');
  return ReserveTokenPriceFeed.methods
    .post(toContract(reserveTokenPriceToSet), toContract(expirationTimeSeconds), config.medianizer)
    .send({ from: owner })
    .on('transactionHash', hash => console.log('TxHash:', hash))
    .on('confirmation', confirmationNumber => console.log('Tx confirmation:', confirmationNumber))
    .on('receipt', receipt => console.log('Tx receipt:', receipt))
    .on('error', console.error);
};

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
