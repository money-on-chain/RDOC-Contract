const { BigNumber } = require('bignumber.js');
const chai = require('chai');
const { toContract, toBigNumber } = require('../../utils/numberHelper');
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

const zeroAddress = '0x0000000000000000000000000000000000000000';

const comissionsTxType = {
  MINT_RISKPRO_FEES_RESERVE: new BN(1),
  REDEEM_RISKPRO_FEES_RESERVE: new BN(2),
  MINT_STABLETOKEN_FEES_RESERVE: new BN(3),
  REDEEM_STABLETOKEN_FEES_RESERVE: new BN(4),
  MINT_RISKPROX_FEES_RESERVE: new BN(5),
  REDEEM_RISKPROX_FEES_RESERVE: new BN(6),
  MINT_RISKPRO_FEES_MOC: new BN(7),
  REDEEM_RISKPRO_FEES_MOC: new BN(8),
  MINT_STABLETOKEN_FEES_MOC: new BN(9),
  REDEEM_STABLETOKEN_FEES_MOC: new BN(10),
  MINT_RISKPROX_FEES_MOC: new BN(11),
  REDEEM_RISKPROX_FEES_MOC: new BN(12)
};

const allowReserve = (reserve, moc) => async (from, amount) =>
  reserve.approve(moc.address, amount, { from });

// Mock ReserveTokens price provider doesn't use second and third parameter
const setReserveTokenPrice = priceProvider => async reservePrice =>
  priceProvider.post(toContract(reservePrice), 0, priceProvider.address);

const getReserveTokenPrice = priceProvider => async () => {
  const priceValue = await priceProvider.peek();
  return priceValue['0'];
};

// Mock MoC price provider doesn't use second and third parameter
const setMoCPrice = mocPriceProvider => async mocPrice =>
  mocPriceProvider.post(toContract(mocPrice), 0, mocPriceProvider.address);

const getMoCPrice = mocPriceProvider => async () => {
  const priceValue = await mocPriceProvider.peek();
  return priceValue['0'];
};

const setSmoothingFactor = (governor, mockMocStateChanger) => async _coeff => {
  const coeff = isBN(_coeff) ? _coeff : toContractBNNoPrec(_coeff);
  await mockMocStateChanger.setSmoothingFactor(coeff);
  const setSmooth = await governor.executeChange(mockMocStateChanger.address);

  return setSmooth;
};

const redeemFreeStableToken = moc => async ({ userAccount, stableTokenAmount, vendorAccount }) => {
  let _vendorAccount = vendorAccount;
  if (!vendorAccount) {
    _vendorAccount = zeroAddress;
  }

  const stableTokenPrecision = await moc.getMocPrecision();
  const formattedAmount = toContract(stableTokenAmount * stableTokenPrecision);

  return _vendorAccount !== zeroAddress
    ? moc.redeemFreeStableTokenVendors(formattedAmount, _vendorAccount, {
        from: userAccount
      })
    : moc.redeemFreeStableToken(formattedAmount, { from: userAccount });
};

const calculateRiskProHoldersInterest = moc => async () => moc.calculateRiskProHoldersInterest();

const getRiskProRate = moc => async () => moc.getRiskProRate();

const getRiskProInterestBlockSpan = moc => async () => moc.getRiskProInterestBlockSpan();

const payRiskProHoldersInterestPayment = moc => async () => moc.payRiskProHoldersInterestPayment();

const isRiskProInterestEnabled = moc => async () => moc.isRiskProInterestEnabled();

const getRiskProInterestAddress = moc => async () => moc.getRiskProInterestAddress();

const mintMoCToken = mocToken => async (anotherAccount, initialBalance, owner) => {
  await mocToken.mint(anotherAccount, web3.utils.toWei(initialBalance.toString()), { from: owner });
};

const approveMoCToken = mocToken => async (anotherAccount, amount, owner) => {
  await mocToken.approve(anotherAccount, web3.utils.toWei(amount.toString()), { from: owner });
};

const mintRiskPro = moc => async (
  from,
  resTokensAmount,
  vendorAccount = zeroAddress,
  applyPrecision = true
) => {
  const reservePrecision = await moc.getReservePrecision();

  const reserveAmountToMint = applyPrecision
    ? toContract(resTokensAmount * reservePrecision)
    : toContract(resTokensAmount);

  return vendorAccount !== zeroAddress
    ? moc.mintRiskProVendors(reserveAmountToMint, vendorAccount, { from })
    : moc.mintRiskPro(toContract(reserveAmountToMint), { from });
};

const mintStableToken = moc => async (from, resTokensAmount, vendorAccount = zeroAddress) => {
  const reservePrecision = await moc.getReservePrecision();
  const reserveTokenAmountWithReservePrecision = toContract(resTokensAmount * reservePrecision);
  return vendorAccount !== zeroAddress
    ? moc.mintStableTokenVendors(reserveTokenAmountWithReservePrecision, vendorAccount, {
        from
      })
    : moc.mintStableToken(reserveTokenAmountWithReservePrecision, {
        from
      });
};

