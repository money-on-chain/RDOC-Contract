const { getWeb3, decodeLog } = require('./changerHelper');
const ReserveTokenPriceFeedAbi = require('../../../oracle/build/contracts/FeedFactory.json');

const input = {
  network: 'rskTestnet',
  tx: '0xef106fce39a483c533ef45353605d2695655c68ddf5ee6a7e751b9853029f704',
  eventName: 'Created'
};

const execute = async () =>
  decodeLog(getWeb3(input.network), ReserveTokenPriceFeedAbi, input.eventName, input.tx);

execute()
  .then(() => console.log('Completed'))
  .catch(err => {
    console.log('Error', err);
  });
