/* eslint-disable no-console */
const MoCSettlementv01162 = artifacts.require('./MoCSettlement_v0116_2.sol');

const { getConfig, getNetwork, saveConfig } = require('../helper');

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);

    // Deploy contract implementation
    console.log('Deploying MoCSettlement v0116_2 ...');
    const mocSettlementv01162 = await MoCSettlementv01162.new();

    // Save implementation address to config file
    config.implementationAddresses.MoCSettlement_v0116_2 = mocSettlementv01162.address;

    saveConfig(config, configPath);

    console.log('MoCSettlement v0116_2 implementation address: ', mocSettlementv01162.address);
  } catch (error) {
    callback(error);
  }

  callback();
};
