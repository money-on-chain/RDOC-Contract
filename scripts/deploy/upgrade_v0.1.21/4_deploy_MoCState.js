/* eslint-disable no-console */
const MoCStateV021 = artifacts.require('./MoCState_v021.sol');
const MoCState = artifacts.require('./MoCState.sol');

const { getConfig, getNetwork, saveConfig } = require('../helper');

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);

    // Link MoCHelperLib
    console.log('Link MoCHelperLib');
    MoCStateV021.link('MoCHelperLib', config.implementationAddresses.MoCHelperLib);
    MoCState.link('MoCHelperLib', config.implementationAddresses.MoCHelperLib);

    // Deploy contract implementation
    console.log('Deploying MoCState v021 ...');
    const mocStateV021 = await MoCStateV021.new();

    // Deploy contract implementation
    console.log('Deploying MoCState ...');
    const mocState = await MoCState.new();

    // Save implementation address to config file
    config.implementationAddresses.MoCState_v021 = mocStateV021.address;
    config.implementationAddresses.MoCState = mocState.address;

    saveConfig(config, configPath);

    console.log('MoCState v021 implementation address: ', mocStateV021.address);
    console.log('MoCState implementation address: ', mocState.address);
  } catch (error) {
    callback(error);
  }

  callback();
};
