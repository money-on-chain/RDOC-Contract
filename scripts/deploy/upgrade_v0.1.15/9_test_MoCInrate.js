/* eslint-disable no-console */
const BigNumber = require('bignumber.js');

const IROCMoCInrate = artifacts.require(
  './changers/proposal_fee_increase/interfaces/IROCMoCInrate.sol'
);
const { getConfig, getNetwork } = require('../helper');

const PRECISION = 10 ** 18;

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);
    const mocInrateAddress = config.FeeIncreaseProposal.ROC.MoCInrate;
    const mocInrate = await IROCMoCInrate.at(mocInrateAddress);

    const contractInfo = {};
    contractInfo.commissionAddress = await mocInrate.commissionsAddress();
    contractInfo.getRiskProInterestAddress = await mocInrate.getRiskProInterestAddress();
    contractInfo.getRiskProRate = await mocInrate.getRiskProRate();
    contractInfo.MINT_RISKPRO_FEES_RESERVE = await mocInrate.commissionRatesByTxType(
      await mocInrate.MINT_RISKPRO_FEES_RESERVE()
    );
    contractInfo.REDEEM_RISKPRO_FEES_RESERVE = await mocInrate.commissionRatesByTxType(
      await mocInrate.REDEEM_RISKPRO_FEES_RESERVE()
    );
    contractInfo.MINT_STABLETOKEN_FEES_RESERVE = await mocInrate.commissionRatesByTxType(
      await mocInrate.MINT_STABLETOKEN_FEES_RESERVE()
    );
    contractInfo.REDEEM_STABLETOKEN_FEES_RESERVE = await mocInrate.commissionRatesByTxType(
      await mocInrate.REDEEM_STABLETOKEN_FEES_RESERVE()
    );
    contractInfo.MINT_RISKPROX_FEES_RESERVE = await mocInrate.commissionRatesByTxType(
      await mocInrate.MINT_RISKPROX_FEES_RESERVE()
    );
    contractInfo.REDEEM_RISKPROX_FEES_RESERVE = await mocInrate.commissionRatesByTxType(
      await mocInrate.REDEEM_RISKPROX_FEES_RESERVE()
    );
    contractInfo.MINT_RISKPRO_FEES_MOC = await mocInrate.commissionRatesByTxType(
      await mocInrate.MINT_RISKPRO_FEES_MOC()
    );
    contractInfo.REDEEM_RISKPRO_FEES_MOC = await mocInrate.commissionRatesByTxType(
      await mocInrate.REDEEM_RISKPRO_FEES_MOC()
    );
    contractInfo.MINT_STABLETOKEN_FEES_MOC = await mocInrate.commissionRatesByTxType(
      await mocInrate.MINT_STABLETOKEN_FEES_MOC()
    );
    contractInfo.REDEEM_STABLETOKEN_FEES_MOC = await mocInrate.commissionRatesByTxType(
      await mocInrate.REDEEM_STABLETOKEN_FEES_MOC()
    );
    contractInfo.MINT_RISKPROX_FEES_MOC = await mocInrate.commissionRatesByTxType(
      await mocInrate.MINT_RISKPROX_FEES_MOC()
    );
    contractInfo.REDEEM_RISKPROX_FEES_MOC = await mocInrate.commissionRatesByTxType(
      await mocInrate.REDEEM_RISKPROX_FEES_MOC()
    );

    console.log('MoCInrate Contract Current Storage');
    console.log();
    console.log(`Commission Address: ${contractInfo.commissionAddress}`);
    console.log(`RIFP Interest Address: ${contractInfo.getRiskProInterestAddress}`);
    console.log(
      `RIFP Rate: ${contractInfo.getRiskProRate} (${BigNumber(contractInfo.getRiskProRate)
        .div(PRECISION)
        .toString()})`
    );
    console.log(
      `MINT_RISKPRO_FEES_RESERVE: ${contractInfo.MINT_RISKPRO_FEES_RESERVE} (${BigNumber(
        contractInfo.MINT_RISKPRO_FEES_RESERVE
      )
        .div(PRECISION)
        .toString()})`
    );
    console.log(
      `REDEEM_RISKPRO_FEES_RESERVE: ${contractInfo.REDEEM_RISKPRO_FEES_RESERVE} (${BigNumber(
        contractInfo.REDEEM_RISKPRO_FEES_RESERVE
      )
        .div(PRECISION)
        .toString()})`
    );
    console.log(
      `MINT_STABLETOKEN_FEES_RESERVE: ${contractInfo.MINT_STABLETOKEN_FEES_RESERVE} (${BigNumber(
        contractInfo.MINT_STABLETOKEN_FEES_RESERVE
      )
        .div(PRECISION)
        .toString()})`
    );
    console.log(
      `REDEEM_STABLETOKEN_FEES_RESERVE: ${
        contractInfo.REDEEM_STABLETOKEN_FEES_RESERVE
      } (${BigNumber(contractInfo.REDEEM_STABLETOKEN_FEES_RESERVE)
        .div(PRECISION)
        .toString()})`
    );
    console.log(
      `MINT_RISKPROX_FEES_RESERVE: ${contractInfo.MINT_RISKPROX_FEES_RESERVE} (${BigNumber(
        contractInfo.MINT_RISKPROX_FEES_RESERVE
      )
        .div(PRECISION)
        .toString()})`
    );
    console.log(
      `REDEEM_RISKPROX_FEES_RESERVE: ${contractInfo.REDEEM_RISKPROX_FEES_RESERVE} (${BigNumber(
        contractInfo.REDEEM_RISKPROX_FEES_RESERVE
      )
        .div(PRECISION)
        .toString()})`
    );
    console.log(
      `MINT_RISKPRO_FEES_MOC: ${contractInfo.MINT_RISKPRO_FEES_MOC} (${BigNumber(
        contractInfo.MINT_RISKPRO_FEES_MOC
      )
        .div(PRECISION)
        .toString()})`
    );
    console.log(
      `REDEEM_RISKPRO_FEES_MOC: ${contractInfo.REDEEM_RISKPRO_FEES_MOC} (${BigNumber(
        contractInfo.REDEEM_RISKPRO_FEES_MOC
      )
        .div(PRECISION)
        .toString()})`
    );
    console.log(
      `MINT_STABLETOKEN_FEES_MOC: ${contractInfo.MINT_STABLETOKEN_FEES_MOC} (${BigNumber(
        contractInfo.MINT_STABLETOKEN_FEES_MOC
      )
        .div(PRECISION)
        .toString()})`
    );
    console.log(
      `REDEEM_STABLETOKEN_FEES_MOC: ${contractInfo.REDEEM_STABLETOKEN_FEES_MOC} (${BigNumber(
        contractInfo.REDEEM_STABLETOKEN_FEES_MOC
      )
        .div(PRECISION)
        .toString()})`
    );
    console.log(
      `MINT_RISKPROX_FEES_MOC: ${contractInfo.MINT_RISKPROX_FEES_MOC} (${BigNumber(
        contractInfo.MINT_RISKPROX_FEES_MOC
      )
        .div(PRECISION)
        .toString()})`
    );
    console.log(
      `REDEEM_RISKPROX_FEES_MOC: ${contractInfo.REDEEM_RISKPROX_FEES_MOC} (${BigNumber(
        contractInfo.REDEEM_RISKPROX_FEES_MOC
      )
        .div(PRECISION)
        .toString()})`
    );
  } catch (error) {
    callback(error);
  }

  callback();
};
