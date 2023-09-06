/* eslint-disable no-console */
const BigNumber = require('bignumber.js');

const MoC = artifacts.require('./MoC.sol');
const MoCExchange = artifacts.require('./MoCExchange.sol');
const StopperV2 = artifacts.require('./governance/StopperV2.sol');

const { getConfig, getNetwork } = require('../helper');

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);
    const [owner] = await web3.eth.getAccounts();

    console.log('MoC.Sol Proxy');
    const mocProxy = await MoC.at(config.proxyAddresses.MoC);

    const contractInfo = {};
    contractInfo.connector = await mocProxy.connector();
    console.log('Connector: ', contractInfo.connector);
    contractInfo.stopper = await mocProxy.stopper();
    console.log('Stopper: ', contractInfo.stopper);
    contractInfo.governor = await mocProxy.governor();
    console.log('Governor: ', contractInfo.governor);

    console.log('Init MoC.Sol Implementation');
    const mocImpl = await MoC.at(config.implementationAddresses.MoC);
    await mocImpl.initialize(
        contractInfo.connector,
        contractInfo.governor,
        contractInfo.stopper,
        false,
        "65820000"
    );

    console.log('Init MoCExchange.Sol Implementation');
    const mocExchangeImpl = await MoCExchange.at(config.implementationAddresses.MoCExchange);
    await mocExchangeImpl.initialize(contractInfo.connector);

    console.log('Init StopperV2.Sol Implementation');
    const stopperV2Impl = await StopperV2.at(config.governanceImplementationAddresses.Stopper);
    await stopperV2Impl.initialize(owner);

    console.log('Init done!');

  } catch (error) {
    callback(error);
  }

  callback();
};