const mintRiskProx = moc => async (from, bucket, resTokensToMint, vendorAccount = zeroAddress) => {
  const reservePrecision = await moc.getReservePrecision();
  return vendorAccount !== zeroAddress
    ? moc.mintRiskProxVendors(
        bucket,
        toContract(resTokensToMint * reservePrecision),
        vendorAccount,
        {
          from
        }
      )
    : moc.mintRiskProx(bucket, toContract(resTokensToMint * reservePrecision), {
        from
      });
};

const redeemRiskProx = moc => async (from, bucket, amount, vendorAccount = zeroAddress) => {
  const reservePrecision = await moc.getReservePrecision();
  const amountWithPrecision = new BN(amount).mul(reservePrecision);
  return vendorAccount !== zeroAddress
    ? moc.redeemRiskProxVendors(bucket, toContract(amountWithPrecision), vendorAccount, {
        from
      })
    : moc.redeemRiskProx(bucket, toContract(amountWithPrecision), { from });
};

const reserveTokenNeededToMintRiskPro = (moc, mocState) => async riskProAmount => {
  // TODO: manage max RiskPro with discount
  const mocPrecision = await moc.getMocPrecision();
  const riskProTecPrice = await mocState.riskProTecPrice();
  // Check discount rate
  const riskProSpotDiscount = await mocState.riskProSpotDiscountRate();
  const factor = mocPrecision.sub(riskProSpotDiscount);
  const finalPrice = riskProTecPrice.mul(factor).div(mocPrecision);

  const reserveTotal = toContractBNNoPrec(riskProAmount * finalPrice);
  return reserveTotal;
};

const mintRiskProAmount = (moc, mocState, mocVendors) => async (
  account,
  riskProAmount,
  vendorAccount,
  txType = comissionsTxType.MINT_RISKPRO_FEES_RESERVE
) => {
  if (!riskProAmount) {
    return;
  }

  const reserveTotal = await reserveTokenNeededToMintRiskPro(moc, mocState)(riskProAmount);
  // User should have more than this balance to pay commissions
  return moc.mintRiskProVendors(toContract(reserveTotal), vendorAccount, { from: account });
};

const mintStableTokenAmount = (moc, priceProvider, mocVendors) => async (
  account,
  stableTokensToMint,
  vendorAccount,
  txType = comissionsTxType.MINT_STABLETOKEN_FEES_RESERVE
) => {
  if (!stableTokensToMint) {
    return;
  }
  const reservePrecision = await moc.getReservePrecision();
  const stableTokenPrecision = await moc.getMocPrecision();

  const formattedAmount = stableTokensToMint * stableTokenPrecision;
  const reservePrice = await getReserveTokenPrice(priceProvider)();
  const reserveTotal = (formattedAmount / reservePrice) * reservePrecision;
  // Account should have enough allowance to pay commissions
  return moc.mintStableTokenVendors(toContract(reserveTotal), vendorAccount, { from: account });
};

const mintRiskProxAmount = (moc, mocState, mocVendors) => async (
  account,
  bucket,
  riskProxAmount,
  vendorAccount,
  txType = comissionsTxType.MINT_RISKPROX_FEES_RESERVE
) => {
  if (!riskProxAmount) {
    return;
  }

  const riskProxTecPrice = await mocState.bucketRiskProTecPrice(BUCKET_X2);
  const reserveTotal = toContractBNNoPrec(riskProxAmount * riskProxTecPrice);

  return moc.mintRiskProxVendors(bucket, reserveTotal, vendorAccount, { from: account });
};

const redeemRiskPro = moc => async (from, amount, vendorAccount = zeroAddress) => {
  const reservePrecision = await moc.getReservePrecision();
  return vendorAccount !== zeroAddress
    ? moc.redeemRiskProVendors(toContract(amount * reservePrecision), vendorAccount, { from })
    : moc.redeemRiskPro(toContract(amount * reservePrecision), { from });
};

const redeemStableTokenRequest = moc => async (from, amount) => {
  const stableTokenPrecision = await moc.getMocPrecision();

  moc.redeemStableTokenRequest(toContract(amount * stableTokenPrecision), {
    from
  });
};

const getMoCAllowance = mocToken => async (owner, spender) => mocToken.allowance(owner, spender);

const getTokenBalance = token => async address => token.balanceOf(address);

// Runs settlement with a default fixed step count
const executeSettlement = moc => () => moc.runSettlement(SETTLEMENT_STEPS);

const getRedeemRequestAt = moc => async index => moc.getRedeemRequestAt(index);

const getRiskProxBalance = riskProx => async (bucket, address) =>
  riskProx.riskProxBalanceOf(bucket, address);

