const testHelperBuilder = require('../mocHelper.js');

let mocHelper;
let toContractBN;
let BUCKET_X2;

contract('MoC : MoCExchange', function([owner, userAccount, vendorAccount]) {
  before(async function() {
    const accounts = [owner, userAccount, vendorAccount];
    mocHelper = await testHelperBuilder({ owner, accounts, useMock: true });
    ({ toContractBN } = mocHelper);
    this.moc = mocHelper.moc;
    this.mocState = mocHelper.mocState;
    this.mocInrate = mocHelper.mocInrate;
    ({ BUCKET_X2 } = mocHelper);
  });

  describe('RiskProx interest recovery', function() {
    [1, 4, 7].forEach(days => {
      let mintEvent;
      let originalInrate;

      describe(`GIVEN a user mints 5 RiskProx AND there are ${days} days til next settlement`, function() {
        before(async function() {
          await mocHelper.revertState();

          // Register vendor for test
          await mocHelper.registerVendor(vendorAccount, 0, owner);

          await this.mocState.setDaysToSettlement(toContractBN(days, 'DAY'));
          await mocHelper.mintRiskPro(userAccount, 18, vendorAccount);
          await mocHelper.mintStableToken(userAccount, 80000, vendorAccount);

          originalInrate = await this.mocInrate.riskProxInrateAvg(
            BUCKET_X2,
            toContractBN(5, 'RES'),
            true
          );

          const mintTx = await mocHelper.mintRiskProx(userAccount, BUCKET_X2, 5, vendorAccount);
          [mintEvent] = mocHelper.findEvents(mintTx, 'RiskProxMint');
        });
        it('THEN the interest taken includes all days to settlement', function() {
          const expected = originalInrate
            .mul(toContractBN(mintEvent.reserveTotal))
            .mul(toContractBN(days))
            .div(mocHelper.MOC_PRECISION);
          mocHelper.assertBig(mintEvent.interests, expected, 'Incorrect Inrate ');
        });

        describe('WHEN he redeems all his RiskProx', function() {
          let redeemInrate;
          let redeemEvent;
          before(async function() {
            redeemInrate = await this.mocInrate.riskProxInrateAvg(
              BUCKET_X2,
              mintEvent.reserveTotal,
              false
            );
            const redeemTx = await mocHelper.redeemRiskProx(
              userAccount,
              BUCKET_X2,
              5,
              vendorAccount
            );

            [redeemEvent] = mocHelper.findEvents(redeemTx, 'RiskProxRedeem');
          });
          it('THEN user recovers 1 day less of interest', function() {
            const expected = 0;

            mocHelper.assertBig(expected, redeemEvent.interests, 'Incorrect interests');
          });
        });
      });
    });
  });
});
