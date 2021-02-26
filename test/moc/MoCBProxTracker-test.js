const testHelperBuilder = require('../mocHelper.js');

let mocHelper;
let BUCKET_X2;

contract('MoCRiskProxManager: RiskProx Address tracking ', function([
  owner,
  account1,
  account2,
  account3,
  vendorAccount
]) {
  before(async function() {
    const accounts = [owner, account1, account2, account3, vendorAccount];
    mocHelper = await testHelperBuilder({ owner, accounts });
    ({ BUCKET_X2 } = mocHelper);
    this.moc = mocHelper.moc;
    this.riskProx = mocHelper.riskProx;
    this.governor = mocHelper.governor;
    this.mockMoCVendorsChanger = mocHelper.mockMoCVendorsChanger;
  });

  beforeEach(async function() {
    await mocHelper.revertState();

    // Register vendor for test
    await this.mockMoCVendorsChanger.setVendorsToRegister(
      await mocHelper.getVendorToRegisterAsArray(vendorAccount, 0)
    );
    await this.governor.executeChange(this.mockMoCVendorsChanger.address);
  });

  describe('GIVEN a new user mints RiskProx', function() {
    beforeEach(async function() {
      await mocHelper.mintRiskProAmount(owner, 30, vendorAccount);
      await mocHelper.mintStableTokenAmount(owner, 50000, vendorAccount);
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
        await mocHelper.mintRiskProx(account2, BUCKET_X2, 1, vendorAccount);
      });
      it('THEN both get tracked', async function() {
        const activeAddress = await this.riskProx.getActiveAddresses(BUCKET_X2);
        const activeAddressLength = await this.riskProx.getActiveAddressesCount(BUCKET_X2);
        assert.equal(activeAddressLength, 2, 'length should be two');
        assert.equal(activeAddress[1], account2, 'account 1 Address is addeed');
      });
      describe('WHEN account 1 liquidates his entire position', function() {
        beforeEach(async function() {
          await mocHelper.redeemRiskProx(account1, BUCKET_X2, 1, vendorAccount);
        });
        it('THEN tracker shrinks', async function() {
          const activeAddress = await this.riskProx.getActiveAddresses(BUCKET_X2);
          const activeAddressLength = await this.riskProx.getActiveAddressesCount(BUCKET_X2);
          assert.equal(activeAddressLength, 1, 'length should be one');
          assert.equal(activeAddress[0], account2, 'account 2 should have moved');
        });
        describe('AND a third user mints', function() {
          it('THEN tracker length is two and third user is tracked', async function() {
            await mocHelper.mintRiskProx(account3, BUCKET_X2, 1, vendorAccount);
            const activeAddress = await this.riskProx.getActiveAddresses(BUCKET_X2);
            const activeAddressLength = await this.riskProx.getActiveAddressesCount(BUCKET_X2);
            assert.equal(activeAddressLength, 2, 'length should be two');
            assert.equal(activeAddress[1], account3, 'account 3 is the last');
          });
        });
        describe('AND account1 mints again', function() {
          it('THEN tracker length is two and owner is last', async function() {
            await mocHelper.mintRiskProx(account1, BUCKET_X2, 1, vendorAccount);
            const activeAddress = await this.riskProx.getActiveAddresses(BUCKET_X2);
            const activeAddressLength = await this.riskProx.getActiveAddressesCount(BUCKET_X2);
            assert.equal(activeAddressLength, 2, 'length should be two');
            assert.equal(activeAddress[1], account1, 'owner is the new last');
          });
        });
      });
      describe('WHEN account 1 partially liquidates his position', function() {
        it('THEN tracker remains the same', async function() {
          await mocHelper.redeemRiskProx(account1, BUCKET_X2, 0.5, vendorAccount);
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
