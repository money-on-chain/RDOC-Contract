const testHelperBuilder = require('../mocHelper.js');

let mocHelper;
let BUCKET_X2;
let BUCKET_C0;

contract('MoC: Daily interests payment', function([owner, account]) {
  before(async function() {
    mocHelper = await testHelperBuilder({ owner, accounts: [owner, account], useMock: true });
    this.moc = mocHelper.moc;
    this.mocState = mocHelper.mocState;
    ({ BUCKET_C0, BUCKET_X2 } = mocHelper);
  });

  beforeEach(function() {
    return mocHelper.revertState();
  });

  const scenarios = [
    {
      description:
        'There is money in the inrate bag. Daily function should increase C0 bucket ReserveTokens',
      // Amount of ReserveTokens to use in riskProx mint
      nRiskProx: 1,
      days: 4,
      expect: {
        nReserve: '0.000130578938033900'
      }
    },
    {
      description: 'There is no money in the inrate bag. C0 buckets keeps the same',
      // Amount of ReserveTokens to use in riskProx mint
      nRiskProx: 0,
      days: 5,
      expect: {
        nReserve: 0
      }
    },
    {
      description:
        'There is money in the inrate bag. Daily function should pay complete inrateBag amount to C0 bucket',
      // Amount of ReserveTokens to use in riskProx mint
      nRiskProx: 1,
      days: 0,
      expect: {
        nReserve: '0.000652894690169500'
      }
    }
  ];
  scenarios.forEach(s => {
    let prevBucketC0State;
    let readyState;
    describe('GIVEN there are minted 0.000652468418693048 ReserveTokens in the C0 interest bag', function() {
      beforeEach(async function() {
        readyState = mocHelper.getContractReadyState(s);
        await this.mocState.setDaysToSettlement(5 * mocHelper.DAY_PRECISION);
        await mocHelper.mintRiskProAmount(account, 10);
        await mocHelper.mintStableTokenAmount(account, 10000);
        if (s.nRiskProx) {
          await mocHelper.mintRiskProxAmount(account, BUCKET_X2, s.nRiskProx);
        }
        prevBucketC0State = await mocHelper.getBucketState(BUCKET_C0);
      });
      describe('WHEN daily payment is run', function() {
        let tx;
        beforeEach(async function() {
          // Set testing days
          await this.mocState.setDaysToSettlement(readyState.days);
          tx = await this.moc.dailyInratePayment();
        });
        it(`THEN bucket C0 ReserveTokens should increase in ${s.expect.nReserve}`, async function() {
          const nReserveToken = await this.mocState.getBucketNReserve(BUCKET_C0);
          const diff = nReserveToken.sub(prevBucketC0State.nReserve);
          mocHelper.assertBigReserve(
            diff,
            s.expect.nReserve,
            'Bucket 0 ReserveTokens did not increase'
          );
        });
        it(`THEN interest bag should decrease in ${s.expect.nReserve}`, async function() {
          const inrateBag = await this.mocState.getInrateBag(BUCKET_C0);
          const diff = prevBucketC0State.inrateBag.sub(inrateBag);
          mocHelper.assertBigReserve(diff, s.expect.nReserve, 'interest bag did not decrease');
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
            s.expect.nReserve,
            `should be ${s.expect.nReserve}`
          );
        });
        it('THEN Daily payment should be disabled', async function() {
          const enabled = await this.moc.isDailyEnabled();
          assert(!enabled, 'Daily payment is still enabled');
        });
      });
    });
  });
});
