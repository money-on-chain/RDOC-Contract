/* eslint-disable no-console */
const UpgraderChanger = artifacts.require('./changers/UpgraderChanger.sol');
const Governor = artifacts.require('moc-governance/contracts/Governance/Governor.sol');

const MoCExchange = artifacts.require('./MoCExchange.sol');

const { getConfig, getNetwork, saveConfig } = require('../helper');

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);

    // Link MoCHelperLib
    console.log('Link MoCHelperLib');
    MoCExchange.link('MoCHelperLib', config.implementationAddresses.MoCHelperLib);

    // Deploy contract implementation
    console.log('Deploy MoCExchange');
    const mocExchange = await MoCExchange.new();

    // Upgrade contracts with proxy (using the contract address of contract just deployed)
    console.log('Upgrade MoCExchange');
    const upgradeMocExchange = await UpgraderChanger.new(
      config.proxyAddresses.MoCExchange,
      config.implementationAddresses.UpgradeDelegator,
      mocExchange.address
    );

    // Save implementation address to config file
    config.implementationAddresses.MoCExchange = mocExchange.address;
    saveConfig(config, configPath);

    console.log('MoCExchange implementation address: ', mocExchange.address);
  } catch (error) {
    callback(error);
  }

  callback();
};
