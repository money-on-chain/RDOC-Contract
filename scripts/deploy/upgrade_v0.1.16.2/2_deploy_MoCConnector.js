/* eslint-disable no-console */
const MoCConnectorv01162 = artifacts.require('./MoCConnector_v0116_2.sol');

const { getConfig, getNetwork, saveConfig } = require('../helper');

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);

    // Deploy contract implementation
    console.log('Deploying MoCConnector v0116_2 ...');
    const mocConnectorv01162 = await MoCConnectorv01162.new();

    // Save implementation address to config file
    config.implementationAddresses.MoCConnector_v0116_2 = mocConnectorv01162.address;

    saveConfig(config, configPath);

    console.log('MoCConnector v0116_2 implementation address: ', mocConnectorv01162.address);
  } catch (error) {
    callback(error);
  }

  callback();
};
