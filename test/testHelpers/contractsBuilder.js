const { TestHelper } = require('zos');
const { Contracts, ZWeb3 } = require('zos-lib');

ZWeb3.initialize(web3.currentProvider);

const PriceProviderMock = artifacts.require('./contracts/mocks/PriceProviderMock.sol');
const StableToken = artifacts.require('./contracts/StableToken.sol');
const CommissionSplitter = artifacts.require('./contracts/auxiliar/CommissionSplitter.sol');
const MoC = artifacts.require('./contracts/MoC.sol');
const MoCState = artifacts.require('./contracts/MoCState.sol');
const MoCStateMock = artifacts.require('./contracts/mocks/MoCStateMock.sol');
const MoCConverter = artifacts.require('./contracts/MoCConverter.sol');
const MoCExchange = artifacts.require('./contracts/MoCExchange.sol');
const MoCInrate = artifacts.require('./contracts/MoCInrate.sol');
const MoCSettlementMock = artifacts.require('./contracts/mocks/MoCSettlementMock.sol');
const RiskPro = artifacts.require('./contracts/RiskProToken.sol');
const RiskProxManager = artifacts.require('./contracts/MoCRiskProxManager.sol');
const MoCSettlement = artifacts.require('./contracts/MoCSettlement.sol');
const MoCBurnout = artifacts.require('./contracts/MoCBurnout.sol');
const MoCConnector = artifacts.require('./contracts/base/MoCConnector.sol');
const Governor = artifacts.require('moc-governance/contracts/Governance/Governor.sol');
const ProxyAdmin = artifacts.require('ProxyAdmin');
const UpgradeDelegator = artifacts.require('UpgradeDelegator');
const Stopper = artifacts.require('moc-governance/contracts/Stopper/Stopper.sol');
const MocStateChanger = artifacts.require('./contracts/MocStateChanger.sol');
const MocInrateChanger = artifacts.require('./contracts/MocInrateChanger.sol');
const MoCSettlementChanger = artifacts.require('./contracts/MoCSettlementChanger.sol');
const MoCBucketContainerChanger = artifacts.require('./contracts/MoCBucketContainerChanger.sol');
const MoCRestartSettlementChanger = artifacts.require(
  './contracts/MoCRestartSettlementChanger.sol'
);
const MoCStallSettlementChanger = artifacts.require('./contracts/MoCStallSettlementChanger.sol');
const MocChanger = artifacts.require('./contracts/MocChanger.sol');

const MoCProxy = Contracts.getFromLocal('MoC');
const MoCStateProxy = Contracts.getFromLocal('MoCState');
const MoCStateMockProxy = Contracts.getFromLocal('MoCStateMock');
const MoCConverterProxy = Contracts.getFromLocal('MoCConverter');
const MoCExchangeProxy = Contracts.getFromLocal('MoCExchange');
const MoCInrateProxy = Contracts.getFromLocal('MoCInrate');
const MoCSettlementMockProxy = Contracts.getFromLocal('MoCSettlementMock');
const RiskProxManagerProxy = Contracts.getFromLocal('MoCRiskProxManager');
const MoCSettlementProxy = Contracts.getFromLocal('MoCSettlement');
const MoCBurnoutProxy = Contracts.getFromLocal('MoCBurnout');
const MoCConnectorProxy = Contracts.getFromLocal('MoCConnector');
const GovernorProxy = Contracts.getFromLocal('Governor');
const StopperProxy = Contracts.getFromLocal('Stopper');
const ReserveToken = artifacts.require('./contracts/test-contracts/ReserveToken.sol');

const { toContract } = require('../../utils/numberHelper');

const transferOwnershipAndMinting = async (token, address) => {
  await token.transferOwnership(address);
  await token.addMinter(address);
  await token.renounceMinter();
};

const transferPausingRole = async (token, address) => {
  await token.addPauser(address);
  await token.renouncePauser();
};

