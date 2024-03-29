const testHelperBuilder = require('../mocHelper.js');

let mocHelper;
let BUCKET_X2;

contract('MoC: Bucket Liquidation', function([owner, userAccount, otherAccount, vendorAccount]) {
  /*
  before(async function() {
    const accounts = [owner, userAccount, otherAccount, vendorAccount];
    mocHelper = await testHelperBuilder({ owner, accounts });
    ({ BUCKET_X2 } = mocHelper);
    this.moc = mocHelper.moc;
    this.mocState = mocHelper.mocState;
  });

  beforeEach(async function() {
    await mocHelper.revertState();

    // Register vendor for test
    await mocHelper.registerVendor(vendorAccount, 0, owner);
  });

  describe('GIVEN user has X2 positions AND ReserveTokens price drops to half', function() {
    let globalCoverage;
    let tx;
    beforeEach(async function() {
      await mocHelper.mintRiskProAmount(userAccount, 10, vendorAccount);
      await mocHelper.mintStableTokenAmount(userAccount, 50000, vendorAccount);
      await mocHelper.mintRiskProxAmount(userAccount, BUCKET_X2, 5, vendorAccount);
      await mocHelper.setReserveTokenPrice(5000 * mocHelper.MOC_PRECISION);
      globalCoverage = await this.mocState.globalCoverage();
    });
    it('WHEN he checks its balance, THEN it is still positive', async function() {
      const balance = await mocHelper.getRiskProxBalance(BUCKET_X2, userAccount);
      mocHelper.assertBigReserve(balance, 5, 'Balance is not positive');
    });
    it('AND BucketLiquidation is reached', async function() {
      const liquidationReached = await this.moc.isBucketLiquidationReached(BUCKET_X2);
      assert(liquidationReached, 'Liquidation of Bucket X2 should have been reached');
    });
    describe('WHEN someone evaluates liquidation of X2 bucket ', function() {
      beforeEach(async function() {
        tx = await this.moc.evalBucketLiquidation(BUCKET_X2);
      });
      it('AND BucketLiquidation event should be emitted', async function() {
        const bucketLiqEvents = mocHelper.findEvents(tx, 'BucketLiquidation');
        assert(bucketLiqEvents.length === 1, 'Liquidation was not executed');
      });
      it('AND X2 bucket is empty', async function() {
        const { nReserve, nStableToken, nRiskPro } = await mocHelper.getBucketState(BUCKET_X2);
        mocHelper.assertBig(nReserve, 0, 'Bucket nReserve is not empty');
        mocHelper.assertBig(nStableToken, 0, 'Bucket nStableToken is not empty');
        mocHelper.assertBig(nRiskPro, 0, 'Bucket nRiskPro is not empty');
      });
      it('AND user have no X2 balance', async function() {
        const balance = await mocHelper.getRiskProxBalance(BUCKET_X2, userAccount);
        mocHelper.assertBig(balance, 0, 'Balance is not zero');
      });
      it('AND global Coverage does not change', async function() {
        const finalGlobalCoverage = await this.mocState.globalCoverage();
        mocHelper.assertBig(finalGlobalCoverage, globalCoverage, 'Global coverage changed');
      });
    });
    describe('WHEN user tries to redeem his X2 position', function() {
      beforeEach(async function() {
        tx = await mocHelper.redeemRiskProx(userAccount, BUCKET_X2, 5, vendorAccount);
      });
      it('AND BucketLiquidation event should be emitted', async function() {
        const bucketLiqEvents = mocHelper.findEvents(tx, 'BucketLiquidation');
        assert(bucketLiqEvents.length === 1, 'Liquidation was executed');
      });
      it('AND Redeem should not happen', async function() {
        const redeemEvents = mocHelper.findEvents(tx, 'RiskProxRedeem');
        assert(redeemEvents.length === 0, 'Redeem event should not be emitted');
      });
    });
    describe('WHEN other user tries to mint X2', function() {
      beforeEach(async function() {
        const resTokensToMint = 2;
        // Intentionally uses this method instead of mintRiskProxAmount,
        // as X2 Price is zero at this state
        tx = await mocHelper.mintRiskProx(otherAccount, BUCKET_X2, resTokensToMint, vendorAccount);
      });
      it('AND BucketLiquidation event is emitted', async function() {
        const bucketLiqEvents = mocHelper.findEvents(tx, 'BucketLiquidation');
        assert(bucketLiqEvents.length === 1, 'Liquidation was not executed');
      });
      it('AND BucketLiquidation is no longer reached', async function() {
        const liquidationReached = await this.moc.isBucketLiquidationReached(BUCKET_X2);
        assert(!liquidationReached, 'Liquidation of Bucket X2 should not been reached');
      });
      it('AND X2 coverage should be restored', async function() {
        const { coverage } = await mocHelper.getBucketState(BUCKET_X2);
        mocHelper.assertBigCb(coverage, 2, 'Coverage is not 2');
      });
      it('AND Mint happens', async function() {
        const mintEvents = mocHelper.findEvents(tx, 'RiskProxMint');
        assert(mintEvents.length === 1, 'Mint event should be emitted');
      });
      it('AND he should have balance', async function() {
        const balance = await mocHelper.getRiskProxBalance(BUCKET_X2, otherAccount);
        mocHelper.assertBigReserve(balance, 2, 'Balance is not 2');
      });
      it('AND original user has no X2 balance', async function() {
        const balance = await mocHelper.getRiskProxBalance(BUCKET_X2, userAccount);
        mocHelper.assertBig(balance, 0, 'Balance is not zero');
      });
    });
  });
   */
});
