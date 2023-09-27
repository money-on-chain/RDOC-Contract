/* eslint-disable no-console */
const MoCv01162 = artifacts.require('./MoC_v0116_2.sol');

const { getConfig, getNetwork, saveConfig } = require('../helper');

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);

    // Deploy contract implementation
    console.log('Deploying MoC v0116_2 ...');
    const mocv01162 = await MoCv01162.new();

    // Save implementation address to config file
    config.implementationAddresses.MoC_v0116_2 = mocv01162.address;

    saveConfig(config, configPath);

    console.log('MoC v0116_2 implementation address: ', mocv01162.address);
  } catch (error) {
    callback(error);
  }

  callback();
};
