const { expectRevert } = require('openzeppelin-test-helpers');
const testHelperBuilder = require('../../mocHelper.js');

let mocHelper;
let toContractBN;

const { BN } = web3.utils;

contract('MoC: MoCExchange', function([owner, userAccount, commissionsAccount]) {
  before(async function() {
    const accounts = [owner, userAccount, commissionsAccount];
    mocHelper = await testHelperBuilder({ owner, accounts });
    ({ toContractBN } = mocHelper);
    this.moc = mocHelper.moc;
    this.mockMocInrateChanger = mocHelper.mockMocInrateChanger;
    this.governor = mocHelper.governor;
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

  describe('RiskPro minting with commissions', function() {
    const scenarios = [
      {
        params: {
          riskProToMint: 1000
        },
        expect: {
          riskProToMint: 1000,
          riskProToMintOnReserveToken: 1000,
          // (riskProToMint * commissionRate = 0.002)
          commissionAmountReserveToken: 2,
          totalCostOnReserveToken: 1002
        }
      }
    ];
    scenarios.forEach(async scenario => {
      describe(`GIVEN ${scenario.params.riskProToMint} RiskPro are minted`, function() {
        let prevUsereserveTokenBalance;
        let prevUserRiskProBalance;
        let prevCommissionsAccountReserveTokenBalance;
        let prevMocReserveTokenBalance;
        beforeEach(async function() {
          prevUserRiskProBalance = await mocHelper.getRiskProBalance(userAccount);
          prevUsereserveTokenBalance = toContractBN(await mocHelper.getReserveBalance(userAccount));
          prevCommissionsAccountReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(commissionsAccount)
          );
          prevMocReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(this.moc.address)
          );
          const mintTx = await mocHelper.mintRiskProAmount(
            userAccount,
            scenario.params.riskProToMint
          );
          toContractBN(await mocHelper.getTxCost(mintTx));
        });
        it(`THEN the user has ${scenario.expect.riskProToMint} more RiskPros`, async function() {
          const UserRiskProBalance = await mocHelper.getRiskProBalance(userAccount);
          const diff = UserRiskProBalance.sub(prevUserRiskProBalance);
          mocHelper.assertBigReserve(
            diff,
            scenario.expect.riskProToMint,
            'user riskPro balance is incorrect'
          );
        });
        it(`THEN the user ReserveTokens balance has decrease by ${scenario.expect.riskProToMintOnReserveToken} ReserveTokens by Mint + ${scenario.expect.commissionAmountReserveToken} ReserveTokens by commissions`, async function() {
          const usereserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(userAccount)
          );
          const diff = prevUsereserveTokenBalance.sub(usereserveTokenBalance);
          mocHelper.assertBigReserve(
            diff,
            scenario.expect.totalCostOnReserveToken,
            'user ReserveTokens balance is incorrect'
          );
        });
        it('THEN global balance increases by the correct amount of ReserveTokens', async function() {
          const mocReserveTokenBalance = await mocHelper.getReserveBalance(this.moc.address);
          const diff = new BN(mocReserveTokenBalance).sub(new BN(prevMocReserveTokenBalance));

          mocHelper.assertBigReserve(
            diff,
            scenario.expect.riskProToMintOnReserveToken,
            'Should increase sale total amount'
          );
        });
        it(`THEN the commissions account reserveToken balance has increase by ${scenario.expect.commissionAmountReserveToken} ReserveTokens`, async function() {
          const commissionsAccountReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(commissionsAccount)
          );
          const diff = commissionsAccountReserveTokenBalance.sub(
            prevCommissionsAccountReserveTokenBalance
          );
          mocHelper.assertBigReserve(
            diff,
            scenario.expect.commissionAmountReserveToken,
            'commissions account balance is incorrect'
          );
        });
      });
    });
    describe('GIVEN since the user sends not enough amount to pay comission', function() {
      it('WHEN a user tries to mint RiskPros with all his allowance and does not send to pay commission', async function() {
        const allowance = await mocHelper.getReserveAllowance(userAccount);
        const mintRiskPro = mocHelper.mintRiskPro(userAccount, allowance);
        await expectRevert.unspecified(mintRiskPro);
      });
    });
  });
});
