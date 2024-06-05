/* eslint-disable no-console */
const MoCExchangeMigrator = artifacts.require('./MoCExchange_Migrator.sol');

const { getConfig, getNetwork, saveConfig } = require('../helper');

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);

    // Link MoCHelperLib
    console.log('Link MoCHelperLib');
    MoCExchangeMigrator.link('MoCHelperLib', config.implementationAddresses.MoCHelperLib);

    // Deploy contract implementation
    console.log('Deploying MoCExchange_Migrator ...');
    const mocExchangeMigrator = await MoCExchangeMigrator.new();

    // Save implementation address to config file
    config.implementationAddresses.MoCExchange_Migrator = mocExchangeMigrator.address;

    saveConfig(config, configPath);

    console.log('MoCExchange_Migrator implementation address: ', mocExchangeMigrator.address);
  } catch (error) {
    callback(error);
  }

  callback();
};
