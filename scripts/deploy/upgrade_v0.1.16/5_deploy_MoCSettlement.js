/* eslint-disable no-console */
const MoCSettlementv0116 = artifacts.require('./MoCSettlement_v0116.sol');
const MoCSettlement = artifacts.require('./MoCSettlement.sol');

const { getConfig, getNetwork, saveConfig } = require('../helper');

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);

    // Deploy contract implementation
    console.log('Deploying MoCSettlement v0116 ...');
    const mocSettlementv0116 = await MoCSettlementv0116.new();

    // Deploy contract implementation
    console.log('Deploying MoCSettlement ...');
    const mocSettlement = await MoCSettlement.new();

    // Save implementation address to config file
    config.implementationAddresses.MoCSettlement_v0116 = mocSettlementv0116.address;
    config.implementationAddresses.MoCSettlement = mocSettlement.address;

    saveConfig(config, configPath);

    console.log('MoCSettlement v0116 implementation address: ', mocSettlementv0116.address);
    console.log('MoCSettlement implementation address: ', mocSettlement.address);
  } catch (error) {
    callback(error);
  }

  callback();
};
