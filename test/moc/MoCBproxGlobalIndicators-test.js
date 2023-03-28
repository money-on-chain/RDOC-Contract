const testHelperBuilder = require('../mocHelper.js');

let mocHelper;
let toContractBN;
let BUCKET_X2;
contract('MoC : RiskProx operations does not modify global indicators', function([
  owner,
  userAccount,
  vendorAccount
]) {
  before(async function() {
    const accounts = [owner, userAccount, vendorAccount];
    mocHelper = await testHelperBuilder({ owner, accounts, useMock: true });
    this.moc = mocHelper.moc;
    this.mocState = mocHelper.mocState;
    ({ toContractBN } = mocHelper);
    ({ BUCKET_X2 } = mocHelper);
  });

  beforeEach(async function() {
    await mocHelper.revertState();

    // Register vendor for test
    await mocHelper.registerVendor(vendorAccount, 0, owner);
  });

  describe('GIVEN there are 10 RiskPro and 50000 StableTokens in the system', function() {
    const initialValues = {};
    beforeEach(async function() {
      // Set days to settlement to calculate interests
      await this.mocState.setDaysToSettlement(toContractBN(5, 'DAY'));

      await mocHelper.mintRiskProAmount(userAccount, 10, vendorAccount);
      await mocHelper.mintStableTokenAmount(userAccount, 50000, vendorAccount);
      initialValues.coverage = await this.mocState.globalCoverage();
      initialValues.maxStableToken = await this.mocState.globalMaxStableToken();
      initialValues.maxRiskPro = await this.mocState.globalMaxRiskPro();
    });
    /*describe('WHEN user mints 5 RiskProx2', function() {
      beforeEach(async function() {
        await mocHelper.mintRiskProxAmount(userAccount, BUCKET_X2, 5, vendorAccount);
      });
      it('THEN global indicators should not change', async function() {
        const finalCoverage = await this.mocState.globalCoverage();
        const finalMaxStableToken = await this.mocState.globalMaxStableToken();
        const finalMaxRiskPro = await this.mocState.globalMaxRiskPro();
        mocHelper.assertBig(initialValues.coverage, finalCoverage, 'Global coverage changed');
        mocHelper.assertBig(
          initialValues.maxStableToken,
          finalMaxStableToken,
          'MaxStableToken changed'
        );
        mocHelper.assertBig(initialValues.maxRiskPro, finalMaxRiskPro, 'MaxRiskPro changed');
      });
      [1, 3, 5].forEach(redValue => {
        describe(`AND user redeems ${redValue}`, function() {
          beforeEach(async function() {
            await mocHelper.redeemRiskProx(userAccount, BUCKET_X2, redValue, vendorAccount);
          });
          it('THEN global indicators should not change', async function() {
            const finalCoverage = await this.mocState.globalCoverage();
            const finalMaxStableToken = await this.mocState.globalMaxStableToken();
            const finalMaxRiskPro = await this.mocState.globalMaxRiskPro();
            mocHelper.assertBig(initialValues.coverage, finalCoverage, 'Global coverage changed');
            mocHelper.assertBig(
              initialValues.maxStableToken,
              finalMaxStableToken,
              'MaxStableToken changed'
            );
            mocHelper.assertBig(initialValues.maxRiskPro, finalMaxRiskPro, 'MaxRiskPro changed');
          });
        });
      });
    });*/
  });
});
