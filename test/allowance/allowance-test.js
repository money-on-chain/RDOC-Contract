const { expectRevert } = require('openzeppelin-test-helpers');
const testHelperBuilder = require('../mocHelper.js');

let mocHelper;
let toContractBN;

contract('MoC: MoCExchange', function([owner, userAccount, vendorAccount]) {
  before(async function() {
    mocHelper = await testHelperBuilder({ owner, accounts: [owner, vendorAccount] });
    ({ toContractBN } = mocHelper);
  });

  beforeEach(function() {
    return mocHelper.revertState();
  });

  describe('GIVEN a user have a balance of 100000 reserve tokens and there are StableTokens and RiskPro available', function() {
    beforeEach(async function() {
      await mocHelper.claimReserveTokens(userAccount, toContractBN(1000, 'RES'));
      await mocHelper.mintRiskPro(owner, 100000, vendorAccount);
    });

    describe('WHEN he tries to mint RiskPro for 100 reserve tokens', function() {
      it('THEN transaction reverts for not having enough allowance', async function() {
        const tx = mocHelper.mintRiskPro(userAccount, 100, vendorAccount);
        await expectRevert(tx, 'amount is not enough');
      });
    });

    describe('WHEN he tries to mint StableTokens for 100 reserve tokens', function() {
      it('THEN transaction reverts for not having enough allowance', async function() {
        const tx = mocHelper.mintStableToken(userAccount, 100, vendorAccount);
        await expectRevert(tx, 'amount is not enough');
      });
    });

    describe('WHEN he gives Moc allowance for 2000 tokens of the reserve token', function() {
      beforeEach(async function() {
        await mocHelper.allowReserve(userAccount, toContractBN(2000, 'RES'));
      });

      it('THEN for MoC allowance for his balance is 2000', async function() {
        const mocAllowance = await mocHelper.getReserveAllowance(userAccount);

        mocHelper.assertBigReserve(
          mocAllowance,
          2000,
          'MoC allowance over users balance is incorrect'
        );
      });
      it('THEN his allowance for spending on MoC is 1000', async function() {
        const mocAllowance = await mocHelper.getMoCSystemAllowance(userAccount);

        mocHelper.assertBigReserve(mocAllowance, 1000, 'MoC system allowance is incorrect');
      });
      describe('THEN WHEN the user tries to mint RiskPro for 1500 reserve tokens', function() {
        it('THEN transaction reverts for not having enough allowance', async function() {
          const tx = mocHelper.mintRiskPro(userAccount, 1500, vendorAccount);
          await expectRevert(tx, 'amount is not enough');
        });
      });
      describe('THEN WHEN the user tries to mint Stable token for 1500 reserve tokens', function() {
        it('THEN transaction reverts for not having enough allowance', async function() {
          const tx = mocHelper.mintStableToken(userAccount, 1500, vendorAccount);
          await expectRevert(tx, 'amount is not enough');
        });
      });
    });

    describe('WHEN he gives Moc allowance for 500 tokens of the reserve token', function() {
      beforeEach(async function() {
        await mocHelper.allowReserve(userAccount, toContractBN(500, 'RES'));
      });

      it('THEN the MoC allowance for his balance is 500', async function() {
        const mocAllowance = await mocHelper.getReserveAllowance(userAccount);

        mocHelper.assertBigReserve(
          mocAllowance,
          500,
          'MoC allowance over users balance is incorrect'
        );
      });
      it('THEN his allowance for spending on MoC is 500', async function() {
        const mocAllowance = await mocHelper.getMoCSystemAllowance(userAccount);

        mocHelper.assertBigReserve(mocAllowance, 500, 'MoC system allowance is incorrect');
      });

      describe('AND WHEN he tries to mint RiskPro for 100 reserve tokens', function() {
        it('THEN he will mint successfully', async function() {
          await mocHelper.mintRiskPro(userAccount, 100, vendorAccount);
          const balances = await mocHelper.getUserBalances(userAccount);
          const allowedBalance = await mocHelper.getReserveAllowance(userAccount);

          mocHelper.assertBigDollar(balances.riskPro, 100, 'RiskPro balance is incorrect');
          mocHelper.assertBigReserve(balances.reserve, 900, 'Reserves balance is incorrect');
          mocHelper.assertBigReserve(allowedBalance, 400, 'Reserves balance is incorrect');
        });
      });
      describe('AND WHEN he tries to mint DOC for 100 reserve tokens', function() {
        it('THEN he will mint successfully', async function() {
          await mocHelper.mintStableToken(userAccount, 100, vendorAccount);
          const balances = await mocHelper.getUserBalances(userAccount);
          const allowedBalance = await mocHelper.getReserveAllowance(userAccount);

          mocHelper.assertBigDollar(balances.stable, 1000000, 'StableToken balance is incorrect');
          mocHelper.assertBigReserve(balances.reserve, 900, 'Reserves balance is incorrect');
          mocHelper.assertBigReserve(allowedBalance, 400, 'Reserves balance is incorrect');
        });
      });
      describe('THEN WHEN the user tries to mint RiskPro for 600 reserve tokens', function() {
        it('THEN transaction reverts for not having enough allowance', async function() {
          const tx = mocHelper.mintRiskPro(userAccount, 600, vendorAccount);
          await expectRevert(tx, 'amount is not enough');
        });
      });
      describe('THEN WHEN the user tries to mint StableToken for 600 reserve tokens', function() {
        it('THEN transaction reverts for not having enough allowance', async function() {
          const tx = mocHelper.mintStableToken(userAccount, 600, vendorAccount);
          await expectRevert(tx, 'amount is not enough');
        });
      });
    });
  });
});
