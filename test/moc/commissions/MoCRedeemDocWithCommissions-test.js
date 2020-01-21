const testHelperBuilder = require('../../mocHelper.js');

let mocHelper;
let toContractBN;

contract('MoC: StableToken Redeem on Settlement with commissions', function([
  owner,
  commissionsAccount,
  ...accounts
]) {
  before(async function() {
    mocHelper = await testHelperBuilder({
      owner,
      accounts: [owner, commissionsAccount, ...accounts],
      useMock: true
    });
    ({ toContractBN } = mocHelper);
    this.moc = mocHelper.moc;
    this.mocSettlement = mocHelper.mocSettlement;
  });
  describe('GIVEN there are commisions of 0.002 set and there are 3 users with stableToken redeem requests', function() {
    let prevCommissionsAccountReserveTokenBalance;
    let prevUsereserveTokenBalance;

    before(async function() {
      // set commissions rate
      await mocHelper.mockMocInrateChanger.setCommissionRate(0.002 * mocHelper.MOC_PRECISION);
      // set commissions address
      await mocHelper.mockMocInrateChanger.setCommissionsAddress(commissionsAccount);
      // update params
      await mocHelper.governor.executeChange(mocHelper.mockMocInrateChanger.address);

      const usersAccounts = accounts.slice(0, 3);
      await Promise.all(usersAccounts.map(account => mocHelper.mintRiskProAmount(account, 1000)));
      await Promise.all(usersAccounts.map(account => mocHelper.mintStableTokenAmount(account, 10)));
      await Promise.all(
        usersAccounts.map(account =>
          this.moc.redeemStableTokenRequest(toContractBN(10 * mocHelper.MOC_PRECISION), {
            from: account
          })
        )
      );

      prevCommissionsAccountReserveTokenBalance = toContractBN(
        await mocHelper.getReserveBalance(commissionsAccount)
      );

      prevUsereserveTokenBalance = toContractBN(await mocHelper.getReserveBalance(accounts[0]));
    });
    describe('WHEN the settlement is executed', function() {
      before(async function() {
        // Enabling Settlement
        await this.mocSettlement.setBlockSpan(1);
        await mocHelper.executeSettlement();
      });

      it('THEN commissions account increase balance by 0.000006 ReserveTokens', async function() {
        const reserveTokenBalance = toContractBN(
          await mocHelper.getReserveBalance(commissionsAccount)
        );
        const diff = reserveTokenBalance.sub(prevCommissionsAccountReserveTokenBalance);
        mocHelper.assertBigReserve(
          diff,
          '0.000006',
          'commissions account reserveToken balance is incorrect'
        );
      });
      it('THEN user account increase balance by 0.000998 ReserveTokens ', async function() {
        const usereserveTokenBalance = toContractBN(await mocHelper.getReserveBalance(accounts[0]));
        const diff = usereserveTokenBalance.sub(prevUsereserveTokenBalance);
        mocHelper.assertBigReserve(
          diff,
          '0.000998',
          'commissions account reserveToken balance is incorrect'
        );
      });
    });
  });
});
