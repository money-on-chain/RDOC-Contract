/* eslint-disable no-console */
const MoCMigrator = artifacts.require('./MoC_Migrator.sol');

const { getConfig, getNetwork, saveConfig } = require('../helper');

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);

    // Deploy contract implementation
    console.log('Deploying MoC_Migrator ...');
    const mocMigrator = await MoCMigrator.new();

    // Save implementation address to config file
    config.implementationAddresses.MoC_Migrator = mocMigrator.address;

    saveConfig(config, configPath);

    console.log('MoC_Migrator implementation address: ', mocMigrator.address);
  } catch (error) {
    callback(error);
  }

  callback();
};
