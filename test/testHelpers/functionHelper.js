const chai = require('chai');
const { toContract } = require('../../utils/numberHelper');
const { toContractBNNoPrec } = require('./formatHelper');

// Changers
const SetCommissionFinalAddressChanger = artifacts.require(
  './contracts/SetCommissionFinalAddressChanger.sol'
);
const SetCommissionMocProportionChanger = artifacts.require(
  './contracts/SetCommissionMocProportionChanger.sol'
);

const SETTLEMENT_STEPS = 100;
const BUCKET_C0 = web3.utils.asciiToHex('C0', 32);
const BUCKET_X2 = web3.utils.asciiToHex('X2', 32);

const { BN, isBN } = web3.utils;

chai.use(require('chai-bn')(BN)).should();

const allowReserve = (reserve, moc) => async (from, amount) =>
  reserve.approve(moc.address, amount, { from });

// Mock ReserveTokens price provider doesn't use second and third parameter
const setReserveTokenPrice = priceProvider => async reservePrice =>
  priceProvider.post(toContract(reservePrice), 0, priceProvider.address);

const getReserveTokenPrice = priceProvider => async () => {
  const priceValue = await priceProvider.peek();
  return priceValue['0'];
};

const setSmoothingFactor = (governor, mockMocStateChanger) => async _coeff => {
  const coeff = isBN(_coeff) ? _coeff : toContractBNNoPrec(_coeff);
  await mockMocStateChanger.setSmoothingFactor(coeff);
  const setSmooth = await governor.executeChange(mockMocStateChanger.address);

  return setSmooth;
};

const calculateRiskProHoldersInterest = moc => async () => moc.calculateRiskProHoldersInterest();

const getRiskProRate = moc => async () => moc.getRiskProRate();

const getRiskProInterestBlockSpan = moc => async () => moc.getRiskProInterestBlockSpan();

const payRiskProHoldersInterestPayment = moc => async () => moc.payRiskProHoldersInterestPayment();

const isRiskProInterestEnabled = moc => async () => moc.isRiskProInterestEnabled();

const getRiskProInterestAddress = moc => async () => moc.getRiskProInterestAddress();

const redeemStableTokenRequest = moc => async (from, amount) => {
  const stableTokenPrecision = await moc.getMocPrecision();

  moc.redeemStableTokenRequest(toContract(amount * stableTokenPrecision), {
    from
  });
};

const redeemRiskPro = moc => async (from, amount) => {
  const reservePrecision = await moc.getReservePrecision();
  return moc.redeemRiskPro(toContract(amount * reservePrecision), { from });
};

const redeemRiskProx = moc => async (bucket, userAccount, riskProxAmount) => {
  const reservePrecision = await moc.getReservePrecision();
  const formattedAmount = toContract(riskProxAmount * reservePrecision);

  return moc.redeemRiskProx(bucket, formattedAmount, {
    from: userAccount
  });
};

const redeemFreeStableToken = moc => async ({ userAccount, stableTokenAmount }) => {
  const stableTokenPrecision = await moc.getMocPrecision();
  const formattedAmount = toContract(stableTokenAmount * stableTokenPrecision);

  return moc.redeemFreeStableToken(formattedAmount, {
    from: userAccount
  });
};

const mintRiskPro = moc => async (from, resTokensAmount, applyPrecision = true) => {
  if (!applyPrecision) {
    return moc.mintRiskPro(toContract(resTokensAmount), { from });
  }
  const reservePrecision = await moc.getReservePrecision();
  return moc.mintRiskPro(toContract(resTokensAmount * reservePrecision), {
    from
  });
};

const mintStableToken = moc => async (from, resTokensAmount) => {
  const reservePrecision = await moc.getReservePrecision();
  const reserveTokenAmountWithReservePrecision = toContract(resTokensAmount * reservePrecision);
  return moc.mintStableToken(reserveTokenAmountWithReservePrecision, {
    from
  });
};

const mintRiskProx = moc => async (from, bucket, resTokensToMint) => {
  const reservePrecision = await moc.getReservePrecision();
  return moc.mintRiskProx(bucket, toContract(resTokensToMint * reservePrecision), {
    from
  });
};

