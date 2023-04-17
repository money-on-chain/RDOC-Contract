/* eslint-disable no-console */
const MoCConnectorv0116 = artifacts.require('./MoCConnector_v0116.sol');
const MoCConnector = artifacts.require('./MoCConnector.sol');

const { getConfig, getNetwork, saveConfig } = require('../helper');

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);

    // Deploy contract implementation
    console.log('Deploying MoCConnector v0116 ...');
    const mocConnectorv0116 = await MoCConnectorv0116.new();

    // Deploy contract implementation
    console.log('Deploying MoCConnector ...');
    const mocConnector = await MoCConnector.new();

    // Save implementation address to config file
    config.implementationAddresses.MoCConnector_v0116 = mocConnectorv0116.address;
    config.implementationAddresses.MoCConnector = mocConnector.address;

    saveConfig(config, configPath);

    console.log('MoCConnector v0116 implementation address: ', mocConnectorv0116.address);
    console.log('MoCConnector implementation address: ', mocConnector.address);
  } catch (error) {
    callback(error);
  }

  callback();
};
