/* eslint-disable no-console */
const abiDecoder = require('abi-decoder');

const PriceProviderMock = artifacts.require('./contracts/mocks/PriceProviderMock.sol');
const StableToken = artifacts.require('./contracts/StableToken.sol');
const MoC = artifacts.require('./contracts/MoC.sol');
const MoCState = artifacts.require('./contracts/MoCState.sol');
const MoCExchange = artifacts.require('./contracts/MoCExchange.sol');
const MoCInrate = artifacts.require('./contracts/MoCInrate.sol');
const RiskPro = artifacts.require('./contracts/RiskProToken.sol');
const RiskProxManager = artifacts.require('./contracts/MoCRiskProxManager.sol');
const MoCSettlement = artifacts.require('./contracts/MoCSettlement.sol');
const Governor = artifacts.require('moc-governance/contracts/Governance/Governor.sol');
const Stopper = artifacts.require('moc-governance/contracts/Stopper/Stopper.sol');
const CommissionSplitter = artifacts.require('./CommissionSplitter.sol');
const MoCVendors = artifacts.require('./MoCVendors.sol');

abiDecoder.addABI(MoC.abi);
abiDecoder.addABI(StableToken.abi);
abiDecoder.addABI(RiskPro.abi);
abiDecoder.addABI(RiskProxManager.abi);
abiDecoder.addABI(MoCSettlement.abi);
abiDecoder.addABI(MoCState.abi);
abiDecoder.addABI(MoCInrate.abi);
abiDecoder.addABI(MoCExchange.abi);
abiDecoder.addABI(PriceProviderMock.abi);
abiDecoder.addABI(Governor.abi);
abiDecoder.addABI(Stopper.abi);
abiDecoder.addABI(CommissionSplitter.abi);
abiDecoder.addABI(MoCVendors.abi);

const objectToString = state =>
  Object.keys(state).reduce(
    (last, key) => `${last}${key}: ${state[key].toString()}
  `,
    ''
  );

const decodeLogs = txReceipt => abiDecoder.decodeLogs(txReceipt.rawLogs);

const transformEvent = event => {
  const obj = {};
  event.forEach(arg => {
    switch (arg.type) {
      case 'address':
        obj[arg.name] = web3.utils.toChecksumAddress(arg.value);
        break;
      case 'bool':
        obj[arg.name] = arg.value === 'true';
        break;
      default:
        // uints and string
        obj[arg.name] = arg.value;
    }
  });

  return obj;
};

const findEvents = (tx, eventName, eventArgs) => {
  const txLogs = decodeLogs(tx.receipt);
  const logs = txLogs.filter(log => log && log.name === eventName);
  const events = logs.map(log => transformEvent(log.events));

  // Filter
  if (eventArgs) {
    return events.filter(ev => Object.entries(eventArgs).every(([k, v]) => ev[k] === v));
  }

  return events;
};

const findEventsInTxs = (txs, eventName, eventArgs) => {
  const events = txs.map(tx => findEvents(tx, eventName, eventArgs));

  // Just a flat without lodash
  return events.reduce((accum, ev) => accum.concat(ev), []);
};

const logDebugEvents = async tx => {
  const events = await findEvents(tx, 'DEBUG');

  events.forEach(ev => {
    console.log(objectToString(ev));
  });
};

module.exports = {
  findEventsInTxs,
  findEvents,
  logDebugEvents,
  decodeLogs
};
