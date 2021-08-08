/* eslint-disable no-console */
const Governor = artifacts.require('moc-governance/contracts/Governance/Governor.sol');
const BatchChanger = artifacts.require('./changers/BatchChanger.sol');

const UpgradeDelegator = artifacts.require('./UpgradeDelegator.sol');
const MoCSettlement = artifacts.require('./MoCSettlement.sol');
const CommissionSplitter = artifacts.require('./CommissionSplitter.sol');
const MoCInrate = artifacts.require('./MoCInrate.sol');
const MoCState = artifacts.require('./MoCState.sol');

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

    console.log('BatchChanger Deploy');
    const batchChanger = await BatchChanger.new();
    // Save changer address to config file
    config.changerAddresses.BatchChanger = batchChanger.address;
    saveConfig(config, configPath);

    const targets = [];
    const datas = [];

    console.log('Prepare Upgrades');
    const upgradeDelegatorAddress = config.implementationAddresses.UpgradeDelegator;
    const upgradeDelegator = await UpgradeDelegator.at(upgradeDelegatorAddress);
    // MoC
    targets.push(upgradeDelegatorAddress);
    datas.push(
      upgradeDelegator.contract.methods
        .upgrade(config.proxyAddresses.MoC, config.implementationAddresses.MoC)
        .encodeABI()
    );
    // MoCExchange
    targets.push(upgradeDelegatorAddress);
    datas.push(
      upgradeDelegator.contract.methods
        .upgrade(config.proxyAddresses.MoCExchange, config.implementationAddresses.MoCExchange)
        .encodeABI()
    );
    // MoCExchange
    targets.push(upgradeDelegatorAddress);
    datas.push(
      upgradeDelegator.contract.methods
        .upgrade(config.proxyAddresses.MoCSettlement, config.implementationAddresses.MoCSettlement)
        .encodeABI()
    );
    // CommissionSplitter
    targets.push(upgradeDelegatorAddress);
    datas.push(
      upgradeDelegator.contract.methods
        .upgrade(
          config.proxyAddresses.CommissionSplitter,
          config.implementationAddresses.CommissionSplitter
        )
        .encodeABI()
    );
    // MoCInrate
    targets.push(upgradeDelegatorAddress);
    datas.push(
      upgradeDelegator.contract.methods
        .upgrade(config.proxyAddresses.MoCInrate, config.implementationAddresses.MoCInrate)
        .encodeABI()
    );
    // MoCInrate
    targets.push(upgradeDelegatorAddress);
    datas.push(
      upgradeDelegator.contract.methods
        .upgrade(config.proxyAddresses.MoCState, config.implementationAddresses.MoCState)
        .encodeABI()
    );

    console.log('Prepare MoCSettlement');
    const moCSettlementAddress = config.proxyAddresses.MoCSettlement;
    const moCSettlement = await MoCSettlement.at(moCSettlementAddress);
    // fixTasksPointer
    targets.push(moCSettlementAddress);
    datas.push(moCSettlement.contract.methods.fixTasksPointer().encodeABI());

    console.log('Prepare CommissionSplitter');
    const commissionSplitterAddress = config.proxyAddresses.CommissionSplitter;
    const commissionSplitter = await CommissionSplitter.at(commissionSplitterAddress);
    // setMocToken
    targets.push(commissionSplitterAddress);
    datas.push(
      commissionSplitter.contract.methods
        .setMocToken(config.implementationAddresses.MoCToken)
        .encodeABI()
    );
    // setMocTokenCommissionAddress
    targets.push(commissionSplitterAddress);
    datas.push(
      commissionSplitter.contract.methods
        .setMocTokenCommissionAddress(config.valuesToAssign.mocTokenCommissionsAddress)
        .encodeABI()
    );

    console.log('Prepare MoCInrate');
    const moCInrateAddress = config.proxyAddresses.MoCInrate;
    const moCInrate = await MoCInrate.at(moCInrateAddress);
    // Setting commissions
    const commissions = await getCommissionsArray(moCInrate)(config);
    for (let i = 0; i < commissions.length; i++) {
      targets.push(moCInrateAddress);
      datas.push(
        moCInrate.contract.methods
          .setCommissionRateByTxType(commissions[i].txType, commissions[i].fee)
          .encodeABI()
      );
    }

    console.log('Prepare MoCState');
    const moCStateAddress = config.proxyAddresses.MoCState;
    const moCState = await MoCState.at(moCStateAddress);
    // setMoCPriceProvider
    targets.push(moCStateAddress);
    datas.push(
      moCState.contract.methods
        .setMoCPriceProvider(config.implementationAddresses.MoCPriceProvider)
        .encodeABI()
    );
    // setMoCToken
    targets.push(moCStateAddress);
    datas.push(
      moCState.contract.methods.setMoCToken(config.implementationAddresses.MoCToken).encodeABI()
    );
    // setMoCVendors
    targets.push(moCStateAddress);
    datas.push(
      moCState.contract.methods.setMoCVendors(config.proxyAddresses.MoCVendors).encodeABI()
    );
    // setLiquidationEnabled
    targets.push(moCStateAddress);
    datas.push(
      moCState.contract.methods
        .setLiquidationEnabled(config.valuesToAssign.liquidationEnabled)
        .encodeABI()
    );
    // setProtected
    const mocPrecision = 10 ** 18;
    const protectedValue = BigNumber(config.valuesToAssign.protected)
      .times(mocPrecision)
      .toString();
    targets.push(moCStateAddress);
    datas.push(moCState.contract.methods.setProtected(protectedValue).encodeABI());

    console.log('targets', targets);
    console.log('datas', datas);
    console.log('Schedule change - BatchChanger');
    let estimatedGas = await batchChanger.contract.methods.schedule(targets, datas).estimateGas();
    console.log('------ Schedule change - estimatedGas -----------', estimatedGas);
    await batchChanger.schedule(targets, datas);

    if (shouldExecuteChanges(network)) {
      // Execute changes in contracts
      console.log('Execute change - BatchChanger');
      const governor = await Governor.at(config.implementationAddresses.Governor);
      estimatedGas = await governor.contract.methods
        .executeChange(batchChanger.address)
        .estimateGas();
      console.log('------ Execute change - estimatedGas -----------', estimatedGas);
      await governor.executeChange(batchChanger.address);
    }

    console.log('BatchChanger address: ', batchChanger.address);
  } catch (error) {
    callback(error);
  }

  callback();
};
