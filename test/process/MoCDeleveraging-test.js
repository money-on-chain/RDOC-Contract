/* eslint-disable no-unused-expressions */
const { expectRevert } = require('openzeppelin-test-helpers');
const { expect } = require('chai');
const testHelperBuilder = require('../mocHelper.js');

let mocHelper;
let toContractBN;
let BUCKET_X2;
let accounts;
contract('MoC: Delever X', function([owner, blacklisted, vendorAccount, ...allAccounts]) {
  accounts = allAccounts.slice(0, 10);
  before(async function() {
    const acc = [owner, blacklisted, vendorAccount, ...accounts];
    mocHelper = await testHelperBuilder({ owner, accounts: acc, useMock: true });
    ({ toContractBN, BUCKET_X2 } = mocHelper);
    this.moc = mocHelper.moc;
    this.mocState = mocHelper.mocState;
    this.mocSettlement = mocHelper.mocSettlement;
  });

  beforeEach(async function() {
    await mocHelper.revertState();

    // Register vendor for test
    await mocHelper.registerVendor(vendorAccount, 0, owner);
  });

  describe('DoS attack mitigation', function() {
    const reserveTokenBalances = [];

    describe('GIVEN two honest users and one attacker mint RiskProx', function() {
      beforeEach(async function() {
        await mocHelper.mintRiskProAmount(owner, 3, vendorAccount);
        await mocHelper.mintStableTokenAmount(owner, 15000, vendorAccount);

        await mocHelper.mintRiskProxAmount(accounts[1], BUCKET_X2, 0.5, vendorAccount);
        await mocHelper.mintRiskProxAmount(accounts[2], BUCKET_X2, 0.5, vendorAccount);
        // Account is not yet blacklisted
        await mocHelper.mintRiskProxAmount(blacklisted, BUCKET_X2, 0.5, vendorAccount);

        // From now blacklisted
        await mocHelper.reserveToken.blacklistAccount(blacklisted);
        reserveTokenBalances.push(toContractBN(await mocHelper.getReserveBalance(accounts[1])));
        reserveTokenBalances.push(toContractBN(await mocHelper.getReserveBalance(accounts[2])));
        reserveTokenBalances.push(toContractBN(await mocHelper.getReserveBalance(blacklisted)));
      });
      describe('WHEN deleveraging is run', function() {
        beforeEach(async function() {
          await this.mocSettlement.pubRunDeleveraging();
        });
        it(`AND bucket ${BUCKET_X2} coverage should be 2`, async function() {
          const bxCoverage = await this.mocState.coverage(BUCKET_X2);
          mocHelper.assertBigCb(bxCoverage, 2, 'Coverage should be 2');
        });
        it('AND honest users receives ReserveTokens', async function() {
          const finalBalance1 = toContractBN(await mocHelper.getReserveBalance(accounts[1]));
          const finalBalance2 = toContractBN(await mocHelper.getReserveBalance(accounts[2]));

          assert(finalBalance1 > reserveTokenBalances[0], 'Honest user balance does not increase');
          assert(finalBalance2 > reserveTokenBalances[1], 'Honest user balance does not increase');
        });
        it('AND attacker does not receive his ReserveTokens', async function() {
          const finalBalance = toContractBN(await mocHelper.getReserveBalance(blacklisted));

          mocHelper.assertBig(finalBalance, reserveTokenBalances[2], 'Incorrect attackers balance');
        });
      });
    });
  });

  describe('During settlement bucket liquidation is not enabled', function() {
    const riskProx2Positions = [0.5, 0.5, 0.5, 0.5, 0.01];
    describe('GIVEN five users have RiskProX and there is a position and the settlement is enabled', function() {
      beforeEach(async function() {
        await mocHelper.mintRiskProAmount(owner, 25, vendorAccount);
        await mocHelper.mintStableTokenAmount(owner, 25000, vendorAccount);

        await Promise.all(
          riskProx2Positions.map((position, i) =>
            mocHelper.mintRiskProxAmount(accounts[i + 1], BUCKET_X2, position, vendorAccount)
          )
        );
        await mocHelper.moc.redeemStableTokenRequest(toContractBN(1, 'USD'), {
          from: owner
        });
        // Verify that the positions are placed
        await Promise.all(
          riskProx2Positions.map(async (position, i) =>
            mocHelper.assertBigReserve(
              await mocHelper.getRiskProxBalance(BUCKET_X2, accounts[i + 1]),
              position
            )
          )
        );
        await mocHelper.waitNBlocks(100);
      });
      describe('WHEN deleveraging has run almost completely', function() {
        beforeEach(async function() {
          // Run only a few deleveraging step
          await this.moc.runSettlement(3);
          await mocHelper.waitNBlocks(100);
          expect(await this.mocSettlement.isSettlementRunning()).to.be.true;
        });
        it(`THEN bucket liquidation should not be enabled ${BUCKET_X2} until the settlement finishes`, async function() {
          await expectRevert(
            this.moc.evalBucketLiquidation(BUCKET_X2),
            'Function can only be called when settlement is ready'
          );
        });
      });
    });
  });

  // TODO: review test
  describe('Deleveraging can be run burning every position', function() {
    const riskProx2Positions = [0.5, 0.5, 0.5, 0.5, 0.01];
    describe('GIVEN five users have only RiskProX2 positions and the settlement is enabled', function() {
      beforeEach(async function() {
        await mocHelper.mintRiskProAmount(owner, 25, vendorAccount);
        await mocHelper.mintStableTokenAmount(owner, 25000, vendorAccount);

        await Promise.all(
          riskProx2Positions.map((position, i) =>
            mocHelper.mintRiskProxAmount(accounts[i + 1], BUCKET_X2, position, vendorAccount)
          )
        );
        // Verify that the positions are placed
        await Promise.all(
          riskProx2Positions.map(async (position, i) =>
            mocHelper.assertBigReserve(
              await mocHelper.getRiskProxBalance(BUCKET_X2, accounts[i + 1]),
              position
            )
          )
        );
        await mocHelper.waitNBlocks(100);
      });
      describe('WHEN deleveraging has run completely', function() {
        beforeEach(async function() {
          // Run only a deleveraging step to finish
          await this.mocSettlement.pubRunDeleveraging();

          expect(await this.mocSettlement.isSettlementRunning()).to.be.false;
        });
        it('THEN all users RiskProx are burnt', async function() {
          await Promise.all(
            riskProx2Positions.map(async (position, i) => {
              mocHelper.assertBigReserve(
                await mocHelper.getRiskProxBalance(BUCKET_X2, accounts[i + 1]),
                0
              );
            })
          );
        });
      });
    });
  });

  describe('Setllement does not finish prematurely', function() {
    const SETTLEMENT_STEPS_TO_RUN = 3;
    const riskProx2Positions = [0.5, 0.5, 0.5, 0.5, 0.5];

    describe('GIVEN five users have RiskProX2 and the settlement is enabled', function() {
      beforeEach(async function() {
        await mocHelper.mintRiskProAmount(owner, 25, vendorAccount);
        await mocHelper.mintStableTokenAmount(owner, 25000, vendorAccount);

        mocHelper.getBucketState(BUCKET_X2);
        await Promise.all(
          riskProx2Positions.map((position, i) =>
            mocHelper.mintRiskProxAmount(accounts[i + 1], BUCKET_X2, position, vendorAccount)
          )
        );
        await Promise.all(
          riskProx2Positions.map(async (position, i) =>
            mocHelper.assertBigReserve(
              await mocHelper.getRiskProxBalance(BUCKET_X2, accounts[i + 1]),
              position
            )
          )
        );
        await mocHelper.waitNBlocks(100);
      });
      describe('WHEN deleveraging has run almost completely', function() {
        beforeEach(async function() {
          await this.moc.runSettlement(SETTLEMENT_STEPS_TO_RUN); // Run only a few deleveraging step
        });
        it('THEN the settlement is running', async function() {
          expect(await this.mocSettlement.isSettlementRunning()).to.be.true;
        });
        it(`THEN the bucket ${BUCKET_X2}'s liquitadion should not be enabled until the settlement finishes`, async function() {
          await expectRevert(
            this.moc.evalBucketLiquidation(BUCKET_X2),
            'Function can only be called when settlement is ready'
          );
        });
        it('THEN two positions are still on place', async function() {
          const expectedPositionsInPlace = riskProx2Positions.length - SETTLEMENT_STEPS_TO_RUN;
          const individualResults = await Promise.all(
            riskProx2Positions.map(async (position, i) =>
              toContractBN(position, 'RES').eq(
                await mocHelper.getRiskProxBalance(BUCKET_X2, accounts[i + 1])
              )
            )
          );

          const positionsInPlace = individualResults.reduce(
            (previousPositionsInPlace, currentPositionIsInPlace) =>
              currentPositionIsInPlace ? previousPositionsInPlace + 1 : previousPositionsInPlace
          );
          expect(
            positionsInPlace === expectedPositionsInPlace,
            `Positions in place should be ${expectedPositionsInPlace} and they actually are ${positionsInPlace}`
          );
        });
      });
    });
  });

  const scenarios = [
    {
      description: 'If there is one X2 position, it gets delevered and coverage is restored',
      users: [
        {
          nRiskPro: 10,
          nStableToken: 10000,
          riskProxMint: {
            nReserve: 1
          }, // Loads X2 with nReserve: 1 and nStableToken: 10000
          expect: {
            returned: { nReserve: 1 },
            burn: { nRiskProx: 1 }
          }
        }
      ],
      expect: {
        coverage: { after: 2 } // X2 coverage is restored
      }
    },
    {
      description: 'If there are two X2 position, both got delevered and coverage is restored',
      // Loads X2 with nReserve: 1 and nStableToken: 10000
      users: [
        {
          nRiskPro: 5,
          nStableToken: 5000,
          riskProxMint: {
            nReserve: 0.5
          },
          expect: {
            returned: { nReserve: 0.5 },
            burn: { nRiskProx: 0.5 }
          }
        },
        {
          nRiskPro: 5,
          nStableToken: 5000,
          riskProxMint: {
            nReserve: 0.5
          },
          expect: {
            returned: { nReserve: 0.5 },
            burn: { nRiskProx: 0.5 }
          }
        }
      ],
      expect: {
        coverage: { after: 2 } // X2 coverage is restored
      }
    },
    {
      description: 'no X2 position, nothings is moved',
      users: [
        {
          nRiskPro: 10,
          nStableToken: 10000,
          riskProxMint: {
            nReserve: 0
          },
          expect: {
            returned: { nReserve: 0 },
            burn: { nRiskProx: 0 }
          }
        }
      ],
      expect: {
        coverage: { after: 2 }
      }
    }
  ];
  scenarios.forEach(s => {
    const userPrevBalances = [];
    describe(`GIVEN there is 1 RiskProx in Bucket ${BUCKET_X2}`, function() {
      beforeEach(async function() {
        await new Promise(resolve => {
          s.users.forEach(async (user, index) => {
            const account = accounts[index + 1];

            await mocHelper.mintRiskProAmount(account, user.nRiskPro, vendorAccount);
            await mocHelper.mintStableTokenAmount(account, user.nStableToken, vendorAccount);

            if (user.riskProxMint.nReserve) {
              await mocHelper.mintRiskProx(
                account,
                BUCKET_X2,
                user.riskProxMint.nReserve,
                vendorAccount
              );
            }
            userPrevBalances[index] = {
              nRiskProx: await mocHelper.getRiskProxBalance(BUCKET_X2, accounts[index + 1]),
              nReserve: await mocHelper.getReserveBalance(accounts[index + 1])
            };
            if (index === s.users.length - 1) resolve();
          });
        });
      });
      describe('WHEN deleveraging is run', function() {
        beforeEach(async function() {
          await this.mocSettlement.pubRunDeleveraging();
        });
        s.users.forEach(async (u, index) => {
          const { nReserve } = u.expect.returned;
          const { nRiskProx } = u.expect.burn;
          it(`THEN ${nReserve} ReserveTokens are returned to the user ${index}`, async function() {
            const usereserveTokenBalance = toContractBN(
              await mocHelper.getReserveBalance(accounts[index + 1])
            );
            const returnedReserveToken = usereserveTokenBalance.sub(
              toContractBN(userPrevBalances[index].nReserve)
            );
            mocHelper.assertBigReserve(
              returnedReserveToken,
              nReserve,
              `returned ReserveTokens should be ${nReserve}`
            );
          });
          it(`AND ${nRiskProx} are burnt for the user ${index}`, async function() {
            const userRiskProxBalance = await mocHelper.getRiskProxBalance(
              BUCKET_X2,
              accounts[index + 1]
            );
            const burnedRiskProx = userPrevBalances[index].nRiskProx.sub(userRiskProxBalance);
            mocHelper.assertBigReserve(
              burnedRiskProx,
              nRiskProx,
              `burned RiskProx should be ${nRiskProx}`
            );
          });
        });
        const newCoverage = s.expect.coverage.after;
        it(`THEN bucket X2 coverage should be ${newCoverage}`, async function() {
          const bLCoverage = await this.mocState.coverage(BUCKET_X2);
          mocHelper.assertBigCb(bLCoverage, newCoverage, `Coverage should be ${newCoverage}`);
        });
      });
    });
  });
});
