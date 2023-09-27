/* eslint-disable no-console */
const BigNumber = require('bignumber.js');

const Governor = artifacts.require('moc-governance/contracts/Governance/Governor.sol');
const FluxCapacitorChanger = artifacts.require('./changers/FluxCapacitorChanger.sol');

const { getConfig, getNetwork, saveConfig, shouldExecuteChanges } = require('../helper');

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);
    const PRECISION = 10 ** 18;

    const toPrecision = value =>
      BigNumber(value)
        .times(PRECISION)
        .toString(10);

    console.log('FluxCapacitorChanger Deploy');
    const fluxCapacitorChanger = await FluxCapacitorChanger.new(
      config.implementationAddresses.UpgradeDelegator,
      config.proxyAddresses.MoC,
      config.implementationAddresses.MoC,
      config.implementationAddresses.MoCExchange,
      config.governanceImplementationAddresses.Stopper,
      toPrecision(config.valuesToAssign.maxAbsoluteOperation),
      toPrecision(config.valuesToAssign.maxOperationalDifference),
      config.valuesToAssign.decayBlockSpan
    );
    console.log('FluxCapacitorChanger address: ', fluxCapacitorChanger.address);

    // Save changer address to config file
    config.changerAddresses.FluxCapacitorChanger = fluxCapacitorChanger.address;
    saveConfig(config, configPath);

    if (shouldExecuteChanges(network)) {
      // Execute changes in contracts
      console.log('Execute change - Changer');
      const governor = await Governor.at(config.implementationAddresses.Governor);
      await governor.executeChange(fluxCapacitorChanger.address);
    } else {
      console.log('Executing test governor execute change');
      const governor = await Governor.at(config.implementationAddresses.Governor);
      await governor.contract.methods
        .executeChange(config.changerAddresses.FluxCapacitorChanger)
        .call({ from: config.governorOwnerAddress });
    }
  } catch (error) {
    callback(error);
  }

  callback();
};
