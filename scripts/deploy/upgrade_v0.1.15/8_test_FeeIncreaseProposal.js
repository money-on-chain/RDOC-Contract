/* eslint-disable no-console */
const BigNumber = require('bignumber.js');

const FeeIncreaseProposal = artifacts.require(
  './changers/proposal_fee_increase/FeeIncreaseProposal.sol'
);
const { getConfig, getNetwork } = require('../helper');

const PRECISION = 10 ** 18;

const MINT_RISKPRO_FEES_RESERVE = '0';
const REDEEM_RISKPRO_FEES_RESERVE = '1';
const MINT_STABLETOKEN_FEES_RESERVE = '2';
const REDEEM_STABLETOKEN_FEES_RESERVE = '3';
const MINT_RISKPROX_FEES_RESERVE = '4';
const REDEEM_RISKPROX_FEES_RESERVE = '5';
const MINT_RISKPRO_FEES_MOC = '6';
const REDEEM_RISKPRO_FEES_MOC = '7';
const MINT_STABLETOKEN_FEES_MOC = '8';
const REDEEM_STABLETOKEN_FEES_MOC = '9';
const MINT_RISKPROX_FEES_MOC = '10';
const REDEEM_RISKPROX_FEES_MOC = '11';

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);
    const feeIncreaseProposalAddress = config.changerAddresses.FeeIncreaseProposal;
    const feeIncreaseProposal = await FeeIncreaseProposal.at(feeIncreaseProposalAddress);

    const contractInfo = {};
    contractInfo.commissionAddress = await feeIncreaseProposal.commissionAddress();
    contractInfo.riskProInterestAddress = await feeIncreaseProposal.riskProInterestAddress();
    contractInfo.riskProRate = await feeIncreaseProposal.riskProRate();
    contractInfo.riskProRateFormatted = BigNumber(contractInfo.riskProRate).div(PRECISION);
    contractInfo.commissionRates = {};
    contractInfo.commissionRates.MINT_RISKPRO_FEES_RESERVE = await feeIncreaseProposal.commissionRates(
      MINT_RISKPRO_FEES_RESERVE
    );
    contractInfo.commissionRates.REDEEM_RISKPRO_FEES_RESERVE = await feeIncreaseProposal.commissionRates(
      REDEEM_RISKPRO_FEES_RESERVE
    );
    contractInfo.commissionRates.MINT_STABLETOKEN_FEES_RESERVE = await feeIncreaseProposal.commissionRates(
      MINT_STABLETOKEN_FEES_RESERVE
    );
    contractInfo.commissionRates.REDEEM_STABLETOKEN_FEES_RESERVE = await feeIncreaseProposal.commissionRates(
      REDEEM_STABLETOKEN_FEES_RESERVE
    );
    contractInfo.commissionRates.MINT_RISKPROX_FEES_RESERVE = await feeIncreaseProposal.commissionRates(
      MINT_RISKPROX_FEES_RESERVE
    );
    contractInfo.commissionRates.REDEEM_RISKPROX_FEES_RESERVE = await feeIncreaseProposal.commissionRates(
      REDEEM_RISKPROX_FEES_RESERVE
    );
    contractInfo.commissionRates.MINT_RISKPRO_FEES_MOC = await feeIncreaseProposal.commissionRates(
      MINT_RISKPRO_FEES_MOC
    );
    contractInfo.commissionRates.REDEEM_RISKPRO_FEES_MOC = await feeIncreaseProposal.commissionRates(
      REDEEM_RISKPRO_FEES_MOC
    );
    contractInfo.commissionRates.MINT_STABLETOKEN_FEES_MOC = await feeIncreaseProposal.commissionRates(
      MINT_STABLETOKEN_FEES_MOC
    );
    contractInfo.commissionRates.REDEEM_STABLETOKEN_FEES_MOC = await feeIncreaseProposal.commissionRates(
      REDEEM_STABLETOKEN_FEES_MOC
    );
    contractInfo.commissionRates.MINT_RISKPROX_FEES_MOC = await feeIncreaseProposal.commissionRates(
      MINT_RISKPROX_FEES_MOC
    );
    contractInfo.commissionRates.REDEEM_RISKPROX_FEES_MOC = await feeIncreaseProposal.commissionRates(
      REDEEM_RISKPROX_FEES_MOC
    );

    console.log('Changer Storage Validation');
    console.log();

    if (
      contractInfo.riskProInterestAddress === config.FeeIncreaseProposal.ROC.riskProInterestAddress
    ) {
      console.log('OK. 1. riskProInterestAddress: ', contractInfo.riskProInterestAddress);
    } else {
      console.log('ERROR. 1. riskProInterestAddress: ', contractInfo.riskProInterestAddress);
    }

    if (contractInfo.commissionAddress === config.FeeIncreaseProposal.ROC.commissionAddress) {
      console.log('OK. 2. commissionAddress: ', contractInfo.commissionAddress);
    } else {
      console.log('ERROR. 2. commissionAddress: ', contractInfo.commissionAddress);
    }

    if (contractInfo.riskProRate.toString() === config.FeeIncreaseProposal.ROC.riskProRate) {
      console.log(
        `OK. 3. riskProRate: ${contractInfo.riskProRate.toString()} (${contractInfo.riskProRateFormatted.toString()}) `
      );
    } else {
      console.log(
        `ERROR. 3. riskProRate: ${contractInfo.riskProRate.toString()} (${contractInfo.riskProRateFormatted.toString()}) `
      );
    }

    console.log();
    console.log('Commission Operation parameters');
    console.log();

    // MINT_RISKPRO_FEES_RESERVE
    if (
      contractInfo.commissionRates.MINT_RISKPRO_FEES_RESERVE.fee.toString() ===
      BigNumber(config.FeeIncreaseProposal.ROC.commissionRates.MINT_RISKPRO_FEES_RESERVE)
        .times(PRECISION)
        .toString()
    ) {
      console.log(
        `OK. 10. MINT_RISKPRO_FEES_RESERVE: ${contractInfo.commissionRates.MINT_RISKPRO_FEES_RESERVE.fee.toString()} (${BigNumber(
          contractInfo.commissionRates.MINT_RISKPRO_FEES_RESERVE.fee
        )
          .div(PRECISION)
          .toString()}) `
      );
    } else {
      console.log(
        `ERROR. 10. MINT_RISKPRO_FEES_RESERVE: ${contractInfo.commissionRates.MINT_RISKPRO_FEES_RESERVE.fee.toString()} (${BigNumber(
          contractInfo.commissionRates.MINT_RISKPRO_FEES_RESERVE.fee
        )
          .div(PRECISION)
          .toString()}) `
      );
    }

    // REDEEM_RISKPRO_FEES_RESERVE

    if (
      contractInfo.commissionRates.REDEEM_RISKPRO_FEES_RESERVE.fee.toString() ===
      BigNumber(config.FeeIncreaseProposal.ROC.commissionRates.REDEEM_RISKPRO_FEES_RESERVE)
        .times(PRECISION)
        .toString()
    ) {
      console.log(
        `OK. 11. REDEEM_RISKPRO_FEES_RESERVE: ${contractInfo.commissionRates.REDEEM_RISKPRO_FEES_RESERVE.fee.toString()} (${BigNumber(
          contractInfo.commissionRates.REDEEM_RISKPRO_FEES_RESERVE.fee
        )
          .div(PRECISION)
          .toString()}) `
      );
    } else {
      console.log(
        `ERROR. 11. REDEEM_RISKPRO_FEES_RESERVE: ${contractInfo.commissionRates.REDEEM_RISKPRO_FEES_RESERVE.fee.toString()} (${BigNumber(
          contractInfo.commissionRates.REDEEM_RISKPRO_FEES_RESERVE.fee
        )
          .div(PRECISION)
          .toString()}) `
      );
    }

    // MINT_STABLETOKEN_FEES_RESERVE

    if (
      contractInfo.commissionRates.MINT_STABLETOKEN_FEES_RESERVE.fee.toString() ===
      BigNumber(config.FeeIncreaseProposal.ROC.commissionRates.MINT_STABLETOKEN_FEES_RESERVE)
        .times(PRECISION)
        .toString()
    ) {
      console.log(
        `OK. 12. MINT_STABLETOKEN_FEES_RESERVE: ${contractInfo.commissionRates.MINT_STABLETOKEN_FEES_RESERVE.fee.toString()} (${BigNumber(
          contractInfo.commissionRates.MINT_STABLETOKEN_FEES_RESERVE.fee
        )
          .div(PRECISION)
          .toString()}) `
      );
    } else {
      console.log(
        `ERROR. 12. MINT_STABLETOKEN_FEES_RESERVE: ${contractInfo.commissionRates.MINT_STABLETOKEN_FEES_RESERVE.fee.toString()} (${BigNumber(
          contractInfo.commissionRates.MINT_STABLETOKEN_FEES_RESERVE.fee
        )
          .div(PRECISION)
          .toString()}) `
      );
    }

    // REDEEM_STABLETOKEN_FEES_RESERVE

    if (
      contractInfo.commissionRates.REDEEM_STABLETOKEN_FEES_RESERVE.fee.toString() ===
      BigNumber(config.FeeIncreaseProposal.ROC.commissionRates.REDEEM_STABLETOKEN_FEES_RESERVE)
        .times(PRECISION)
        .toString()
    ) {
      console.log(
        `OK. 13. REDEEM_STABLETOKEN_FEES_RESERVE: ${contractInfo.commissionRates.REDEEM_STABLETOKEN_FEES_RESERVE.fee.toString()} (${BigNumber(
          contractInfo.commissionRates.REDEEM_STABLETOKEN_FEES_RESERVE.fee
        )
          .div(PRECISION)
          .toString()}) `
      );
    } else {
      console.log(
        `ERROR. 13. REDEEM_STABLETOKEN_FEES_RESERVE: ${contractInfo.commissionRates.REDEEM_STABLETOKEN_FEES_RESERVE.fee.toString()} (${BigNumber(
          contractInfo.commissionRates.REDEEM_STABLETOKEN_FEES_RESERVE.fee
        )
          .div(PRECISION)
          .toString()}) `
      );
    }

    // MINT_RISKPROX_FEES_RESERVE

    if (
      contractInfo.commissionRates.MINT_RISKPROX_FEES_RESERVE.fee.toString() ===
      BigNumber(config.FeeIncreaseProposal.ROC.commissionRates.MINT_RISKPROX_FEES_RESERVE)
        .times(PRECISION)
        .toString()
    ) {
      console.log(
        `OK. 14. MINT_RISKPROX_FEES_RESERVE: ${contractInfo.commissionRates.MINT_RISKPROX_FEES_RESERVE.fee.toString()} (${BigNumber(
          contractInfo.commissionRates.MINT_RISKPROX_FEES_RESERVE.fee
        )
          .div(PRECISION)
          .toString()}) `
      );
    } else {
      console.log(
        `ERROR. 14. MINT_RISKPROX_FEES_RESERVE: ${contractInfo.commissionRates.MINT_RISKPROX_FEES_RESERVE.fee.toString()} (${BigNumber(
          contractInfo.commissionRates.MINT_RISKPROX_FEES_RESERVE.fee
        )
          .div(PRECISION)
          .toString()}) `
      );
    }

    // REDEEM_RISKPROX_FEES_RESERVE

    if (
      contractInfo.commissionRates.REDEEM_RISKPROX_FEES_RESERVE.fee.toString() ===
      BigNumber(config.FeeIncreaseProposal.ROC.commissionRates.REDEEM_RISKPROX_FEES_RESERVE)
        .times(PRECISION)
        .toString()
    ) {
      console.log(
        `OK. 15. REDEEM_RISKPROX_FEES_RESERVE: ${contractInfo.commissionRates.REDEEM_RISKPROX_FEES_RESERVE.fee.toString()} (${BigNumber(
          contractInfo.commissionRates.REDEEM_RISKPROX_FEES_RESERVE.fee
        )
          .div(PRECISION)
          .toString()}) `
      );
    } else {
      console.log(
        `ERROR. 15. REDEEM_RISKPROX_FEES_RESERVE: ${contractInfo.commissionRates.REDEEM_RISKPROX_FEES_RESERVE.fee.toString()} (${BigNumber(
          contractInfo.commissionRates.REDEEM_RISKPROX_FEES_RESERVE.fee
        )
          .div(PRECISION)
          .toString()}) `
      );
    }

    // MINT_RISKPRO_FEES_MOC

    if (
      contractInfo.commissionRates.MINT_RISKPRO_FEES_MOC.fee.toString() ===
      BigNumber(config.FeeIncreaseProposal.ROC.commissionRates.MINT_RISKPRO_FEES_MOC)
        .times(PRECISION)
        .toString()
    ) {
      console.log(
        `OK. 16. MINT_RISKPRO_FEES_MOC: ${contractInfo.commissionRates.MINT_RISKPRO_FEES_MOC.fee.toString()} (${BigNumber(
          contractInfo.commissionRates.MINT_RISKPRO_FEES_MOC.fee
        )
          .div(PRECISION)
          .toString()}) `
      );
    } else {
      console.log(
        `ERROR. 16. MINT_RISKPRO_FEES_MOC: ${contractInfo.commissionRates.MINT_RISKPRO_FEES_MOC.fee.toString()} (${BigNumber(
          contractInfo.commissionRates.MINT_RISKPRO_FEES_MOC.fee
        )
          .div(PRECISION)
          .toString()}) `
      );
    }

    // REDEEM_RISKPRO_FEES_MOC

    if (
      contractInfo.commissionRates.REDEEM_RISKPRO_FEES_MOC.fee.toString() ===
      BigNumber(config.FeeIncreaseProposal.ROC.commissionRates.REDEEM_RISKPRO_FEES_MOC)
        .times(PRECISION)
        .toString()
    ) {
      console.log(
        `OK. 17. REDEEM_RISKPRO_FEES_MOC: ${contractInfo.commissionRates.REDEEM_RISKPRO_FEES_MOC.fee.toString()} (${BigNumber(
          contractInfo.commissionRates.REDEEM_RISKPRO_FEES_MOC.fee
        )
          .div(PRECISION)
          .toString()}) `
      );
    } else {
      console.log(
        `ERROR. 17. REDEEM_RISKPRO_FEES_MOC: ${contractInfo.commissionRates.REDEEM_RISKPRO_FEES_MOC.fee.toString()} (${BigNumber(
          contractInfo.commissionRates.REDEEM_RISKPRO_FEES_MOC.fee
        )
          .div(PRECISION)
          .toString()}) `
      );
    }

    // MINT_STABLETOKEN_FEES_MOC

    if (
      contractInfo.commissionRates.MINT_STABLETOKEN_FEES_MOC.fee.toString() ===
      BigNumber(config.FeeIncreaseProposal.ROC.commissionRates.MINT_STABLETOKEN_FEES_MOC)
        .times(PRECISION)
        .toString()
    ) {
      console.log(
        `OK. 18. MINT_STABLETOKEN_FEES_MOC: ${contractInfo.commissionRates.MINT_STABLETOKEN_FEES_MOC.fee.toString()} (${BigNumber(
          contractInfo.commissionRates.MINT_STABLETOKEN_FEES_MOC.fee
        )
          .div(PRECISION)
          .toString()}) `
      );
    } else {
      console.log(
        `ERROR. 18. MINT_STABLETOKEN_FEES_MOC: ${contractInfo.commissionRates.MINT_STABLETOKEN_FEES_MOC.fee.toString()} (${BigNumber(
          contractInfo.commissionRates.MINT_STABLETOKEN_FEES_MOC.fee
        )
          .div(PRECISION)
          .toString()}) `
      );
    }

    // REDEEM_STABLETOKEN_FEES_MOC

    if (
      contractInfo.commissionRates.REDEEM_STABLETOKEN_FEES_MOC.fee.toString() ===
      BigNumber(config.FeeIncreaseProposal.ROC.commissionRates.REDEEM_STABLETOKEN_FEES_MOC)
        .times(PRECISION)
        .toString()
    ) {
      console.log(
        `OK. 19. REDEEM_STABLETOKEN_FEES_MOC: ${contractInfo.commissionRates.REDEEM_STABLETOKEN_FEES_MOC.fee.toString()} (${BigNumber(
          contractInfo.commissionRates.REDEEM_STABLETOKEN_FEES_MOC.fee
        )
          .div(PRECISION)
          .toString()}) `
      );
    } else {
      console.log(
        `ERROR. 19. REDEEM_STABLETOKEN_FEES_MOC: ${contractInfo.commissionRates.REDEEM_STABLETOKEN_FEES_MOC.fee.toString()} (${BigNumber(
          contractInfo.commissionRates.REDEEM_STABLETOKEN_FEES_MOC.fee
        )
          .div(PRECISION)
          .toString()}) `
      );
    }

    // MINT_RISKPROX_FEES_MOC

    if (
      contractInfo.commissionRates.MINT_RISKPROX_FEES_MOC.fee.toString() ===
      BigNumber(config.FeeIncreaseProposal.ROC.commissionRates.MINT_RISKPROX_FEES_MOC)
        .times(PRECISION)
        .toString()
    ) {
      console.log(
        `OK. 20. MINT_RISKPROX_FEES_MOC: ${contractInfo.commissionRates.MINT_RISKPROX_FEES_MOC.fee.toString()} (${BigNumber(
          contractInfo.commissionRates.MINT_RISKPROX_FEES_MOC.fee
        )
          .div(PRECISION)
          .toString()}) `
      );
    } else {
      console.log(
        `ERROR. 20. MINT_RISKPROX_FEES_MOC: ${contractInfo.commissionRates.MINT_RISKPROX_FEES_MOC.fee.toString()} (${BigNumber(
          contractInfo.commissionRates.MINT_RISKPROX_FEES_MOC.fee
        )
          .div(PRECISION)
          .toString()}) `
      );
    }

    // REDEEM_RISKPROX_FEES_MOC

    if (
      contractInfo.commissionRates.REDEEM_RISKPROX_FEES_MOC.fee.toString() ===
      BigNumber(config.FeeIncreaseProposal.ROC.commissionRates.REDEEM_RISKPROX_FEES_MOC)
        .times(PRECISION)
        .toString()
    ) {
      console.log(
        `OK. 21. REDEEM_RISKPROX_FEES_MOC: ${contractInfo.commissionRates.REDEEM_RISKPROX_FEES_MOC.fee.toString()} (${BigNumber(
          contractInfo.commissionRates.REDEEM_RISKPROX_FEES_MOC.fee
        )
          .div(PRECISION)
          .toString()}) `
      );
    } else {
      console.log(
        `ERROR. 21. REDEEM_RISKPROX_FEES_MOC: ${contractInfo.commissionRates.REDEEM_RISKPROX_FEES_MOC.fee.toString()} (${BigNumber(
          contractInfo.commissionRates.REDEEM_RISKPROX_FEES_MOC.fee
        )
          .div(PRECISION)
          .toString()}) `
      );
    }
  } catch (error) {
    callback(error);
  }

  callback();
};
