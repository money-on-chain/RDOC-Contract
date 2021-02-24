const testHelperBuilder = require('../mocHelper.js');

const { BN } = web3.utils;

let mocHelper;
let BUCKET_X2;

contract('MoC: Retrocompatibility', function([owner, userAccount]) {
  before(async function() {
    mocHelper = await testHelperBuilder({ owner });
    ({ BUCKET_X2 } = mocHelper);
    this.moc = mocHelper.moc;
    this.mockMocInrateChanger = mocHelper.mockMocInrateChanger;
    this.governor = mocHelper.governor;
    this.mocState = mocHelper.mocState;
    this.reservePrice = await this.mocState.getBitcoinPrice();
    this.riskProx2Price = await this.mocState.bucketRiskProTecPrice(BUCKET_X2);
  });

  beforeEach(async function() {
    await mocHelper.revertState();
    // Commission rates for test are set in functionHelper.js
    // await mocHelper.mockMocInrateChanger.setCommissionRates(
    //   await mocHelper.getCommissionsArrayNonZero()
    // );

    // // set commissions address
    // await mocHelper.mockMocInrateChanger.setCommissionsAddress(commissionsAccount);
    // // update params
    // await mocHelper.governor.executeChange(mocHelper.mockMocInrateChanger.address);
  });

  describe('GIVEN since the user wants to mint and redeem BPro with the retrocompatible functions', function() {
    it('WHEN a user tries to mint BPros, THEN operation is successful', async function() {
      const mintAmount = 100;

      // Mint
      await mocHelper.mintRiskPro(userAccount, mintAmount);
      const balance = await mocHelper.getRiskProBalance(userAccount);
      mocHelper.assertBigRBTC(
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
      mocHelper.assertBigRBTC(balance, 0, 'userAccount Risk balance was not 0');
    });
  });
  describe('GIVEN since the user wants to mint and redeem StableToken with the retrocompatible functions', function() {
    it('WHEN a user tries to mint StableToken, THEN operation is successful', async function() {
      // Mint BPros to be able to mint StableToken
      await mocHelper.mintRiskPro(userAccount, 100);

      const mintAmount = 1;

      // Mint
      await mocHelper.mintStableToken(userAccount, mintAmount);
      const balance = await mocHelper.getStableTokenBalance(userAccount);
      const mintAmountInStableToken = new BN(mintAmount)
        .mul(this.reservePrice)
        .div(mocHelper.RESERVE_PRECISION);
      mocHelper.assertBigRBTC(
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
        docAmount: redeemAmount
      });
      const balance = await mocHelper.getStableTokenBalance(userAccount);
      mocHelper.assertBigRBTC(balance, 0, 'userAccount StableToken balance was not 0');
    });
  });
  describe('GIVEN since the user wants to mint and redeem RiskProx with the retrocompatible functions', function() {
    it('WHEN a user tries to mint RiskProxs, THEN operation is successful', async function() {
      // Mint RiskPros to be able to mint DoC
      await mocHelper.mintRiskPro(userAccount, 100);
      // Mint StableToken to be able to mint BTCX
      await mocHelper.mintStableToken(userAccount, 100);

      const mintAmount = 1;

      // Mint
      await mocHelper.mintRiskProx(userAccount, BUCKET_X2, mintAmount);
      const balance = await mocHelper.getRiskProxBalance(BUCKET_X2, userAccount);
      const mintAmountInBTCX = new BN(mintAmount)
        .mul(mocHelper.MOC_PRECISION)
        .div(this.riskProx2Price);
      mocHelper.assertBigRBTC(
        balance,
        mintAmountInBTCX,
        'userAccount RiskProx balance was not mintAmountInBTCX'
      );
    });
    it('WHEN a user tries to redeem RiskProxs, THEN operation is successful', async function() {
      const redeemAmount = 1;

      // Redeem
      await mocHelper.redeemRiskProx(userAccount, BUCKET_X2, redeemAmount);
      const balance = await mocHelper.getRiskProxBalance(BUCKET_X2, userAccount);
      mocHelper.assertBigRBTC(balance, 0, 'userAccount RiskProx balance was not 0');
    });
  });
});
