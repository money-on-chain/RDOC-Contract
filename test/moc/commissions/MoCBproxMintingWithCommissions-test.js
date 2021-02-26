const testHelperBuilder = require('../../mocHelper.js');

let mocHelper;
let toContractBN;
let BUCKET_X2;

contract('MoC : MoCExchange', function([owner, userAccount, commissionsAccount]) {
  before(async function() {
    const accounts = [owner, userAccount, commissionsAccount];
    mocHelper = await testHelperBuilder({ owner, accounts, useMock: true });
    ({ toContractBN } = mocHelper);
    this.moc = mocHelper.moc;
    this.mocState = mocHelper.mocState;
    ({ BUCKET_X2 } = mocHelper);
  });

  beforeEach(async function() {
    await mocHelper.revertState();
    // set commissions rate
    await mocHelper.mockMocInrateChanger.setCommissionRate(0.002 * mocHelper.MOC_PRECISION);
    // set commissions address
    await mocHelper.mockMocInrateChanger.setCommissionsAddress(commissionsAccount);
    // update params
    await mocHelper.governor.executeChange(mocHelper.mockMocInrateChanger.address);
  });

  describe('RiskProx minting with commissions', function() {
    const scenarios = [
      {
        params: {
          nRiskProx: 5
        },
        expect: {
          nRiskProx: '5',
          nReserveToken: '5',
          totalCostOnReserveToken: '5.01',
          commission: {
            nReserveToken: '0.01'
          }
        }
      },
      {
        params: {
          nRiskProx: 10
        },
        expect: {
          nRiskProx: '8',
          nReserveToken: '8',
          totalCostOnReserveToken: '8.016',
          commission: {
            nReserveToken: '0.016'
          }
        }
      }
    ];

    describe('GIVEN the user have 18 RiskPro and 8000 StableTokens and no interest is charged', function() {
      beforeEach(async function() {
        await this.mocState.setDaysToSettlement(toContractBN(0, 'DAY'));
        await mocHelper.mintRiskProAmount(userAccount, 18);
        await mocHelper.mintStableTokenAmount(userAccount, 80000);
      });

      scenarios.forEach(async s => {
        describe(`WHEN a user sends ReserveTokens to mint ${s.params.nRiskProx} RiskProx`, function() {
          let initialCommissionAccountBalance;
          let prevUserReserveTokenBalance;
          beforeEach(async function() {
            initialCommissionAccountBalance = toContractBN(
              await mocHelper.getReserveBalance(commissionsAccount)
            );
            prevUserReserveTokenBalance = toContractBN(await mocHelper.getReserveBalance(owner));
            initialCommissionAccountBalance = toContractBN(
              await mocHelper.getReserveBalance(commissionsAccount)
            );

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
          it(`THEN the user reserveToken balance has decrease by ${s.expect.nReserveToken} ReserveTokens by Mint + ${s.expect.commission.nReserveToken} ReserveTokens by commissions`, async function() {
            const usereserveTokenBalance = toContractBN(await mocHelper.getReserveBalance(owner));
            const diff = prevUserReserveTokenBalance.sub(usereserveTokenBalance);
            mocHelper.assertBigReserve(
              diff,
              s.expect.totalCostOnReserveToken,
              'user reserveToken balance is incorrect'
            );
          });
          it('AND the commissions accounts balance increase', async function() {
            const balance = toContractBN(await mocHelper.getReserveBalance(commissionsAccount));
            const diff = balance.sub(initialCommissionAccountBalance);
            const expected = toContractBN(s.expect.commission.nReserveToken, 'RES');
            mocHelper.assertBig(diff, expected, 'the commissions accounts balance is not correct');
          });
        });
      });
    });
  });
});
