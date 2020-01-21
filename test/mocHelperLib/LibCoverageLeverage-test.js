const MoCHelperLib = artifacts.require('./contracts/mocks/MoCHelperLibMock.sol');
const testHelperBuilder = require('../mocHelper');

let mocHelperLib;
let mocHelper;
let toContractBN;

contract('MoCHelperLib:  Coverage-Leverage', function([owner]) {
  before(async function() {
    mocHelperLib = await MoCHelperLib.new();
    mocHelper = await testHelperBuilder({ owner });
    ({ toContractBN } = mocHelper);
  });

  describe('Leverage calculation', function() {
    const states = [
      {
        nReserve: 0,
        lB: 0,
        expect: {
          leverage: 1
        }
      },
      {
        nReserve: 1,
        lB: 0,
        expect: {
          leverage: 1
        }
      },
      {
        nReserve: 5,
        lB: 2,
        expect: {
          leverage: 1.6666666666666668
        }
      },
      {
        nReserve: 1,
        lB: 5,
        expect: {
          leverage: '∞'
        }
      },
      {
        nReserve: 1,
        lB: 1,
        expect: {
          leverage: '∞'
        }
      },
      {
        nReserve: 0,
        lB: 1,
        expect: {
          leverage: '∞'
        }
      },
      {
        // Extreme values still holds lev = 1
        nReserve: 21 * 10 ** 6, // 21M: Max ReserveTokens ever to be mined
        lB: 1 / 10 ** 18, // 1 wei Locket
        expect: {
          leverage: 1
        }
      }
    ];
    states.forEach(state => {
      describe(`GIVEN nReserve is ${state.nReserve} and lB is ${state.lB}`, function() {
        let contractReadyState;
        before(function() {
          contractReadyState = mocHelper.getContractReadyState(state);
        });
        it(`THEN leverage calculation using nReserve and lB should be ${state.expect.leverage}`, async function() {
          const { nReserve, lB, expect } = contractReadyState;
          const leverage = await mocHelperLib.leverage(toContractBN(nReserve), toContractBN(lB));
          mocHelper.assertBig(
            leverage,
            expect.leverage,
            `Expected leverage(${leverage.toString()}) to be ${expect.leverage}`,
            { significantDigits: 15 }
          );
        });
        it(`THEN leverage calculation using coverage should be ${state.expect.leverage}`, async function() {
          const { nReserve, lB, expect } = contractReadyState;
          const coverage = await mocHelperLib.coverage(toContractBN(nReserve), toContractBN(lB));
          const leverage = await mocHelperLib.leverageFromCoverage(toContractBN(coverage));
          mocHelper.assertBig(
            leverage,
            expect.leverage,
            `Expected leverage(${leverage.toString()}) to be ${expect.leverage}`,
            { significantDigits: 13 }
          );
        });
      });
    });
  });
});