const getUserBalances = (
  riskProToken,
  stableToken,
  riskProxManager,
  reserveToken,
  mocToken
) => async account => {
  const [stable, riskPro, riskPro2x, reserve, moc] = await Promise.all([
    stableToken.balanceOf(account),
    riskProToken.balanceOf(account),
    riskProxManager.riskProxBalanceOf(BUCKET_X2, account),
    reserveToken.balanceOf(account),
    mocToken.balanceOf(account)
  ]);

  return { stable, riskPro, riskPro2x, reserve, moc };
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

const bucketStateToString = state =>
  Object.keys(state).reduce(
    (last, key) => `${last}${key}: ${state[key].toString()}
  `,
    ''
  );

const bucketString = moc => async bucket => {
  const bucketState = await getBucketState(moc)(bucket);
  return bucketStateToString(bucketState);
};

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

const getCommissionsArrayNonZero = (moc, mocInrate) => async () => {
  let mocPrecision = 10 ** 18;
  if (typeof moc !== 'undefined') {
    mocPrecision = await moc.getMocPrecision();
  }

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

const getCommissionsArrayInvalidLength = async () => {
  const ret = [];
  const length = 60;
  const mocPrecision = 10 ** 18;

  for (let i = 1; i <= length; i++) {
    ret.push({
      txType: i.toString(),
      fee: BigNumber(i)
        .times(mocPrecision)
        .toString()
    });
  }

  return ret;
};

const getCommissionsArrayChangingTest = async () => {
  const ret = [];
  const length = 12;
  const mocPrecision = 10 ** 18;

  for (let i = 1; i <= length; i++) {
    ret.push({
      txType: i.toString(),
      fee: BigNumber(i * 2)
        .times(mocPrecision)
        .toString()
    });
  }

  return ret;
};

const registerVendor = (moc, mocToken, mocVendors) => async (vendorAccount, markup, owner) => {
  let mocPrecision = 10 ** 18;
  if (typeof moc !== 'undefined') {
    mocPrecision = await moc.getMocPrecision();
  }

  // Amount is converted to wei in mint and approve functions
  const vendorRequiredMoCs = 1000;

  // Add initial MoC token balance and allowance for vendor to register
  await mintMoCToken(mocToken)(vendorAccount, vendorRequiredMoCs, owner);
  await approveMoCToken(mocToken)(mocVendors.address, vendorRequiredMoCs, vendorAccount);

  // Register vendor
  return mocVendors.registerVendor(toContractBNNoPrec(markup * mocPrecision).toString(), {
    from: vendorAccount
  });
};

const consolePrintTestVariables = obj => {
  for (let i = 0; i < Object.keys(obj).length; i++) {
    const variableName = Object.keys(obj)[i];
    // eslint-disable-next-line no-console
    console.log(`${variableName}: ${obj[variableName].toString()}`);
  }
};

module.exports = async contracts => {
  const {
    stableToken,
    riskPro,
    moc,
    mocState,
    riskProx,
    priceProvider,
    mocInrate,
    governor,
    mockMocStateChanger,
    reserveToken,
    commissionSplitter,
    mocToken,
    mocPriceProvider,
    mocVendors
  } = contracts;

  return {
    setReserveTokenPrice: setReserveTokenPrice(priceProvider),
    getReserveTokenPrice: getReserveTokenPrice(priceProvider),
    getReserveAllowance: getReserveAllowance(reserveToken, moc),
    getStableTokenBalance: getTokenBalance(stableToken),
    getRiskProBalance: getTokenBalance(riskPro),
    getReserveBalance: getTokenBalance(reserveToken),
    getRiskProxBalance: getRiskProxBalance(riskProx),
    getUserBalances: getUserBalances(riskPro, stableToken, riskProx, reserveToken, mocToken),
    setSmoothingFactor: setSmoothingFactor(governor, mockMocStateChanger),
    mintRiskPro: mintRiskPro(moc),
    mintStableToken: mintStableToken(moc),
    mintRiskProx: mintRiskProx(moc),
    redeemRiskPro: redeemRiskPro(moc),
    redeemRiskProx: redeemRiskProx(moc),
    redeemFreeStableToken: redeemFreeStableToken(moc),
    redeemStableTokenRequest: redeemStableTokenRequest(moc),
    reserveTokenNeededToMintRiskPro: reserveTokenNeededToMintRiskPro(moc, mocState),
    mintRiskProAmount: mintRiskProAmount(moc, mocState, mocVendors),
    mintStableTokenAmount: mintStableTokenAmount(moc, priceProvider, mocVendors),
    mintRiskProxAmount: mintRiskProxAmount(moc, mocState, mocVendors),
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
    setMocCommissionProportion: setMocCommissionProportion(commissionSplitter, governor),
    mintMoCToken: mintMoCToken(mocToken),
    getMoCBalance: getTokenBalance(mocToken),
    approveMoCToken: approveMoCToken(mocToken),
    getMoCAllowance: getMoCAllowance(mocToken),
    comissionsTxType,
    getCommissionsArrayNonZero: getCommissionsArrayNonZero(moc, mocInrate),
    getCommissionsArrayInvalidLength,
    getCommissionsArrayChangingTest,
    BUCKET_C0,
    BUCKET_X2,
    setMoCPrice: setMoCPrice(mocPriceProvider),
    getMoCPrice: getMoCPrice(mocPriceProvider),
    registerVendor: registerVendor(moc, mocToken, mocVendors),
    consolePrintTestVariables
  };
};
