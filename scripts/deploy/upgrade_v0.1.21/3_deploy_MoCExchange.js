/* eslint-disable no-console */
const MoCExchangev0116 = artifacts.require('./MoCExchange_v0116.sol');
const MoCExchange = artifacts.require('./MoCExchange.sol');

const { getConfig, getNetwork, saveConfig } = require('../helper');

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);

    // Link MoCHelperLib
    console.log('Link MoCHelperLib');
    MoCExchangev0116.link('MoCHelperLib', config.implementationAddresses.MoCHelperLib);
    MoCExchange.link('MoCHelperLib', config.implementationAddresses.MoCHelperLib);

    // Deploy contract implementation
    console.log('Deploying MoCExchange v0116 ...');
    const mocExchangev0116 = await MoCExchangev0116.new();

    // Deploy contract implementation
    console.log('Deploying MoCExchange ...');
    const mocExchange = await MoCExchange.new();

    // Save implementation address to config file
    config.implementationAddresses.MoCExchange_v0116 = mocExchangev0116.address;
    config.implementationAddresses.MoCExchange = mocExchange.address;

    saveConfig(config, configPath);

    console.log('MoCExchange v0116 implementation address: ', mocExchangev0116.address);
    console.log('MoCExchange implementation address: ', mocExchange.address);
  } catch (error) {
    callback(error);
  }

  callback();
};
