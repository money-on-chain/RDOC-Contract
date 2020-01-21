const testHelperBuilder = require('../mocHelper.js');

let mocHelper;
let toContractBN;
let BUCKET_X2;

contract('MoCRiskProxManager: RiskProx Address tracking ', function([
  owner,
  account1,
  account2,
  account3
]) {
  before(async function() {
    const accounts = [owner, account1, account2, account3];
    mocHelper = await testHelperBuilder({ owner, accounts });
    ({ toContractBN } = mocHelper);
    ({ BUCKET_X2 } = mocHelper);
    this.moc = mocHelper.moc;
    this.riskProx = mocHelper.riskProx;
  });

  beforeEach(function() {
    return mocHelper.revertState();
  });

  describe('GIVEN a new user mints RiskProx', function() {
    beforeEach(async function() {
      await mocHelper.mintRiskProAmount(owner, 30);
      await mocHelper.mintStableTokenAmount(owner, 50000);
      await mocHelper.mintRiskProx(account1, BUCKET_X2, 1);
    });
    it('THEN he enters the address tracker', async function() {
      const activeAddress = await this.riskProx.getActiveAddresses(BUCKET_X2);
      assert.equal(activeAddress[0], account1, 'Address is addeed');
    });
    it('THEN if he mints again, tracker is not altered', async function() {
      const activeAddress = await this.riskProx.getActiveAddresses(BUCKET_X2);
      const activeAddressLength = await this.riskProx.getActiveAddressesCount(BUCKET_X2);
      assert.equal(activeAddressLength, 1, 'length should be one');
      assert.equal(activeAddress[0], account1, 'Address is addeed');
    });
    describe('AND another account also mints', function() {
      beforeEach(async function() {
        await mocHelper.mintRiskProx(account2, BUCKET_X2, 1);
      });
      it('THEN both get tracked', async function() {
        const activeAddress = await this.riskProx.getActiveAddresses(BUCKET_X2);
        const activeAddressLength = await this.riskProx.getActiveAddressesCount(BUCKET_X2);
        assert.equal(activeAddressLength, 2, 'length should be two');
        assert.equal(activeAddress[1], account2, 'account 1 Address is addeed');
      });
      describe('WHEN account 1 liquidates his entire position', function() {
        beforeEach(async function() {
          await this.moc.redeemRiskProx(BUCKET_X2, toContractBN(1 * mocHelper.RESERVE_PRECISION), {
            from: account1
          });
        });
        it('THEN tracker shrinks', async function() {
          const activeAddress = await this.riskProx.getActiveAddresses(BUCKET_X2);
          const activeAddressLength = await this.riskProx.getActiveAddressesCount(BUCKET_X2);
          assert.equal(activeAddressLength, 1, 'length should be one');
          assert.equal(activeAddress[0], account2, 'account 2 should have moved');
        });
        describe('AND a third user mints', function() {
          it('THEN tracker length is two and third user is tracked', async function() {
            await mocHelper.mintRiskProx(account3, BUCKET_X2, 1);
            const activeAddress = await this.riskProx.getActiveAddresses(BUCKET_X2);
            const activeAddressLength = await this.riskProx.getActiveAddressesCount(BUCKET_X2);
            assert.equal(activeAddressLength, 2, 'length should be two');
            assert.equal(activeAddress[1], account3, 'account 3 is the last');
          });
        });
        describe('AND account1 mints again', function() {
          it('THEN tracker length is two and owner is last', async function() {
            await mocHelper.mintRiskProx(account1, BUCKET_X2, 1);
            const activeAddress = await this.riskProx.getActiveAddresses(BUCKET_X2);
            const activeAddressLength = await this.riskProx.getActiveAddressesCount(BUCKET_X2);
            assert.equal(activeAddressLength, 2, 'length should be two');
            assert.equal(activeAddress[1], account1, 'owner is the new last');
          });
        });
      });
      describe('WHEN account 1 partially liquidates his position', function() {
        it('THEN tracker remains the same', async function() {
          await this.moc.redeemRiskProx(BUCKET_X2, toContractBN(0.5 * mocHelper.RESERVE_PRECISION));
          const activeAddress = await this.riskProx.getActiveAddresses(BUCKET_X2);
          const activeAddressLength = await this.riskProx.getActiveAddressesCount(BUCKET_X2);
          assert.equal(activeAddressLength, 2, 'length should be unchanged');
          assert.equal(activeAddress[0], account1, 'owner in 0');
          assert.equal(activeAddress[1], account2, 'account1 in 1');
        });
      });
    });
  });
});
