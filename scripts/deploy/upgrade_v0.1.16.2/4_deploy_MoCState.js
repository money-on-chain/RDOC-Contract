/* eslint-disable no-console */
const MoCStatev01162 = artifacts.require('./MoCState_v0116_2.sol');

const { getConfig, getNetwork, saveConfig } = require('../helper');

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);

    // Link MoCHelperLib
    console.log('Link MoCHelperLib');
    MoCStatev01162.link('MoCHelperLib', config.implementationAddresses.MoCHelperLib);

    // Deploy contract implementation
    console.log('Deploying MoCState v0116_2 ...');
    const mocStatev01162 = await MoCStatev01162.new();

    // Save implementation address to config file
    config.implementationAddresses.MoCState_v0116_2 = mocStatev01162.address;

    saveConfig(config, configPath);

    console.log('MoCState v0116_2 implementation address: ', mocStatev01162.address);
  } catch (error) {
    callback(error);
  }

  callback();
};
