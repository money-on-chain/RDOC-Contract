/* eslint-disable no-console */
const StableTokenMigrationChanger = artifacts.require('./changers/StableTokenMigrationChanger.sol');
const { getConfig, getNetwork } = require('../helper');

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);

    const changerAddress = config.changerAddresses.StableTokenMigrationChanger;
    const changer = await StableTokenMigrationChanger.at(changerAddress);

    const changerInfo = {};
    changerInfo.upgradeDelegator = await changer.upgradeDelegator();
    changerInfo.stableTokenV2 = await changer.stableTokenV2();
    changerInfo.tokenMigrator = await changer.tokenMigrator();

    // MoC
    changerInfo.mocProxy = await changer.mocProxy();
    changerInfo.mocCurrentImplementation = await changer.mocCurrentImp();
    changerInfo.mocAtomicImplementation = await changer.mocAtomicImp();

    // MoCConnector
    changerInfo.mocConnectorProxy = await changer.mocConnectorProxy();
    changerInfo.mocConnectorCurrentImplementation = await changer.mocConnectorCurrentImp();
    changerInfo.mocConnectorAtomicImplementation = await changer.mocConnectorAtomicImp();

    // MoCExchange
    changerInfo.mocExchangeProxy = await changer.mocExchangeProxy();
    changerInfo.mocExchangeCurrentImplementation = await changer.mocExchangeCurrentImp();
    changerInfo.mocExchangeAtomicImplementation = await changer.mocExchangeAtomicImp();

    // MoCState
    changerInfo.mocStateProxy = await changer.mocStateProxy();
    changerInfo.mocStateCurrentImplementation = await changer.mocStateCurrentImp();
    changerInfo.mocStateAtomicImplementation = await changer.mocStateAtomicImp();

    // MoCSettlement
    changerInfo.mocSettlementProxy = await changer.mocSettlementProxy();
    changerInfo.mocSettlementCurrentImplementation = await changer.mocSettlementCurrentImp();
    changerInfo.mocSettlementAtomicImplementation = await changer.mocSettlementAtomicImp();

    console.log('Changer contract parameters');

    if (changerInfo.upgradeDelegator === config.implementationAddresses.UpgradeDelegator) {
      console.log('OK. Upgrade Delegator: ', changerInfo.upgradeDelegator);
    } else {
      console.log('ERROR! Upgrade Delegator is not the same ', changerInfo.upgradeDelegator);
    }

    if (changerInfo.stableTokenV2 === config.implementationAddresses.StableTokenV2) {
      console.log('OK. StableTokenV2: ', changerInfo.stableTokenV2);
    } else {
      console.log('ERROR! StableTokenV2 is not the same ', changerInfo.stableTokenV2);
    }

    if (changerInfo.tokenMigrator === config.implementationAddresses.TokenMigrator) {
      console.log('OK. TokenMigrator: ', changerInfo.tokenMigrator);
    } else {
      console.log('ERROR! TokenMigrator is not the same ', changerInfo.tokenMigrator);
    }

    // MoC
    if (changerInfo.mocProxy === config.proxyAddresses.MoC) {
      console.log('OK. Proxy MoC.sol contract: ', changerInfo.mocProxy);
    } else {
      console.log('ERROR! Proxy MoC.sol is not the same ', changerInfo.mocProxy);
    }

    if (changerInfo.mocAtomicImplementation === config.implementationAddresses.MoC_v0116) {
      console.log(
        'OK. Implementation MoC_v0116.sol contract: ',
        changerInfo.mocAtomicImplementation
      );
    } else {
      console.log(
        'ERROR! Implementation MoC_v0116.sol is not the same ',
        changerInfo.mocMiddleTermImplementation
      );
    }

    if (changerInfo.mocCurrentImplementation === config.implementationAddresses.MoC) {
      console.log('OK. Implementation MoC.sol contract: ', changerInfo.mocCurrentImplementation);
    } else {
      console.log(
        'ERROR! Implementation MoC.sol is not the same ',
        changerInfo.mocCurrentImplementation
      );
    }

    // MoCConnector
    if (changerInfo.mocConnectorProxy === config.proxyAddresses.MoCConnector) {
      console.log('OK. Proxy MoCConnector.sol contract: ', changerInfo.mocConnectorProxy);
    } else {
      console.log('ERROR! Proxy MoCConnector.sol is not the same ', changerInfo.mocConnectorProxy);
    }

    if (
      changerInfo.mocConnectorAtomicImplementation ===
      config.implementationAddresses.MoCConnector_v0116
    ) {
      console.log(
        'OK. Implementation MoCConnector_v0116.sol contract: ',
        changerInfo.mocConnectorAtomicImplementation
      );
    } else {
      console.log(
        'ERROR! Implementation MoCConnector_v0116.sol is not the same ',
        changerInfo.mocConnectorAtomicImplementation
      );
    }

    if (
      changerInfo.mocConnectorCurrentImplementation === config.implementationAddresses.MoCConnector
    ) {
      console.log(
        'OK. Implementation MoCConnector.sol contract: ',
        changerInfo.mocConnectorCurrentImplementation
      );
    } else {
      console.log(
        'ERROR! Implementation MoCConnector.sol is not the same ',
        changerInfo.mocConnectorCurrentImplementation
      );
    }

    // MoCExchange
    if (changerInfo.mocExchangeProxy === config.proxyAddresses.MoCExchange) {
      console.log('OK. Proxy MoCExchange.sol contract: ', changerInfo.mocExchangeProxy);
    } else {
      console.log('ERROR! Proxy MoCExchange.sol is not the same ', changerInfo.mocExchangeProxy);
    }

    if (
      changerInfo.mocExchangeAtomicImplementation ===
      config.implementationAddresses.MoCExchange_v0116
    ) {
      console.log(
        'OK. Implementation MoCExchange_v0116.sol contract: ',
        changerInfo.mocExchangeAtomicImplementation
      );
    } else {
      console.log(
        'ERROR! Implementation MoCExchange_v0116.sol is not the same ',
        changerInfo.mocExchangeAtomicImplementation
      );
    }

    if (
      changerInfo.mocExchangeCurrentImplementation === config.implementationAddresses.MoCExchange
    ) {
      console.log(
        'OK. Implementation MoCExchange.sol contract: ',
        changerInfo.mocExchangeCurrentImplementation
      );
    } else {
      console.log(
        'ERROR! Implementation MoCExchange.sol is not the same ',
        changerInfo.mocExchangeCurrentImplementation
      );
    }

    // MoCState
    if (changerInfo.mocStateProxy === config.proxyAddresses.MoCState) {
      console.log('OK. Proxy MoCState.sol contract: ', changerInfo.mocStateProxy);
    } else {
      console.log('ERROR! Proxy MoCState.sol is not the same ', changerInfo.mocStateProxy);
    }

    if (
      changerInfo.mocStateAtomicImplementation === config.implementationAddresses.MoCState_v0116
    ) {
      console.log(
        'OK. Implementation MoCState_v0116.sol contract: ',
        changerInfo.mocStateAtomicImplementation
      );
    } else {
      console.log(
        'ERROR! Implementation MoCState_v0116.sol is not the same ',
        changerInfo.mocStateAtomicImplementation
      );
    }

    if (changerInfo.mocStateCurrentImplementation === config.implementationAddresses.MoCState) {
      console.log(
        'OK. Implementation MoCState.sol contract: ',
        changerInfo.mocStateCurrentImplementation
      );
    } else {
      console.log(
        'ERROR! Implementation MoCState.sol is not the same ',
        changerInfo.mocStateCurrentImplementation
      );
    }

    // MoCSettlement
    if (changerInfo.mocSettlementProxy === config.proxyAddresses.MoCSettlement) {
      console.log('OK. Proxy MoCSettlement.sol contract: ', changerInfo.mocSettlementProxy);
    } else {
      console.log(
        'ERROR! Proxy MoCSettlement.sol is not the same ',
        changerInfo.mocSettlementProxy
      );
    }

    if (
      changerInfo.mocSettlementAtomicImplementation ===
      config.implementationAddresses.MoCSettlement_v0116
    ) {
      console.log(
        'OK. Implementation MoCSettlement_v0116.sol contract: ',
        changerInfo.mocSettlementAtomicImplementation
      );
    } else {
      console.log(
        'ERROR! Implementation MoCSettlement_v0116.sol is not the same ',
        changerInfo.mocSettlementAtomicImplementation
      );
    }

    if (
      changerInfo.mocSettlementCurrentImplementation ===
      config.implementationAddresses.MoCSettlement
    ) {
      console.log(
        'OK. Implementation MoCSettlement.sol contract: ',
        changerInfo.mocSettlementCurrentImplementation
      );
    } else {
      console.log(
        'ERROR! Implementation MoCSettlement.sol is not the same ',
        changerInfo.mocSettlementCurrentImplementation
      );
    }
  } catch (error) {
    callback(error);
  }

  callback();
};
