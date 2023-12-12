/* eslint-disable no-console */
const V2MigrationChanger = artifacts.require('./changers/V2MigrationChanger.sol');
const { getConfig, getNetwork } = require('../helper');

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);

    const changerAddress = config.changerAddresses.V2MigrationChanger;
    const changer = await V2MigrationChanger.at(changerAddress);

    const changerInfo = {};
    changerInfo.upgradeDelegator = await changer.upgradeDelegator();
    changerInfo.commissionSplitter = await changer.commissionSplitter();
    changerInfo.mocV2 = await changer.mocV2();

    // MoC
    changerInfo.mocProxy = await changer.mocProxy();
    changerInfo.mocMigrator = await changer.mocMigrator();

    // MoCExchange
    changerInfo.mocExchangeProxy = await changer.mocExchangeProxy();
    changerInfo.mocExchangeMigrator = await changer.mocExchangeMigrator();

    // MoCState
    changerInfo.mocStateProxy = await changer.mocStateProxy();

    // MoCSettlement
    changerInfo.mocSettlementProxy = await changer.mocSettlementProxy();

    // MoCInrate
    changerInfo.mocInrateProxy = await changer.mocInrateProxy();

    // MoCRiskProxManager
    changerInfo.mocRiskProxManagerProxy = await changer.mocRiskProxManagerProxy();

    // Deprecated
    changerInfo.deprecatedImplementation = await changer.deprecatedImp();

    console.log('Changer contract parameters');

    if (changerInfo.upgradeDelegator === config.implementationAddresses.UpgradeDelegator) {
      console.log('OK. Upgrade Delegator: ', changerInfo.upgradeDelegator);
    } else {
      console.error('ERROR! Upgrade Delegator is not the same ', changerInfo.upgradeDelegator);
    }

    if (changerInfo.commissionSplitter === config.v1ProxyAddresses.CommissionSplitter) {
      console.log('OK. CommissionSplitter: ', changerInfo.commissionSplitter);
    } else {
      console.error('ERROR! CommissionSplitter is not the same ', changerInfo.commissionSplitter);
    }

    if (changerInfo.mocV2 === config.v2ProxyAddresses.MoC) {
      console.log('OK. MoCV2: ', changerInfo.mocV2);
    } else {
      console.error('ERROR! MoCV2 is not the same ', changerInfo.mocV2);
    }

    // MoC
    if (changerInfo.mocProxy === config.v1ProxyAddresses.MoC) {
      console.log('OK. Proxy MoC.sol contract: ', changerInfo.mocProxy);
    } else {
      console.error('ERROR! Proxy MoC.sol is not the same ', changerInfo.mocProxy);
    }

    if (changerInfo.mocMigrator === config.implementationAddresses.MoC_Migrator) {
      console.log('OK. Implementation MoC_Migrator.sol contract: ', changerInfo.mocMigrator);
    } else {
      console.error(
        'ERROR! Implementation MoC_Migrator.sol is not the same ',
        changerInfo.mocMigrator
      );
    }

    // MoCExchange
    if (changerInfo.mocExchangeProxy === config.v1ProxyAddresses.MoCExchange) {
      console.log('OK. Proxy MoCExchange.sol contract: ', changerInfo.mocExchangeProxy);
    } else {
      console.error('ERROR! Proxy MoCExchange.sol is not the same ', changerInfo.mocExchangeProxy);
    }

    if (changerInfo.mocExchangeMigrator === config.implementationAddresses.MoCExchange_Migrator) {
      console.log(
        'OK. Implementation MoCExchange_Migrator.sol contract: ',
        changerInfo.mocExchangeMigrator
      );
    } else {
      console.error(
        'ERROR! Implementation MoCExchange_Migrator.sol is not the same ',
        changerInfo.mocExchangeMigrator
      );
    }

    // MoCState
    if (changerInfo.mocStateProxy === config.v1ProxyAddresses.MoCState) {
      console.log('OK. Proxy MoCState.sol contract: ', changerInfo.mocStateProxy);
    } else {
      console.error('ERROR! Proxy MoCState.sol is not the same ', changerInfo.mocStateProxy);
    }

    // MoCSettlement
    if (changerInfo.mocSettlementProxy === config.v1ProxyAddresses.MoCSettlement) {
      console.log('OK. Proxy MoCSettlement.sol contract: ', changerInfo.mocSettlementProxy);
    } else {
      console.error(
        'ERROR! Proxy MoCSettlement.sol is not the same ',
        changerInfo.mocSettlementProxy
      );
    }

    // MoCInrate
    if (changerInfo.mocInrateProxy === config.v1ProxyAddresses.MoCInrate) {
      console.log('OK. Proxy MoCInrate.sol contract: ', changerInfo.mocInrateProxy);
    } else {
      console.error('ERROR! Proxy MoCInrate.sol is not the same ', changerInfo.mocInrateProxy);
    }

    // MoCRiskProxManager
    if (changerInfo.mocRiskProxManagerProxy === config.v1ProxyAddresses.MoCRiskProxManager) {
      console.log(
        'OK. Proxy MoCRiskProxManager.sol contract: ',
        changerInfo.mocRiskProxManagerProxy
      );
    } else {
      console.error(
        'ERROR! Proxy MoCRiskProxManager.sol is not the same ',
        changerInfo.mocRiskProxManagerProxy
      );
    }

    // Deprecated
    if (changerInfo.deprecatedImplementation === config.implementationAddresses.Deprecated) {
      console.log(
        'OK. Implementation Deprecated.sol contract: ',
        changerInfo.deprecatedImplementation
      );
    } else {
      console.error(
        'ERROR! Implementation Deprecated.sol is not the same ',
        changerInfo.deprecatedImplementation
      );
    }

    // Authorized
    await config.authorizedExecutors.forEach(async (authorizedExecutor, i) => {
      const changerAuthExec = await changer.authorizedExecutors(i);
      if (changerAuthExec === authorizedExecutor) {
        console.log('OK. Authorized Executor address: ', authorizedExecutor);
      } else {
        console.error('ERROR! Authorized Executor address is not correct ', changerAuthExec);
      }
    });
  } catch (error) {
    callback(error);
  }

  callback();
};
