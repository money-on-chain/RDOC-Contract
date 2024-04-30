/* eslint-disable no-console */
const Governor = artifacts.require('moc-governance/contracts/Governance/Governor.sol');
const V2MigrationChanger = artifacts.require('./changers/V2MigrationChanger.sol');

const { getConfig, getNetwork, saveConfig, shouldExecuteChanges } = require('../helper');

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);

    console.log('V2MigrationChanger Deploy');
    const v2MigrationChanger = await V2MigrationChanger.new(
      config.implementationAddresses.UpgradeDelegator,
      config.v1ProxyAddresses.CommissionSplitter,
      config.v2ProxyAddresses.MoC,
      config.v1ProxyAddresses.MoC,
      config.implementationAddresses.MoC_Migrator,
      config.implementationAddresses.MoCExchange_Migrator,
      config.implementationAddresses.Deprecated,
      config.authorizedExecutors
    );
    console.log('V2MigrationChanger address: ', v2MigrationChanger.address);

    // Save changer address to config file
    config.changerAddresses = { V2MigrationChanger: v2MigrationChanger.address };
    saveConfig(config, configPath);

    if (shouldExecuteChanges(network)) {
      // Execute changes in contracts
      console.log('Execute change - Changer');
      const governor = await Governor.at(config.implementationAddresses.Governor);
      await governor.executeChange(v2MigrationChanger.address);
    } else {
      console.log('Executing test governor execute change');
      const governor = await Governor.at(config.implementationAddresses.Governor);
      await governor.contract.methods
        .executeChange(config.changerAddresses.Changer)
        .call({ from: config.governorOwnerAddress });
    }
  } catch (error) {
    callback(error);
  }

  callback();
};
