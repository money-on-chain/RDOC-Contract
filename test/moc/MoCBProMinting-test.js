const { expectRevert } = require('openzeppelin-test-helpers');
const testHelperBuilder = require('../mocHelper.js');

let mocHelper;
let toContractBN;
let BUCKET_C0;

contract('MoC: MoCExchange', function([owner, userAccount, vendorAccount]) {
  before(async function() {
    const accounts = [owner, userAccount, vendorAccount];
    mocHelper = await testHelperBuilder({ owner, accounts });
    ({ toContractBN } = mocHelper);
    this.moc = mocHelper.moc;
    this.mocState = mocHelper.mocState;
    ({ BUCKET_C0 } = mocHelper);
  });

  beforeEach(async function() {
    await mocHelper.revertState();

    // Register vendor for test
    await mocHelper.registerVendor(vendorAccount, 0, owner);
  });

  describe('RiskPro minting', function() {
    describe('GIVEN sends 100 ReserveTokens to mint RiskPro', function() {
      [(0, 100)].forEach(nRiskPros => {
        describe(`AND there are ${nRiskPros} nRiskPros`, function() {
          let userPrevBalance;
          let c0riskProPrevBalance;
          beforeEach(async function() {
            if (nRiskPros) {
              await mocHelper.mintRiskProAmount(owner, nRiskPros, vendorAccount);
            }

            userPrevBalance = toContractBN(await mocHelper.getReserveBalance(userAccount));
            c0riskProPrevBalance = await this.mocState.getBucketNRiskPro(BUCKET_C0);
            await mocHelper.mintRiskPro(userAccount, 100);
          });
          it('THEN he receives 100 RiskPro on his account', async function() {
            const balance = await mocHelper.getRiskProBalance(userAccount);
            mocHelper.assertBigReserve(balance, 100, 'userAccount RiskPro balance was not 10000');
          });
          it('AND GLOBAL balance increases by 100 ReserveTokens', async function() {
            const mocEthBalance = await mocHelper.getReserveBalance(this.moc.address);
            mocHelper.assertBigReserve(
              mocEthBalance,
              100 + nRiskPros,
              'Should only increase the total amount of the sale'
            );
          });
          it('AND C0 Bucket balance increases by 100 ReserveTokens', async function() {
            const c0ReserveTokenBalance = await this.mocState.getBucketNReserve(BUCKET_C0);
            mocHelper.assertBigReserve(
              c0ReserveTokenBalance,
              100 + nRiskPros,
              'C0 ReserveTokens amount should rise 10000 wei'
            );
          });
          it('AND C0 Bucket RiskPro balance increases by 100 RiskPro', async function() {
            const c0RiskProBalance = await this.mocState.getBucketNRiskPro(BUCKET_C0);
            const diff = c0RiskProBalance.sub(c0riskProPrevBalance);
            mocHelper.assertBigReserve(diff, 100, 'C0 ReserveTokens amount should rise 10000 wei');
          });
          it('AND User Balance decreases by 100 + fee', async function() {
            const userBalance = await mocHelper.getReserveBalance(userAccount);
            const diff = toContractBN(userPrevBalance).sub(toContractBN(userBalance));
            mocHelper.assertBigReserve(
              diff,
              100,
              'Should decrease by the cost of the Token and the gas used'
            );
          });
        });
      });
    });

    describe('GIVEN a user owns 10 RiskPros', function() {
      let userPreBalance;
      let initialRiskProBalance;
      let c0PrevRiskProBalance;
      let c0PrevReserveTokenBalance;
      let maxRiskPro;
      const from = userAccount;
      beforeEach(async function() {
        await mocHelper.mintRiskPro(from, 11, vendorAccount);
        c0PrevRiskProBalance = await this.mocState.getBucketNRiskPro(BUCKET_C0);
        c0PrevReserveTokenBalance = await this.mocState.getBucketNReserve(BUCKET_C0);
        initialRiskProBalance = await mocHelper.getRiskProBalance(userAccount);
        userPreBalance = toContractBN(await mocHelper.getReserveBalance(userAccount));
      });
      describe('AND there are 50000 StableTokens AND ReserveTokens Price falls to 8000', function() {
        beforeEach(async function() {
          await mocHelper.mintStableTokenAmount(owner, 50000, vendorAccount);
          await mocHelper.setReserveTokenPrice(8000 * mocHelper.MOC_PRECISION);
        });
        describe('WHEN he tries to redeem 3 RiskPros', function() {
          it('THEN reverts for having the Coverage below Cobj', async function() {
            const coverage = await this.mocState.globalCoverage();
            const cobj = 3 * mocHelper.MOC_PRECISION;
            assert(coverage < cobj, 'Coverage is not below Cobj');
            const riskProRedemption = mocHelper.redeemRiskPro(from, 3, vendorAccount);
            await expectRevert.unspecified(riskProRedemption);
          });
        });
      });
      describe('AND ReserveTokens Price rises to 16000', function() {
        beforeEach(async function() {
          await mocHelper.setReserveTokenPrice(16000 * mocHelper.MOC_PRECISION);
          maxRiskPro = await this.mocState.absoluteMaxRiskPro();
        });
        describe('WHEN he tries to redeem 11 RiskPros', function() {
          it('THEN he receives only the max redeem amount', async function() {
            await mocHelper.redeemRiskPro(from, 11, vendorAccount);

            const riskProBalance = await mocHelper.getRiskProBalance(userAccount);
            const balanceDiff = initialRiskProBalance.sub(riskProBalance);

            mocHelper.assertBig(
              balanceDiff,
              maxRiskPro,
              'The redemption riskPro amount was incorrect'
            );
          });
        });
      });
      describe('WHEN he tries to redeem 20 RiskPros', function() {
        it('THEN he redeems all his RiskPros', async function() {
          await mocHelper.redeemRiskPro(from, 20, vendorAccount);

          const riskProBalance = await mocHelper.getRiskProBalance(userAccount);
          mocHelper.assertBig(riskProBalance, 0, 'The redemption riskPro amount was incorrect');
        });
      });
      describe('WHEN he tries to redeem 6 RiskPros', function() {
        beforeEach(async function() {
          await mocHelper.redeemRiskPro(from, 6, vendorAccount);
        });
        it('THEN he receives the corresponding amount of ReserveTokens AND his RiskPro balance is 4', async function() {
          const userBalance = toContractBN(await mocHelper.getReserveBalance(userAccount));
          const balanceDiff = userPreBalance.sub(userBalance);
          mocHelper.assertBigReserve(balanceDiff, -6, 'Should increase by the equivalent RiskPro');
          const riskProBalance = await mocHelper.getRiskProBalance(userAccount);
          mocHelper.assertBigReserve(riskProBalance, 5, 'Should be 11 - 6');
        });
        it('AND C0 Bucket ReserveTokens balance decreases by 6 ReserveTokens', async function() {
          const c0ReserveTokenBalance = await this.mocState.getBucketNReserve(BUCKET_C0);
          const diff = c0ReserveTokenBalance.sub(c0PrevReserveTokenBalance);
          mocHelper.assertBigReserve(diff, -6, 'C0 ReserveTokens amount should rise 10000 wei');
        });
        it('AND C0 Bucket RiskPro balance decreases by 6 RiskPro', async function() {
          const c0RiskProBalance = await this.mocState.getBucketNRiskPro(BUCKET_C0);
          const diff = c0RiskProBalance.sub(c0PrevRiskProBalance);
          mocHelper.assertBigReserve(diff, -6, 'C0 ReserveTokens amount should rise 6 wei');
        });
      });
    });
  });

  describe('RiskPro mixed minting', function() {
    let userPrevBalance;
    describe('GIVEN there are 10 RiskPros, 50000 StableTokens AND the ReserveTokens price falls to 6400', function() {
      beforeEach(async function() {
        await mocHelper.setSmoothingFactor(10 ** 18);
        await mocHelper.mintRiskProAmount(owner, 10, vendorAccount);
        await mocHelper.mintStableTokenAmount(owner, 50000, vendorAccount);

        userPrevBalance = await mocHelper.getReserveBalance(userAccount);
        await mocHelper.setReserveTokenPrice(6400 * mocHelper.MOC_PRECISION);
      });

      it('THEN there are riskPros with discount available', async function() {
        const riskProsWithDiscount = await this.mocState.maxRiskProWithDiscount();
        assert(riskProsWithDiscount.gt(toContractBN(0)), undefined);
      });
      describe('WHEN a user sent 10 ReserveTokens to mint RiskPros', function() {
        const sentAmount = 10;
        beforeEach(async function() {
          await mocHelper.mintRiskPro(userAccount, sentAmount, vendorAccount);
        });
        it('THEN he receives the correct 13.913 of RiskPros', async function() {
          const balance = await mocHelper.getRiskProBalance(userAccount);
          mocHelper.assertBig(
            balance,
            '13913043478260869569',
            'userAccount RiskPro balance was not correct'
          );
        });
        it('THEN he spent all the ReserveTokens he sent', async function() {
          const currentBalance = await mocHelper.getReserveBalance(userAccount);
          const diff = toContractBN(userPrevBalance).sub(toContractBN(currentBalance));
          mocHelper.assertBig(
            diff,
            toContractBN(sentAmount).mul(mocHelper.RESERVE_PRECISION),
            `userAccount ReserveTokens did not decreased in ${sentAmount} but in ${diff.toString()}`
          );
        });
        it('THEN there are no more RiskPros with discount available', async function() {
          const riskProsAvailable = await this.mocState.maxRiskProWithDiscount();
          mocHelper.assertBig(riskProsAvailable, 0, 'There are riskPros with discount available');
        });
      });
    });
  });

  describe('RiskPro minting with discount', function() {
    describe('GIVEN there are 10 RiskPros AND the ReserveTokens price is 10000', function() {
      let userPrevBalance;
      beforeEach(async function() {
        await mocHelper.setSmoothingFactor(10 ** 18);
        await mocHelper.mintRiskProAmount(owner, 10, vendorAccount);
        userPrevBalance = toContractBN(await mocHelper.getReserveBalance(userAccount));
      });

      describe('AND the UTPDU is set to 2', function() {
        describe('AND the discount is set to 10%', function() {
          describe('AND the Amount of StableTokens is 50000', function() {
            beforeEach(async function() {
              await mocHelper.mintStableTokenAmount(owner, 50000, vendorAccount);
            });

            describe('WHEN ReserveTokens Price is 5400', function() {
              let maxWithDiscount;
              beforeEach(async function() {
                await mocHelper.setReserveTokenPrice(5400 * mocHelper.MOC_PRECISION);
                maxWithDiscount = toContractBN(await this.mocState.maxRiskProWithDiscount());
              });
              describe('AND a user tries to mint the max amount of RiskPro with Discount', function() {
                beforeEach(async function() {
                  await mocHelper.mintRiskProAmount(
                    userAccount,
                    maxWithDiscount.div(mocHelper.RESERVE_PRECISION),
                    vendorAccount
                  );
                });
                it('AND coverage should be close to utpdu', async function() {
                  const coverage = await this.mocState.globalCoverage();
                  const utpdu = await this.mocState.utpdu();

                  mocHelper.assertBig(coverage, utpdu, 'Coverage is not close to utpdu', {
                    significantDigits: 3 // FIXME 2: before 15
                  });
                });
              });

              describe('AND a user sends ReserveTokens to mint 0.5 RiskPro with Discount', function() {
                let totalWithDiscount;
                beforeEach(async function() {
                  totalWithDiscount = await mocHelper.reserveTokenNeededToMintRiskPro(0.5);
                  const applyPrecision = false;
                  await mocHelper.mintRiskPro(
                    userAccount,
                    totalWithDiscount,
                    vendorAccount,
                    applyPrecision
                  );
                });
                it('THEN he receives 0.5 RiskPros on his account', async function() {
                  const balance = await mocHelper.getRiskProBalance(userAccount);
                  mocHelper.assertBig(
                    balance,
                    toContractBN(0.5, 'RES'),
                    'userAccount RiskPro balance was close to 0.5',
                    {
                      significantDigits: 14
                    }
                  );
                });
                it('THEN the amount available for discount should decrease', async function() {
                  const newMaxAmountWithDiscount = await this.mocState.maxRiskProWithDiscount();
                  const diff = newMaxAmountWithDiscount.sub(maxWithDiscount);
                  assert(diff.lt(toContractBN(0)), 'discount RiskPro does not decrease');
                });
                it('THEN User Balance decreases by the total discount price', async function() {
                  const userBalance = toContractBN(await mocHelper.getReserveBalance(userAccount));
                  const diff = userPrevBalance.sub(userBalance);
                  mocHelper.assertBig(
                    diff,
                    totalWithDiscount,
                    'Should decrease by the cost of the Token and the gas used'
                  );
                });
                describe('AND the ReserveTokens Price rises to 11000', function() {
                  beforeEach(async function() {
                    await mocHelper.setReserveTokenPrice(11000 * mocHelper.MOC_PRECISION);
                  });
                  describe('AND the user tries to mint 10 RiskPro with Discount', function() {
                    it('THEN max riskPro with discount should be 0', async function() {
                      const maxRiskPro = await this.mocState.maxRiskProWithDiscount();
                      mocHelper.assertBig(maxRiskPro, 0, 'Max riskPro available is not 0');
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

  describe('RiskPro tec price', function() {
    describe('GIVEN the user have 18 RiskPro and 80000 StableTokens and ReserveToken price falls to 2000 and liquidation is not enabled', function() {
      beforeEach(async function() {
        await mocHelper.mintRiskProAmount(userAccount, 18, vendorAccount);
        await mocHelper.mintStableTokenAmount(userAccount, 80000, vendorAccount);
        // Move price to change RiskProx price and make it different
        // from RiskPro price
        const reserveTokenPrice = toContractBN(2000 * mocHelper.MOC_PRECISION);
        await mocHelper.setReserveTokenPrice(reserveTokenPrice);
      });
      it('THEN the RiskProx price in ReserveToken should be 0 ReserveToken', async function() {
        const riskProTecPrice = await this.mocState.riskProTecPrice();

        mocHelper.assertBigReserve(riskProTecPrice, 0, 'RiskPro tec price price is incorrect');
      });
    });
  });
});
