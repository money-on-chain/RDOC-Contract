/* eslint-disable no-console */
const MoCConnectorV021 = artifacts.require('./MoCConnector_v021.sol');
const MoCConnector = artifacts.require('./MoCConnector.sol');

const { getConfig, getNetwork, saveConfig } = require('../helper');

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);

    // Deploy contract implementation
    console.log('Deploying MoCConnector v021 ...');
    const mocConnectorV021 = await MoCConnectorV021.new();

    // Deploy contract implementation
    console.log('Deploying MoCConnector ...');
    const mocConnector = await MoCConnector.new();

    // Save implementation address to config file
    config.implementationAddresses.MoCConnector_v021 = mocConnectorV021.address;
    config.implementationAddresses.MoCConnector = mocConnector.address;

    saveConfig(config, configPath);

    console.log('MoCConnector v021 implementation address: ', mocConnectorV021.address);
    console.log('MoCConnector implementation address: ', mocConnector.address);
  } catch (error) {
    callback(error);
  }

  callback();
};
