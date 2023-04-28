/* eslint-disable no-console */
const Governor = artifacts.require('moc-governance/contracts/Governance/Governor.sol');
const StableTokenMigrationChanger = artifacts.require('./changers/StableTokenMigrationChanger.sol');

const { getConfig, getNetwork, saveConfig, shouldExecuteChanges } = require('../helper');

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);

    console.log('StableTokenMigrationChanger Deploy');
    const stableTokenMigrationChanger = await StableTokenMigrationChanger.new({
      upgradeDelegator: config.implementationAddresses.UpgradeDelegator,
      stableTokenV2: config.implementationAddresses.StableTokenV2,
      tokenMigrator: config.implementationAddresses.TokenMigrator,
      mocProxy: config.proxyAddresses.MoC,
      mocAtomicImp: config.implementationAddresses.MoC_v0116,
      mocConnectorProxy: config.proxyAddresses.MoCConnector,
      mocConnectorAtomicImp: config.implementationAddresses.MoCConnector_v0116,
      mocExchangeProxy: config.proxyAddresses.MoCExchange,
      mocExchangeAtomicImp: config.implementationAddresses.MoCExchange_v0116,
      mocStateProxy: config.proxyAddresses.MoCState,
      mocStateAtomicImp: config.implementationAddresses.MoCState_v0116,
      mocSettlementProxy: config.proxyAddresses.MoCSettlement,
      mocSettlementAtomicImp: config.implementationAddresses.MoCSettlement_v0116
    });
    console.log('StableTokenMigrationChanger address: ', stableTokenMigrationChanger.address);

    // Save changer address to config file
    config.changerAddresses.StableTokenMigrationChanger = stableTokenMigrationChanger.address;
    saveConfig(config, configPath);

    if (shouldExecuteChanges(network)) {
      // Execute changes in contracts
      console.log('Execute change - Changer');
      const governor = await Governor.at(config.implementationAddresses.Governor);
      await governor.executeChange(stableTokenMigrationChanger.address);
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