const baseParams = {
  reservePrice: toContract(10000 * 10 ** 18), // mocPrecision
  smoothingFactor: toContract(0.01653 * 10 ** 18), // coefficientPrecision
  c0Cobj: toContract(3 * 10 ** 18), // mocPrecision
  x2Cobj: toContract(2 * 10 ** 18), // mocPrecision
  liq: toContract(1.04 * 10 ** 18), // mocPrecision
  utpdu: toContract(2 * 10 ** 18), // mocPrecision
  maxDiscountRate: toContract(50), // mocPrecision
  settlementBlockSpan: toContract(100),
  dayBlockSpan: toContract(4 * 60 * 24),
  riskProxTmin: toContract(0), // mocPrecision
  riskProxTmax: toContract(0.0002611578760678 * 10 ** 18), // mocPrecision
  riskProxPower: toContract(1),
  riskProRate: toContract(0.000047945 * 10 ** 18), // mocPrecision -- weekly 0.0025 / 365 * 7
  emaBlockSpan: toContract(40),
  commissionRate: toContract(0 * 10 ** 18), // mocPrecision
  peg: toContract(1),
  startStoppable: true
};

const createContracts = params => async ({ owner, useMock }) => {
  const reserveToken = await ReserveToken.new({ from: owner });
  const project = await TestHelper();

  const {
    reservePrice,
    smoothingFactor,
    c0Cobj,
    x2Cobj,
    liq,
    utpdu,
    maxDiscountRate,
    settlementBlockSpan,
    dayBlockSpan,
    riskProxTmin,
    riskProxPower,
    riskProxTmax,
    emaBlockSpan,
    riskProRate,
    commissionRate,
    peg,
    startStoppable
  } = params;
  const settlementContract = useMock ? MoCSettlementMock : MoCSettlement;
  const stateContract = useMock ? MoCStateMock : MoCState;
  const settlementContractProxy = useMock ? MoCSettlementMockProxy : MoCSettlementProxy;
  const stateContractProxy = useMock ? MoCStateMockProxy : MoCStateProxy;

  // Non-upgradeable
  const riskPro = await RiskPro.new({ from: owner });
  const stableToken = await StableToken.new({ from: owner });
  const priceProvider = await PriceProviderMock.new(reservePrice);

  // Upgradeable
  const mocSettlementProxy = await project.createProxy(settlementContractProxy);
  const mocStateProxy = await project.createProxy(stateContractProxy);
  const mocConnectorProxy = await project.createProxy(MoCConnectorProxy);
  const riskProxProxy = await project.createProxy(RiskProxManagerProxy);
  const mocConverterProxy = await project.createProxy(MoCConverterProxy);
  const mocExchangeProxy = await project.createProxy(MoCExchangeProxy);
  const mocInrateProxy = await project.createProxy(MoCInrateProxy);
  const mocBurnoutProxy = await project.createProxy(MoCBurnoutProxy);
  const mocProxy = await project.createProxy(MoCProxy);

  // Governance
  const governorProxy = await project.createProxy(GovernorProxy);
  const stopperProxy = await project.createProxy(StopperProxy);
  const proxyAdmin = await ProxyAdmin.new();
  const upgradeDelegator = await UpgradeDelegator.new();

  const mocSettlement = await settlementContract.at(mocSettlementProxy.address);
  const mocState = await stateContract.at(mocStateProxy.address);
  const mocConnector = await MoCConnector.at(mocConnectorProxy.address);
  const riskProx = await RiskProxManager.at(riskProxProxy.address);
  const mocConverter = await MoCConverter.at(mocConverterProxy.address);
  const mocExchange = await MoCExchange.at(mocExchangeProxy.address);
  const mocInrate = await MoCInrate.at(mocInrateProxy.address);
  const mocBurnout = await MoCBurnout.at(mocBurnoutProxy.address);
  const moc = await MoC.at(mocProxy.address);

  const governor = await Governor.at(governorProxy.address);
  const stopper = await Stopper.at(stopperProxy.address);

  const mockMocStateChanger = await MocStateChanger.new(
    mocState.address,
    priceProvider.address,
    peg,
    utpdu,
    maxDiscountRate,
    dayBlockSpan,
    liq,
    smoothingFactor,
    emaBlockSpan,
    { from: owner }
  );
  const mockMocInrateChanger = await MocInrateChanger.new(
    mocInrate.address,
    7 * dayBlockSpan,
    riskProxTmin,
    riskProxTmax,
    riskProxPower,
    riskProRate,
    commissionRate,
    { from: owner }
  );

  const mockMoCSettlementChanger = await MoCSettlementChanger.new(
    mocSettlement.address,
    dayBlockSpan,
    {
      from: owner
    }
  );
  const mockMoCStallSettlementChanger = await MoCStallSettlementChanger.new(mocSettlement.address);
  const mockMoCRestartSettlementChanger = await MoCRestartSettlementChanger.new(
    mocSettlement.address
  );
  const mockMoCBucketContainerChanger = await MoCBucketContainerChanger.new(
    riskProx.address,
    c0Cobj,
    x2Cobj,
    {
      from: owner
    }
  );
  const mockMocChanger = await MocChanger.new(moc.address, governor.address, stopper.address, {
    from: owner
  });

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

  // Initialize contracts
  await mocConverter.initialize(mocConnector.address);
  await moc.initialize(mocConnector.address, governor.address, stopper.address, startStoppable);
  await stopper.initialize(owner);
  await mocExchange.initialize(mocConnector.address);
  await mocState.initialize(
    mocConnector.address,
    governor.address,
    priceProvider.address,
    liq, // mocPrecision
    utpdu, // mocPrecision
    maxDiscountRate, // mocPrecision
    dayBlockSpan, // no Precision
    reservePrice,
    smoothingFactor,
    emaBlockSpan
  );

  const commissionSplitter = await CommissionSplitter.new(
    moc.address,
    reserveToken.address,
    owner,
    0,
    governor.address,
    {
      from: owner
    }
  );

  await mocInrate.initialize(
    mocConnector.address,
    governor.address,
    riskProxTmin,
    riskProxPower,
    riskProxTmax,
    riskProRate,
    dayBlockSpan * 7,
    owner,
    commissionSplitter.address,
    commissionRate
  );
  await riskProx.initialize(mocConnector.address, governor.address, c0Cobj, x2Cobj);
  await mocSettlement.initialize(mocConnector.address, governor.address, settlementBlockSpan);
  await mocBurnout.initialize(mocConnector.address);
  await governor.initialize(owner);
  await upgradeDelegator.initialize(governor.address, proxyAdmin.address);

  // Transfer roles
  await transferOwnershipAndMinting(stableToken, mocExchange.address);
  await transferOwnershipAndMinting(riskPro, mocExchange.address);
  await transferPausingRole(riskPro, moc.address);
  await proxyAdmin.transferOwnership(upgradeDelegator.address);

  // Transfer upgrade adminship
  await project.changeProxyAdmin(mocSettlementProxy.address, proxyAdmin.address);
  await project.changeProxyAdmin(mocStateProxy.address, proxyAdmin.address);
  await project.changeProxyAdmin(mocConnectorProxy.address, proxyAdmin.address);
  await project.changeProxyAdmin(riskProxProxy.address, proxyAdmin.address);
  await project.changeProxyAdmin(mocConverterProxy.address, proxyAdmin.address);
  await project.changeProxyAdmin(mocExchangeProxy.address, proxyAdmin.address);
  await project.changeProxyAdmin(mocInrateProxy.address, proxyAdmin.address);
  await project.changeProxyAdmin(mocBurnoutProxy.address, proxyAdmin.address);
  await project.changeProxyAdmin(mocProxy.address, proxyAdmin.address);
  await project.changeProxyAdmin(governorProxy.address, proxyAdmin.address);
  await project.changeProxyAdmin(stopperProxy.address, proxyAdmin.address);

  return {
    mocConnector,
    moc,
    mocState,
    mocInrate,
    riskProx,
    riskPro,
    stableToken,
    mocBurnout,
    mocSettlement,
    priceProvider,
    governor,
    stopper,
    mockMocStateChanger,
    mockMocInrateChanger,
    mockMoCSettlementChanger,
    mockMoCBucketContainerChanger,
    mockMocChanger,
    mockMoCStallSettlementChanger,
    mockMoCRestartSettlementChanger,
    commissionSplitter,
    reserveToken
  };
};

module.exports = {
  createBaseContracts: createContracts(baseParams),
  createContracts
};
