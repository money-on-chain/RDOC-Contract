const testHelperBuilder = require('../../mocHelper.js');

let mocHelper;
let toContractBN;
let BUCKET_X2;
// TODO: test RiskProx redeems with interests
contract('MoC', function([owner, userAccount, commissionsAccount]) {
  before(async function() {
    const accounts = [owner, userAccount, commissionsAccount];
    mocHelper = await testHelperBuilder({ owner, accounts, useMock: true });
    ({ toContractBN } = mocHelper);
    this.moc = mocHelper.moc;
    this.mocState = mocHelper.mocState;
    this.mockMocInrateChanger = mocHelper.mockMocInrateChanger;
    this.governor = mocHelper.governor;
    ({ BUCKET_X2 } = mocHelper);
  });

  describe('RiskProx redeem with commissions and without interests', function() {
    describe('Redeem RiskProxs', function() {
      const scenarios = [
        {
          // redeem 1 RiskProx
          params: {
            stableTokensToMint: 10000,
            riskProxsToRedeem: 1,
            commissionRate: 0.002,
            riskProxToMint: 1,
            riskProToMint: 100
          },
          expect: {
            riskProxsToRedeem: 1,
            riskProxsToRedeemOnReserveToken: 0.998,
            commissionAddressBalance: 0.002,
            commissionsOnReserveToken: 0.002
          }
        },
        {
          // Redeeming limited by max available to redeem.
          params: {
            stableTokensToMint: 50000,
            riskProxsToRedeem: 50,
            commissionRate: 0.002,
            riskProxToMint: 5,
            riskProToMint: 100
          },
          expect: {
            riskProxsToRedeem: 5,
            riskProxsToRedeemOnReserveToken: 4.99,
            commissionAddressBalance: 0.01,
            commissionsOnReserveToken: 0.01
          }
        }
      ];

      scenarios.forEach(async scenario => {
        describe(`GIVEN ${scenario.params.riskProToMint} RiskPro and StableToken is minted`, function() {
          let prevUsereserveTokenBalance;
          let prevUserRiskProxBalance;
          let prevCommissionsAccountReserveTokenBalance;
          beforeEach(async function() {
            await mocHelper.revertState();
            // this make the interests zero
            await this.mocState.setDaysToSettlement(0);
            // set commissions rate
            await mocHelper.mockMocInrateChanger.setCommissionRate(toContractBN(0.002, 'RAT'));
            await mocHelper.mockMocInrateChanger.setCommissionsAddress(commissionsAccount);
            // update params
            await mocHelper.governor.executeChange(mocHelper.mockMocInrateChanger.address);

            // set commissions address

            await mocHelper.mintRiskProAmount(owner, scenario.params.riskProToMint);
            await mocHelper.mintStableTokenAmount(userAccount, scenario.params.stableTokensToMint);
            await mocHelper.mintRiskProxAmount(
              userAccount,
              BUCKET_X2,
              scenario.params.riskProxToMint
            );
            prevUsereserveTokenBalance = toContractBN(
              await mocHelper.getReserveBalance(userAccount)
            );
            prevUserRiskProxBalance = toContractBN(
              await mocHelper.getRiskProxBalance(BUCKET_X2, userAccount)
            );
            prevCommissionsAccountReserveTokenBalance = toContractBN(
              await mocHelper.getReserveBalance(commissionsAccount)
            );
            await this.moc.redeemRiskProx(
              BUCKET_X2,
              toContractBN(scenario.params.riskProxsToRedeem * mocHelper.RESERVE_PRECISION),
              {
                from: userAccount
              }
            );
          });
          describe(`WHEN ${scenario.params.riskProxsToRedeem} RiskProxs to redeeming`, function() {
            it(`THEN the user has ${scenario.expect.riskProxsToRedeemOnReserveToken} more reserveToken`, async function() {
              const usereserveTokenBalance = toContractBN(
                await mocHelper.getReserveBalance(userAccount)
              );
              const diff = usereserveTokenBalance.sub(prevUsereserveTokenBalance);
              mocHelper.assertBigReserve(
                diff,
                scenario.expect.riskProxsToRedeemOnReserveToken,
                'user reserveToken balance is incorrect'
              );
            });
            it(`THEN the user BPox balance decreased ${scenario.params.riskProxsToRedeem} RiskProxs`, async function() {
              const userRiskProxBalance = toContractBN(
                await mocHelper.getRiskProxBalance(BUCKET_X2, userAccount)
              );
              const diff = prevUserRiskProxBalance.sub(userRiskProxBalance);
              mocHelper.assertBigReserve(
                diff,
                scenario.expect.riskProxsToRedeem,
                'user RiskProx balance is incorrect'
              );
            });
            it(`AND commissions account increase balance by ${scenario.expect.commissionAddressBalance} ReserveTokens`, async function() {
              const reserveTokenBalance = toContractBN(
                await mocHelper.getReserveBalance(commissionsAccount)
              );
              const diff = reserveTokenBalance.sub(prevCommissionsAccountReserveTokenBalance);
              mocHelper.assertBigReserve(
                diff,
                scenario.expect.commissionAddressBalance,
                `Balance does not increase by ${scenario.expect.commissionAddressBalance} ReserveTokens`
              );
            });
          });
        });
      });
    });
  });
});
