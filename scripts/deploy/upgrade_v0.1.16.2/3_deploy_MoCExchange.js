/* eslint-disable no-console */
const MoCExchangev01162 = artifacts.require('./MoCExchange_v0116_2.sol');

const { getConfig, getNetwork, saveConfig } = require('../helper');

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);

    // Link MoCHelperLib
    console.log('Link MoCHelperLib');
    MoCExchangev01162.link('MoCHelperLib', config.implementationAddresses.MoCHelperLib);

    // Deploy contract implementation
    console.log('Deploying MoCExchange v0116_2 ...');
    const mocExchangev01162 = await MoCExchangev01162.new();

    // Save implementation address to config file
    config.implementationAddresses.MoCExchange_v0116_2 = mocExchangev01162.address;

    saveConfig(config, configPath);

    console.log('MoCExchange v0116_2 implementation address: ', mocExchangev01162.address);
  } catch (error) {
    callback(error);
  }

  callback();
};
