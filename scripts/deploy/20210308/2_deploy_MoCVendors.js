/* eslint-disable no-console */
const AdminUpgradeabilityProxy = artifacts.require('AdminUpgradeabilityProxy');

const MoCVendors = artifacts.require('./MoCVendors.sol');

const { getConfig, getNetwork, saveConfig } = require('../helper');

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);

    // Deploy new MoCVendors implementation
    const mocVendors = await MoCVendors.new();

    // Save implementation address to config file
    config.implementationAddresses.MoCVendors = mocVendors.address;
    saveConfig(network, config);

    // Initialize contract
    const initData = await mocVendors.contract.methods
      .initialize(
        config.proxyAddresses.MoCConnector,
        config.implementationAddresses.Governor,
        config.valuesToAssign.vendorMoCDepositAddress,
        config.valuesToAssign.vendorRequiredMoCs
      )
      .encodeABI();
    console.log('MoCVendors Initialized');

    const proxyMocVendors = await AdminUpgradeabilityProxy.new(
      mocVendors.address,
      config.implementationAddresses.ProxyAdmin,
      initData
    );

    // Save proxy address to config file
    config.proxyAddresses.MoCVendors = proxyMocVendors.address;
    saveConfig(network, config);

    console.log('MoCVendors proxy address: ', proxyMocVendors.address);
    console.log('MoCVendors implementation address: ', mocVendors.address);
  } catch (error) {
    callback(error);
  }

  callback();
};