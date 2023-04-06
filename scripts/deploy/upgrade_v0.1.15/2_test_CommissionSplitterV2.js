/* eslint-disable no-console */
const CommissionSplitterV2 = artifacts.require('./auxiliar/CommissionSplitterV2.sol');
const { getConfig, getNetwork } = require('../helper');

module.exports = async callback => {
  try {
    const network = getNetwork(process.argv);
    const configPath = `${__dirname}/deployConfig-${network}.json`;
    const config = getConfig(network, configPath);
    const commissionSplitterV2Address = config.proxyAddresses.CommissionSplitterV2;
    const commissionSplitterV2 = await CommissionSplitterV2.at(commissionSplitterV2Address);

    const contractInfo = {};
    contractInfo.reserveToken = await commissionSplitterV2.reserveToken();
    contractInfo.outputMoC = await commissionSplitterV2.outputMoC();
    contractInfo.outputAddress_2 = await commissionSplitterV2.outputAddress_2();
    contractInfo.outputAddress_3 = await commissionSplitterV2.outputAddress_3();
    contractInfo.outputProportion_1 = await commissionSplitterV2.outputProportion_1();
    contractInfo.outputProportion_2 = await commissionSplitterV2.outputProportion_2();
    contractInfo.outputTokenGovernAddress_1 = await commissionSplitterV2.outputTokenGovernAddress_1();
    contractInfo.outputTokenGovernAddress_2 = await commissionSplitterV2.outputTokenGovernAddress_2();
    contractInfo.outputProportionTokenGovern_1 = await commissionSplitterV2.outputProportionTokenGovern_1();
    contractInfo.tokenGovern = await commissionSplitterV2.tokenGovern();

    console.log('Contract storage');

    if (
      contractInfo.reserveToken.toLowerCase() ===
      config.CommissionSplitterV2.reserveToken.toLowerCase()
    ) {
      console.log('OK. 1. reserveToken: ', contractInfo.reserveToken);
    } else {
      console.log('ERROR. 1. reserveToken: ', contractInfo.reserveToken);
    }

    if (
      contractInfo.outputMoC.toLowerCase() === config.CommissionSplitterV2.outputMoC.toLowerCase()
    ) {
      console.log('OK. 1. outputMoC: ', contractInfo.outputMoC);
    } else {
      console.log('ERROR. 1. outputMoC: ', contractInfo.outputMoC);
    }

    if (
      contractInfo.outputAddress_2.toLowerCase() ===
      config.CommissionSplitterV2.outputAddress_2.toLowerCase()
    ) {
      console.log('OK. 2. outputAddress_2: ', contractInfo.outputAddress_2);
    } else {
      console.log('ERROR. 2. outputAddress_2: ', contractInfo.outputAddress_2);
    }

    if (
      contractInfo.outputAddress_3.toLowerCase() ===
      config.CommissionSplitterV2.outputAddress_3.toLowerCase()
    ) {
      console.log('OK. 3. outputAddress_3: ', contractInfo.outputAddress_3);
    } else {
      console.log('ERROR. 3. outputAddress_3: ', contractInfo.outputAddress_3);
    }

    if (
      contractInfo.outputProportion_1.toString() === config.CommissionSplitterV2.outputProportion_1
    ) {
      console.log('OK. 4. outputProportion_1: ', contractInfo.outputProportion_1.toString());
    } else {
      console.log('ERROR. 4. outputProportion_1: ', contractInfo.outputProportion_1.toString());
    }

    if (
      contractInfo.outputProportion_2.toString() === config.CommissionSplitterV2.outputProportion_2
    ) {
      console.log('OK. 5. outputProportion_2: ', contractInfo.outputProportion_2.toString());
    } else {
      console.log('ERROR. 5. outputProportion_2: ', contractInfo.outputProportion_2.toString());
    }

    if (
      contractInfo.outputTokenGovernAddress_1.toLowerCase() ===
      config.CommissionSplitterV2.outputTokenGovernAddress_1.toLowerCase()
    ) {
      console.log(
        'OK. 5. outputTokenGovernAddress_1: ',
        contractInfo.outputTokenGovernAddress_1.toString()
      );
    } else {
      console.log(
        'ERROR. 5. outputTokenGovernAddress_1: ',
        contractInfo.outputTokenGovernAddress_1.toString()
      );
    }

    if (
      contractInfo.outputTokenGovernAddress_2.toLowerCase() ===
      config.CommissionSplitterV2.outputTokenGovernAddress_2.toLowerCase()
    ) {
      console.log(
        'OK. 5. outputTokenGovernAddress_2: ',
        contractInfo.outputTokenGovernAddress_2.toString()
      );
    } else {
      console.log(
        'ERROR. 5. outputTokenGovernAddress_2: ',
        contractInfo.outputTokenGovernAddress_2.toString()
      );
    }

    if (
      contractInfo.outputProportionTokenGovern_1.toString() ===
      config.CommissionSplitterV2.outputProportionTokenGovern_1
    ) {
      console.log(
        'OK. 5. outputProportionTokenGovern_1: ',
        contractInfo.outputProportionTokenGovern_1.toString()
      );
    } else {
      console.log(
        'ERROR. 5. outputProportionTokenGovern_1: ',
        contractInfo.outputProportionTokenGovern_1.toString()
      );
    }

    if (
      contractInfo.tokenGovern.toLowerCase() ===
      config.CommissionSplitterV2.tokenGovern.toLowerCase()
    ) {
      console.log('OK. 5. tokenGovern: ', contractInfo.tokenGovern.toString());
    } else {
      console.log('ERROR. 5. tokenGovern: ', contractInfo.tokenGovern.toString());
    }
  } catch (error) {
    callback(error);
  }

  callback();
};
