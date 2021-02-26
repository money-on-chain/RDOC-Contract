const testHelperBuilder = require('../../mocHelper.js');

let mocHelper;
let toContractBN;

// TODO: test free stableTokens redeems with interests
contract('MoC', function([owner, userAccount, commissionsAccount]) {
  before(async function() {
    const accounts = [owner, userAccount, commissionsAccount];
    mocHelper = await testHelperBuilder({ owner, accounts, useMock: true });
    ({ toContractBN } = mocHelper);
    this.moc = mocHelper.moc;
    this.mocState = mocHelper.mocState;
    this.mockMocInrateChanger = mocHelper.mockMocInrateChanger;
  });

  describe('Free StableToken redeem with commissions and without interests', function() {
    describe('Redeem free stableTokens', function() {
      const scenarios = [
        {
          // redeem 100 StableTokens when has 1000 free StableTokens
          params: {
            stableTokensToMint: 1000,
            stableTokensToRedeem: 100,
            commissionsRate: 0.2,
            riskProToMint: 1
          },
          expect: {
            stableTokensToRedeem: 100,
            // (stableTokensToRedeem / reservePrice) - ((stableTokensToRedeem / reservePrice) * commissionRate)
            stableTokensToRedeemOnReserveToken: 0.008,
            commissionAddressBalance: 0.002
          }
        },
        {
          // Redeeming limited by free stableToken amount and user stableToken balance.
          params: {
            stableTokensToMint: 500,
            stableTokensToRedeem: 600,
            commissionsRate: 0.2,
            riskProToMint: 1
          },
          expect: {
            stableTokensToRedeem: 500,
            // (stableTokensToRedeem / reservePrice) - ((stableTokensToRedeem / reservePrice) * commissionRate)
            stableTokensToRedeemOnReserveToken: 0.04,
            commissionAddressBalance: 0.01
          }
        }
      ];

      scenarios.forEach(async scenario => {
        describe(`GIVEN ${scenario.params.riskProToMint} RiskPro is minted and reserveToken price is ${scenario.params.initialReserveTokenPrice} usd`, function() {
          let prevUserReserveTokenBalance;
          let prevUserStableTokenBalance;
          let prevCommissionsAccountReserveTokenBalance;
          beforeEach(async function() {
            await mocHelper.revertState();
            // this make the interests zero
            await this.mocState.setDaysToSettlement(0);
            // set commissions rate
            await mocHelper.mockMocInrateChanger.setCommissionRate(toContractBN(0.2, 'RAT'));
            // set commissions address
            await mocHelper.mockMocInrateChanger.setCommissionsAddress(commissionsAccount);
            // update params
            await mocHelper.governor.executeChange(mocHelper.mockMocInrateChanger.address);

            await mocHelper.mintRiskProAmount(owner, scenario.params.riskProToMint);
            await mocHelper.mintStableTokenAmount(userAccount, scenario.params.stableTokensToMint);
            prevUserReserveTokenBalance = toContractBN(
              await mocHelper.getReserveBalance(userAccount)
            );
            prevUserStableTokenBalance = toContractBN(
              await mocHelper.getStableTokenBalance(userAccount)
            );
            prevCommissionsAccountReserveTokenBalance = toContractBN(
              await mocHelper.getReserveBalance(commissionsAccount)
            );
            await this.moc.redeemFreeStableToken(
              toContractBN(scenario.params.stableTokensToRedeem * mocHelper.RESERVE_PRECISION),
              {
                from: userAccount
              }
            );
          });
          describe(`WHEN ${scenario.params.stableTokensToMint} stableToken are redeeming`, function() {
            it(`THEN the user has ${scenario.expect.stableTokensToRedeemOnReserveToken} more reserveToken`, async function() {
              const usereserveTokenBalance = toContractBN(
                await mocHelper.getReserveBalance(userAccount)
              );
              const diff = usereserveTokenBalance.sub(prevUserReserveTokenBalance);
              mocHelper.assertBigReserve(
                diff,
                scenario.expect.stableTokensToRedeemOnReserveToken,
                'user reserveToken balance is incorrect'
              );
            });
            it(`THEN the user stableTokens balance decreased ${scenario.params.stableTokensToRedeem} StableTokens`, async function() {
              const userStableTokenBalance = toContractBN(
                await mocHelper.getStableTokenBalance(userAccount)
              );
              const diff = prevUserStableTokenBalance.sub(userStableTokenBalance);
              mocHelper.assertBigReserve(
                diff,
                scenario.expect.stableTokensToRedeem,
                'user stableToken balance is incorrect'
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
