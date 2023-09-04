/* eslint-disable no-console */
const BigNumber = require('bignumber.js');

const FluxCapacitorChanger = artifacts.require('./changers/FluxCapacitorChanger.sol');
const { getConfig, getNetwork } = require('../helper');

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);
    const PRECISION = 10 ** 18;

    const fromPrecision = value =>
      BigNumber(value)
        .div(PRECISION)
        .toString();

    const changerAddress = config.changerAddresses.FluxCapacitorChanger;
    const changer = await FluxCapacitorChanger.at(changerAddress);

    const changerInfo = {};
    changerInfo.upgradeDelegator = await changer.upgradeDelegator();
    changerInfo.mocProxy = await changer.mocProxy();
    changerInfo.mocNewImplementation = await changer.mocNewImplementation();

    changerInfo.mocExchangeProxy = await changer.mocExchangeProxy();
    changerInfo.mocExchangeNewImplementation = await changer.mocExchangeNewImplementation();

    changerInfo.stopperNewImplementation = await changer.stopperNewImplementation();

    changerInfo.maxAbsoluteOperation = fromPrecision(await changer.maxAbsoluteOperation());
    changerInfo.maxOperationalDifference = fromPrecision(await changer.maxOperationalDifference());
    changerInfo.decayBlockSpan = (await changer.decayBlockSpan()).toString();

    console.log('Changer contract parameters');

    if (
      changerInfo.upgradeDelegator === config.governanceImplementationAddresses.UpgradeDelegator
    ) {
      console.log('OK. UpgradeDelegator: ', changerInfo.upgradeDelegator);
    } else {
      console.log('ERROR! UpgradeDelegator is not the same ', changerInfo.upgradeDelegator);
    }

    if (changerInfo.mocProxy === config.proxyAddresses.MoC) {
      console.log('OK. MoC Proxy: ', changerInfo.mocProxy);
    } else {
      console.log('ERROR! MoC Proxy is not the same ', changerInfo.mocProxy);
    }

    if (changerInfo.mocNewImplementation === config.implementationAddresses.MoC) {
      console.log('OK. MoC NewImplementation: ', changerInfo.mocNewImplementation);
    } else {
      console.log(
        'ERROR! MoC NewImplementation is not the same ',
        changerInfo.mocNewImplementation
      );
    }

    if (changerInfo.mocExchangeNewImplementation === config.implementationAddresses.MoCExchange) {
      console.log('OK. MoCExchange NewImplementation: ', changerInfo.mocExchangeNewImplementation);
    } else {
      console.log(
        'ERROR! MoCExchange NewImplementation is not the same ',
        changerInfo.mocExchangeNewImplementation
      );
    }

    if (changerInfo.stopperNewImplementation === config.governanceImplementationAddresses.Stopper) {
      console.log('OK. Stopper NewImplementation: ', changerInfo.stopperNewImplementation);
    } else {
      console.log(
        'ERROR! Stopper NewImplementation is not the same ',
        changerInfo.stopperNewImplementation
      );
    }

    if (
      changerInfo.maxAbsoluteOperation === config.valuesToAssign.maxAbsoluteOperation.toString()
    ) {
      console.log('OK. maxAbsoluteOperation: ', changerInfo.maxAbsoluteOperation);
    } else {
      console.log('ERROR! maxAbsoluteOperation is not the same ', changerInfo.maxAbsoluteOperation);
    }

    if (
      changerInfo.maxOperationalDifference ===
      config.valuesToAssign.maxOperationalDifference.toString()
    ) {
      console.log('OK. maxOperationalDifference: ', changerInfo.maxOperationalDifference);
    } else {
      console.log(
        'ERROR! maxOperationalDifference is not the same ',
        changerInfo.maxOperationalDifference
      );
    }

    if (changerInfo.decayBlockSpan === config.valuesToAssign.decayBlockSpan.toString()) {
      console.log('OK. decayBlockSpan: ', changerInfo.decayBlockSpan);
    } else {
      console.log('ERROR! decayBlockSpan is not the same ', changerInfo.decayBlockSpan);
    }
  } catch (error) {
    callback(error);
  }

  callback();
};
