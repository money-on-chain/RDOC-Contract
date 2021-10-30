const testHelperBuilder = require('../mocHelper.js');

let mocHelper;
let toContractBN;
let BUCKET_C0;
let BUCKET_X2;

contract('MoC', function([owner, vendorAccount]) {
  before(async function() {
    mocHelper = await testHelperBuilder({ owner, accounts: [owner, vendorAccount] });
    ({ toContractBN, BUCKET_C0, BUCKET_X2 } = mocHelper);
    this.mocState = mocHelper.mocState;
    this.moc = mocHelper.moc;
  });

  beforeEach(async function() {
    await mocHelper.revertState();

    // Register vendor for test
    await mocHelper.registerVendor(vendorAccount, 0, owner);
  });

  describe('State variables', function() {
    let expect;

    const baseState = {
      nRiskPro: 0,
      nStableTokens: 0,
      reservePrice: { from: 10000, to: 10000 },
      nStableTokenReserveAmount: 0,
      riskProReserveTokenAmount: 0
    };

    const states = [
      {
        ...baseState,
        nRiskPro: 10,
        nStableTokens: 10000,
        reservePrice: { from: 10000, to: 5000 },
        expect: {
          globals: {
            globalLockedReserveTokens: 2,
            globalCoverage: 5.5,
            globalMaxStableToken: 12500
          },
          C0: { leverage: '1.222222222222222222', coverage: 5.5, lockedReserveTokens: 2 }
        }
      },
      {
        ...baseState,
        reservePrice: { from: 10000, to: 4000 },
        expect: {
          globals: { globalLockedReserveTokens: 0, globalCoverage: '∞' },
          C0: { lockedReserveTokens: 0, leverage: 1, coverage: '∞' },
          X2: { coverage: 2, leverage: 2 }
        }
      },
      {
        ...baseState,
        nStableTokens: 10000,
        nRiskPro: 5,
        reservePrice: { from: 10000, to: 5000 },
        expect: {
          globals: { globalLockedReserveTokens: 2, globalCoverage: 3, globalMaxStableToken: 0 },
          C0: { leverage: 1.5, coverage: 3 }
        }
      },
      {
        ...baseState,
        nStableTokens: 12000,
        nRiskPro: 2.4,
        reservePrice: { from: 10000, to: 1000 },
        expect: {
          globals: { globalLockedReserveTokens: 12, globalCoverage: 0.3, globalMaxStableToken: 0 },
          C0: { leverage: '∞', lockedReserveTokens: 12, coverage: 0.3 }
        }
      },
      {
        ...baseState,
        nRiskPro: 10,
        expect: {
          globals: { globalMaxRiskPro: 10, riskProTecPrice: 1 },
          C0: { maxRiskPro: 10 }
        }
      }
    ];

    states.forEach(state => {
      describe(`GIVEN there are ${state.nStableTokens} StableTokens`, function() {
        describe(`AND ${state.nRiskPro} RiskPro`, function() {
          const { from, to } = state.reservePrice;
          describe(`WHEN ReserveTokens Price moves from ${from} to ${to} USD`, function() {
            beforeEach(async function() {
              ({ expect } = mocHelper.getContractReadyState(state));

              await mocHelper.setReserveTokenPrice(toContractBN(state.reservePrice.from, 'USD'));
              // For simplifying BMA calculation.
              // It will be always the middle between the two values.
              await mocHelper.setSmoothingFactor(0.5 * 10 ** 18);

              if (state.nRiskPro) {
                await mocHelper.mintRiskProAmount(owner, state.nRiskPro, vendorAccount);
              }
              if (state.nStableTokens) {
                await mocHelper.mintStableTokenAmount(owner, state.nStableTokens, vendorAccount);
              }

              await mocHelper.setReserveTokenPrice(toContractBN(state.reservePrice.to, 'USD'));
            });

            Object.keys(state.expect).forEach(async function(scope) {
              Object.keys(state.expect[scope]).forEach(async function(key) {
                const friendlyExpected =
                  state.expect[scope][key] === '∞' ? '∞' : Math.round(state.expect[scope][key]);
                it(`THEN ${key} should be ${friendlyExpected}`, async function() {
                  const fn = this.mocState[key];
                  const scopes = { C0: BUCKET_C0, X2: BUCKET_X2 };
                  const newScope = scopes[scope] || scope;
                  const actual = await (scope === 'globals' ? fn() : fn(newScope));
                  mocHelper.assertBig(actual, expect[scope][key], undefined, {
                    significantDigits: 15
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
