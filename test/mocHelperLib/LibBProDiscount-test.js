const MoCHelperLib = artifacts.require('./contracts/mocks/MoCHelperLibMock.sol');
const testHelperBuilder = require('../mocHelper.js');

let mocHelperLib;
let mocHelper;
let toContractBN;

contract('MoCHelperLib: RiskProDiscount', function([owner]) {
  before(async function() {
    mocHelperLib = await MoCHelperLib.new();
    mocHelper = await testHelperBuilder({ owner });
    ({ toContractBN } = mocHelper);
  });
  describe('RiskProSpotDiscountRate', function() {
    const states = [
      {
        discount: 0.1,
        liq: 1.1,
        utpdu: 1.6,
        coverage: 1.4,
        expect: {
          discount: 0.04
        }
      },
      {
        discount: 0.2,
        liq: 1,
        utpdu: 2,
        coverage: 1.5,
        expect: {
          discount: 0.1
        }
      },
      {
        discount: 0.2,
        liq: 1,
        utpdu: 2,
        coverage: 1.6,
        expect: {
          discount: 0.08
        }
      },
      {
        discount: 0.2,
        liq: 1,
        utpdu: 2,
        coverage: 1.8,
        expect: {
          discount: 0.04
        }
      },
      {
        discount: 0.2,
        liq: 1,
        utpdu: 2,
        coverage: 1,
        expect: {
          discount: 0.2
        }
      }
    ];
    states.forEach(state => {
      describe(`GIVEN the liquidationDiscountRate is ${state.discount}, liq is ${state.liq},
      utpdu is ${state.utpdu} and cov is ${state.cov}`, function() {
        it(`THEN spot discount rate should be ${state.expect.discount}`, async function() {
          const { discount, liq, utpdu, coverage, expect } = mocHelper.getContractReadyState(state);
          const spotDiscount = await mocHelperLib.riskProSpotDiscountRate(
            toContractBN(discount),
            toContractBN(liq),
            toContractBN(utpdu),
            toContractBN(coverage)
          );

          mocHelper.assertBig(spotDiscount, expect.discount);
        });
      });
    });
  });
  describe('Max RiskPro with discount available', function() {
    const states = [
      {
        params: {
          nReserve: 1,
          nStableTokens: 10000,
          utpdu: 2,
          peg: 1,
          reservePrice: 10000,
          riskProUsdPrice: 8000,
          discount: 0.2
        },
        expect: {
          nRiskPro: 1.5625
        }
      },
      {
        // Not possible scenario in practice. This occurs with coverage below 1
        params: {
          nReserve: 1,
          nStableTokens: 1000,
          utpdu: 2,
          peg: 1,
          reservePrice: 10000,
          riskProUsdPrice: 8000,
          discount: 0.2
        },
        expect: {
          nRiskPro: 0
        }
      },
      {
        // Should not be possible in practice. This occurs with Cov over utpdu
        params: {
          nReserve: 1,
          nStableTokens: 1000,
          utpdu: 2,
          peg: 1,
          reservePrice: 10000,
          riskProUsdPrice: 8000,
          discount: 0
        },
        expect: {
          nRiskPro: 0
        }
      }
    ];
    states.forEach(state => {
      let { params, expect } = state;
      describe(`GIVEN the parameters are nReserve:${params.nReserve},nStableToken: ${params.nStableTokens},utpdu: ${params.utpdu},discount: ${params.discount},peg: ${params.peg},reservePrice: ${params.reservePrice}`, function() {
        it(`THEN max RiskProWithDiscount should be ${expect.nRiskPro}`, async function() {
          ({ params, expect } = mocHelper.getContractReadyState(state));

          const maxRiskProWithDiscount = await mocHelperLib.maxRiskProWithDiscount(
            toContractBN(params.nReserve),
            toContractBN(params.nStableTokens),
            toContractBN(params.utpdu),
            toContractBN(params.peg),
            toContractBN(params.reservePrice),
            toContractBN(params.riskProUsdPrice),
            toContractBN(params.discount)
          );

          mocHelper.assertBig(maxRiskProWithDiscount, expect.nRiskPro);
        });
      });
    });
  });
});
