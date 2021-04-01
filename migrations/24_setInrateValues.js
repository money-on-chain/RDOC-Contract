const BigNumber = require('bignumber.js');
const utils = require('./utils');
const allConfigs = require('./configs/config');
const { toContract } = require('../utils/numberHelper.js');

const Governor = artifacts.require('moc-governance/contracts/Governance/Governor.sol');
const MoCInrateChanger = artifacts.require('MocInrateChanger.sol');
const MoCInrate = artifacts.require('MoCInrate.sol');

const consolePrintTestVariables = obj => {
  for (let i = 0; i < Object.keys(obj).length; i++) {
    const variableName = Object.keys(obj)[i];
    // eslint-disable-next-line no-console
    console.log(`${variableName}: ${obj[variableName].toString()}`);
  }
};

const getCommissionsArray = mocInrate => async () => {
  const mocPrecision = 10 ** 18;

  const ret = [
    {
      txType: (await mocInrate.MINT_RISKPRO_FEES_RESERVE()).toString(),
      fee: BigNumber(0.001)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: (await mocInrate.REDEEM_RISKPRO_FEES_RESERVE()).toString(),
      fee: BigNumber(0.002)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: (await mocInrate.MINT_STABLETOKEN_FEES_RESERVE()).toString(),
      fee: BigNumber(0.003)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: (await mocInrate.REDEEM_STABLETOKEN_FEES_RESERVE()).toString(),
      fee: BigNumber(0.004)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: (await mocInrate.MINT_RISKPROX_FEES_RESERVE()).toString(),
      fee: BigNumber(0.005)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: (await mocInrate.REDEEM_RISKPROX_FEES_RESERVE()).toString(),
      fee: BigNumber(0.006)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: (await mocInrate.MINT_RISKPRO_FEES_MOC()).toString(),
      fee: BigNumber(0.007)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: (await mocInrate.REDEEM_RISKPRO_FEES_MOC()).toString(),
      fee: BigNumber(0.008)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: (await mocInrate.MINT_STABLETOKEN_FEES_MOC()).toString(),
      fee: BigNumber(0.009)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: (await mocInrate.REDEEM_STABLETOKEN_FEES_MOC()).toString(),
      fee: BigNumber(0.01)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: (await mocInrate.MINT_RISKPROX_FEES_MOC()).toString(),
      fee: BigNumber(0.011)
        .times(mocPrecision)
        .toString()
    },
    {
      txType: (await mocInrate.REDEEM_RISKPROX_FEES_MOC()).toString(),
      fee: BigNumber(0.012)
        .times(mocPrecision)
        .toString()
    }
  ];
  return ret;
};

module.exports = async (deployer, currentNetwork, [owner]) => {
  // Workaround to get the link working on tests
  const {
    createInstances,
    initializeContracts,
    getProxies,
    getProxyAddress
  } = await utils.makeUtils(artifacts, currentNetwork, allConfigs[currentNetwork], owner, deployer);
  // const proxies = getProxies();
  // const moc = await MoC.at(getProxyAddress(proxies, 'MoC'));
  // const mocInrate = await MoCInrate.at('');
  const mocInrate = await MoCInrate.deployed();

  const mocPrecision = 10 ** 18;

  // const bitProRate = toContract(0.000047945 * 10 ** 18); // mocPrecision -- weekly 0.0025 / 365 * 7
  const dayBlockSpan = 7 * allConfigs[currentNetwork].dayBlockSpan;
  const btcxTmin = toContract(allConfigs[currentNetwork].riskProxTmin * mocPrecision);
  const btcxTmax = toContract(allConfigs[currentNetwork].riskProxTmax * mocPrecision);
  const btcxPower = toContract(allConfigs[currentNetwork].riskProxPower);
  const bitProHolderRate = toContract(allConfigs[currentNetwork].riskProHolderRate * mocPrecision);
  const docTmin = toContract(allConfigs[currentNetwork].stableTmin * mocPrecision);
  const docTmax = toContract(allConfigs[currentNetwork].stableTmax * mocPrecision);
  const docPower = toContract(allConfigs[currentNetwork].stablePower);

  // Setting commissions
  const commissions = await getCommissionsArray(mocInrate)();

  const prueba = {
    dayBlockSpan,
    btcxTmin,
    btcxTmax,
    btcxPower,
    bitProHolderRate,
    docPower,
    docTmin,
    docTmax,
    commissions
  };
  consolePrintTestVariables(prueba);

  const mockMocInrateChanger = await MoCInrateChanger.new(
    mocInrate.address,
    dayBlockSpan,
    btcxTmin,
    btcxTmax,
    btcxPower,
    bitProHolderRate,
    // commissionRate,
    docTmin,
    docTmax,
    docPower,
    commissions
  );

  // const governor = await Governor.at('');
  const governor = await Governor.deployed();
  // Execute changes in MoCInrate
  await governor.executeChange(mockMocInrateChanger.address);
};
