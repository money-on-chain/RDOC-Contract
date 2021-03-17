const testHelperBuilder = require('../../mocHelper.js');

let mocHelper;
let toContractBN;

contract('MoC: StableToken Redeem on Settlement with commissions', function([
  owner,
  commissionsAccount,
  vendorAccount,
  ...accounts
]) {
  before(async function() {
    mocHelper = await testHelperBuilder({
      owner,
      accounts: [owner, commissionsAccount, vendorAccount, ...accounts],
      useMock: true
    });
    ({ toContractBN } = mocHelper);
    this.moc = mocHelper.moc;
    this.mocSettlement = mocHelper.mocSettlement;
    this.mockMocInrateChanger = mocHelper.mockMocInrateChanger;
    this.governor = mocHelper.governor;
    this.mocVendors = mocHelper.mocVendors;
  });
  describe('GIVEN there are commisions set and there are 3 users with stableToken redeem requests', function() {
    let prevCommissionsAccountReserveTokenBalance;
    let prevUserReserveTokenBalance;

    before(async function() {
      // Register vendor for test
      await mocHelper.registerVendor(vendorAccount, 0.01, owner);

      // Commission rates for test are set in functionHelper.js
      await this.mockMocInrateChanger.setCommissionRates(
        await mocHelper.getCommissionsArrayNonZero()
      );

      // set commissions address
      await this.mockMocInrateChanger.setCommissionsAddress(commissionsAccount);
      // update params
      await this.governor.executeChange(this.mockMocInrateChanger.address);

      const txTypeMintRiskPro = await mocHelper.mocInrate.MINT_RISKPRO_FEES_RESERVE();
      const txTypeMintStableToken = await mocHelper.mocInrate.MINT_STABLETOKEN_FEES_RESERVE();

      const usersAccounts = accounts.slice(0, 3);
      await Promise.all(
        usersAccounts.map(account =>
          mocHelper.mintRiskProAmount(account, 1000, vendorAccount, txTypeMintRiskPro)
        )
      );
      await Promise.all(
        usersAccounts.map(account =>
          mocHelper.mintStableTokenAmount(account, 10, vendorAccount, txTypeMintStableToken)
        )
      );
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

      prevUserReserveTokenBalance = toContractBN(await mocHelper.getReserveBalance(accounts[0]));
    });
    describe('WHEN the settlement is executed', function() {
      before(async function() {
        // Enabling Settlement
        await this.mocSettlement.setBlockSpan(1);
        await mocHelper.executeSettlement();
      });

      it('THEN commissions account increase balance by 0.000012 ReserveTokens', async function() {
        const reserveTokenBalance = toContractBN(
          await mocHelper.getReserveBalance(commissionsAccount)
        );
        const diff = reserveTokenBalance.sub(prevCommissionsAccountReserveTokenBalance);
        mocHelper.assertBigReserve(
          diff,
          '0.000012',
          'commissions account reserveToken balance is incorrect'
        );
      });
      it('THEN user account increase balance by 0.000996 ReserveTokens ', async function() {
        const usereserveTokenBalance = toContractBN(await mocHelper.getReserveBalance(accounts[0]));
        const diff = usereserveTokenBalance.sub(prevUserReserveTokenBalance);
        mocHelper.assertBigReserve(
          diff,
          '0.000996',
          'commissions account reserveToken balance is incorrect'
        );
      });
    });
  });
});
