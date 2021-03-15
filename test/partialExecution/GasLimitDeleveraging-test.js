const testHelperBuilder = require('../mocHelper.js');
const { executeBatched } = require('../testHelpers/networkHelper');

let mocHelper;
let BUCKET_X2;
let initialAccounts;
let afterAccounts;

const initializeDeleveraging = async (owner, vendorAccount, accounts) => {
  await mocHelper.mintRiskProAmount(owner, 10 * accounts.length, vendorAccount);
  await mocHelper.mintStableTokenAmount(owner, 50000 * accounts.length, vendorAccount);
  await executeBatched(
    accounts.map(account => () => mocHelper.mintRiskProx(account, BUCKET_X2, 5, vendorAccount))
  );
};

contract.skip('MoC: Gas limit on deleveraging', function([owner, vendorAccount, ...accounts]) {
  initialAccounts = accounts.slice(0, 300);
  afterAccounts = accounts.slice(300, 500);
  before(async function() {
    this.timeout(500000);
    mocHelper = await testHelperBuilder({
      owner,
      accounts: [owner, vendorAccount, ...accounts],
      useMock: true
    });
    ({ BUCKET_X2 } = mocHelper);
    this.mocSettlement = mocHelper.mocSettlement;
    this.riskProx = mocHelper.riskProx;
    this.moc = mocHelper.moc;

    mocHelper.revertState();

    // Register vendor for test
    await mocHelper.registerVendor(vendorAccount, 0, owner);

    await initializeDeleveraging(owner, vendorAccount, initialAccounts.slice(0, 100));
    await initializeDeleveraging(owner, vendorAccount, initialAccounts.slice(100, 200));
    await initializeDeleveraging(owner, vendorAccount, initialAccounts.slice(200, 300));
  });

  describe(`WHEN there are ${initialAccounts.length} accounts which minted BProx`, function() {
    let activeAddress;
    let activeAddressLength;
    it(`THEN must be ${initialAccounts.length} active addresses`, async function() {
      activeAddress = await this.riskProx.getActiveAddresses(BUCKET_X2);
      activeAddressLength = await this.riskProx.getActiveAddressesCount(BUCKET_X2);
      mocHelper.assertBig(
        activeAddressLength,
        initialAccounts.length,
        `length should be ${initialAccounts.length}`
      );
    });
    it(`AND account ${initialAccounts[2]} should be an active address`, async function() {
      assert.equal(activeAddress[2], initialAccounts[2], 'account 2 is no an active');
    });
    describe(`AND ${afterAccounts.length} accounts also minted BProx`, function() {
      beforeEach(async function() {
        await initializeDeleveraging(owner, afterAccounts.slice(0, 100));
        await initializeDeleveraging(owner, afterAccounts.slice(100, 200));
      });
      it(`THEN must be ${initialAccounts.length +
        afterAccounts.length} active addresses`, async function() {
        const allActiveAddressLength = await this.riskProx.getActiveAddressesCount(BUCKET_X2);
        mocHelper.assertBig(
          allActiveAddressLength,
          initialAccounts.length + afterAccounts.length,
          `length should be ${initialAccounts.length + afterAccounts.length}`
        );
      });
    });
    describe('WHEN ReserveToken price changes to 5000 USD', function() {
      beforeEach(async function() {
        await mocHelper.setReserveTokenPrice(5000 * mocHelper.MOC_PRECISION);
      });

      let tx;
      it('THEN BucketLiquidation must been reached', async function() {
        const liquidationReached = await this.moc.isBucketLiquidationReached(BUCKET_X2);
        assert(liquidationReached, 'Liquidation of Bucket X2 should have been reached');
        tx = await this.moc.evalBucketLiquidation(BUCKET_X2);
      });

      it('AND BucketLiquidation event should be emitted', async function() {
        const bucketLiqEvents = mocHelper.findEvents(tx, 'BucketLiquidation');
        assert(bucketLiqEvents.length === 1, 'Liquidation was not executed');
      });

      it('AND X2 bucket should be empty', async function() {
        const { nB, nDoc, nBPro } = await mocHelper.getBucketState(BUCKET_X2);
        mocHelper.assertBig(nB, 0, 'Bucket nB is not empty');
        mocHelper.assertBig(nDoc, 0, 'Bucket nDoc is not empty');
        mocHelper.assertBig(nBPro, 0, 'Bucket nBPro is not empty');
      });

      it('AND active addresses must be empty', async function() {
        const newActiveAddressLength = await this.riskProx.getActiveAddressesCount(BUCKET_X2);
        mocHelper.assertBig(newActiveAddressLength, 0, 'Active addresses array is not empty');
      });
    });
  });

  describe('GIVEN there was a bucket X2 liquidation', function() {
    const accoutsNewLiquidation = accounts.slice(300, 400);
    describe(`WHEN ${accoutsNewLiquidation.length} minted BProx`, function() {
      it(`THEN must be ${accoutsNewLiquidation.length} active addresses`, async function() {
        await mocHelper.setReserveTokenPrice(10000 * mocHelper.MOC_PRECISION);
        await initializeDeleveraging(owner, accoutsNewLiquidation);
        const activeAddressLength = await this.riskProx.getActiveAddressesCount(BUCKET_X2);
        mocHelper.assertBig(
          activeAddressLength,
          accoutsNewLiquidation.length,
          `length should be ${accoutsNewLiquidation.length}`
        );
      });
      it(`AND account ${accoutsNewLiquidation[5]} should be an active address`, async function() {
        const activeAddress = await this.riskProx.getActiveAddresses(BUCKET_X2);
        assert.equal(
          activeAddress[5],
          accoutsNewLiquidation[5],
          `account ${accoutsNewLiquidation[5]} is no an active`
        );
      });
    });

    describe('WHEN ReserveToken price changes to 2500', function() {
      beforeEach(async function() {
        await mocHelper.setReserveTokenPrice(2500 * mocHelper.MOC_PRECISION);
      });

      let tx;
      it('THEN BucketLiquidation must been reached', async function() {
        const liquidationReached = await this.moc.isBucketLiquidationReached(BUCKET_X2);
        assert(liquidationReached, 'Liquidation of Bucket X2 should have been reached');
        tx = await this.moc.evalBucketLiquidation(BUCKET_X2);
      });

      it('AND BucketLiquidation event should be emitted', async function() {
        const bucketLiqEvents = mocHelper.findEvents(tx, 'BucketLiquidation');
        assert(bucketLiqEvents.length === 1, 'Liquidation was not executed');
      });

      it('AND X2 bucket should be empty', async function() {
        const { nB, nDoc, nBPro } = await mocHelper.getBucketState(BUCKET_X2);
        mocHelper.assertBig(nB, 0, 'Bucket nB is not empty');
        mocHelper.assertBig(nDoc, 0, 'Bucket nDoc is not empty');
        mocHelper.assertBig(nBPro, 0, 'Bucket nBPro is not empty');
      });

      it('AND active addresses must be empty', async function() {
        const activeAddressLength = await this.riskProx.getActiveAddressesCount(BUCKET_X2);
        mocHelper.assertBig(activeAddressLength, 0, 'Active addresses array is not empty');
      });
    });
  });
});
