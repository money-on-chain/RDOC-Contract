/* eslint-disable no-console */
const MoCV021 = artifacts.require('./MoC_v021.sol');
const MoC = artifacts.require('./MoC.sol');

const { getConfig, getNetwork, saveConfig } = require('../helper');

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);

    // Deploy contract implementation
    console.log('Deploying MoC v021 ...');
    const mocV021 = await MoCV021.new();

    // Deploy contract implementation
    console.log('Deploying MoC ...');
    const moc = await MoC.new();

    // Save implementation address to config file
    config.implementationAddresses.MoC_v021 = mocV021.address;
    config.implementationAddresses.MoC = moc.address;

    saveConfig(config, configPath);

    console.log('MoC v021 implementation address: ', mocV021.address);
    console.log('MoC implementation address: ', moc.address);
  } catch (error) {
    callback(error);
  }

  callback();
};
