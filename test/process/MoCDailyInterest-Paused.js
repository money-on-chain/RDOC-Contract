const { expectRevert } = require('openzeppelin-test-helpers');
const testHelperBuilder = require('../mocHelper.js');

let mocHelper;
const CONTRACT_IS_PAUSED = 'contract_is_paused';
let BUCKET_X2;
let BUCKET_C0;
contract('MoC: Daily interests payment paused', function([owner, account]) {
  before(async function() {
    mocHelper = await testHelperBuilder({ owner, accounts: [owner, account], useMock: true });
    ({ BUCKET_C0, BUCKET_X2 } = mocHelper);
    this.moc = mocHelper.moc;
    this.mocState = mocHelper.mocState;
  });

  beforeEach(async function() {
    await mocHelper.revertState();
    await mocHelper.stopper.pause(mocHelper.moc.address);
    const paused = await mocHelper.moc.paused();
    assert(paused, 'Not paused');
  });

  let prevBucketC0State;
  describe('GIVEN there are minted 0.000652468418693048 ReserveTokens in the C0 interest bag', function() {
    beforeEach(async function() {
      await mocHelper.stopper.unpause(mocHelper.moc.address);
      const paused = await mocHelper.moc.paused();
      assert(!paused, 'Paused');
      await this.mocState.setDaysToSettlement(5 * mocHelper.DAY_PRECISION);
      await mocHelper.mintRiskProAmount(account, 10);
      await mocHelper.mintStableTokenAmount(account, 10000);
      await mocHelper.mintRiskProxAmount(account, BUCKET_X2, 1);
      prevBucketC0State = await mocHelper.getBucketState(BUCKET_C0);
    });

    describe('WHEN Days To Settlement is setted and MoC contract is paused', function() {
      beforeEach(async function() {
        await this.mocState.setDaysToSettlement(4);
        await mocHelper.stopper.pause(mocHelper.moc.address);
        const paused = await mocHelper.moc.paused();
        assert(paused, 'Not paused');
        await expectRevert(this.moc.dailyInratePayment(), CONTRACT_IS_PAUSED);
      });
      it('THEN Inrate bag should be readable and not change', async function() {
        const inrateBag = await this.mocState.getInrateBag(BUCKET_C0);
        const diff = prevBucketC0State.inrateBag.sub(inrateBag);
        mocHelper.assertBigReserve(diff, 0, 'interest changed');
      });
      it('THEN Daily payment should be enabled', async function() {
        const enabled = await this.moc.isDailyEnabled();
        assert(enabled, 'Daily payment is is enabled, but system paused');
      });
    });

    describe('WHEN MoC is unpuased and daily payment is run', function() {
      let tx;
      beforeEach(async function() {
        await this.mocState.setDaysToSettlement(4);
        tx = await this.moc.dailyInratePayment();
      });
      it('THEN bucket C0 ReserveTokens should increase in 0.000130578938033900', async function() {
        const nReserveToken = await this.mocState.getBucketNReserve(BUCKET_C0);
        const diff = nReserveToken.sub(prevBucketC0State.nReserve);
        mocHelper.assertBigReserve(
          diff,
          '0.000130578938033900',
          'Bucket 0 ReserveTokens did not increase'
        );
      });
      it('THEN interest bag should decrease in 0.000130578938033900', async function() {
        const inrateBag = await this.mocState.getInrateBag(BUCKET_C0);
        const diff = prevBucketC0State.inrateBag.sub(inrateBag);
        mocHelper.assertBigReserve(diff, '0.000130578938033900', 'interest bag did not decrease');
      });
      it('THEN InrateDailyPay event is emitted and RiskPro Bucket0 checked', async function() {
        const [inrateEvent] = await mocHelper.findEvents(tx, 'InrateDailyPay');
        // TODO: review this operation. Why lB?
        const prevRiskProBucket0 = prevBucketC0State.nReserve.sub(prevBucketC0State.lB);
        const bnRiskProBucket0 = new web3.utils.BN(inrateEvent.nReserveBucketC0);
        assert(
          bnRiskProBucket0.cmp(prevRiskProBucket0) >= 0,
          'RiskPro Should be greather than prevRiskProBucket0'
        );
      });
      it('THEN InrateDailyPay event is emitted', async function() {
        const [inrateEvent] = await mocHelper.findEvents(tx, 'InrateDailyPay');
        mocHelper.assertBigReserve(
          inrateEvent.amount,
          '0.000130578938033900',
          'should be 0.000130578938033900'
        );
      });
      it('THEN Daily payment should be disabled', async function() {
        const enabled = await this.moc.isDailyEnabled();
        assert(!enabled, 'Daily payment is still enabled');
      });
    });
  });
});
