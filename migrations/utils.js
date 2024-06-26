/* eslint-disable no-console */
const jsonfile = require('jsonfile');
const { scripts, ConfigVariablesInitializer } = require('zos');

const { add, push, create, setAdmin } = scripts;
const forceDeploy = true;

const fs = require('fs');

const makeUtils = async (artifacts, networkName, config, owner, deployer) => {
  const ReserveToken = artifacts.require('./test-contracts/ReserveToken.sol');
  const MoC = artifacts.require('./MoC.sol');
  const PriceProviderMock = artifacts.require('./mocks/PriceProviderMock.sol');
  const MoCLib = artifacts.require('./MoCHelperLib.sol');
  const StableToken = artifacts.require('./token/StableToken.sol');
  const RiskProToken = artifacts.require('./token/RiskProToken.sol');
  const MoCToken = artifacts.require('./token/MoCToken.sol');
  const RiskProxManager = artifacts.require('./MoCRiskProxManager.sol');
  const Governor = artifacts.require('moc-governance/contracts/Governance/Governor.sol');
  const Stopper = artifacts.require('moc-governance/contracts/Stopper/Stopper.sol');
  const UpgradeDelegator = artifacts.require(
    'moc-governance/contracts/Upgradeability/UpgradeDelegator.sol'
  );
  const CommissionSplitter = artifacts.require('CommissionSplitter');
  const MoCPriceProviderMock = artifacts.require('./mocks/MoCPriceProviderMock.sol');

  const ProxyAdmin = artifacts.require('ProxyAdmin');
  const MoCInrate = artifacts.require('./MoCInrate.sol');
  const MoCExchange = artifacts.require('./MoCExchange.sol');
  const MoCVendors = artifacts.require('./MoCVendors.sol');
  const MoCConnector = artifacts.require('./base/MoCConnector.sol');
  const MoCLibMock = artifacts.require('./mocks/MoCHelperLibMock.sol');

  const MoCHelperLibHarness = artifacts.require(
    './contracts/test-contracts/MoCHelperLibHarness.sol'
  );

  const { toContract } = require('../utils/numberHelper');

  const { network, txParams } = await ConfigVariablesInitializer.initNetworkConfiguration({
    network: networkName,
    from: owner
  });
  const options = { network, txParams };
  let stableToken;
  let riskPro;
  let mocToken;
  let riskProx;
  let mocSettlement;
  let mocState;
  let mocExchange;
  let mocInrate;
  let moc;
  let mocConnector;
  let commissionSplitter;
  let reserveToken;
  let mocVendors;

  const oracle = async () => {
    switch (networkName) {
      case 'coverage':
      case 'development':
      case 'devTestnet':
        return (await PriceProviderMock.deployed()).address;
      default:
        return config.oracle;
    }
  };

  const mocOracle = async () => {
    switch (networkName) {
      case 'regtest':
      case 'coverage':
      case 'development':
      case 'devTestnet':
        return (await MoCPriceProviderMock.deployed()).address;
      default:
        return config.mocOracle;
    }
  };

  const governorContractAddress = async () => {
    switch (networkName) {
      case 'coverage':
      case 'development':
      case 'devTestnet':
        return (await Governor.deployed()).address;
      default:
        return config.governor;
    }
  };

  const stopperContractAddress = async () => {
    switch (networkName) {
      case 'coverage':
      case 'development':
      case 'devTestnet':
        return (await Stopper.deployed()).address;
      default:
        return config.stopper;
    }
  };

  const proxyAdminContractAddress = async () => {
    switch (networkName) {
      case 'coverage':
      case 'development':
      case 'devTestnet':
        return (await ProxyAdmin.deployed()).address;
      default:
        return config.proxyAdmin;
    }
  };

  const getReserveToken = () => {
    if (config.reserveToken) {
      return ReserveToken.at(config.reserveToken);
    }

    return ReserveToken.deployed();
  };

  const getMoCToken = () => {
    if (config.mocToken) {
      return MoCToken.at(config.mocToken);
    }

    return MoCToken.deployed();
  };

  const deployReserveToken = () => {
    // If ReserveToken is not configured, then deploy it
    if (!config.reserveToken) {
      console.log('Deploying ReserveToken');
      return deployer.deploy(ReserveToken);
    }
  };

  const deployMoCToken = () => {
    // If MoCToken is not configured, then deploy it
    if (!config.mocToken) {
      console.log('Deploying MoCToken');
      return deployer.deploy(MoCToken);
    }
  };

  const deployMocLibMock = async () => {
    await deployer.link(MoCLib, MoCLibMock);
    await deployer.deploy(MoCLibMock);
    // await deployer.deploy(ReserveToken);
  };

  const deployMoCHelperLibHarness = async () => {
    await deployer.link(MoCLib, MoCHelperLibHarness);
    await deployer.deploy(MoCHelperLibHarness);
    const mocHelperLibHarness = await MoCHelperLibHarness.deployed();
    await mocHelperLibHarness.initialize();
    console.log('MoCHelperLibHarness initialized');
  };

  const deployOracleMock = async () => {
    await deployer.deploy(PriceProviderMock, toContract(config.initialPrice * 10 ** 18));
  };

  const deployMoCOracleMock = async () => {
    // If mocOracle is not configured, then deploy it
    if (!config.mocOracle) {
      console.log('Deploying MoCPriceProviderMock');
      return deployer.deploy(MoCPriceProviderMock, toContract(config.initialPrice * 10 ** 18));
    }
  };

  const deployGovernorContract = async () => {
    await deployer.deploy(Governor);
    const governor = await Governor.deployed();
    governor.initialize(owner);
  };

  const deployStopperContract = async () => {
    await deployer.deploy(Stopper, owner);
  };

  const deployUpgradeDelegatorContract = async () => {
    const governorAddress = await governorContractAddress();
    console.log(governorAddress);
    const proxyAdminAddress = await proxyAdminContractAddress();
    await deployer.deploy(UpgradeDelegator);
    const delegator = await UpgradeDelegator.deployed();
    await delegator.initialize(governorAddress, proxyAdminAddress);
    const proxyAdmin = await ProxyAdmin.at(proxyAdminAddress);
    await proxyAdmin.transferOwnership(delegator.address);
  };

  const deployProxyAdminContract = async () => {
    await deployer.deploy(ProxyAdmin);
  };

  const transferOwnershipAndMinting = async (token, address) => {
    const symbol = await token.symbol();

    console.log(`Changing ${symbol} ownership`);
    await token.transferOwnership(address);
    console.log(`${symbol} Ownership completely changed`);

    console.log(`Changing ${symbol} minter`);
    await token.addMinter(address);
    await token.renounceMinter();
    console.log(`${symbol} minter successfully changed`);
  };

  const transferPausingRole = async (token, address) => {
    const symbol = await token.symbol();

    console.log(`Changing ${symbol} pauser`);
    await token.addPauser(address);
    await token.renouncePauser();
    console.log(`${symbol} pauser successfully changed`);
  };

  const getProxies = () => {
    const { proxies } = jsonfile.readFileSync(`./zos.${network}.json`);
    return proxies;
  };

  const getProxyAddress = (proxies, contractName) => {
    const projectPrefix = 'money-on-chain';
    const proxiesOfInterest = proxies[`${projectPrefix}/${contractName}`];
    return proxiesOfInterest[proxiesOfInterest.length - 1].address;
  };

  const getImplementationAddress = (proxies, contractName) => {
    const projectPrefix = 'money-on-chain';
    const proxiesOfInterest = proxies[`${projectPrefix}/${contractName}`];
    return proxiesOfInterest[proxiesOfInterest.length - 1].implementation;
  };

  const createInstances = async (MoCSettlementContract, MoCStateContract) => {
    const proxies = getProxies();
    stableToken = await StableToken.deployed();
    riskPro = await RiskProToken.deployed();
    reserveToken = await getReserveToken();
    mocToken = await getMoCToken();

    riskProx = await RiskProxManager.at(getProxyAddress(proxies, 'MoCRiskProxManager'));
    mocSettlement = await MoCSettlementContract.at(getProxyAddress(proxies, 'MoCSettlement'));
    mocState = await MoCStateContract.at(getProxyAddress(proxies, 'MoCState'));
    mocExchange = await MoCExchange.at(getProxyAddress(proxies, 'MoCExchange'));
    moc = await MoC.at(getProxyAddress(proxies, 'MoC'));
    mocInrate = await MoCInrate.at(getProxyAddress(proxies, 'MoCInrate'));
    mocConnector = await MoCConnector.at(getProxyAddress(proxies, 'MoCConnector'));
    commissionSplitter = await CommissionSplitter.at(
      getProxyAddress(proxies, 'CommissionSplitter')
    );
    mocVendors = await MoCVendors.at(getProxyAddress(proxies, 'MoCVendors'));
  };

  const linkMocLib = async MoCStateContract => {
    // Deploy and Link all contracts
    await deployer.link(MoCLib, MoC);
    await deployer.link(MoCLib, MoCStateContract);
    await deployer.link(MoCLib, MoCExchange);
    await deployer.link(MoCLib, MoCInrate);
    await deployer.link(MoCLib, MoCVendors);
  };

  const deployUpgradable = async (MoCSettlementContract, MoCStateContract, step) => {
    const contracts = [
      { name: 'MoC', alias: 'MoC' },
      { name: 'MoCConnector', alias: 'MoCConnector' },
      { name: 'MoCRiskProxManager', alias: 'MoCRiskProxManager' },
      { name: MoCSettlementContract.contractName, alias: 'MoCSettlement' },
      { name: 'MoCConverter', alias: 'MoCConverter' },  // Remove this after fixing the indexes
      { name: MoCStateContract.contractName, alias: 'MoCState' },
      { name: 'MoCExchange', alias: 'MoCExchange' },
      { name: 'MoCInrate', alias: 'MoCInrate' },
      { name: 'CommissionSplitter', alias: 'CommissionSplitter' },
      { name: 'MoCVendors', alias: 'MoCVendors' }
    ];
    const contract = contracts[step - 1];
    console.log(`deploying Upgradable ${step - 1}: ${contract.name}`);
    add({
      contractsData: [contract]
    });
    await push({ force: forceDeploy, ...options });
    console.log(`pushed ${step - 1}: ${contract.name}`);
    let index = 1;
    if (index++ === step) {
      moc = await create({ contractAlias: contract.alias, ...options });
    }
    if (index++ === step) {
      mocConnector = await create({
        contractAlias: contract.alias,
        ...options
      });
    }
    if (index++ === step) {
      riskProx = await await create({ contractAlias: contract.alias, ...options });
    }
    if (index++ === step) {
      mocSettlement = await create({
        contractAlias: contract.alias,
        ...options
      });
    }
    if (index++ === step) {
      // mocConverter = await create({
      //   contractAlias: contract.alias,
      //   ...options
      // });
    }
    if (index++ === step) {
      mocState = await create({ contractAlias: contract.alias, ...options });
    }
    if (index++ === step) {
      mocExchange = await create({ contractAlias: contract.alias, ...options });
    }
    if (index++ === step) {
      mocInrate = await create({ contractAlias: contract.alias, ...options });
    }
    if (index++ === step) {
      commissionSplitter = await create({
        contractAlias: contract.alias,
        ...options
      });
    }
    if (index++ === step) {
      mocVendors = await create({ contractAlias: contract.alias, ...options });
    }
    console.log(`Created ${step - 1}: ${contract.name}`);
  };

  const getContractAddresses = async () => {
    const proxies = getProxies();
    const proxyAdmin = await ProxyAdmin.at(await proxyAdminContractAddress());
    const priceFeedAddress = await oracle();
    const mocPriceFeedAddress = await mocOracle();
    return {
      moc: getProxyAddress(proxies, 'MoC'),
      oracle: priceFeedAddress,
      moCRiskProxManager: getProxyAddress(proxies, 'MoCRiskProxManager'),
      mocState: getProxyAddress(proxies, 'MoCState'),
      mocInrate: getProxyAddress(proxies, 'MoCInrate'),
      commissionSplitter: getProxyAddress(proxies, 'CommissionSplitter'),
      governor: await governorContractAddress(),
      stopper: await stopperContractAddress(),
      proxyAdmin: proxyAdmin.address,
      upgradeDelegator: await proxyAdmin.owner(),
      mocOracle: mocPriceFeedAddress,
      mocVendors: getProxyAddress(proxies, 'MoCVendors'),
      mocExchange: getProxyAddress(proxies, 'MoCExchange'),
      mocSettlement: getProxyAddress(proxies, 'MoCSettlement'),
      mocConnector: getProxyAddress(proxies, 'MoCConnector')
    };
  };

  const getImplementationAddresses = async () => {
    const proxies = getProxies();
    const proxyAdmin = await ProxyAdmin.at(await proxyAdminContractAddress());
    const priceFeedAddress = await oracle();
    const mocPriceFeedAddress = await mocOracle();
    return {
      moc: getImplementationAddress(proxies, 'MoC'),
      oracle: priceFeedAddress,
      mocRiskProxManager: getImplementationAddress(proxies, 'MoCRiskProxManager'),
      mocState: getImplementationAddress(proxies, 'MoCState'),
      mocInrate: getImplementationAddress(proxies, 'MoCInrate'),
      commissionSplitter: getImplementationAddress(proxies, 'CommissionSplitter'),
      governor: await governorContractAddress(),
      stopper: await stopperContractAddress(),
      proxyAdmin: proxyAdmin.address,
      upgradeDelegator: await proxyAdmin.owner(),
      mocOracle: mocPriceFeedAddress,
      mocVendors: getImplementationAddress(proxies, 'MoCVendors'),
      mocExchange: getImplementationAddress(proxies, 'MoCExchange'),
      mocSettlement: getImplementationAddress(proxies, 'MoCSettlement'),
      mocConnector: getImplementationAddress(proxies, 'MoCConnector'),
      mocToken: (await getMoCToken()).address,
      mocHelperLib: (await MoCLib.deployed()).address,
      mocReserve: (await getReserveToken()).address,
    };
  };

  const initializeContracts = async () => {
    console.log('Initializing contracts');
    const oracleAddress = await oracle();
    const governorAddress = await governorContractAddress();
    const stopperAddress = await stopperContractAddress();
    const mocOracleAddress = await mocOracle();
    const mocStateInitializeParams = {
      connectorAddress: mocConnector.address,
      governor: governorAddress,
      priceProvider: oracleAddress,
      liq: toContract(config.liq * 10 ** 18),
      utpdu: toContract(config.utpdu * 10 ** 18),
      maxDiscRate: toContract(config.maxDiscRate * 10 ** 18),
      dayBlockSpan: config.dayBlockSpan,
      ema: toContract(config.initialEma * 10 ** 18),
      smoothFactor: toContract(config.smoothFactor * 10 ** 18),
      emaBlockSpan: config.dayBlockSpan,
      maxMintRiskPro: toContract(config.maxMintRiskPro * 10 ** 18),
      mocPriceProvider: mocOracleAddress,
      mocTokenAddress: mocToken.address,
      mocVendorsAddress: mocVendors.address,
      liquidationEnabled: config.liquidationEnabled,
      protected: toContract(config.protected * 10 ** 18)
    };

    console.log('Initializing MoC');
    await mocConnector.initialize(
      moc.address,
      stableToken.address,
      riskPro.address,
      riskProx.address,
      mocState.address,
      mocSettlement.address,
      mocExchange.address,
      mocInrate.address,
      mocVendors.address, // pass other address as parameter because MoCBurnout is deprecated
      reserveToken.address
    );
    console.log('MoCConnector Initialized');

    await moc.initialize(
      mocConnector.address,
      governorAddress,
      stopperAddress,
      config.startStoppable,
      config.maxGasPrice
    );
    console.log('MoC Initialized');

    await mocExchange.initialize(mocConnector.address);
    console.log('Exchange Initialized');

    let targetAddressRiskPro = owner;
    if (config.targetAddressRiskProInterest !== '') {
      targetAddressRiskPro = config.targetAddressRiskProInterest;
    }

    await mocInrate.initialize(
      mocConnector.address,
      governorAddress,
      toContract(config.riskProxTmin * 10 ** 18), // riskProxTmin [using mocPrecision]
      toContract(config.riskProxPower), // riskProxPower [no precision]
      toContract(config.riskProxTmax * 10 ** 18), // riskProxTmax [using mocPrecision]
      // RiskPro Holder rate .25% (annual 0.0025 / 365 * 7) with [mocPrecision]
      toContract(config.riskProHolderRate * 10 ** 18),
      // Blockspan to execute payment once a week
      config.dayBlockSpan * config.daysRiskProHolderExecutePayment,
      targetAddressRiskPro, // Target address of RiskPro interest
      commissionSplitter.address, // Target address of commission payment
      // toContract(config.commissionRate * 10 ** 18), // commissionRate [mocPrecision]
      toContract(config.stableTmin * 10 ** 18), // stableTmin [using mocPrecision]
      toContract(config.stablePower), // stablePower [no precision]
      toContract(config.stableTmax * 10 ** 18) // stableTmax [using mocPrecision]
    );
    console.log('Inrate Initialized');

    // Initializing values
    await riskProx.initialize(
      mocConnector.address,
      governorAddress,
      toContract(config.c0Cobj * 10 ** 18),
      toContract(config.x2Cobj * 10 ** 18)
    ); // mocPrecision
    console.log('RiskProxManager Initialized');

    await mocSettlement.initialize(
      mocConnector.address,
      governorAddress,
      settlementBlockSpan(config)
    );
    console.log('Settlement Initialized');

    let vendorGuardianAddress = owner;
    if (config.vendorGuardianAddress !== '') {
      ({ vendorGuardianAddress } = config.vendorGuardianAddress);
    }

    await mocVendors.initialize(mocConnector.address, governorAddress, vendorGuardianAddress);
    console.log('Vendors Initialized');

    // Making sure to call the correct initialize function
    await mocState.methods[
      'initialize((address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,address,address,address,bool,uint256))'
    ](mocStateInitializeParams);
    console.log('State Initialized');

    let targetAddressCommission = owner;
    if (config.targetAddressCommissionPayment !== '') {
      targetAddressCommission = config.targetAddressCommissionPayment;
    }

    let mocTokenCommissionsAddress = owner;
    if (config.mocTokenCommissionsAddress !== '') {
      mocTokenCommissionsAddress  = config.mocTokenCommissionsAddress;
    }

    await commissionSplitter.initialize(
      moc.address,
      targetAddressCommission,
      toContract(config.mocProportion),
      governorAddress,
      reserveToken.address,
      mocToken.address,
      mocTokenCommissionsAddress
    );
    console.log('CommissionSplitter Initialized');
  };

  const setGovernance = async () => {
    const adminAddress = await proxyAdminContractAddress();
    await setAdmin({
      contractAlias: 'MoC',
      newAdmin: adminAddress,
      ...options
    });
    await setAdmin({
      contractAlias: 'MoCConnector',
      newAdmin: adminAddress,
      ...options
    });
    await setAdmin({
      contractAlias: 'MoCRiskProxManager',
      newAdmin: adminAddress,
      ...options
    });
    await setAdmin({
      contractAlias: 'MoCSettlement',
      newAdmin: adminAddress,
      ...options
    });
    await setAdmin({
      contractAlias: 'MoCState',
      newAdmin: adminAddress,
      ...options
    });
    await setAdmin({
      contractAlias: 'MoCExchange',
      newAdmin: adminAddress,
      ...options
    });
    await setAdmin({
      contractAlias: 'MoCInrate',
      newAdmin: adminAddress,
      ...options
    });
    await setAdmin({
      contractAlias: 'CommissionSplitter',
      newAdmin: adminAddress,
      ...options
    });
    await setAdmin({
      contractAlias: 'MoCVendors',
      newAdmin: adminAddress,
      ...options
    });
  };

  const transferStableTokenRoles = async () => {
    await transferOwnershipAndMinting(stableToken, mocExchange.address);
  };

  const transferRiskProRoles = async () => {
    await transferOwnershipAndMinting(riskPro, mocExchange.address);
  };

  const transferRiskProPausingRole = async () => {
    await transferPausingRole(riskPro, moc.address);
  };

  const settlementBlockSpan = () => toContract(config.dayBlockSpan * config.settlementDays);

  const saveConfig = async (path, networkConfig) => {
    const contractAddresses = await getContractAddresses();
    const implementationAddr = await getImplementationAddresses();

    const proxyAddresses = {
      MoC: contractAddresses.moc,
      MoCConnector: contractAddresses.mocConnector,
      MoCExchange: contractAddresses.mocExchange,
      MoCSettlement: contractAddresses.mocSettlement,
      MoCInrate: contractAddresses.mocInrate,
      MoCState: contractAddresses.mocState,
      MoCVendors: contractAddresses.mocVendors,
      CommissionSplitter: contractAddresses.commissionSplitter,
      MoCRiskProxManager: contractAddresses.moCRiskProxManager
    };

    const implementationAddresses = {
      MoC: implementationAddr.moc,
      MoCConnector: implementationAddr.mocConnector,
      MoCExchange: implementationAddr.mocExchange,
      MoCSettlement: implementationAddr.mocSettlement,
      MoCInrate: implementationAddr.mocInrate,
      MoCState: implementationAddr.mocState,
      MoCRiskProxManager: implementationAddr.mocRiskProxManager,
      ProxyAdmin: implementationAddr.proxyAdmin,
      UpgradeDelegator: implementationAddr.upgradeDelegator,
      Governor: implementationAddr.governor,
      MoCToken: implementationAddr.mocToken,
      MocReserve: implementationAddr.mocReserve,
      MoCPriceProvider: implementationAddr.mocOracle,
      MoCVendors: implementationAddr.mocVendors,
      MoCHelperLib: implementationAddr.mocHelperLib,
      CommissionSplitter: implementationAddr.commissionSplitter
    };

    let vendorGuardianAddress = owner;
    if (networkConfig.vendorGuardianAddress !== '') {
      ({ vendorGuardianAddress } = networkConfig.vendorGuardianAddress);
    }

    let mocTokenCommissionsAddress = owner;
    if (config.mocTokenCommissionsAddress !== '') {
      ({ mocTokenCommissionsAddress } = config.mocTokenCommissionsAddress);
    }

    const valuesToAssign = {
      commissionRates: networkConfig.commissionRates,
      liquidationEnabled: networkConfig.liquidationEnabled,
      protected: networkConfig.protected,
      vendorGuardianAddress,
      mocTokenCommissionsAddress,
      mocProportion: networkConfig.mocProportion,
      targetAddressCommissionPayment: networkConfig.targetAddressCommissionPayment

    };

    const changerAddresses = {};

    let governorOwnerAddress = owner;
    if (networkConfig.governorOwnerAddress !== '') {
      ({ governorOwnerAddress } = networkConfig.governorOwnerAddress);
    }

    const configValues = {
      proxyAddresses,
      implementationAddresses,
      valuesToAssign,
      changerAddresses,
      governorOwnerAddress
    };

    fs.writeFileSync(path, JSON.stringify(configValues, null, 2));
  };

  return {
    initializeContracts,
    linkMocLib,
    deployUpgradable,
    transferStableTokenRoles,
    transferRiskProRoles,
    transferRiskProPausingRole,
    deployReserveToken,
    deployMocLibMock,
    deployOracleMock,
    deployGovernorContract,
    deployUpgradeDelegatorContract,
    deployProxyAdminContract,
    deployStopperContract,
    setGovernance,
    createInstances,
    getContractAddresses,
    deployMoCOracleMock,
    deployMoCHelperLibHarness,
    saveConfig,
    getProxies,
    getProxyAddress,
    deployMoCToken
  };
};

const isDevelopment = currentNetwork =>
  currentNetwork === 'development' ||
  currentNetwork === 'coverage' ||
  currentNetwork === 'regtest' ||
  currentNetwork === 'devTestnet';

module.exports = { makeUtils, isDevelopment };
