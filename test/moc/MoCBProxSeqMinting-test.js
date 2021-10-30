const testHelperBuilder = require('../mocHelper.js');

let mocHelper;
let userAccount;
let BUCKET_X2;
let toContractBN;

contract('MoC', function([owner, vendorAccount]) {
  before(async function() {
    userAccount = owner;
    mocHelper = await testHelperBuilder({ owner, accounts: [owner, vendorAccount], useMock: true });
    this.moc = mocHelper.moc;
    this.mocState = mocHelper.mocState;
    ({ BUCKET_X2, toContractBN } = mocHelper);
  });

  describe('GIVEN the user have 100 RiskPro and 100000 StableTokens', function() {
    before(async function() {
      // Register vendor for test
      await mocHelper.registerVendor(vendorAccount, 0, owner);

      await this.mocState.setDaysToSettlement(0);
      await mocHelper.mintRiskProAmount(userAccount, 100, vendorAccount);
      await mocHelper.mintStableTokenAmount(userAccount, 1000000, vendorAccount);
    });

    describe('WHEN a user mints RiskProx in sequence', function() {
      [1, 10, 5].forEach(function(nReserve) {
        it('THEN maxRiskProx in ReserveTokens should drop in every mint', async function() {
          // Max at the start
          const lastReserveTokenMax = await this.mocState.maxRiskProxResTokenValue(BUCKET_X2);
          // First minting
          await mocHelper.mintRiskProx(userAccount, BUCKET_X2, nReserve);

          const newReserveTokenMax = await this.mocState.maxRiskProxResTokenValue(BUCKET_X2);

          mocHelper.assertBig(
            newReserveTokenMax,
            lastReserveTokenMax.sub(toContractBN(nReserve, 'RES')),
            'Max RiskProx does not dropped'
          );
        });
      });
    });
  });
});
