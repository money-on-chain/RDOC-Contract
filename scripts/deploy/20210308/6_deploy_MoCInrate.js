/* eslint-disable no-console */
const UpgraderChanger = artifacts.require('./changers/UpgraderChanger.sol');
const Governor = artifacts.require('moc-governance/contracts/Governance/Governor.sol');

const MoCInrate = artifacts.require('./MoCInrate.sol');
const MoCInrateChangerDeploy = artifacts.require('./MocInrateChangerDeploy.sol');

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

    // Upgrade contracts with proxy (using the contract address of contract just deployed)
    console.log('Upgrade MoCInrate');
    const upgradeMocInrate = await UpgraderChanger.new(
      config.proxyAddresses.MoCInrate,
      config.implementationAddresses.UpgradeDelegator,
      mocInrate.address
    );

    // Save implementation address and changer address to config file
    config.implementationAddresses.MoCInrate = mocInrate.address;
    config.changerAddresses['6_MoCInrate'] = upgradeMocInrate.address;
    saveConfig(config, configPath);

    let governor;
    if (shouldExecuteChanges(network)) {
      // Execute changes in contracts
      console.log('Execute change - MoCInrate');
      governor = await Governor.at(config.implementationAddresses.Governor);
      await governor.executeChange(upgradeMocInrate.address);
    }

    // Setting commissions
    const commissions = await getCommissionsArray(mocInrate)(config);

    // Use changer contract
    const mocInrateChangerDeploy = await MoCInrateChangerDeploy.new(
      config.proxyAddresses.MoCInrate,
      commissions
    );

    // Save changer address to config file
    config.changerAddresses['6_MoCInrateChangerDeploy'] = mocInrateChangerDeploy.address;
    saveConfig(config, configPath);

    if (shouldExecuteChanges(network)) {
      // Execute changes in MoCInrate
      console.log('Execute change - MoCInrateChangerDeploy');
      await governor.executeChange(mocInrateChangerDeploy.address);
    }

    console.log('MoCInrate implementation address: ', mocInrate.address);
  } catch (error) {
    callback(error);
  }

  callback();
};
