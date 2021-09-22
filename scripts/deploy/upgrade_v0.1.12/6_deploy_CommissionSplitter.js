/* eslint-disable no-console */
const CommissionSplitter = artifacts.require('./CommissionSplitter.sol');

const AdminUpgradeabilityProxy = artifacts.require('AdminUpgradeabilityProxy');

const { getConfig, getNetwork, saveConfig } = require('../helper');

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);

    // Deploy new CommissionSplitter implementationxs
    console.log('Deploy CommissionSplitter');
    const commissionSplitter = await CommissionSplitter.new();

    // Save implementation address to config file
    config.implementationAddresses.CommissionSplitter = commissionSplitter.address;
    saveConfig(config, configPath);

    // Initialize contract
    const initData = await commissionSplitter.contract.methods
      .initialize(
        config.proxyAddresses.MoC,
        config.valuesToAssign.targetAddressCommissionPayment,
        config.valuesToAssign.mocProportion,
        config.implementationAddresses.Governor,
        config.implementationAddresses.MocReserve,
        config.implementationAddresses.MoCToken,
        config.valuesToAssign.mocTokenCommissionsAddress
      )
      .encodeABI();
    console.log('CommissionSplitter Initialized');

    const proxyMocVendors = await AdminUpgradeabilityProxy.new(
      commissionSplitter.address,
      config.implementationAddresses.ProxyAdmin,
      initData
    );

    // Save proxy address to config file
    config.proxyAddresses.CommissionSplitter = proxyMocVendors.address;
    saveConfig(config, configPath);

    console.log('CommissionSplitter proxy address: ', proxyMocVendors.address);
    console.log('CommissionSplitter implementation address: ', commissionSplitter.address);
  } catch (error) {
    callback(error);
  }

  callback();
};
