/* eslint-disable no-console */
/* eslint-disable camelcase */
const BigNumber = require('bignumber.js');

const FeeIncreaseProposal = artifacts.require(
  './changers/proposal_fee_increase/FeeIncreaseProposal.sol'
);
const { getConfig, getNetwork, saveConfig } = require('../helper');

const getMoCCommissionsArray = async config => {
  const mocPrecision = 10 ** 18;
  const MINT_RISKPRO_FEES_RESERVE = '1';
  const REDEEM_RISKPRO_FEES_RESERVE = '2';
  const MINT_STABLETOKEN_FEES_RESERVE = '3';
  const REDEEM_STABLETOKEN_FEES_RESERVE = '4';
  const MINT_RISKPROX_FEES_RESERVE = '5';
  const REDEEM_RISKPROX_FEES_RESERVE = '6';
  const MINT_RISKPRO_FEES_MOC = '7';
  const REDEEM_RISKPRO_FEES_MOC = '8';
  const MINT_STABLETOKEN_FEES_MOC = '9';
  const REDEEM_STABLETOKEN_FEES_MOC = '10';
  const MINT_RISKPROX_FEES_MOC = '11';
  const REDEEM_RISKPROX_FEES_MOC = '12';

  const ret = [
    {
      txType: MINT_RISKPRO_FEES_RESERVE,
      fee: BigNumber(config.FeeIncreaseProposal.ROC.commissionRates.MINT_RISKPRO_FEES_RESERVE)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: REDEEM_RISKPRO_FEES_RESERVE,
      fee: BigNumber(config.FeeIncreaseProposal.ROC.commissionRates.REDEEM_RISKPRO_FEES_RESERVE)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: MINT_STABLETOKEN_FEES_RESERVE,
      fee: BigNumber(config.FeeIncreaseProposal.ROC.commissionRates.MINT_STABLETOKEN_FEES_RESERVE)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: REDEEM_STABLETOKEN_FEES_RESERVE,
      fee: BigNumber(config.FeeIncreaseProposal.ROC.commissionRates.REDEEM_STABLETOKEN_FEES_RESERVE)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: MINT_RISKPROX_FEES_RESERVE,
      fee: BigNumber(config.FeeIncreaseProposal.ROC.commissionRates.MINT_RISKPROX_FEES_RESERVE)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: REDEEM_RISKPROX_FEES_RESERVE,
      fee: BigNumber(config.FeeIncreaseProposal.ROC.commissionRates.REDEEM_RISKPROX_FEES_RESERVE)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: MINT_RISKPRO_FEES_MOC,
      fee: BigNumber(config.FeeIncreaseProposal.ROC.commissionRates.MINT_RISKPRO_FEES_MOC)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: REDEEM_RISKPRO_FEES_MOC,
      fee: BigNumber(config.FeeIncreaseProposal.ROC.commissionRates.REDEEM_RISKPRO_FEES_MOC)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: MINT_STABLETOKEN_FEES_MOC,
      fee: BigNumber(config.FeeIncreaseProposal.ROC.commissionRates.MINT_STABLETOKEN_FEES_MOC)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: REDEEM_STABLETOKEN_FEES_MOC,
      fee: BigNumber(config.FeeIncreaseProposal.ROC.commissionRates.REDEEM_STABLETOKEN_FEES_MOC)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: MINT_RISKPROX_FEES_MOC,
      fee: BigNumber(config.FeeIncreaseProposal.ROC.commissionRates.MINT_RISKPROX_FEES_MOC)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: REDEEM_RISKPROX_FEES_MOC,
      fee: BigNumber(config.FeeIncreaseProposal.ROC.commissionRates.REDEEM_RISKPROX_FEES_MOC)
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

    const {
      MoCInrate,
      riskProInterestAddress,
      commissionAddress,
      riskProRate
    } = config.FeeIncreaseProposal.ROC;

    const commissionsMoCrates = await getMoCCommissionsArray(config);

    console.log('Deploying FeeIncreaseProposal Contract Changer ...');
    // eslint-disable-next-line no-shadow
    const feeIncreaseProposal = await FeeIncreaseProposal.new(
      MoCInrate,
      commissionAddress,
      riskProInterestAddress,
      riskProRate,
      commissionsMoCrates
    );

    console.log('Deploying FeeIncreaseProposal Contract Changer DONE!');

    // Save changer address to config file
    config.changerAddresses.FeeIncreaseProposal = feeIncreaseProposal.address;
    saveConfig(config, configPath);
  } catch (error) {
    callback(error);
  }

  callback();
};
