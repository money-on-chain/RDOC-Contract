const testHelperBuilder = require('../../mocHelper.js');

let mocHelper;
let toContractBN;

contract('MoC: MoCExchange', function([owner, userAccount, commissionsAccount]) {
  before(async function() {
    const accounts = [owner, userAccount, commissionsAccount];
    mocHelper = await testHelperBuilder({ owner, accounts });
    ({ toContractBN } = mocHelper);
    this.moc = mocHelper.moc;
    this.mockMocInrateChanger = mocHelper.mockMocInrateChanger;
    this.governor = mocHelper.governor;
  });

  describe('RiskPro redeeming with commissions', function() {
    const scenarios = [
      {
        params: {
          riskProToMint: 100,
          riskProToRedeem: 100
        },
        expect: {
          // (riskProToMint * commissionRate = 0.002)
          riskProRedeemed: 100,
          // (riskProToRedeem) - (riskProToRedeem * commissionRate)
          riskProToRedeemOnReserveToken: 99.8,
          commissionAmountReserveToken: 0.2
        }
      },
      {
        params: {
          riskProToMint: 100,
          riskProToRedeem: 50
        },
        expect: {
          // (riskProToMint * commissionRate = 0.002)
          riskProRedeemed: 50,
          commissionAmountReserveToken: 0.1,
          // (riskProToRedeem) - (riskProToRedeem * commissionRate)
          riskProToRedeemOnReserveToken: 49.9
        }
      }
    ];
    let initialRiskProBalance;
    let prevCommissionAccountBalance;
    let prevUsereserveTokenBalance;
    scenarios.forEach(async scenario => {
      beforeEach(async function() {
        await mocHelper.revertState();
        // set commissions rate
        await mocHelper.mockMocInrateChanger.setCommissionRate(toContractBN(0.002, 'RAT'));
        // set commissions address
        await mocHelper.mockMocInrateChanger.setCommissionsAddress(commissionsAccount);
        // update params
        await mocHelper.governor.executeChange(mocHelper.mockMocInrateChanger.address);

        await mocHelper.mintRiskProAmount(userAccount, scenario.params.riskProToMint);

        initialRiskProBalance = await mocHelper.getRiskProBalance(userAccount);
        prevCommissionAccountBalance = toContractBN(
          await mocHelper.getReserveBalance(commissionsAccount)
        );
        prevUsereserveTokenBalance = toContractBN(await mocHelper.getReserveBalance(userAccount));
      });

      describe(`WHEN he tries to redeem ${scenario.params.riskProToRedeem} RiskPros`, function() {
        it(`THEN the user has ${scenario.expect.riskProToRedeemOnReserveToken} more reserveToken`, async function() {
          await mocHelper.redeemRiskPro(userAccount, scenario.params.riskProToRedeem);

          const usereserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(userAccount)
          );
          const diff = usereserveTokenBalance.sub(prevUsereserveTokenBalance);
          mocHelper.assertBigReserve(
            diff,
            scenario.expect.riskProToRedeemOnReserveToken,
            'user reserveToken balance is incorrect'
          );
        });
        it('THEN he receives only the max redeem amount', async function() {
          await mocHelper.redeemRiskPro(userAccount, scenario.params.riskProToRedeem);

          const riskProBalance = await mocHelper.getRiskProBalance(userAccount);
          const balanceDiff = initialRiskProBalance.sub(riskProBalance);

          mocHelper.assertBigReserve(
            balanceDiff,
            scenario.expect.riskProRedeemed,
            'The redemption riskPro amount was incorrect'
          );
        });
        it(`THEN commission account balance increase by ${scenario.expect.commissionAmountReserveToken} ReserveTokens`, async function() {
          await mocHelper.redeemRiskPro(userAccount, scenario.params.riskProToRedeem);

          const reserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(commissionsAccount)
          );
          const balanceDiff = reserveTokenBalance.sub(prevCommissionAccountBalance);

          mocHelper.assertBigReserve(
            balanceDiff,
            scenario.expect.commissionAmountReserveToken,
            'The commission account balance is incorrect'
          );
        });
      });
    });
  });
});
