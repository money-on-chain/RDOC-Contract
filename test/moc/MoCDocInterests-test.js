const testHelperBuilder = require('../mocHelper.js');

let mocHelper;
let toContractBN;
let BUCKET_X2;
let BUCKET_C0;

contract('MoC', function([owner, userAccount, userAccount2, vendorAccount]) {
  before(async function() {
    const accounts = [owner, userAccount, userAccount2, vendorAccount];
    mocHelper = await testHelperBuilder({ owner, accounts, useMock: true });
    ({ toContractBN } = mocHelper);
    ({ BUCKET_X2, BUCKET_C0 } = mocHelper);
    this.moc = mocHelper.moc;
    this.mocState = mocHelper.mocState;
    this.mocInrate = mocHelper.mocInrate;
  });

  beforeEach(async function() {
    await mocHelper.revertState();

    // Register vendor for test
    await mocHelper.registerVendor(vendorAccount, 0, owner);
  });

  describe('GIVEN the interest rate for 1 day to settlement is 0.00002611578760678', function() {
    beforeEach(async function() {
      await mocHelper.mintRiskPro(owner, 10, vendorAccount);
      await mocHelper.mintStableToken(userAccount, 10000, vendorAccount); // 10000 ReserveToken = all StableTokens
      await this.mocState.setDaysToSettlement(toContractBN(1, 'DAY'));
    });

    it('THEN the interest rate for redemption the full redemption is 0.00002611578760678', async function() {
      const inrate = await this.mocInrate.stableTokenInrateAvg(toContractBN(10000, 'USD'));

      mocHelper.assertBigRate(inrate, 0.00002611578760678, 'Interest rate is incorrect');
    });

    describe('WHEN days to settlement is 6 AND the user redeems all FreeStableToken', function() {
      beforeEach(async function() {
        await this.mocState.setDaysToSettlement(toContractBN(6, 'DAY'));
      });

      it('THEN the interest rate for redemption the full redemption is 0.00002611578760678', async function() {
        const inrate = await this.mocInrate.stableTokenInrateAvg(toContractBN(10000, 'USD'));

        mocHelper.assertBigRate(inrate, 0.00002611578760678, 'Interest rate is incorrect');
      });

      it('AND the user redeems all the Free StableTokens THEN the ReserveTokens interests are 0.000156694725640680 ReserveTokens', async function() {
        const redeemTx = await mocHelper.redeemFreeStableToken({
          userAccount,
          stableTokenAmount: 10000,
          vendorAccount
        });
        const [freeStableTokenRedeemEvent] = mocHelper.findEvents(
          redeemTx,
          'FreeStableTokenRedeem'
        );
        mocHelper.assertBigReserve(
          freeStableTokenRedeemEvent.interests,
          0.00015669472564068,
          'Interests are incorrect'
        );
      });
    });
  });

  describe('GIVEN a user mints 10000 StableTokens and they are all available to redeem AND there are 1 day til next settlement', function() {
    const expectedInRate = '0.000130578938033900'; // 5 * 0,00002611578760678
    let prevNB;
    beforeEach(async function() {
      await mocHelper.mintRiskPro(owner, 10, vendorAccount);
      ({ nReserve: prevNB } = await mocHelper.getBucketState(BUCKET_C0));
      await mocHelper.mintStableToken(userAccount, 1, vendorAccount); // 1 ReserveToken = 10000 StableTokens
      await this.mocState.setDaysToSettlement(toContractBN(1, 'DAY'));
    });

    it(`THEN the interest rate for redemption the full redemption is ${expectedInRate}`, async function() {
      const inrate = await this.mocInrate.stableTokenInrateAvg(toContractBN(10000, 'USD'));
      mocHelper.assertBigRate(inrate, expectedInRate, 'Interest rate is incorrect');
    });

    describe('WHEN the user redeems all his stableTokens', function() {
      let redeemTx;
      beforeEach(async function() {
        redeemTx = await mocHelper.redeemFreeStableToken({
          userAccount,
          stableTokenAmount: 10000,
          vendorAccount
        });
      });

      it(`THEN the ReserveTokens interests are ${expectedInRate} ReserveTokens`, function() {
        const [freeStableTokenRedeemEvent] = mocHelper.findEvents(
          redeemTx,
          'FreeStableTokenRedeem'
        );
        mocHelper.assertBigReserve(
          freeStableTokenRedeemEvent.interests,
          expectedInRate,
          'Interests are incorrect'
        );
      });
      it('AND recovered ReserveTokens is 1 ReserveTokens minus those interests', function() {
        const [freeStableTokenRedeemEvent] = mocHelper.findEvents(
          redeemTx,
          'FreeStableTokenRedeem'
        );
        mocHelper.assertBigReserve(
          freeStableTokenRedeemEvent.reserveTotal,
          '0.999869421061966100',
          'reserveTotal is incorrect'
        );
      });
      it('AND inrateBag receives those interest', async function() {
        const { inrateBag } = await mocHelper.getBucketState(BUCKET_C0);
        mocHelper.assertBigReserve(inrateBag, expectedInRate, 'inrateBag value is incorrect');
      });
      it('AND C0 previous NB is restored as before stableToken minting', async function() {
        const { nReserve } = await mocHelper.getBucketState(BUCKET_C0);
        mocHelper.assertBig(nReserve, prevNB, 'C0 nReserve value is incorrect');
      });
    });
  });

  describe('GIVEN a user mints all StableTokens and they are all available to redeem AND there are 1 day til next settlement', function() {
    beforeEach(async function() {
      await mocHelper.mintRiskPro(owner, 10);
      await mocHelper.mintStableToken(userAccount, 10000);
      await this.mocState.setDaysToSettlement(toContractBN(1, 'DAY'));
    });

    /*describe('AND another user buys 0.5 RiskProx', function() {
      beforeEach(async function() {
        await mocHelper.mintRiskProxAmount(userAccount2, BUCKET_X2, '0.5', vendorAccount);
      });

      it('THEN the interest rate for redeem the full redemption is 0.00005223157521356', async function() {
        const inrate = await this.mocInrate.stableTokenInrateAvg(toContractBN(10000, 'USD'));

        mocHelper.assertBigRate(inrate, '0.00005223157521356', 'Interest rate is incorrect');
      });

      describe('WHEN the user redeems all freeStableTokens', function() {
        let redeemTx;

        beforeEach(async function() {
          redeemTx = await mocHelper.redeemFreeStableToken({
            userAccount,
            stableTokenAmount: 10000
          });
        });

        it('THEN the ReserveTokens interests are 0.00005223157521356 ReserveTokens', function() {
          const [freeStableTokenRedeemEvent] = mocHelper.findEvents(
            redeemTx,
            'FreeStableTokenRedeem'
          );
          mocHelper.assertBigReserve(
            freeStableTokenRedeemEvent.interests,
            '0.00005223157521356',
            'Interests are incorrect'
          );
        });
        it('AND recovered ReserveTokens is 0.99994776842478644 ReserveTokens', function() {
          const [freeStableTokenRedeemEvent] = mocHelper.findEvents(
            redeemTx,
            'FreeStableTokenRedeem'
          );

          mocHelper.assertBigReserve(
            freeStableTokenRedeemEvent.reserveTotal,
            '0.99994776842478644',
            'Interests are incorrect'
          );
        });
      });
    });*/
  });
});
