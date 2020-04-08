const testHelperBuilder = require('../mocHelper.js');

let mocHelper;
let toContractBN;
let BUCKET_X2;

contract('MoC', function([owner, userAccount, otherAccount]) {
  before(async function() {
    const accounts = [owner, userAccount, otherAccount];
    mocHelper = await testHelperBuilder({ owner, accounts, useMock: true });
    ({ toContractBN } = mocHelper);
    this.moc = mocHelper.moc;
    this.mocState = mocHelper.mocState;
    this.mocConnector = mocHelper.mocConnector;
    ({ BUCKET_X2 } = mocHelper);
  });

  describe('Free StableToken redeem without interests', function() {
    before(async function() {
      await mocHelper.revertState();
      // This makes stableToken redemption interests zero
      await this.mocState.setDaysToSettlement(0);
    });
    describe('Redeem free stableTokens locking some of them', function() {
      const scenarios = [
        {
          params: {
            stableTokensToMint: 1000,
            riskProToMint: 1,
            riskProxToMint: 0.05,
            stableTokensToRedeem: 100,
            stableTokensToDrop: 0,
            initialReserveTokenPrice: 10000
          },
          expect: {
            initialFreeStableTokens: 1000,
            stableTokensToRedeem: 100,
            inRateBeforeRedeem: 0.02,
            X2BucketCoverageBeforeRedeem: 2,
            X2BucketLeverageBeforeRedeem: 2,
            X2BucketCoverageAfterRedeem: 2,
            X2BucketLeverageAfterRedeem: 2,
            freeStableTokensAfterRiskProxMint: 500,
            freeStableTokensAfterRedeem: 400,
            stableTokenBalanceAfterRedeem: 900
          }
        },
        {
          params: {
            stableTokensToMint: 1000,
            riskProToMint: 1,
            riskProxToMint: 0.05,
            stableTokensToRedeem: 500,
            stableTokensToDrop: 0,
            initialReserveTokenPrice: 10000
          },
          expect: {
            initialFreeStableTokens: 1000,
            stableTokensToRedeem: 500,
            X2BucketCoverageBeforeRedeem: 2,
            X2BucketLeverageBeforeRedeem: 2,
            X2BucketCoverageAfterRedeem: 2,
            X2BucketLeverageAfterRedeem: 2,
            freeStableTokensAfterRiskProxMint: 500,
            freeStableTokensAfterRedeem: 0,
            stableTokenBalanceAfterRedeem: 500
          }
        },
        {
          params: {
            stableTokensToMint: 1000,
            riskProToMint: 1,
            riskProxToMint: 0.05,
            stableTokensToRedeem: 200,
            stableTokensToDrop: 900,
            initialReserveTokenPrice: 10000
          },
          expect: {
            initialFreeStableTokens: 1000,
            stableTokensToRedeem: 100,
            X2BucketCoverageBeforeRedeem: 2,
            X2BucketLeverageBeforeRedeem: 2,
            X2BucketCoverageAfterRedeem: 2,
            X2BucketLeverageAfterRedeem: 2,
            freeStableTokensAfterRiskProxMint: 500,
            freeStableTokensAfterRedeem: 400,
            stableTokenBalanceAfterRedeem: 0
          }
        }
      ];

      scenarios.forEach(async scenario => {
        describe.only(`GIVEN ${scenario.params.riskProToMint} RiskPro is minted and reserveToken price is ${scenario.params.initialReserveTokenPrice} usd`, function() {
          beforeEach(async function() {
            await mocHelper.revertState();
            await mocHelper.mintRiskProAmount(owner, scenario.params.riskProToMint);
            const riskProTokenBalance = await mocHelper.getRiskProBalance(owner);
            mocHelper.assertBigReserve(
              riskProTokenBalance,
              scenario.params.riskProToMint,
              'wrong amount of riskPro received'
            );
          });
          describe(`WHEN ${scenario.params.stableTokensToMint} stableToken are minted`, function() {
            beforeEach(async function() {
              await mocHelper.mintStableTokenAmount(
                userAccount,
                scenario.params.stableTokensToMint
              );
            });
            it(`THEN the user has ${scenario.params.stableTokensToMint} stableTokens`, async function() {
              const stableTokenBalance = await mocHelper.getStableTokenBalance(userAccount);
              mocHelper.assertBigDollar(
                stableTokenBalance,
                scenario.params.stableTokensToMint,
                'wrong amount of stableToken received'
              );
            });
            it(`THEN ${scenario.expect.initialFreeStableTokens} stableToken are free stableTokens`, async function() {
              const freeStableToken = await this.mocState.freeStableToken();
              mocHelper.assertBigDollar(
                freeStableToken,
                scenario.expect.initialFreeStableTokens,
                'wrong amount of free stableToken'
              );
            });
            describe(`WHEN ${scenario.params.riskProxToMint} RiskProx are minted`, function() {
              beforeEach(async function() {
                const stableTokenBalance = await mocHelper.getStableTokenBalance(userAccount);
                mocHelper.assertBigDollar(
                  stableTokenBalance,
                  scenario.params.stableTokensToMint,
                  'wrong amount of stableToken received'
                );

                await mocHelper.mintRiskProxAmount(
                  owner,
                  BUCKET_X2,
                  scenario.params.riskProxToMint
                );
              });
              it(`THEN the user has ${scenario.params.riskProxToMint} riskProx `, async function() {
                const riskProxBalance = await mocHelper.getRiskProxBalance(BUCKET_X2, owner);

                mocHelper.assertBigReserve(
                  riskProxBalance,
                  scenario.params.riskProxToMint,
                  'wrong amount of riskProx received'
                );
              });
              it(`THEN ${scenario.expect.freeStableTokensAfterRiskProxMint} stableToken are free stableTokens`, async function() {
                const freeStableToken = await this.mocState.freeStableToken();
                mocHelper.assertBigDollar(
                  freeStableToken,
                  scenario.expect.freeStableTokensAfterRiskProxMint,
                  'wrong amount of free stableToken after minting riskProx'
                );
              });
              it(`THEN X2 bucket coverage is ${scenario.expect.X2BucketCoverageBeforeRedeem}`, async function() {
                const coverage = await this.mocState.coverage(BUCKET_X2);
                mocHelper.assertBigCb(
                  coverage,
                  scenario.expect.X2BucketCoverageBeforeRedeem,
                  'wrong X2 coverage after minting riskProx'
                );
              });
              it(`THEN X2 bucket leverage is ${scenario.expect.X2BucketLeverageBeforeRedeem}`, async function() {
                const leverage = await this.mocState.leverage(BUCKET_X2);
                mocHelper.assertBigCb(
                  leverage,
                  scenario.expect.X2BucketLeverageBeforeRedeem,
                  'wrong X2 leverage after minting riskProx'
                );
              });

              describe(`AND the user drops ${scenario.params.stableTokensToDrop} stableToken`, function() {
                let usereserveTokenBalance;
                let redeemTx;
                let usedGas;
                beforeEach(async function() {
                  await mocHelper.stableToken.transfer(
                    otherAccount,
                    toContractBN(scenario.params.stableTokensToDrop * mocHelper.MOC_PRECISION),
                    {
                      from: userAccount
                    }
                  );
                });
                it(`THEN the user has ${scenario.params.stableTokensToMint -
                  scenario.params.stableTokensToDrop} stableToken`, async function() {
                  const stableTokenBalance = await mocHelper.getStableTokenBalance(userAccount);
                  mocHelper.assertBigDollar(
                    stableTokenBalance,
                    scenario.params.stableTokensToMint - scenario.params.stableTokensToDrop,
                    'user has wrong amount of stableTokens'
                  );
                });
                describe(`AND ${scenario.params.stableTokensToRedeem} stableTokens are redeemed`, function() {
                  beforeEach(async function() {
                    usereserveTokenBalance = await mocHelper.getReserveBalance(userAccount);
                    redeemTx = await this.moc.redeemFreeStableToken(
                      toContractBN(scenario.params.stableTokensToRedeem * mocHelper.MOC_PRECISION),
                      {
                        from: userAccount
                      }
                    );
                    usedGas = toContractBN(await mocHelper.getTxCost(redeemTx));
                  });
                  it(`THEN the redeemers ReserveTokens balance is increased by redeeming only ${scenario.expect.stableTokensToRedeem} stableTokens`, async function() {
                    const currentBalance = toContractBN(
                      await mocHelper.getReserveBalance(userAccount)
                    );
                    mocHelper.assertBig(
                      usereserveTokenBalance,
                      currentBalance
                        .sub(
                          mocHelper.RESERVE_PRECISION.mul(
                            toContractBN(scenario.expect.stableTokensToRedeem)
                          ).div(toContractBN(scenario.params.initialReserveTokenPrice))
                        )
                        .add(usedGas),
                      'incorrect amount of ReserveTokens sent to user'
                    );
                  });
                  it('THEN redeemers StableToken balance is decreased', async function() {
                    const stableTokenBalance = await mocHelper.getStableTokenBalance(userAccount);
                    mocHelper.assertBigDollar(
                      stableTokenBalance,
                      scenario.expect.stableTokenBalanceAfterRedeem,
                      'wrong amount of stableToken burnt after redeem'
                    );
                  });
                  it(`THEN ${scenario.expect.stableTokensToRedeem} StableTokens are burnt`, async function() {
                    const transferEvent = mocHelper.findEvents(redeemTx, 'Transfer')[0];
                    mocHelper.assertBigDollar(
                      transferEvent.value,
                      scenario.expect.stableTokensToRedeem,
                      'Incorrect amount of StableTokens burnt'
                    );
                    assert(
                      transferEvent.to === '0x0000000000000000000000000000000000000000',
                      'StableTokens werent burnt'
                    );
                    assert(
                      transferEvent.from === userAccount,
                      'StableTokens were burnt from the wrong address'
                    );
                  });
                  it('THEN a FreeStableTokenRedeem event is logged', async function() {
                    const freeStableTokenRedeemEvent = mocHelper.findEvents(
                      redeemTx,
                      'FreeStableTokenRedeem'
                    )[0];
                    mocHelper.assertBigDollar(
                      freeStableTokenRedeemEvent.amount,
                      scenario.expect.stableTokensToRedeem,
                      'wrong amount of stableTokens redeemed'
                    );
                    mocHelper.assertBigReserve(
                      freeStableTokenRedeemEvent.reserveTotal,
                      scenario.expect.stableTokensToRedeem /
                        scenario.params.initialReserveTokenPrice,
                      'wrong amount of reserveToken sent to redeemer'
                    );
                    mocHelper.assertBigReserve(
                      freeStableTokenRedeemEvent.reservePrice,
                      scenario.params.initialReserveTokenPrice,
                      'wrong reserveToken price set on event'
                    );
                  });
                  it('THEN a regular StableTokenRedeem event is not logged', function() {
                    const stableTokenRedeemEvents = mocHelper.findEvents(
                      redeemTx,
                      'StableTokenRedeem'
                    );
                    assert(
                      stableTokenRedeemEvents.length === 0,
                      'a stableToken redeem event was generated on a free stableToken redeem'
                    );
                  });
                  it(`THEN free stableTokens are decreased to ${scenario.expect.freeStableTokensAfterRedeem}`, async function() {
                    const freeStableToken = await this.mocState.freeStableToken();
                    mocHelper.assertBigDollar(
                      freeStableToken,
                      scenario.expect.freeStableTokensAfterRedeem,
                      'wrong amount of free stableToken'
                    );
                  });
                  it(`THEN X2 bucket coverage is ${scenario.expect.X2BucketCoverageBeforeRedeem}`, async function() {
                    const coverage = await this.mocState.coverage(BUCKET_X2);
                    mocHelper.assertBigCb(
                      coverage,
                      scenario.expect.X2BucketCoverageBeforeRedeem,
                      'wrong X2 coverage after minting riskProx'
                    );
                  });
                  it(`THEN X2 bucket leverage is ${scenario.expect.X2BucketLeverageBeforeRedeem}`, async function() {
                    const leverage = await this.mocState.leverage(BUCKET_X2);
                    mocHelper.assertBigCb(
                      leverage,
                      scenario.expect.X2BucketLeverageBeforeRedeem,
                      'wrong X2 leverage after minting riskProx'
                    );
                  });
                });
              });
            });
          });
        });
      });
    });
    describe('Redeem free stableTokens without locking any', function() {
      before(async function() {
        await mocHelper.revertState();
      });
      const scenarios = [
        {
          description: 'Redeeming: happy path',
          params: {
            stableTokensToMint: 1000,
            riskProToMint: 1,
            stableTokensToRedeem: 100,
            stableTokensToDrop: 0,
            initialReserveTokenPrice: 10000
          },
          expect: {
            initialFreeStableTokens: 1000,
            stableTokensToRedeem: 100,
            freeStableTokensAfterRedeem: 900,
            stableTokenBalanceAfterRedeem: 900
          }
        },
        {
          description: 'Redeeming limited by free stableToken amount AND users balance',
          params: {
            stableTokensToMint: 1000,
            riskProToMint: 1,
            stableTokensToRedeem: 2000,
            stableTokensToDrop: 0,
            initialReserveTokenPrice: 10000
          },
          expect: {
            initialFreeStableTokens: 1000,
            stableTokensToRedeem: 1000,
            freeStableTokensAfterRedeem: 0,
            stableTokenBalanceAfterRedeem: 0
          }
        },
        {
          description: 'Redeeming limited by users balance',
          params: {
            stableTokensToMint: 1000,
            riskProToMint: 1,
            stableTokensToRedeem: 500,
            stableTokensToDrop: 900,
            initialReserveTokenPrice: 10000
          },
          expect: {
            initialFreeStableTokens: 1000,
            stableTokensToRedeem: 100,
            freeStableTokensAfterRedeem: 900,
            stableTokenBalanceAfterRedeem: 0
          }
        },
        {
          description: 'Redeeming up to both users balance and free stableToken amount',
          params: {
            stableTokensToMint: 1000,
            riskProToMint: 1,
            stableTokensToRedeem: 1000,
            stableTokensToDrop: 0,
            initialReserveTokenPrice: 10000
          },
          expect: {
            initialFreeStableTokens: 1000,
            stableTokensToRedeem: 1000,
            freeStableTokensAfterRedeem: 0,
            stableTokenBalanceAfterRedeem: 0
          }
        }
      ];

      scenarios.forEach(async scenario => {
        describe(scenario.description, function() {
          let usereserveTokenBalance;
          let redeemTx;
          let usedGas;
          describe(`GIVEN ${scenario.params.riskProToMint} bitpro is minted and reserveToken price is ${scenario.params.initialReserveTokenPrice} usd`, function() {
            before(async function() {
              await mocHelper.revertState();
              await mocHelper.mintRiskProAmount(owner, scenario.params.riskProToMint);
              await mocHelper.mintStableTokenAmount(
                userAccount,
                scenario.params.stableTokensToMint
              );
            });
            it(`THEN there are ${scenario.params.stableTokensToMint} stableToken are minted`, async function() {
              const stableTokenBalance = await mocHelper.getStableTokenBalance(userAccount);
              mocHelper.assertBigDollar(
                stableTokenBalance,
                scenario.params.stableTokensToMint,
                'wrong amount of stableToken received'
              );
            });
            it(`THEN ${scenario.expect.initialFreeStableTokens} stableToken are free stableTokens`, async function() {
              const freeStableToken = await this.mocState.freeStableToken();
              mocHelper.assertBigDollar(
                freeStableToken,
                scenario.expect.initialFreeStableTokens,
                'wrong amount of free stableToken'
              );
            });
            describe(`AND a user drops ${scenario.params.stableTokensToDrop}`, function() {
              beforeEach(async function() {
                if (scenario.params.stableTokensToDrop) {
                  await mocHelper.stableToken.transfer(
                    otherAccount,
                    toContractBN(scenario.params.stableTokensToDrop * mocHelper.MOC_PRECISION),
                    {
                      from: userAccount
                    }
                  );
                }
              });
              it(`THEN the user has ${scenario.params.stableTokensToMint -
                scenario.params.stableTokensToDrop} RiskPro`, async function() {
                const stableTokenBalance = await mocHelper.getStableTokenBalance(userAccount);
                mocHelper.assertBigDollar(
                  stableTokenBalance,
                  scenario.params.stableTokensToMint - scenario.params.stableTokensToDrop,
                  'user has wrong amount of stableTokens'
                );
              });
              describe(`AND ${scenario.params.stableTokensToRedeem} stableTokens are redeemed`, function() {
                beforeEach(async function() {
                  usereserveTokenBalance = toContractBN(
                    await mocHelper.getReserveBalance(userAccount)
                  );
                  redeemTx = await this.moc.redeemFreeStableToken(
                    toContractBN(
                      scenario.params.stableTokensToRedeem * mocHelper.RESERVE_PRECISION
                    ),
                    {
                      from: userAccount
                    }
                  );
                  usedGas = await mocHelper.getTxCost(redeemTx);
                });
                it(`THEN the redeemers ReserveTokens balance is increased by redeeming only ${scenario.expect.stableTokensToRedeem} stableTokens`, async function() {
                  const currentBalance = toContractBN(
                    await mocHelper.getReserveBalance(userAccount)
                  );
                  mocHelper.assertBig(
                    usereserveTokenBalance,
                    currentBalance
                      .sub(
                        mocHelper.RESERVE_PRECISION.mul(
                          toContractBN(scenario.expect.stableTokensToRedeem)
                        ).div(toContractBN(scenario.params.initialReserveTokenPrice))
                      )
                      .add(usedGas),
                    'incorrect amount of ReserveTokens sent to user',
                    { significantDigits: -14 }
                  );
                });
                it('THEN redeemers StableToken balance is decreased', async function() {
                  const stableTokenBalance = await mocHelper.getStableTokenBalance(userAccount);
                  mocHelper.assertBigDollar(
                    stableTokenBalance,
                    scenario.expect.stableTokenBalanceAfterRedeem,
                    'wrong amount of stableToken burnt after redeem'
                  );
                });
                it(`THEN ${scenario.expect.stableTokensToRedeem} StableTokens are burnt`, async function() {
                  const transferEvent = mocHelper.findEvents(redeemTx, 'Transfer')[0];
                  mocHelper.assertBigDollar(
                    transferEvent.value,
                    scenario.expect.stableTokensToRedeem,
                    'Incorrect amount of StableTokens burnt'
                  );
                  assert(
                    transferEvent.to === '0x0000000000000000000000000000000000000000',
                    'StableTokens werent burnt'
                  );
                  assert(
                    transferEvent.from === userAccount,
                    'StableTokens were burnt from the wrong address'
                  );
                });
                it('THEN a FreeStableTokenRedeem event is logged', async function() {
                  const freeStableTokenRedeemEvent = mocHelper.findEvents(
                    redeemTx,
                    'FreeStableTokenRedeem'
                  )[0];
                  mocHelper.assertBigDollar(
                    freeStableTokenRedeemEvent.amount,
                    scenario.expect.stableTokensToRedeem,
                    'wrong amount of stableTokens redeemed'
                  );
                  mocHelper.assertBigReserve(
                    freeStableTokenRedeemEvent.reserveTotal,
                    scenario.expect.stableTokensToRedeem / scenario.params.initialReserveTokenPrice,
                    'wrong amount of reserveToken sent to redeemer'
                  );
                  mocHelper.assertBigReserve(
                    freeStableTokenRedeemEvent.reservePrice,
                    scenario.params.initialReserveTokenPrice,
                    'wrong reserveToken price set on event'
                  );
                });
                it('THEN a regular StableTokenRedeem event is not logged', function() {
                  const stableTokenRedeemEvents = mocHelper.findEvents(
                    redeemTx,
                    'StableTokenRedeem'
                  );
                  assert(
                    stableTokenRedeemEvents.length === 0,
                    'a stableToken redeem event was generated on a free stableToken redeem'
                  );
                });
                it(`THEN free stableTokens are decreased by ${scenario.expect.stableTokensToRedeem}`, async function() {
                  const freeStableToken = await this.mocState.freeStableToken();
                  mocHelper.assertBigDollar(
                    freeStableToken,
                    scenario.expect.freeStableTokensAfterRedeem,
                    'wrong amount of free stableToken'
                  );
                });
              });
            });
          });
        });
      });
    });
  });
});
