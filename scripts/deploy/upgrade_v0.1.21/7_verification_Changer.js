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

    let proxy;
    let middleTermImplementation;
    let newImplementation;
    // MoC
    ({ proxy, middleTermImplementation, newImplementation } = await changer.upgradesAddresses(0));
    changerInfo.mocProxy = proxy;
    changerInfo.mocMiddleTermImplementation = middleTermImplementation;
    changerInfo.mocNewImplementation = newImplementation;

    // MoCConnector
    ({ proxy, middleTermImplementation, newImplementation } = await changer.upgradesAddresses(1));
    changerInfo.mocConnectorProxy = proxy;
    changerInfo.mocConnectorMiddleTermImplementation = middleTermImplementation;
    changerInfo.mocConnectorNewImplementation = newImplementation;

    // MoCExchange
    ({ proxy, middleTermImplementation, newImplementation } = await changer.upgradesAddresses(2));
    changerInfo.mocExchangeProxy = proxy;
    changerInfo.mocExchangeMiddleTermImplementation = middleTermImplementation;
    changerInfo.mocExchangeNewImplementation = newImplementation;

    // MoCState
    ({ proxy, middleTermImplementation, newImplementation } = await changer.upgradesAddresses(3));
    changerInfo.mocStateProxy = proxy;
    changerInfo.mocStateMiddleTermImplementation = middleTermImplementation;
    changerInfo.mocStateNewImplementation = newImplementation;

    // MoCSettlement
    ({ proxy, middleTermImplementation, newImplementation } = await changer.upgradesAddresses(4));
    changerInfo.mocSettlementProxy = proxy;
    changerInfo.mocSettlementMiddleTermImplementation = middleTermImplementation;
    changerInfo.mocSettlementNewImplementation = newImplementation;

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

    if (changerInfo.mocMiddleTermImplementation === config.implementationAddresses.MoC_v0116) {
      console.log(
        'OK. Implementation MoC_v0116.sol contract: ',
        changerInfo.mocMiddleTermImplementation
      );
    } else {
      console.log(
        'ERROR! Implementation MoC_021.sol is not the same ',
        changerInfo.mocMiddleTermImplementation
      );
    }

    if (changerInfo.mocNewImplementation === config.implementationAddresses.MoC) {
      console.log('OK. Implementation MoC.sol contract: ', changerInfo.mocNewImplementation);
    } else {
      console.log(
        'ERROR! Implementation MoC.sol is not the same ',
        changerInfo.mocNewImplementation
      );
    }

    // MoCConnector
    if (changerInfo.mocConnectorProxy === config.proxyAddresses.MoCConnector) {
      console.log('OK. Proxy MoCConnector.sol contract: ', changerInfo.mocConnectorProxy);
    } else {
      console.log('ERROR! Proxy MoCConnector.sol is not the same ', changerInfo.mocConnectorProxy);
    }

    if (
      changerInfo.mocConnectorMiddleTermImplementation ===
      config.implementationAddresses.MoCConnector_v0116
    ) {
      console.log(
        'OK. Implementation MoCConnector_v0116.sol contract: ',
        changerInfo.mocConnectorMiddleTermImplementation
      );
    } else {
      console.log(
        'ERROR! Implementation MoCConnector_021.sol is not the same ',
        changerInfo.mocConnectorMiddleTermImplementation
      );
    }

    if (changerInfo.mocConnectorNewImplementation === config.implementationAddresses.MoCConnector) {
      console.log(
        'OK. Implementation MoCConnector.sol contract: ',
        changerInfo.mocConnectorNewImplementation
      );
    } else {
      console.log(
        'ERROR! Implementation MoCConnector.sol is not the same ',
        changerInfo.mocConnectorNewImplementation
      );
    }

    // MoCExchange
    if (changerInfo.mocExchangeProxy === config.proxyAddresses.MoCExchange) {
      console.log('OK. Proxy MoCExchange.sol contract: ', changerInfo.mocExchangeProxy);
    } else {
      console.log('ERROR! Proxy MoCExchange.sol is not the same ', changerInfo.mocExchangeProxy);
    }

    if (
      changerInfo.mocExchangeMiddleTermImplementation ===
      config.implementationAddresses.MoCExchange_v0116
    ) {
      console.log(
        'OK. Implementation MoCExchange_v0116.sol contract: ',
        changerInfo.mocExchangeMiddleTermImplementation
      );
    } else {
      console.log(
        'ERROR! Implementation MoCExchange_021.sol is not the same ',
        changerInfo.mocExchangeMiddleTermImplementation
      );
    }

    if (changerInfo.mocExchangeNewImplementation === config.implementationAddresses.MoCExchange) {
      console.log(
        'OK. Implementation MoCExchange.sol contract: ',
        changerInfo.mocExchangeNewImplementation
      );
    } else {
      console.log(
        'ERROR! Implementation MoCExchange.sol is not the same ',
        changerInfo.mocExchangeNewImplementation
      );
    }

    // MoCState
    if (changerInfo.mocStateProxy === config.proxyAddresses.MoCState) {
      console.log('OK. Proxy MoCState.sol contract: ', changerInfo.mocStateProxy);
    } else {
      console.log('ERROR! Proxy MoCState.sol is not the same ', changerInfo.mocStateProxy);
    }

    if (
      changerInfo.mocStateMiddleTermImplementation === config.implementationAddresses.MoCState_v0116
    ) {
      console.log(
        'OK. Implementation MoCState_v0116.sol contract: ',
        changerInfo.mocStateMiddleTermImplementation
      );
    } else {
      console.log(
        'ERROR! Implementation MoCState_021.sol is not the same ',
        changerInfo.mocStateMiddleTermImplementation
      );
    }

    if (changerInfo.mocStateNewImplementation === config.implementationAddresses.MoCState) {
      console.log(
        'OK. Implementation MoCState.sol contract: ',
        changerInfo.mocStateNewImplementation
      );
    } else {
      console.log(
        'ERROR! Implementation MoCState.sol is not the same ',
        changerInfo.mocStateNewImplementation
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
      changerInfo.mocSettlementMiddleTermImplementation ===
      config.implementationAddresses.MoCSettlement_v0116
    ) {
      console.log(
        'OK. Implementation MoCSettlement_v0116.sol contract: ',
        changerInfo.mocSettlementMiddleTermImplementation
      );
    } else {
      console.log(
        'ERROR! Implementation MoCSettlement_021.sol is not the same ',
        changerInfo.mocSettlementMiddleTermImplementation
      );
    }

    if (
      changerInfo.mocSettlementNewImplementation === config.implementationAddresses.MoCSettlement
    ) {
      console.log(
        'OK. Implementation MoCSettlement.sol contract: ',
        changerInfo.mocSettlementNewImplementation
      );
    } else {
      console.log(
        'ERROR! Implementation MoCSettlement.sol is not the same ',
        changerInfo.mocSettlementNewImplementation
      );
    }
  } catch (error) {
    callback(error);
  }

  callback();
};
