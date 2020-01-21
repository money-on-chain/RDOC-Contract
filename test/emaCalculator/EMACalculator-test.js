const testHelperBuilder = require('../mocHelper');

let mocHelper;
let toContractBN;
const factorPrecision = 10 ** 18;
const blocksPerEMA = 50;
contract('MoC: MoCState', function([owner]) {
  before(async function() {
    mocHelper = await testHelperBuilder({ owner });
    ({ toContractBN } = mocHelper);
    this.mocState = mocHelper.mocState;
  });

  describe('EMA calculation period', function() {
    before(async function() {
      await mocHelper.revertState();
    });
    describe(`GIVEN the EMA calculation period is ${blocksPerEMA} blocks and ReserveTokens price is set`, function() {
      let initialEMA;
      before(async function() {
        await this.mocState.getLastEmaCalculation();
        await mocHelper.mockMocStateChanger.setEmaCalculationBlockSpan(toContractBN(blocksPerEMA));
        await mocHelper.governor.executeChange(mocHelper.mockMocStateChanger.address);
        await mocHelper.setReserveTokenPrice(toContractBN(5000 * mocHelper.MOC_PRECISION));
        initialEMA = await this.mocState.getExponentalMovingAverage();
      });
      describe('WHEN ReserveTokens price is set before 50 blocks', function() {
        before(async function() {
          await mocHelper.setReserveTokenPrice(toContractBN(1000 * mocHelper.MOC_PRECISION));
        });
        it('THEN EMA calculation is not necessary', async function() {
          const shouldCalculate = await this.mocState.shouldCalculateEma();
          assert(!shouldCalculate, 'EMA calculation is not needed');
        });
        describe('AND calculate EMA is called', function() {
          before(async function() {
            await this.mocState.calculateReserveTokenMovingAverage();
          });
          it('THEN EMA stays the same', async function() {
            const finalEMA = await this.mocState.getExponentalMovingAverage();
            mocHelper.assertBig(finalEMA, initialEMA, 'EMA Changed');
          });
        });
      });
      describe('WHEN ReserveTokens price is set after 20 blocks and EMA calculation is called', function() {
        let tx;
        before(async function() {
          await mocHelper.waitNBlocks(20);
          await mocHelper.setReserveTokenPrice(toContractBN(1000 * mocHelper.MOC_PRECISION));
          tx = await this.mocState.calculateReserveTokenMovingAverage();
        });
        it('THEN EMA event is emitted', function() {
          const bmaEvents = mocHelper.findEvents(tx, 'MovingAverageCalculation');
          assert(bmaEvents.length === 1, 'EMA calculation event was not emitted');
        });
        it('AND EMA change', async function() {
          const finalEMA = await this.mocState.getExponentalMovingAverage();
          finalEMA.should.be.bignumber.not.equal(initialEMA, 'EMA did not Change');
        });
      });
    });
  });

  describe('EMA 120 calculation', function() {
    before(async function() {
      await mocHelper.revertState();
    });
    describe('GIVEN the bma calculation period is 1 block and the period 120', function() {
      before(async function() {
        const sm = 2 / (120 + 1);
        await mocHelper.mockMocStateChanger.setEmaCalculationBlockSpan(1);
        await mocHelper.mockMocStateChanger.setSmoothingFactor(toContractBN(1 * factorPrecision));
        await mocHelper.governor.executeChange(mocHelper.mockMocStateChanger.address);

        await mocHelper.setReserveTokenPrice(toContractBN(123.25983 * mocHelper.MOC_PRECISION));
        await mocHelper.mocState.calculateReserveTokenMovingAverage();
        await mocHelper.mockMocStateChanger.setSmoothingFactor(toContractBN(sm * factorPrecision));
        await mocHelper.governor.executeChange(mocHelper.mockMocStateChanger.address);
      });

      const states = [
        { reservePrice: 125.58083, movingAverage: '123.298193636363626531' },
        { reservePrice: 100.81083, movingAverage: '122.926501675431996146' },
        { reservePrice: 116.967, movingAverage: '122.827997515507500334' },
        { reservePrice: 121.17883, movingAverage: '122.800738548309029252' }
      ];

      states.forEach(async state => {
        describe(`WHEN the user set a price of ${state.reservePrice}`, function() {
          before(async function() {
            await mocHelper.setReserveTokenPrice(
              toContractBN(state.reservePrice * mocHelper.MOC_PRECISION)
            );
            await this.mocState.calculateReserveTokenMovingAverage();
          });
          it(`THEN the new EMA is ${state.movingAverage}`, async function() {
            const ema = await this.mocState.getExponentalMovingAverage();
            mocHelper.assertBigDollar(ema, state.movingAverage, 'EMA is incorrect');
          });
        });
      });
    });
  });

  describe('Extreme EMA calculation', function() {
    const states = [
      {
        reservePrice: 12000,
        smoothingFactor: 0.6,
        ema: 11200
      },
      {
        reservePrice: 13000,
        smoothingFactor: 1,
        ema: 13000
      },
      {
        reservePrice: 12000,
        smoothingFactor: 0,
        ema: 10000
      }
    ];

    states.forEach(state => {
      describe('GIVEN the initial price is 10000 and the bma calculation period is 1 block', function() {
        describe(`AND the weighting decrease coefficient value is ${state.smoothingFactor}`, function() {
          describe(`WHEN the user set a price of ${state.reservePrice}`, function() {
            beforeEach(async function() {
              await mocHelper.revertState();
              await mocHelper.mockMocStateChanger.setEmaCalculationBlockSpan(1);
              await mocHelper.mockMocStateChanger.setSmoothingFactor(
                toContractBN(state.smoothingFactor * factorPrecision)
              );
              await mocHelper.governor.executeChange(mocHelper.mockMocStateChanger.address);
              await mocHelper.setReserveTokenPrice(
                toContractBN(state.reservePrice * mocHelper.MOC_PRECISION)
              );
              await mocHelper.mocState.calculateReserveTokenMovingAverage();
            });
            it(`THEN the new price is ${state.reservePrice} cents`, async function() {
              const price = await mocHelper.getReserveTokenPrice();
              mocHelper.assertBigDollar(
                toContractBN(price),
                state.reservePrice,
                'Price is incorrect'
              );
            });
            it(`THEN the new EMA is ${state.ema}`, async function() {
              const ema = await this.mocState.getExponentalMovingAverage();
              mocHelper.assertBigDollar(ema, state.ema, 'EMA is incorrect');
            });
          });
        });
      });
    });
  });
});
