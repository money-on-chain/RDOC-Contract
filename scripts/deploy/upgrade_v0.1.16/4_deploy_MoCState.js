/* eslint-disable no-console */
const MoCStatev0116 = artifacts.require('./MoCState_v0116.sol');

const { getConfig, getNetwork, saveConfig } = require('../helper');

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);

    // Link MoCHelperLib
    console.log('Link MoCHelperLib');
    MoCStatev0116.link('MoCHelperLib', config.implementationAddresses.MoCHelperLib);

    // Deploy contract implementation
    console.log('Deploying MoCState v0116 ...');
    const mocStatev0116 = await MoCStatev0116.new();

    // Save implementation address to config file
    config.implementationAddresses.MoCState_v0116 = mocStatev0116.address;

    saveConfig(config, configPath);

    console.log('MoCState v0116 implementation address: ', mocStatev0116.address);
  } catch (error) {
    callback(error);
  }

  callback();
};
