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
    this.governor = mocHelper.governor;
    this.mockMoCVendorsChanger = mocHelper.mockMoCVendorsChanger;
    ({ BUCKET_X2 } = mocHelper);
  });

  beforeEach(async function() {
    await mocHelper.revertState();

    // Register vendor for test
    await this.mockMoCVendorsChanger.setVendorsToRegister(
      await mocHelper.getVendorToRegisterAsArray(vendorAccount, 0)
    );
    await this.governor.executeChange(this.mockMoCVendorsChanger.address);
  });

  describe('RiskProx Mint interest calculation', function() {
    const onMinting = true;
    beforeEach(async function() {
      await mocHelper.mintRiskProAmount(userAccount, 18, vendorAccount);
      await mocHelper.mintStableTokenAmount(userAccount, 80000, vendorAccount);
      await this.mocState.setDaysToSettlement(toContractBN(1, 'DAY'));
    });
    describe('WHEN all StableTokens are in bucket 0 ', function() {
      it('THEN abundance ratio is 0', async function() {
        const abundanceRatio = await this.mocState.currentAbundanceRatio();

        mocHelper.assertBig(
          abundanceRatio,
          toContractBN(1, 'MAX'),
          'The abundance ratio is incorrect'
        );
      });
      it('AND spot interest rate is 0', async function() {
        const spotInrate = await this.mocInrate.spotInrate();

        mocHelper.assertBig(spotInrate, 0, 'Spot interest rate is incorrect');
      });
    });
    const scenarios = [
      {
        params: {
          nRiskProx: 0
        },
        expect: {
          inrateAvg: 0,
          interestValues: {
            finalInterest: 0
          }
        }
      },
      {
        params: {
          nRiskProx: 5
        },
        expect: {
          inrateAvg: 0.000081611836271187,
          interestValues: {
            finalInterest: '0.000408059181355935'
          }
        }
      }
    ];
    scenarios.forEach(s => {
      describe(`WHEN a user wants to send ${s.params.nRiskProx} to mint RiskProx`, function() {
        let params;
        beforeEach(async function() {
          ({ params } = mocHelper.getContractReadyState(s));
        });
        it(`THEN inrateAvg should be ${s.expect.inrateAvg}`, async function() {
          const inrateAvg = await this.mocInrate.riskProxInrateAvg(
            BUCKET_X2,
            toContractBN(params.nRiskProx),
            onMinting
          );

          mocHelper.assertBigRate(inrateAvg, s.expect.inrateAvg, 'Inrate avg is incorrect');
        });
        it(`THEN finalInterest should be ${s.expect.interestValues.finalInterest}`, async function() {
          const finalInterest = await this.mocInrate.calcMintInterestValues(
            BUCKET_X2,
            toContractBN(params.nRiskProx)
          );

          mocHelper.assertBigReserve(
            finalInterest,
            s.expect.interestValues.finalInterest,
            'final interest is incorrect'
          );
        });
      });
    });
  });

  describe('RiskProx Redeem Interest calculation', function() {
    const redeemScenarios = [
      {
        params: {
          nReserve: 5,
          freeStableTokenRedeem: {
            nStableTokens: 40000 // All free stableTokens
          }
        },
        expect: {
          inrate: '0.0002611578760678',
          inrateAvg: '0.0001305789380339',
          preInterest: '0.0006528946901695',
          finalInterest: '0.0006528946901695'
        }
      },
      {
        params: {
          nReserve: 5,
          freeStableTokenRedeem: {
            nStableTokens: 0 // No Redemption
          }
        },
        expect: {
          inrate: '0.000145087708926555',
          inrateAvg: '0.000072543854463277',
          preInterest: '0.000362719272316385',
          finalInterest: '0.000362719272316385'
        }
      },
      {
        params: {
          nReserve: 2.5,
          freeStableTokenRedeem: {
            nStableTokens: 0 // No Redemption
          }
        },
        expect: {
          inrate: '0.000145087708926555',
          inrateAvg: '0.000108815781694916',
          preInterest: '0.00027203945423729',
          finalInterest: '0.00027203945423729'
        }
      }
    ];

    redeemScenarios.forEach(s => {
      const onMinting = false;
      let params;
      describe(`WHEN the user have 4.99959195 RiskProx AND ${s.params.freeStableTokenRedeem.nStableTokens} FreeStableTokens are redeemed AND a user wants to redeem ${s.params.nReserve} ReserveTokens value in RiskProx`, function() {
        beforeEach(async function() {
          await mocHelper.mintRiskPro(userAccount, 18, vendorAccount);
          await mocHelper.mintStableToken(userAccount, 80000, vendorAccount);
          await this.mocState.setDaysToSettlement(toContractBN(2, 'DAY'));
          ({ params } = mocHelper.getContractReadyState(s));
          await mocHelper.mintRiskProxAmount(userAccount, BUCKET_X2, 5, vendorAccount);
          await mocHelper.redeemFreeStableToken({
            userAccount,
            stableTokenAmount: params.freeStableTokenRedeem.nStableTokens),
            vendorAccount
          });
        });
        it(`THEN inrate should be ${s.expect.inrate}`, async function() {
          const inrate = await this.mocInrate.spotInrate();

          mocHelper.assertBigRate(inrate, s.expect.inrate, 'Inrate is incorrect', {
            significantDigits: 15
          });
        });
        it(`THEN inrateAvg should be ${s.expect.inrateAvg}`, async function() {
          const inrateAvg = await this.mocInrate.riskProxInrateAvg(
            BUCKET_X2,
            toContractBN(params.nReserve),
            onMinting
          );

          mocHelper.assertBigRate(inrateAvg, s.expect.inrateAvg, 'Inrate avg is incorrect', {
            significantDigits: 15
          });
        });
        it(`THEN redemption pre-interest should be ${s.expect.preInterest}`, async function() {
          const preInterest = await this.mocInrate.calcRedeemInterestValue(
            BUCKET_X2,
            toContractBN(params.nReserve)
          );
          mocHelper.assertBigReserve(
            preInterest,
            s.expect.preInterest,
            'pre-interest is incorrect',
            {
              significantDigits: 15
            }
          );
        });
        it(`THEN final Interest should be ${s.expect.finalInterest}`, async function() {
          const finalInterest = await this.mocInrate.calcFinalRedeemInterestValue(
            BUCKET_X2,
            toContractBN(params.nReserve)
          );
          mocHelper.assertBigReserve(
            finalInterest,
            s.expect.finalInterest,
            'final interest is incorrect',
            { significantDigits: 15 }
          );
        });
      });
    });
  });
});
