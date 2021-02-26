const { BigNumber } = require('bignumber.js');
const testHelperBuilder = require('../mocHelper.js');

let mocHelper;
let toContractBN;
let BUCKET_X2;
let BUCKET_C0;

contract('MoC : MoCExchange', function([owner, userAccount, vendorAccount]) {
  before(async function() {
    const accounts = [owner, userAccount, vendorAccount];
    mocHelper = await testHelperBuilder({ owner, accounts, useMock: true });
    ({ toContractBN } = mocHelper);
    ({ BUCKET_C0, BUCKET_X2 } = mocHelper);
    this.moc = mocHelper.moc;
    this.mocState = mocHelper.mocState;
    this.mocInrate = mocHelper.mocInrate;
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

  describe('GIVEN a user owns 5, RiskProxs', function() {
    let c0InitialState;
    let x2InitialState;
    let initialReserveTokenBalance;
    beforeEach(async function() {
      // Set days to settlement to calculate interests
      await this.mocState.setDaysToSettlement(5 * mocHelper.DAY_PRECISION);
      await mocHelper.mintRiskProAmount(userAccount, 10, vendorAccount);
      await mocHelper.mintStableTokenAmount(userAccount, 50000, vendorAccount);

      await mocHelper.mintRiskProxAmount(userAccount, BUCKET_X2, 5, vendorAccount);

      initialReserveTokenBalance = toContractBN(await mocHelper.getReserveBalance(userAccount));
      c0InitialState = await mocHelper.getBucketState(BUCKET_C0);
      x2InitialState = await mocHelper.getBucketState(BUCKET_X2);
    });
    const scenarios = [
      {
        description:
          'User tries to redeem more than his balance. Should redeem only his total balance and receive the complete inrate bag value. ReserveTokens Price gos up',
        params: {
          reservePrice: 10800,
          nRiskProx: 10
        },
        expect: {
          nReserve: 10,
          nStableTokens: 50000,
          nRiskProx: 0,
          redeemed: {
            nReserve: '5.37037037037037037'
          },
          interest: {
            nReserve: '0.002418128482109259258930393785692400'
          }
        }
      },
      {
        description:
          'User tries to redeem more than his balance. Should redeem only his total balance. ReserveTokens Price does not change',
        params: {
          reservePrice: 9800,
          nRiskProx: 10
        },
        expect: {
          nReserve: 10,
          nStableTokens: 50000,
          nRiskProx: 0,
          redeemed: {
            nReserve: '4.897959183673465'
          },
          interest: {
            nReserve: '0.0026648762864061224488516777749872000'
          }
        }
      },
      {
        description:
          'User redeem less than his balance. Should redeem what he requests. ReserveTokens Price does not change',
        params: {
          reservePrice: 10000,
          nRiskProx: 3
        },
        expect: {
          nReserve: 6,
          nStableTokens: 30000,
          nRiskProx: 2,
          redeemed: {
            nReserve: '3'
          },
          interest: {
            nReserve: '0.00219372615896952'
          }
        }
      },
      {
        description:
          'User redeem less than his balance. ReserveTokens Price falls to 8000, should receive ReserveTokens according to the price',
        params: {
          reservePrice: 8000,
          nRiskProx: 3
        },
        expect: {
          nReserve: 6,
          nStableTokens: 30000,
          nRiskProx: 2,
          redeemed: {
            nReserve: '2.25'
          },
          interest: {
            nReserve: '0.00274215769871189999853751589402032'
          }
        }
      },
      {
        description:
          'User redeem less than his balance, ReserveTokens Price rises to 12500, should receive ReserveTokens according to the price',
        params: {
          // Leverage 1.666
          reservePrice: 12500,
          nRiskProx: 3
        },
        expect: {
          // (RiskProx price = 1.2) * 3 * leverage
          nReserve: 6,
          // (RiskProx price = 1.2) * 3 * (leverage-1) * ReserveTokenPrice
          nStableTokens: 29999.9999999999999625,
          nRiskProx: 2,
          redeemed: {
            nReserve: '3.6'
          },
          interest: {
            nReserve: '0.00175498092717561599780627384103048'
          }
        }
      }
    ];

    scenarios.forEach(async s => {
      let params;
      let finalReserveTokenBalance;
      let c0FinalState;
      let x2FinalState;
      let tx;
      describe(`WHEN ReserveTokens Price ${s.params.reservePrice} AND he tries to redeem ${s.params.nRiskProx} RiskProx `, function() {
        beforeEach(async function() {
          ({ params } = await mocHelper.getContractReadyState(s));
          await mocHelper.setReserveTokenPrice(params.reservePrice);

          tx = await mocHelper.redeemRiskProx(
            userAccount,
            BUCKET_X2,
            s.params.nRiskProx,
            vendorAccount
          );

          finalReserveTokenBalance = toContractBN(await mocHelper.getReserveBalance(userAccount));
          c0FinalState = await mocHelper.getBucketState(BUCKET_C0);
          x2FinalState = await mocHelper.getBucketState(BUCKET_X2);
        });
        it('THEN the event is emitted with correct values', async function() {
          const [riskProxRedeemEvent] = mocHelper.findEvents(tx, 'RiskProxRedeem');

          mocHelper.assertBigReserve(
            riskProxRedeemEvent.interests,
            s.expect.interest.nReserve,
            'Interests in event is incorrect',
            { significantDigits: 15 }
          );
          mocHelper.assertBigReserve(
            riskProxRedeemEvent.reserveTotal,
            s.expect.redeemed.nReserve,
            'ReserveToken total in event is incorrect',
            { significantDigits: 15 }
          );
        });
        it(`THEN his riskprox balance decrease in ${s.expect.nRiskProx}`, async function() {
          const finalRiskProxBalance = await mocHelper.getRiskProxBalance(BUCKET_X2, userAccount);

          mocHelper.assertBigReserve(finalRiskProxBalance, s.expect.nRiskProx, undefined);
        });
        it(`AND he receives ${s.expect.redeemed.nReserve} ReserveTokens for the redeem + ${s.expect.interest.nReserve} from interests`, async function() {
          const diff = finalReserveTokenBalance.sub(initialReserveTokenBalance);
          const expected = new BigNumber(s.expect.redeemed.nReserve).plus(
            s.expect.interest.nReserve
          );
          mocHelper.assertBigReserve(
            diff,
            expected,
            'The amount of RiskPros received is incorrect',
            {
              significantDigits: 15
            }
          );
        });
        it(`AND RiskProx in bucket X2 decrease to ${s.expect.nRiskProx}`, async function() {
          mocHelper.assertBigReserve(
            x2FinalState.nRiskPro,
            s.expect.nRiskProx,
            'The RiskProx balance in X2 is incorrect'
          );
        });
        it(`AND X2 ReserveTokens decreases in ${s.expect.nReserve}`, async function() {
          const diff = x2InitialState.nReserve.sub(x2FinalState.nReserve);

          mocHelper.assertBigReserve(
            diff,
            s.expect.nReserve,
            'X2 ReserveTokens amount is incorrect',
            {
              significantDigits: 15
            }
          );
        });
        it('AND C0 StableTokens increases', async function() {
          const diff = c0FinalState.nStableToken.sub(c0InitialState.nStableToken);

          mocHelper.assertBigDollar(
            diff,
            s.expect.nStableTokens,
            'C0 StableTokens amount is incorrect',
            {
              significantDigits: 15
            }
          );
        });
        it('AND X2 StableTokens decreases', async function() {
          const diff = x2InitialState.nStableToken.sub(x2FinalState.nStableToken);

          mocHelper.assertBigDollar(
            diff,
            s.expect.nStableTokens,
            'X2 StableTokens amount is incorrect',
            {
              significantDigits: 15
            }
          );
        });
        it('AND the inrateBag decrease', async function() {
          const diff = c0InitialState.inrateBag.sub(c0FinalState.inrateBag);

          mocHelper.assertBigDollar(
            diff,
            s.expect.interest.nReserve,
            'inrateBag does not decrease',
            {
              significantDigits: 15
            }
          );
        });
      });
    });
  });
});
