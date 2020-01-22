/* eslint-disable no-console */
const jsonfile = require('jsonfile');
const { scripts, ConfigVariablesInitializer } = require('zos');

const { add, push, create, setAdmin } = scripts;
const forceDeploy = true;

const makeUtils = async (artifacts, networkName, config, owner, deployer) => {
  const ReserveToken = artifacts.require('./test-contracts/ReserveToken.sol');
  const MoC = artifacts.require('./MoC.sol');
  const PriceProviderMock = artifacts.require('./mocks/PriceProviderMock.sol');
  const MoCLib = artifacts.require('./MoCHelperLib.sol');
  const StableToken = artifacts.require('./token/StableToken.sol');
  const RiskProToken = artifacts.require('./token/RiskProToken.sol');
  const RiskProxManager = artifacts.require('./MoCRiskProxManager.sol');
  const MoCBurnout = artifacts.require('./MoCBurnout.sol');
  const MoCConverter = artifacts.require('./MoCConverter.sol');
  const Governor = artifacts.require('moc-governance/contracts/Governance/Governor.sol');
  const Stopper = artifacts.require('moc-governance/contracts/Stopper/Stopper.sol');
  const UpgradeDelegator = artifacts.require(
    'moc-governance/contracts/Upgradeability/UpgradeDelegator.sol'
  );
  const ProxyAdmin = artifacts.require('ProxyAdmin');
  const MoCInrate = artifacts.require('./MoCInrate.sol');
  const MoCExchange = artifacts.require('./MoCExchange.sol');
  const MoCConnector = artifacts.require('./base/MoCConnector.sol');
  const MoCLibMock = artifacts.require('./mocks/MoCHelperLibMock.sol');
  const { toContract } = require('../utils/numberHelper');

  const CommissionSplitter = artifacts.require('./CommissionSplitter.sol');

  const { network, txParams } = await ConfigVariablesInitializer.initNetworkConfiguration({
    network: networkName,
    from: owner
  });
  const options = { network, txParams };
  let stableToken;
  let riskPro;
  let riskProx;
  let mocSettlement;
  let mocState;
  let mocConverter;
  let mocExchange;
  let mocInrate;
  let moc;
  let mocConnector;
  let mocBurnout;
  let reserveToken;

  const oracle = async () => {
    switch (networkName) {
      case 'coverage':
      case 'development':
        return (await PriceProviderMock.deployed()).address;
      default:
        return config.oracle;
    }
  };

  const governorContractAddress = async () => {
    switch (networkName) {
      case 'coverage':
      case 'development':
        return (await Governor.deployed()).address;
      default:
        return config.governor;
    }
  };

  const stopperContractAddress = async () => {
    switch (networkName) {
      case 'coverage':
      case 'development':
        return (await Stopper.deployed()).address;
      default:
        return config.stopper;
    }
  };

  const proxyAdminContractAddress = async () => {
    switch (networkName) {
      case 'coverage':
      case 'development':
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

  const getCommissionSplitter = () => {
    if (config.commissionSplitter) {
      return CommissionSplitter.at(config.commissionSplitter);
    }

    return CommissionSplitter.deployed();
  };

  const deployReserveToken = () => {
    // If ReserveToken is not configured, then deploy it
    if (!config.reserveToken) {
      console.log('Deploying ReserveToken');
      return deployer.deploy(ReserveToken);
    }
  };

  const deployCommissionSplitter = async () => {
    // If CommissionSplitter is not configured, then deploy it
    if (!config.commissionSplitter) {
      const governorAddress = await governorContractAddress();
      console.log('Deploying CommissionSplitter');
      return deployer.deploy(
        CommissionSplitter,
        moc.address,
        reserveToken.address,
        owner,
        config.mocCommissionProportion,
        governorAddress
      );
    }
  };

  const deployMocLibMock = async () => {
    await deployer.link(MoCLib, MoCLibMock);
    await deployer.deploy(MoCLibMock);
    await deployer.deploy(ReserveToken);
  };

  const deployOracleMock = async () => {
    await deployer.deploy(PriceProviderMock, toContract(config.initialPrice * 10 ** 18));
  };

  const deployGovernorContract = async () => {
    await deployer.deploy(Governor);
    const governor = await Governor.deployed();
    return governor.initialize(owner);
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

  const createInstances = async (MoCSettlementContract, MoCStateContract) => {
    const proxies = getProxies();
    stableToken = await StableToken.deployed();
    riskPro = await RiskProToken.deployed();
    reserveToken = await getReserveToken();

    riskProx = await RiskProxManager.at(getProxyAddress(proxies, 'MoCRiskProxManager'));
    mocSettlement = await MoCSettlementContract.at(getProxyAddress(proxies, 'MoCSettlement'));
    mocState = await MoCStateContract.at(getProxyAddress(proxies, 'MoCState'));
    mocConverter = await MoCConverter.at(getProxyAddress(proxies, 'MoCConverter'));
    mocExchange = await MoCExchange.at(getProxyAddress(proxies, 'MoCExchange'));
    moc = await MoC.at(getProxyAddress(proxies, 'MoC'));
    mocInrate = await MoCInrate.at(getProxyAddress(proxies, 'MoCInrate'));
    mocBurnout = await MoCBurnout.at(getProxyAddress(proxies, 'MoCBurnout'));
    mocConnector = await MoCConnector.at(getProxyAddress(proxies, 'MoCConnector'));
  };

  const linkMocLib = async MoCStateContract => {
    // Deploy and Link all contracts
    await deployer.link(MoCLib, MoC);
    await deployer.link(MoCLib, MoCConverter);
    await deployer.link(MoCLib, MoCStateContract);
    await deployer.link(MoCLib, MoCExchange);
    await deployer.link(MoCLib, MoCInrate);
  };

  const deployUpgradable = async (MoCSettlementContract, MoCStateContract, step) => {
    const contracts = [
      { name: 'MoC', alias: 'MoC' },
      { name: 'MoCConnector', alias: 'MoCConnector' },
      { name: 'MoCRiskProxManager', alias: 'MoCRiskProxManager' },
      { name: 'MoCBurnout', alias: 'MoCBurnout' },
      { name: MoCSettlementContract.contractName, alias: 'MoCSettlement' },
      { name: 'MoCConverter', alias: 'MoCConverter' },
      { name: MoCStateContract.contractName, alias: 'MoCState' },
      { name: 'MoCExchange', alias: 'MoCExchange' },
      { name: 'MoCInrate', alias: 'MoCInrate' }
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
      mocConnector = await create({ contractAlias: contract.alias, ...options });
    }
    if (index++ === step) {
      riskProx = await await create({ contractAlias: contract.alias, ...options });
    }
    if (index++ === step) {
      mocBurnout = await create({ contractAlias: contract.alias, ...options });
    }
    if (index++ === step) {
      mocSettlement = await create({ contractAlias: contract.alias, ...options });
    }
    if (index++ === step) {
      mocConverter = await create({ contractAlias: contract.alias, ...options });
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
    console.log(`Created ${step - 1}: ${contract.name}`);
  };

  const getContractAddresses = async () => {
    const proxies = getProxies();
    const proxyAdmin = await ProxyAdmin.at(await proxyAdminContractAddress());
    const priceFeedAddress = await oracle();
    return {
      moc: getProxyAddress(proxies, 'MoC'),
      oracle: priceFeedAddress,
      moCRiskProxManager: getProxyAddress(proxies, 'MoCRiskProxManager'),
      mocState: getProxyAddress(proxies, 'MoCState'),
      mocInrate: getProxyAddress(proxies, 'MoCInrate'),
      governor: await governorContractAddress(),
      stopper: await stopperContractAddress(),
      proxyAdmin: proxyAdmin.address,
      upgradeDelegator: await proxyAdmin.owner()
    };
  };

  const initializeContracts = async () => {
    console.log('Initializing contracts');
    const oracleAddress = await oracle();
    const governorAddress = await governorContractAddress();
    const stopperAddress = await stopperContractAddress();

    console.log('Initializing MoC');
    await mocConnector.initialize(
      moc.address,
      stableToken.address,
      riskPro.address,
      riskProx.address,
      mocState.address,
      mocSettlement.address,
      mocConverter.address,
      mocExchange.address,
      mocInrate.address,
      mocBurnout.address,
      reserveToken.address
    );
    console.log('MoCConnector Initialized');

    await moc.initialize(
      mocConnector.address,
      governorAddress,
      stopperAddress,
      config.startStoppable
    );
    console.log('MoC Initialized');

    await mocExchange.initialize(mocConnector.address);
    console.log('Exchange Initialized');

    await mocConverter.initialize(mocConnector.address);
    console.log('Converter Initialized');

    const commissionSplitter = await getCommissionSplitter();

    await mocInrate.initialize(
      mocConnector.address,
      governorAddress,
      0, // riskProxTmin [using mocPrecision]
      toContract(1), // riskProxPower [no precision]
      toContract(0.0002611578760678 * 10 ** 18), // riskProxTmax [using mocPrecision]
      toContract(0.000047945 * 10 ** 18), // RiskPro Holder rate .25% (annual 0.0025 / 365 * 7) with [mocPrecision]
      config.dayBlockSpan * 7, // Blockspan to execute payment once a week
      owner, // Target address of RiskPro interest
      commissionSplitter.address, // Target address of commission payment
      toContract(0.002 * 10 ** 18), // commissionRate [mocPrecision]
      toContract(config.stableTmin * 10 ** 18), // stableTmin [using mocPrecision]
      toContract(config.stablePower), // stablePower [no precision]
      toContract(config.stableTmax * 10 ** 18) // stableTmax [using mocPrecision]
    );
    console.log('Inrate Initialized');

    // Initializing values
    await riskProx.initialize(
      mocConnector.address,
      governorAddress,
      toContract(4 * 10 ** 18),
      toContract(2 * 10 ** 18)
    ); // mocPrecision
    console.log('RiskProxManager Initialized');

    await mocBurnout.initialize(mocConnector.address);
    console.log('Burnout Initialized');

    await mocSettlement.initialize(
      mocConnector.address,
      governorAddress,
      settlementBlockSpan(config)
    );
    console.log('Settlement Initialized');

    await mocState.initialize(
      mocConnector.address,
      governorAddress,
      oracleAddress,
      toContract(1.04 * 10 ** 18), // _liq
      toContract(2 * 10 ** 18), // _utpdu
      toContract(0.5 * 10 ** 18), // _maxDiscRate
      config.dayBlockSpan, // _dayBlockSpan
      toContract(config.initialEma * 10 ** 18), // _ema
      toContract(0.01653 * 10 ** 18), // _smoothFactor
      config.dayBlockSpan, // _emaBlockSpan
      toContract(config.maxMintRiskPro * 10 ** 18)
    );
    console.log('State Initialized');
  };

  const setGovernance = async () => {
    const adminAddress = await proxyAdminContractAddress();
    await setAdmin({ contractAlias: 'MoC', newAdmin: adminAddress, ...options });
    await setAdmin({ contractAlias: 'MoCConnector', newAdmin: adminAddress, ...options });
    await setAdmin({ contractAlias: 'MoCRiskProxManager', newAdmin: adminAddress, ...options });
    await setAdmin({ contractAlias: 'MoCBurnout', newAdmin: adminAddress, ...options });
    await setAdmin({ contractAlias: 'MoCSettlement', newAdmin: adminAddress, ...options });
    await setAdmin({ contractAlias: 'MoCConverter', newAdmin: adminAddress, ...options });
    await setAdmin({ contractAlias: 'MoCState', newAdmin: adminAddress, ...options });
    await setAdmin({ contractAlias: 'MoCExchange', newAdmin: adminAddress, ...options });
    await setAdmin({ contractAlias: 'MoCInrate', newAdmin: adminAddress, ...options });
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

  return {
    initializeContracts,
    linkMocLib,
    deployUpgradable,
    transferStableTokenRoles,
    transferRiskProRoles,
    transferRiskProPausingRole,
    deployReserveToken,
    deployCommissionSplitter,
    deployMocLibMock,
    deployOracleMock,
    deployGovernorContract,
    deployUpgradeDelegatorContract,
    deployProxyAdminContract,
    deployStopperContract,
    setGovernance,
    createInstances,
    getContractAddresses
  };
};

module.exports = makeUtils;
