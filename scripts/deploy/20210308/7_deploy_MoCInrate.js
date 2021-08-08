/* eslint-disable no-console */
const MoCInrate = artifacts.require('./MoCInrate.sol');

const BigNumber = require('bignumber.js');
const { getConfig, getNetwork, saveConfig, shouldExecuteChanges } = require('../helper');

const getCommissionsArray = mocInrate => async config => {
  const mocPrecision = 10 ** 18;

  const ret = [
    {
      txType: (await mocInrate.MINT_RISKPRO_FEES_RESERVE()).toString(),
      fee: BigNumber(config.valuesToAssign.commissionRates.MINT_RISKPRO_FEES_RESERVE)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: (await mocInrate.REDEEM_RISKPRO_FEES_RESERVE()).toString(),
      fee: BigNumber(config.valuesToAssign.commissionRates.REDEEM_RISKPRO_FEES_RESERVE)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: (await mocInrate.MINT_STABLETOKEN_FEES_RESERVE()).toString(),
      fee: BigNumber(config.valuesToAssign.commissionRates.MINT_STABLETOKEN_FEES_RESERVE)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: (await mocInrate.REDEEM_STABLETOKEN_FEES_RESERVE()).toString(),
      fee: BigNumber(config.valuesToAssign.commissionRates.REDEEM_STABLETOKEN_FEES_RESERVE)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: (await mocInrate.MINT_RISKPROX_FEES_RESERVE()).toString(),
      fee: BigNumber(config.valuesToAssign.commissionRates.MINT_RISKPROX_FEES_RESERVE)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: (await mocInrate.REDEEM_RISKPROX_FEES_RESERVE()).toString(),
      fee: BigNumber(config.valuesToAssign.commissionRates.REDEEM_RISKPROX_FEES_RESERVE)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: (await mocInrate.MINT_RISKPRO_FEES_MOC()).toString(),
      fee: BigNumber(config.valuesToAssign.commissionRates.MINT_RISKPRO_FEES_MOC)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: (await mocInrate.REDEEM_RISKPRO_FEES_MOC()).toString(),
      fee: BigNumber(config.valuesToAssign.commissionRates.REDEEM_RISKPRO_FEES_MOC)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: (await mocInrate.MINT_STABLETOKEN_FEES_MOC()).toString(),
      fee: BigNumber(config.valuesToAssign.commissionRates.MINT_STABLETOKEN_FEES_MOC)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: (await mocInrate.REDEEM_STABLETOKEN_FEES_MOC()).toString(),
      fee: BigNumber(config.valuesToAssign.commissionRates.REDEEM_STABLETOKEN_FEES_MOC)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: (await mocInrate.MINT_RISKPROX_FEES_MOC()).toString(),
      fee: BigNumber(config.valuesToAssign.commissionRates.MINT_RISKPROX_FEES_MOC)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: (await mocInrate.REDEEM_RISKPROX_FEES_MOC()).toString(),
      fee: BigNumber(config.valuesToAssign.commissionRates.REDEEM_RISKPROX_FEES_MOC)
        .times(mocPrecision)
        .toString()
    }
  ];
  return ret;
};

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);

    // Link MoCHelperLib
    console.log('Link MoCHelperLib');
    MoCInrate.link('MoCHelperLib', config.implementationAddresses.MoCHelperLib);

    // Deploy contract implementation
    console.log('Deploy MoCInrate');
    const mocInrate = await MoCInrate.new();

    // Save implementation address and changer address to config file
    config.implementationAddresses.MoCInrate = mocInrate.address;
    saveConfig(config, configPath);

    console.log('MoCInrate implementation address: ', mocInrate.address);
  } catch (error) {
    callback(error);
  }

  callback();
};