const reserveTokenNeededToMintRiskPro = (moc, mocState) => async riskProAmount => {
  // TODO: manage max Bitpro with discount
  const mocPrecision = await moc.getMocPrecision();
  const riskProTecPrice = await mocState.riskProTecPrice();
  // Check discount rate
  const riskProSpotDiscount = await mocState.riskProSpotDiscountRate();
  const factor = mocPrecision.sub(riskProSpotDiscount);
  const finalPrice = riskProTecPrice.mul(factor).div(mocPrecision);

  const reserveTotal = toContractBNNoPrec(riskProAmount * finalPrice);
  return reserveTotal;
};

const mintRiskProAmount = (moc, mocState) => async (account, riskProAmount) => {
  if (!riskProAmount) {
    return;
  }

  const reserveTotal = await reserveTokenNeededToMintRiskPro(moc, mocState)(riskProAmount);
  // User should have more than this balance to pay commissions
  return moc.mintRiskPro(toContract(reserveTotal), { from: account });
};

const mintStableTokenAmount = (moc, priceProvider) => async (account, stableTokensToMint) => {
  if (!stableTokensToMint) {
    return;
  }
  const reservePrecision = await moc.getReservePrecision();
  const stableTokenPrecision = await moc.getMocPrecision();

  const formattedAmount = stableTokensToMint * stableTokenPrecision;
  const reservePrice = await getReserveTokenPrice(priceProvider)();
  const reserveTotal = (formattedAmount / reservePrice) * reservePrecision;
  // Account should have enough allowance to pay commissions
  return moc.mintStableToken(toContract(reserveTotal), { from: account });
};

const mintRiskProxAmount = (moc, mocState) => async (account, bucket, riskProxAmount) => {
  if (!riskProxAmount) {
    return;
  }

  const riskProxTecPrice = await mocState.bucketRiskProTecPrice(BUCKET_X2);
  const reserveTotal = toContractBNNoPrec(riskProxAmount * riskProxTecPrice);

  return moc.mintRiskProx(bucket, reserveTotal, { from: account });
};

const getTokenBalance = token => async address => token.balanceOf(address);

// Runs settlement with a default fixed step count
const executeSettlement = moc => () => moc.runSettlement(SETTLEMENT_STEPS);

const getRiskProxBalance = riskProx => async (bucket, address) =>
  riskProx.riskProxBalanceOf(bucket, address);

const getRedeemRequestAt = moc => async index => moc.getRedeemRequestAt(index);

const getUserBalances = (
  riskProToken,
  stableToken,
  riskProxManager,
  reserveToken
) => async account => {
  const [stable, riskPro, riskPro2x, reserve] = await Promise.all([
    stableToken.balanceOf(account),
    riskProToken.balanceOf(account),
    riskProxManager.riskProxBalanceOf(BUCKET_X2, account),
    reserveToken.balanceOf(account)
  ]);

  return { stable, riskPro, riskPro2x, reserve };
};

const getGlobalState = mocState => async () => {
  const [
    coverage,
    nReserve,
    adjNReserve,
    nRiskPro,
    nStableToken,
    inrateBag,
    nRiskProx2,
    riskProTecPrice,
    abRatio
  ] = await Promise.all([
    mocState.globalCoverage(),
    mocState.reserves(),
    mocState.collateralReserves(),
    mocState.riskProTotalSupply(),
    mocState.stableTokenTotalSupply(),
    mocState.getInrateBag(BUCKET_C0),
    mocState.getBucketNRiskPro(BUCKET_X2),
    mocState.riskProTecPrice(),
    mocState.currentAbundanceRatio()
  ]);

  return {
    coverage,
    nReserve,
    adjNReserve,
    nRiskPro,
    nStableToken,
    inrateBag,
    nRiskProx2,
    riskProTecPrice,
    abRatio
  };
};

const getBucketState = mocState => async bucket => {
  const [
    coverage,
    leverage,
    lB,
    nReserve,
    nRiskPro,
    nStableToken,
    inrateBag,
    riskProxTecPrice
  ] = await Promise.all([
    mocState.coverage(bucket),
    mocState.leverage(bucket),
    mocState.lockedReserveTokens(bucket),
    mocState.getBucketNReserve(bucket),
    mocState.getBucketNRiskPro(bucket),
    mocState.getBucketNStableToken(bucket),
    mocState.getInrateBag(bucket),
    mocState.bucketRiskProTecPrice(bucket)
  ]);

  return { coverage, leverage, lB, nReserve, nRiskPro, nStableToken, inrateBag, riskProxTecPrice };
};

const bucketString = moc => async bucket => {
  const bucketState = await getBucketState(moc)(bucket);
  return bucketStateToString(bucketState);
};

