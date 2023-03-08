/* eslint-disable no-console */
const MoCv0116 = artifacts.require('./MoC_v0116.sol');
const MoC = artifacts.require('./MoC.sol');

const { getConfig, getNetwork, saveConfig } = require('../helper');

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);

    // Deploy contract implementation
    console.log('Deploying MoC v0116 ...');
    const mocv0116 = await MoCv0116.new();

    // Deploy contract implementation
    console.log('Deploying MoC ...');
    const moc = await MoC.new();

    // Save implementation address to config file
    config.implementationAddresses.MoC_v0116 = mocv0116.address;
    config.implementationAddresses.MoC = moc.address;

    saveConfig(config, configPath);

    console.log('MoC v0116 implementation address: ', mocv0116.address);
    console.log('MoC implementation address: ', moc.address);
  } catch (error) {
    callback(error);
  }

  callback();
};
