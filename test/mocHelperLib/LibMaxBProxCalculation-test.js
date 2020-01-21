const MoCHelperLib = artifacts.require('./contracts/mocks/MoCHelperLibMock.sol');
const testHelperBuilder = require('../mocHelper.js');

let mocHelperLib;
let mocHelper;
let toContractBN;

contract('MoCHelperLib: MaxRiskProxCalculation', function([owner]) {
  before(async function() {
    mocHelperLib = await MoCHelperLib.new();
    mocHelper = await testHelperBuilder({ owner });
    ({ toContractBN } = mocHelper);
  });

  describe('MaxRiskProxCalculation', function() {
    const states = [
      {
        nStableTokens: 10000,
        peg: 1,
        reservePrice: 10000,
        leverage: 1,
        expect: {
          maxRiskPro: 0
        }
      },
      {
        nStableTokens: 0,
        peg: 1,
        reservePrice: 10000,
        leverage: 1,
        expect: {
          maxRiskPro: 0
        }
      },
      {
        nStableTokens: 100000,
        peg: 1,
        reservePrice: 10000,
        leverage: 2,
        expect: {
          maxRiskPro: 10
        }
      },
      {
        nStableTokens: 100000,
        peg: 1,
        reservePrice: 10000,
        leverage: '∞',
        delta: 0,
        expect: {
          maxRiskPro: 0
        }
      },
      {
        nStableTokens: 100000,
        peg: 1,
        reservePrice: 10000,
        leverage: '∞',
        delta: 1000000, // Moves INFINIT down
        expect: {
          maxRiskPro: 0
        }
      }
    ];
    states.forEach(state => {
      describe(`GIVEN nStableToken is ${state.nStableTokens}, peg is ${state.peg},
      reservePrice is ${state.reservePrice} and leverage is ${state.leverage}`, function() {
        it(`THEN maxRiskProx should be ${state.expect.maxRiskPro}`, async function() {
          const {
            nStableTokens,
            peg,
            reservePrice,
            leverage,
            expect
          } = mocHelper.getContractReadyState(state);
          const nStableTokensBN = toContractBN(nStableTokens);
          const pegBN = toContractBN(peg);
          const reserveTokenPriceBN = toContractBN(reservePrice);
          const leverageBN = toContractBN(leverage);
          const maxRiskProxPromise =
            state.leverage === '∞'
              ? mocHelperLib.maxRiskProxReserveValueInfiniteLeverage(
                  nStableTokensBN,
                  pegBN,
                  reserveTokenPriceBN,
                  state.delta
                )
              : mocHelperLib.maxRiskProxResTokenValue(
                  nStableTokensBN,
                  pegBN,
                  reserveTokenPriceBN,
                  leverageBN
                );
          mocHelper.assertBig(await maxRiskProxPromise, expect.maxRiskPro);
        });
      });
    });
  });
});
