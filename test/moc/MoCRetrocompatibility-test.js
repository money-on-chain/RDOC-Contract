const testHelperBuilder = require('../mocHelper.js');

const { BN } = web3.utils;

let mocHelper;
let BUCKET_X2;

contract('MoC: Retrocompatibility', function([owner, userAccount]) {
  before(async function() {
    mocHelper = await testHelperBuilder({ owner, accounts: [owner, userAccount] });
    ({ BUCKET_X2 } = mocHelper);
    this.moc = mocHelper.moc;
    this.mockMocInrateChanger = mocHelper.mockMocInrateChanger;
    this.governor = mocHelper.governor;
    this.mocState = mocHelper.mocState;
    this.reservePrice = await this.mocState.getReserveTokenPrice();
    this.riskProx2Price = await this.mocState.bucketRiskProTecPrice(BUCKET_X2);
  });

  beforeEach(async function() {
    await mocHelper.revertState();
  });

  describe('GIVEN since the user wants to mint and redeem RiskPro with the retrocompatible functions', function() {
    it('WHEN a user tries to mint RiskPros, THEN operation is successful', async function() {
      const mintAmount = 100;

      // Mint
      await mocHelper.mintRiskPro(userAccount, mintAmount);
      const balance = await mocHelper.getRiskProBalance(userAccount);
      mocHelper.assertBigReserve(
        balance,
        mintAmount,
        'userAccount RiskPro balance was not mintAmount'
      );
    });
    it('WHEN a user tries to redeem RiskPros, THEN operation is successful', async function() {
      const redeemAmount = 100;

      // Redeem
      await mocHelper.redeemRiskPro(userAccount, redeemAmount);
      const balance = await mocHelper.getRiskProBalance(userAccount);
      mocHelper.assertBigReserve(balance, 0, 'userAccount Risk balance was not 0');
    });
  });
  describe('GIVEN since the user wants to mint and redeem StableToken with the retrocompatible functions', function() {
    it('WHEN a user tries to mint StableToken, THEN operation is successful', async function() {
      // Mint RiskPros to be able to mint StableToken
      await mocHelper.mintRiskPro(userAccount, 100);

      const mintAmount = 1;

      // Mint
      await mocHelper.mintStableToken(userAccount, mintAmount);
      const balance = await mocHelper.getStableTokenBalance(userAccount);
      const mintAmountInStableToken = new BN(mintAmount)
        .mul(this.reservePrice)
        .div(mocHelper.RESERVE_PRECISION);
      mocHelper.assertBigReserve(
        balance,
        mintAmountInStableToken,
        'userAccount StableToken balance was not mintAmountInStableToken'
      );
    });
    it('WHEN a user tries to redeem StableTokens, THEN operation is successful', async function() {
      const redeemAmount = 1;

      // Redeem
      await mocHelper.redeemFreeStableToken({
        userAccount,
        stableTokenAmount: redeemAmount
      });
      const balance = await mocHelper.getStableTokenBalance(userAccount);
      mocHelper.assertBigReserve(balance, 0, 'userAccount StableToken balance was not 0');
    });
  });
  describe('GIVEN since the user wants to mint and redeem RiskProx with the retrocompatible functions', function() {
    it('WHEN a user tries to mint RiskProxs, THEN operation is successful', async function() {
      // Mint RiskPros to be able to mint StableToken
      await mocHelper.mintRiskPro(userAccount, 100);
      // Mint StableToken to be able to mint RiskProx
      await mocHelper.mintStableToken(userAccount, 100);

      const mintAmount = 1;

      // Mint
      await mocHelper.mintRiskProx(userAccount, BUCKET_X2, mintAmount);
      const balance = await mocHelper.getRiskProxBalance(BUCKET_X2, userAccount);
      const mintAmountInRiskProx = new BN(mintAmount)
        .mul(mocHelper.MOC_PRECISION)
        .div(this.riskProx2Price);
      mocHelper.assertBigReserve(
        balance,
        mintAmountInRiskProx,
        'userAccount RiskProx balance was not mintAmountInRiskProx'
      );
    });
    it('WHEN a user tries to redeem RiskProxs, THEN operation is successful', async function() {
      const redeemAmount = 1;

      // Redeem
      await mocHelper.redeemRiskProx(userAccount, BUCKET_X2, redeemAmount);
      const balance = await mocHelper.getRiskProxBalance(BUCKET_X2, userAccount);
      mocHelper.assertBigReserve(balance, 0, 'userAccount RiskProx balance was not 0');
    });
  });
});
