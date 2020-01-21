const testHelperBuilder = require('../mocHelper.js');

let mocHelper;
let reservePrice;
let toContractBN;
let BUCKET_X2;
let BUCKET_C0;

contract('MoC : MoCExchange', function([owner, userAccount]) {
  before(async function() {
    const accounts = [owner, userAccount];
    mocHelper = await testHelperBuilder({ owner, accounts, useMock: true });
    ({ toContractBN } = mocHelper);
    ({ BUCKET_C0, BUCKET_X2 } = mocHelper);
    this.moc = mocHelper.moc;
    this.mocState = mocHelper.mocState;
    this.mocInrate = mocHelper.mocInrate;
    reservePrice = await mocHelper.getReserveTokenPrice();
  });

  beforeEach(function() {
    return mocHelper.revertState();
  });

  describe('RiskProx minting', function() {
    const scenarios = [
      {
        params: {
          nRiskProx: 5
        },
        expect: {
          nRiskProx: '5',
          nReserveToken: '5',
          nStableTokens: '40000',
          interest: {
            nReserveToken: '0.000652894690169500'
          }
        }
      },
      {
        params: {
          nRiskProx: 10
        },
        expect: {
          nRiskProx: '10',
          nReserveToken: '10',
          nStableTokens: '80000',
          interest: {
            nReserveToken: '0.002611578760678'
          }
        }
      },
      {
        params: {
          nRiskProx: 15
        },
        expect: {
          nRiskProx: '10',
          nReserveToken: '10',
          nStableTokens: '80000',
          interest: {
            nReserveToken: '0.002611578760678'
          }
        }
      }
    ];

    let c0InitialState;
    let x2InitialState;
    let globalInitialState;

    describe('GIVEN the user have 18 RiskPro and 8000 StableTokens and Price falls to 8000 and days to settlement is 2', function() {
      beforeEach(async function() {
        await this.mocState.setDaysToSettlement(toContractBN(2, 'DAY'));
        await mocHelper.mintRiskProAmount(userAccount, 18);
        await mocHelper.mintStableTokenAmount(userAccount, 80000);
        // Move price to change RiskProx price and make it different
        // from RiskPro price
        reservePrice = toContractBN(8000 * mocHelper.MOC_PRECISION);
        await mocHelper.setReserveTokenPrice(reservePrice);

        // [RES] / [RES]
        globalInitialState = await mocHelper.getGlobalState();
        c0InitialState = await mocHelper.getBucketState(BUCKET_C0);
        x2InitialState = await mocHelper.getBucketState(BUCKET_X2);
      });
      it('THEN there is 5 ReserveTokens in RiskProx available to mint', async function() {
        const riskProReserveTokenMax = await this.mocState.maxRiskProxResTokenValue(BUCKET_X2);

        mocHelper.assertBigReserve(
          riskProReserveTokenMax,
          10,
          'The amount of RiskProx available is incorrect'
        );
      });
      it('AND the RiskProx price in ReserveTokens should be 1 ReserveTokens', async function() {
        const riskProx2ReserveTokenPrice = await this.mocState.bucketRiskProTecPrice(BUCKET_X2);

        mocHelper.assertBigReserve(
          riskProx2ReserveTokenPrice,
          1,
          'RiskProx ReserveTokens price is incorrect'
        );
      });
      it('AND the RiskProx price in RiskPro should be 1.125', async function() {
        const riskProxRiskProPrice = await this.mocState.riskProxRiskProPrice(BUCKET_X2);

        mocHelper.assertBigReserve(
          riskProxRiskProPrice,
          1.125,
          'RiskProx RiskPro price is incorrect',
          {
            significantDigits: 16
          }
        );
      });

      scenarios.forEach(async s => {
        describe(`WHEN a user sends ReserveTokens to mint ${s.params.nRiskProx} RiskProx`, function() {
          let initialBalance;
          beforeEach(async function() {
            x2InitialState = await mocHelper.getBucketState(BUCKET_X2);

            initialBalance = toContractBN(await mocHelper.getReserveBalance(owner));

            await mocHelper.mintRiskProxAmount(owner, BUCKET_X2, s.params.nRiskProx);
          });
          it(`THEN he receives ${s.expect.nRiskProx} RiskProx`, async function() {
            const balance = await mocHelper.getRiskProxBalance(BUCKET_X2, owner);
            mocHelper.assertBigReserve(
              balance,
              s.expect.nRiskProx,
              'RiskProx balance is incorrect'
            );
          });
          it('AND the C0 coverage increases', async function() {
            const { coverage } = await mocHelper.getBucketState(BUCKET_C0);
            const diff = coverage.sub(toContractBN(c0InitialState.coverage));
            assert(diff > 0, 'C0 coverage does not increase');
          });
          it('AND the C0 StableTokens decreases by the amount transferred', async function() {
            const { nStableToken } = await mocHelper.getBucketState(BUCKET_C0);
            const diff = c0InitialState.nStableToken.sub(nStableToken);
            mocHelper.assertBigDollar(
              diff,
              s.expect.nStableTokens,
              `StableToken amount does not decrease by ${s.expect.nStableTokens}`
            );
          });
          it('AND the X2 StableTokens increases', async function() {
            const { nStableToken } = await mocHelper.getBucketState(BUCKET_X2);
            const diff = nStableToken.sub(x2InitialState.nStableToken);
            mocHelper.assertBigDollar(
              diff,
              s.expect.nStableTokens,
              'X2 StableToken amount does not increase'
            );
          });
          it('AND the X2 coverage maintains in Cobj', async function() {
            const { coverage } = await mocHelper.getBucketState(BUCKET_X2);
            const diff = coverage.sub(x2InitialState.coverage);

            mocHelper.assertBig(diff, 0, 'X2 coverage changed');
          });
          it('AND the Global coverage should not change', async function() {
            const coverage = await this.mocState.globalCoverage();

            const diff = coverage.sub(globalInitialState.coverage);

            mocHelper.assertBig(diff, 0, 'Global coverage changed');
          });
          it('AND he only spent the sale amount', async function() {
            const balance = toContractBN(await mocHelper.getReserveBalance(owner));
            const diff = initialBalance.sub(balance);
            const expected = toContractBN(s.expect.nReserveToken, 'RES').add(
              toContractBN(s.expect.interest.nReserveToken, 'RES')
            );
            mocHelper.assertBig(diff, expected, 'The cost of the minting is not correct');
          });
          it('AND the inRateBag increase', async function() {
            const finalInrateBag = (await mocHelper.getBucketState(BUCKET_C0)).inrateBag;
            const diff = finalInrateBag.sub(c0InitialState.inrateBag);
            mocHelper.assertBigDollar(
              diff,
              s.expect.interest.nReserveToken,
              'inrateBag does not increase'
            );
          });
        });
      });
    });
  });
});
