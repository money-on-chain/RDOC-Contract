const { BN } = web3.utils;

const unitsMapping = {
  nStableTokens: 'MAX',
  nStableTokengl: 'MAX',
  liq: 'MAX',
  utpdu: 'MAX',
  peg: 'PEG',
  nRiskPro: 'RES',
  nRiskProx: 'RES',
  initialnB: 'RES',
  reservePrice: 'MAX',
  B: 'MAX',
  nStableTokensReserveTokenAmount: 'RES',
  riskProReserveTokenAmount: 'RES',
  globalLockedReserveTokens: 'RES',
  globalCoverage: 'MAX',
  globalMaxStableToken: 'MAX',
  globalMaxRiskPro: 'RES',
  riskProTecPrice: 'RES',
  riskProUsdPrice: 'MAX',
  maxRiskPro: 'RES',
  lockedReserveTokens: 'RES',
  coverage: 'MAX',
  leverage: 'MAX',
  discount: 'RAT',
  nReserve: 'RES',
  lB: 'RES',
  Co: 'MAX',
  tMax: 'RAT',
  tMin: 'RAT',
  riskProRate: 'RAT',
  days: 'DAY',
  stableToken0: 'MAX',
  stableTokent: 'MAX',
  inrate: 'RAT',
  inratePost: 'RAT',
  inrateAvg: 'RAT',
  blockSpan: 'NONE',
  power: 'NONE'
};

module.exports = async moc => {
  const [RESERVE_PRECISION, DAY_PRECISION, MOC_PRECISION] = await Promise.all([
    moc.getReservePrecision(),
    moc.getDayPrecision(),
    moc.getMocPrecision()
  ]);
  const unitsPrecision = {
    RES: RESERVE_PRECISION,
    USD: MOC_PRECISION,
    COV: MOC_PRECISION,
    RAT: MOC_PRECISION,
    DAY: DAY_PRECISION,
    MAX: MOC_PRECISION,
    PEG: new BN(1),
    NONE: new BN(1)
  };
  return {
    RESERVE_PRECISION,
    MOC_PRECISION,
    DAY_PRECISION,
    unitsPrecision,
    unitsMapping
  };
};
