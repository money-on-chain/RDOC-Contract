/* eslint-disable no-console */
const BigNumber = require('bignumber.js');

const MoCExchange = artifacts.require('./MoCExchange.sol');
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

    const moCExchangeAddress = config.proxyAddresses.MoCExchange;
    const moCExchange = await MoCExchange.at(moCExchangeAddress);

    const fluxInfo = {};
    fluxInfo.maxAbsoluteOperation = await moCExchange.maxAbsoluteOperation();
    fluxInfo.maxOperationalDifference = await moCExchange.maxOperationalDifference();
    fluxInfo.decayBlockSpan = await moCExchange.decayBlockSpan();

    // accumulator increased by minting and redeeming stable token operations
    fluxInfo.absoluteAccumulator = await moCExchange.absoluteAccumulator();

    // accumulator increased by minting and decreased by redeeming stable token operations
    fluxInfo.differentialAccumulator = await moCExchange.differentialAccumulator();

    // last block number where an operation was submitted
    fluxInfo.lastOperationBlockNumber = await moCExchange.lastOperationBlockNumber();

    /**
    * @notice gets the max amount of reserve token allowed to operate to mint stable tokens with on the last block, restricted by accumulators
    * @return maxResAllowed minimum regarding maxAbsoluteOperation and maxOperationalDifference
    */

    fluxInfo.lastMaxReserveAllowedToMint = await moCExchange.lastMaxReserveAllowedToMint();

    /**
     * @notice gets the max amount of reserve token allowed to operate to mint stable tokens with, restricted by accumulators
     * @return maxResAllowed minimum regarding maxAbsoluteOperation and maxOperationalDifference
    */
    fluxInfo.maxReserveAllowedToMint = await moCExchange.maxReserveAllowedToMint();

    /**
    * @notice gets the max amount of reserve token allowed to operate to redeem stable tokens with, restricted by accumulators
    * @return maxResAllowed minimum regarding maxAbsoluteOperation and maxOperationalDifference
    */

    fluxInfo.maxReserveAllowedToRedeem = await moCExchange.maxReserveAllowedToRedeem();


    /**
   * @notice gets the max amount of reserve token allowed to operate to redeem stable tokens with on the last block, restricted by accumulators
   * @return maxResAllowed minimum regarding maxAbsoluteOperation and maxOperationalDifference
   */

    fluxInfo.lastMaxReserveAllowedToRedeem = await moCExchange.lastMaxReserveAllowedToRedeem();


    console.log("Flux Capacitors Getters")
    console.log("=======================")
    console.log('maxAbsoluteOperation: ', fromPrecision(fluxInfo.maxAbsoluteOperation).toString());
    console.log('maxOperationalDifference: ', fromPrecision(fluxInfo.maxOperationalDifference).toString());
    console.log('decayBlockSpan: ', fluxInfo.decayBlockSpan.toString());
    console.log('absoluteAccumulator: ', fromPrecision(fluxInfo.absoluteAccumulator).toString());
    console.log('differentialAccumulator: ', fromPrecision(fluxInfo.differentialAccumulator).toString());
    console.log('lastOperationBlockNumber: ', fluxInfo.lastOperationBlockNumber.toString());
    console.log('lastMaxReserveAllowedToMint: ', fromPrecision(fluxInfo.lastMaxReserveAllowedToMint).toString());
    console.log('maxReserveAllowedToMint: ', fromPrecision(fluxInfo.maxReserveAllowedToMint).toString());
    console.log('maxReserveAllowedToRedeem: ', fromPrecision(fluxInfo.maxReserveAllowedToRedeem).toString());
    console.log('lastMaxReserveAllowedToRedeem: ', fromPrecision(fluxInfo.lastMaxReserveAllowedToRedeem).toString());

  } catch (error) {
    callback(error);
  }

  callback();
};