const bucketStateToString = state =>
  Object.keys(state).reduce(
    (last, key) => `${last}${key}: ${state[key].toString()}
  `,
    ''
  );

const logBucket = moc => async bucket => {
  // eslint-disable-next-line no-console
  console.log(await bucketString(moc)(bucket));
};

const claimReserveTokens = reserveToken => (from, amount) => reserveToken.claim(amount, { from });

const getReserveAllowance = (reserve, moc) => async account =>
  reserve.allowance(account, moc.address);

const getMoCSystemAllowance = moc => async account => moc.getAllowance(account);

const maxStableToken = mocState => async () => mocState.absoluteMaxStableToken();
const maxRiskPro = mocState => async () => mocState.absoluteMaxRiskPro();

const addReserves = (reserve, moc) => async (from, amount, withAllow = true) => {
  if (withAllow) {
    await allowReserve(reserve, moc)(from, amount);
  }
  await moc.addReserves(amount, { from });
};

const setFinalCommissionAddress = (commissionSplitter, governor) => async finalAddress => {
  const setCommissionAddressChanger = await SetCommissionFinalAddressChanger.new(
    commissionSplitter.address,
    finalAddress
  );

  return governor.executeChange(setCommissionAddressChanger.address);
};

const setMocCommissionProportion = (commissionSplitter, governor) => async proportion => {
  const setCommissionMocProportionChanger = await SetCommissionMocProportionChanger.new(
    commissionSplitter.address,
    proportion
  );

  return governor.executeChange(setCommissionMocProportionChanger.address);
};

module.exports = async contracts => {
  const {
    stableToken,
    riskPro,
    moc,
    mocState,
    riskProx,
    priceProvider,
    governor,
    mockMocStateChanger,
    reserveToken,
    commissionSplitter
  } = contracts;

  return {
    setReserveTokenPrice: setReserveTokenPrice(priceProvider),
    getReserveTokenPrice: getReserveTokenPrice(priceProvider),
    getReserveAllowance: getReserveAllowance(reserveToken, moc),
    getStableTokenBalance: getTokenBalance(stableToken),
    getRiskProBalance: getTokenBalance(riskPro),
    getReserveBalance: getTokenBalance(reserveToken),
    getRiskProxBalance: getRiskProxBalance(riskProx),
    getUserBalances: getUserBalances(riskPro, stableToken, riskProx, reserveToken),
    setSmoothingFactor: setSmoothingFactor(governor, mockMocStateChanger),
    mintRiskPro: mintRiskPro(moc),
    mintStableToken: mintStableToken(moc),
    mintRiskProx: mintRiskProx(moc),
    redeemRiskPro: redeemRiskPro(moc),
    redeemRiskProx: redeemRiskProx(moc),
    redeemFreeStableToken: redeemFreeStableToken(moc),
    redeemStableTokenRequest: redeemStableTokenRequest(moc),
    reserveTokenNeededToMintRiskPro: reserveTokenNeededToMintRiskPro(moc, mocState),
    mintRiskProAmount: mintRiskProAmount(moc, mocState),
    mintStableTokenAmount: mintStableTokenAmount(moc, priceProvider),
    mintRiskProxAmount: mintRiskProxAmount(moc, mocState),
    calculateRiskProHoldersInterest: calculateRiskProHoldersInterest(moc),
    getRiskProRate: getRiskProRate(moc),
    getRiskProInterestBlockSpan: getRiskProInterestBlockSpan(moc),
    getRiskProInterestAddress: getRiskProInterestAddress(moc),
    payRiskProHoldersInterestPayment: payRiskProHoldersInterestPayment(moc),
    isRiskProInterestEnabled: isRiskProInterestEnabled(moc),
    executeSettlement: executeSettlement(moc),
    getGlobalState: getGlobalState(mocState),
    getBucketState: getBucketState(mocState),
    logBucket: logBucket(mocState),
    getRedeemRequestAt: getRedeemRequestAt(moc),
    allowReserve: allowReserve(reserveToken, moc),
    getMoCSystemAllowance: getMoCSystemAllowance(moc),
    claimReserveTokens: claimReserveTokens(reserveToken),
    addReserves: addReserves(reserveToken, moc),
    maxStableToken: maxStableToken(mocState),
    maxRiskPro: maxRiskPro(mocState),
    setFinalCommissionAddress: setFinalCommissionAddress(commissionSplitter, governor),
    setMocCommissionProportion: setMocCommissionProportion(commissionSplitter, governor)
  };
};
