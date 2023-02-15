/* eslint-disable no-console */
const MoCSettlementV021 = artifacts.require('./MoCSettlement_v021.sol');
const MoCSettlement = artifacts.require('./MoCSettlement.sol');

const { getConfig, getNetwork, saveConfig } = require('../helper');

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);

    // Deploy contract implementation
    console.log('Deploying MoCSettlement v021 ...');
    const mocSettlementV021 = await MoCSettlementV021.new();

    // Deploy contract implementation
    console.log('Deploying MoCSettlement ...');
    const mocSettlement = await MoCSettlement.new();

    // Save implementation address to config file
    config.implementationAddresses.MoCSettlement_v021 = mocSettlementV021.address;
    config.implementationAddresses.MoCSettlement = mocSettlement.address;

    saveConfig(config, configPath);

    console.log('MoCSettlement v021 implementation address: ', mocSettlementV021.address);
    console.log('MoCSettlement implementation address: ', mocSettlement.address);
  } catch (error) {
    callback(error);
  }

  callback();
};
