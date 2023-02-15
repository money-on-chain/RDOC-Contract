/* eslint-disable no-console */
const MoCExchangeV021 = artifacts.require('./MoCExchange_v021.sol');
const MoCExchange = artifacts.require('./MoCExchange.sol');

const { getConfig, getNetwork, saveConfig } = require('../helper');

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);

    // Link MoCHelperLib
    console.log('Link MoCHelperLib');
    MoCExchangeV021.link('MoCHelperLib', config.implementationAddresses.MoCHelperLib);
    MoCExchange.link('MoCHelperLib', config.implementationAddresses.MoCHelperLib);

    // Deploy contract implementation
    console.log('Deploying MoCExchange v021 ...');
    const mocExchangeV021 = await MoCExchangeV021.new();

    // Deploy contract implementation
    console.log('Deploying MoCExchange ...');
    const mocExchange = await MoCExchange.new();

    // Save implementation address to config file
    config.implementationAddresses.MoCExchange_v021 = mocExchangeV021.address;
    config.implementationAddresses.MoCExchange = mocExchange.address;

    saveConfig(config, configPath);

    console.log('MoCExchange v021 implementation address: ', mocExchangeV021.address);
    console.log('MoCExchange implementation address: ', mocExchange.address);
  } catch (error) {
    callback(error);
  }

  callback();
};
