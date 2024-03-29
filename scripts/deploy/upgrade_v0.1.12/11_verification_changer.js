/* eslint-disable no-console */
const Governor = artifacts.require('moc-governance/contracts/Governance/Governor.sol');
const BatchChanger = artifacts.require('./changers/BatchChanger.sol');
const UpgradeDelegator = artifacts.require('./UpgradeDelegator.sol');
const MoCSettlement = artifacts.require('./MoCSettlement.sol');
const CommissionSplitter = artifacts.require('./CommissionSplitter.sol');
const MoCInrate = artifacts.require('./MoCInrate.sol');
const MoCState = artifacts.require('./MoCState.sol');

const BigNumber = require('bignumber.js');
const { getConfig, getNetwork, shouldExecuteChanges } = require('../helper');

const getCommissionsArray = async config => {
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
      fee: BigNumber(config.valuesToAssign.commissionRates.MINT_RISKPRO_FEES_RESERVE)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: REDEEM_RISKPRO_FEES_RESERVE,
      fee: BigNumber(config.valuesToAssign.commissionRates.REDEEM_RISKPRO_FEES_RESERVE)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: MINT_STABLETOKEN_FEES_RESERVE,
      fee: BigNumber(config.valuesToAssign.commissionRates.MINT_STABLETOKEN_FEES_RESERVE)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: REDEEM_STABLETOKEN_FEES_RESERVE,
      fee: BigNumber(config.valuesToAssign.commissionRates.REDEEM_STABLETOKEN_FEES_RESERVE)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: MINT_RISKPROX_FEES_RESERVE,
      fee: BigNumber(config.valuesToAssign.commissionRates.MINT_RISKPROX_FEES_RESERVE)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: REDEEM_RISKPROX_FEES_RESERVE,
      fee: BigNumber(config.valuesToAssign.commissionRates.REDEEM_RISKPROX_FEES_RESERVE)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: MINT_RISKPRO_FEES_MOC,
      fee: BigNumber(config.valuesToAssign.commissionRates.MINT_RISKPRO_FEES_MOC)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: REDEEM_RISKPRO_FEES_MOC,
      fee: BigNumber(config.valuesToAssign.commissionRates.REDEEM_RISKPRO_FEES_MOC)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: MINT_STABLETOKEN_FEES_MOC,
      fee: BigNumber(config.valuesToAssign.commissionRates.MINT_STABLETOKEN_FEES_MOC)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: REDEEM_STABLETOKEN_FEES_MOC,
      fee: BigNumber(config.valuesToAssign.commissionRates.REDEEM_STABLETOKEN_FEES_MOC)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: MINT_RISKPROX_FEES_MOC,
      fee: BigNumber(config.valuesToAssign.commissionRates.MINT_RISKPROX_FEES_MOC)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: REDEEM_RISKPROX_FEES_MOC,
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
    const error = [];
    let msjError;

    console.log(`BatchChanger Deploy at: ${config.changerAddresses.BatchChanger}`);
    const batchChanger = await BatchChanger.at(config.changerAddresses.BatchChanger);

    const lengthData = await batchChanger.datasToExecuteLength();
    const lengthTarget = await batchChanger.targetsToExecuteLength();

    const upgradeDelegatorAddress = config.implementationAddresses.UpgradeDelegator;
    const upgradeDelegator = await UpgradeDelegator.at(upgradeDelegatorAddress);

    console.log('Length Data: ', lengthData.toString());
    console.log('Length Target: ', lengthTarget.toString());

    if (lengthData.toString() !== lengthTarget.toString()) {
      msjError = 'ERROR! Not valid array length';
      console.log(msjError);
      error.push(msjError);
    } else {
      console.log('OK! length of arrays');
    }

    // STEP 0 MoC.sol Implementation Upgrade

    let step = 0;
    let targetBatch = await batchChanger.targetsToExecute(step);
    let dataBatch = await batchChanger.datasToExecute(step);

    let target = upgradeDelegatorAddress;
    let encodeData = upgradeDelegator.contract.methods
      .upgrade(config.proxyAddresses.MoC, config.implementationAddresses.MoC)
      .encodeABI();

    if (dataBatch === encodeData && target === targetBatch) {
      console.log(
        `OK! STEP 0. MoC.sol [${config.proxyAddresses.MoC}] Upgrade to implementation [${config.implementationAddresses.MoC}].`
      );
    } else {
      msjError = 'ERROR! NOT VALID! STEP 0.';
      console.log(msjError);
      error.push(msjError);
    }

    // STEP 1 MoCExchange.sol Implementation Upgrade

    step = 1;
    targetBatch = await batchChanger.targetsToExecute(step);
    dataBatch = await batchChanger.datasToExecute(step);

    target = upgradeDelegatorAddress;
    encodeData = upgradeDelegator.contract.methods
      .upgrade(config.proxyAddresses.MoCExchange, config.implementationAddresses.MoCExchange)
      .encodeABI();

    if (dataBatch === encodeData && target === targetBatch) {
      console.log(
        `OK! STEP ${step}. MoCExchange.sol [${config.proxyAddresses.MoCExchange}] Upgrade to implementation [${config.implementationAddresses.MoCExchange}].`
      );
    } else {
      msjError = `ERROR! NOT VALID! STEP: ${step}.`;
      console.log(msjError);
      error.push(msjError);
    }

    // STEP 2 MoCSettlement.sol Implementation Upgrade

    step = 2;
    targetBatch = await batchChanger.targetsToExecute(step);
    dataBatch = await batchChanger.datasToExecute(step);

    target = upgradeDelegatorAddress;
    encodeData = upgradeDelegator.contract.methods
      .upgrade(config.proxyAddresses.MoCSettlement, config.implementationAddresses.MoCSettlement)
      .encodeABI();

    if (dataBatch === encodeData && target === targetBatch) {
      console.log(
        `OK! STEP ${step}. MoCSettlement.sol [${config.proxyAddresses.MoCSettlement}] Upgrade to implementation [${config.implementationAddresses.MoCSettlement}].`
      );
    } else {
      msjError = `ERROR! NOT VALID! STEP: ${step}.`;
      console.log(msjError);
      error.push(msjError);
    }

    // STEP 3 MoCInrate.sol Implementation Upgrade

    step = 3;
    targetBatch = await batchChanger.targetsToExecute(step);
    dataBatch = await batchChanger.datasToExecute(step);

    target = upgradeDelegatorAddress;
    encodeData = upgradeDelegator.contract.methods
      .upgrade(config.proxyAddresses.MoCInrate, config.implementationAddresses.MoCInrate)
      .encodeABI();

    if (dataBatch === encodeData && target === targetBatch) {
      console.log(
        `OK! STEP ${step}. MoCInrate.sol [${config.proxyAddresses.MoCInrate}] Upgrade to implementation [${config.implementationAddresses.MoCInrate}].`
      );
    } else {
      msjError = `ERROR! NOT VALID! STEP: ${step}.`;
      console.log(msjError);
      error.push(msjError);
    }

    // STEP 4 MoCState.sol Implementation Upgrade

    step = 4;
    targetBatch = await batchChanger.targetsToExecute(step);
    dataBatch = await batchChanger.datasToExecute(step);

    target = upgradeDelegatorAddress;
    encodeData = upgradeDelegator.contract.methods
      .upgrade(config.proxyAddresses.MoCState, config.implementationAddresses.MoCState)
      .encodeABI();

    if (dataBatch === encodeData && target === targetBatch) {
      console.log(
        `OK! STEP ${step}. MoCState.sol [${config.proxyAddresses.MoCState}] Upgrade to implementation [${config.implementationAddresses.MoCState}].`
      );
    } else {
      msjError = `ERROR! NOT VALID! STEP: ${step}.`;
      console.log(msjError);
      error.push(msjError);
    }

    // STEP 5 Prepare MoCSettlement

    step = 5;
    targetBatch = await batchChanger.targetsToExecute(step);
    dataBatch = await batchChanger.datasToExecute(step);

    target = config.proxyAddresses.MoCSettlement;
    const moCSettlement = await MoCSettlement.at(target);

    encodeData = moCSettlement.contract.methods.fixTasksPointer().encodeABI();

    if (dataBatch === encodeData && target === targetBatch) {
      console.log(`OK! STEP ${step}. Prepare moCSettlement.sol execute: [fixTasksPointer()]`);
    } else {
      msjError = `ERROR! NOT VALID! STEP: ${step}.`;
      console.log(msjError);
      error.push(msjError);
    }

    // STEP 6 Prepare MoCInrate - setCommissionRateByTxType

    step = 6;
    let varStep = 6;

    target = config.proxyAddresses.MoCInrate;
    const moCInrate = await MoCInrate.at(target);

    const commissions = await getCommissionsArray(config);
    /* eslint-disable no-await-in-loop */
    for (let i = 0; i < commissions.length; i++) {
      targetBatch = await batchChanger.targetsToExecute(varStep);
      dataBatch = await batchChanger.datasToExecute(varStep);

      encodeData = moCInrate.contract.methods
        .setCommissionRateByTxType(commissions[i].txType, commissions[i].fee)
        .encodeABI();

      if (dataBatch === encodeData && target === targetBatch) {
        console.log(
          `OK! STEP ${varStep}. Prepare MoCInrate.sol execute: [setCommissionRateByTxType(${commissions[i].txType}, ${commissions[i].fee})]`
        );
      } else {
        msjError = `ERROR! NOT VALID! STEP: ${step}.`;
        console.log(msjError);
        error.push(msjError);
      }

      varStep += 1;
    }

    // STEP 18 Prepare MoCInrate - setCommissionsAddress
    step = 18;
    target = config.proxyAddresses.MoCInrate;

    targetBatch = await batchChanger.targetsToExecute(step);
    dataBatch = await batchChanger.datasToExecute(step);

    encodeData = moCInrate.contract.methods
      .setCommissionsAddress(config.proxyAddresses.CommissionSplitter)
      .encodeABI();

    if (dataBatch === encodeData && target === targetBatch) {
      console.log(
        `OK! STEP ${step}. Prepare MoCInrate.sol execute: [setCommissionsAddress(${config.proxyAddresses.CommissionSplitter})]`
      );
    } else {
      msjError = `ERROR! NOT VALID! STEP: ${step}.`;
      console.log(msjError);
      error.push(msjError);
    }

    // STEP 19 Prepare MoCState - setMoCPriceProvider

    step = 19;
    targetBatch = await batchChanger.targetsToExecute(step);
    dataBatch = await batchChanger.datasToExecute(step);

    target = config.proxyAddresses.MoCState;
    const moCState = await MoCState.at(target);
    encodeData = moCState.contract.methods
      .setMoCPriceProvider(config.implementationAddresses.MoCPriceProvider)
      .encodeABI();

    if (dataBatch === encodeData && target === targetBatch) {
      console.log(
        `OK! STEP ${step}. Prepare moCState.sol execute: [setMoCPriceProvider(${config.implementationAddresses.MoCPriceProvider})]`
      );
    } else {
      msjError = `ERROR! NOT VALID! STEP: ${step}.`;
      console.log(msjError);
      error.push(msjError);
    }

    // STEP 20 Prepare MoCState - setMoCToken

    step = 20;
    targetBatch = await batchChanger.targetsToExecute(step);
    dataBatch = await batchChanger.datasToExecute(step);

    target = config.proxyAddresses.MoCState;
    encodeData = moCState.contract.methods
      .setMoCToken(config.implementationAddresses.MoCToken)
      .encodeABI();

    if (dataBatch === encodeData && target === targetBatch) {
      console.log(
        `OK! STEP ${step}. Prepare moCState.sol execute: [setMoCToken(${config.implementationAddresses.MoCToken})]`
      );
    } else {
      msjError = `ERROR! NOT VALID! STEP: ${step}.`;
      console.log(msjError);
      error.push(msjError);
    }

    // STEP 21 Prepare MoCState - setMoCVendors

    step = 21;
    targetBatch = await batchChanger.targetsToExecute(step);
    dataBatch = await batchChanger.datasToExecute(step);

    target = config.proxyAddresses.MoCState;
    encodeData = moCState.contract.methods
      .setMoCVendors(config.proxyAddresses.MoCVendors)
      .encodeABI();

    if (dataBatch === encodeData && target === targetBatch) {
      console.log(
        `OK! STEP ${step}. Prepare moCState.sol execute: [setMoCVendors(${config.proxyAddresses.MoCVendors})]`
      );
    } else {
      msjError = `ERROR! NOT VALID! STEP: ${step}.`;
      console.log(msjError);
      error.push(msjError);
    }

    // STEP 22 Prepare MoCState - setLiquidationEnabled

    step = 22;
    targetBatch = await batchChanger.targetsToExecute(step);
    dataBatch = await batchChanger.datasToExecute(step);

    target = config.proxyAddresses.MoCState;
    encodeData = moCState.contract.methods
      .setLiquidationEnabled(config.valuesToAssign.liquidationEnabled)
      .encodeABI();

    if (dataBatch === encodeData && target === targetBatch) {
      console.log(
        `OK! STEP ${step}. Prepare moCState.sol execute: [setLiquidationEnabled(${config.valuesToAssign.liquidationEnabled})]`
      );
    } else {
      msjError = `ERROR! NOT VALID! STEP: ${step}.`;
      console.log(msjError);
      error.push(msjError);
    }

    // STEP 23 Prepare MoCState - setProtected

    step = 23;
    targetBatch = await batchChanger.targetsToExecute(step);
    dataBatch = await batchChanger.datasToExecute(step);

    target = config.proxyAddresses.MoCState;

    const mocPrecision = 10 ** 18;
    const protectedValue = BigNumber(config.valuesToAssign.protected)
      .times(mocPrecision)
      .toString();
    encodeData = moCState.contract.methods.setProtected(protectedValue).encodeABI();

    if (dataBatch === encodeData && target === targetBatch) {
      console.log(
        `OK! STEP ${step}. Prepare moCState.sol execute: [setProtected(${config.valuesToAssign.protected})]`
      );
    } else {
      msjError = `ERROR! NOT VALID! STEP: ${step}.`;
      console.log(msjError);
      error.push(msjError);
    }

    if (error.length === 0) {
      const governor = await Governor.at(config.implementationAddresses.Governor);
      if (shouldExecuteChanges(network)) {
        // Execute changes in contracts
        console.log('Execute change - BatchChanger');
        await governor.executeChange(batchChanger.address);
      } else {
        console.log('Executing test governor execute change');
        await governor.contract.methods
          .executeChange(config.changerAddresses.BatchChanger)
          .call({ from: config.governorOwnerAddress });
      }
    } else {
      console.log(
        'The change was not executed by governor, becase they have this errors: \n *',
        error.join('\n * ')
      );
    }
  } catch (error) {
    callback(error);
  }

  callback();
};
