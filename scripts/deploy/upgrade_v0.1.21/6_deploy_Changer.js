/* eslint-disable no-console */
const Governor = artifacts.require('moc-governance/contracts/Governance/Governor.sol');
const StableTokenMigrationChanger = artifacts.require('./changers/StableTokenMigrationChanger.sol');

const { getConfig, getNetwork, saveConfig /* , shouldExecuteChanges */ } = require('../helper');

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);

    console.log('StableTokenMigrationChanger Deploy');
    const stableTokenMigrationChanger = await StableTokenMigrationChanger.new(
      config.implementationAddresses.UpgradeDelegator,
      config.implementationAddresses.StableTokenV2,
      config.implementationAddresses.TokenMigrator,
      [
        {
          proxy: config.proxyAddresses.MoC,
          middleTermImplementation: config.implementationAddresses.MoC_v021,
          newImplementation: config.implementationAddresses.MoC
        },
        {
          proxy: config.proxyAddresses.MoCConnector,
          middleTermImplementation: config.implementationAddresses.MoCConnector_v021,
          newImplementation: config.implementationAddresses.MoCConnector
        },
        {
          proxy: config.proxyAddresses.MoCExchange,
          middleTermImplementation: config.implementationAddresses.MoCExchange_v021,
          newImplementation: config.implementationAddresses.MoCExchange
        },
        {
          proxy: config.proxyAddresses.MoCState,
          middleTermImplementation: config.implementationAddresses.MoCState_v021,
          newImplementation: config.implementationAddresses.MoCState
        },
        {
          proxy: config.proxyAddresses.MoCSettlement,
          middleTermImplementation: config.implementationAddresses.MoCSettlement_v021,
          newImplementation: config.implementationAddresses.MoCSettlement
        }
      ]
    );
    console.log('StableTokenMigrationChanger address: ', stableTokenMigrationChanger.address);

    // Save changer address to config file
    config.changerAddresses.StableTokenMigrationChanger = stableTokenMigrationChanger.address;
    saveConfig(config, configPath);

    // if (shouldExecuteChanges(network)) {
    //   // Execute changes in contracts
    //   console.log('Execute change - Changer');
    //   const governor = await Governor.at(config.implementationAddresses.Governor);
    //   await governor.executeChange(stableTokenMigrationChanger.address);
    // } else {
    //   console.log('Executing test governor execute change');
    //   const governor = await Governor.at(config.implementationAddresses.Governor);
    //   await governor.contract.methods
    //     .executeChange(config.changerAddresses.Changer)
    //     .call({ from: config.governorOwnerAddress });
    // }
  } catch (error) {
    callback(error);
  }

  callback();
};
