/* eslint-disable no-console */
const Deprecated = artifacts.require('./Deprecated.sol');

const { getConfig, getNetwork, saveConfig } = require('../helper');

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);

    // Deploy contract implementation
    console.log('Deploying Deprecated ...');
    const deprecated = await Deprecated.new();

    // Save implementation address to config file
    config.implementationAddresses.Deprecated = deprecated.address;

    saveConfig(config, configPath);

    console.log('Deprecated implementation address: ', deprecated.address);
  } catch (error) {
    callback(error);
  }

  callback();
};
