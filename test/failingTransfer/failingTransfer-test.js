const { expectRevert } = require('openzeppelin-test-helpers');
const testHelperBuilder = require('../mocHelper.js');

let mocHelper;
let BUCKET_X2;
let reserveToken;
const DEPOSIT_FAILED = 'Token deposit failed on RRC20 Reserve token transfer';
const WITHDRAWAL_FAILED = 'Token withdrawal failed on RRC20 Reserve token transfer';

// Expected behaviour
const shouldRevertBasicFunctions = userAccount => {
  describe('WHEN a blacklisted user tries to mint RiskPro', function() {
    it('THEN the transaction reverts', async function() {
      const tx = mocHelper.mintRiskProAmount(userAccount, 1);

      await expectRevert(tx, DEPOSIT_FAILED);
    });
  });
  describe('WHEN a blacklisted user tries to mint StableToken', function() {
    it('THEN the transaction reverts', async function() {
      const tx = mocHelper.mintStableTokenAmount(userAccount, 1);

      await expectRevert(tx, DEPOSIT_FAILED);
    });
  });
  describe('WHEN a blacklisted user tries to mint RiskProx', function() {
    it('THEN the transaction reverts', async function() {
      const tx = mocHelper.mintRiskProxAmount(userAccount, BUCKET_X2, 1);

      await expectRevert(tx, DEPOSIT_FAILED);
    });
  });
  describe('WHEN a blacklisted user tries to redeem RiskPro', function() {
    it('THEN the transaction reverts', async function() {
      const tx = mocHelper.redeemRiskPro(userAccount, 1);

      await expectRevert(tx, WITHDRAWAL_FAILED);
    });
  });
  describe('WHEN a blacklisted user tries to redeem StableToken', function() {
    it('THEN the transaction reverts', async function() {
      const tx = mocHelper.redeemFreeStableToken({ userAccount, stableTokenAmount: 1 });

      await expectRevert(tx, WITHDRAWAL_FAILED);
    });
  });
  describe('WHEN a blacklisted user tries to redeem RiskProx', function() {
    it('THEN the transaction reverts', async function() {
      const tx = mocHelper.redeemRiskProx(BUCKET_X2, userAccount, 1);

      await expectRevert(tx, WITHDRAWAL_FAILED);
    });
  });
};

const initializeScenario = async userAccount => {
  await mocHelper.mintRiskProAmount(userAccount, 100);
  await mocHelper.mintStableTokenAmount(userAccount, 10000);
  await mocHelper.mintRiskProxAmount(userAccount, BUCKET_X2, 10);
};

/** The goal of this test is to check the behaviour on transfer
 * and transferFrom revert or fail on the RRC20 token
 */
contract('MoC: Reverting Transfer on basic operations', function([owner, userAccount]) {
  before(async function() {
    const accounts = [owner, userAccount];
    mocHelper = await testHelperBuilder({ owner, accounts });
    ({ BUCKET_X2, reserveToken } = mocHelper);
  });

  describe('GIVEN all tokens can be minted and redeemed by the user', function() {
    before(async function() {
      await initializeScenario(userAccount);
    });

    describe('AND the reserveToken contract starts to fail with all transactions', function() {
      before(async function() {
        await reserveToken.setToFail(true);
      });
      after(async function() {
        await mocHelper.revertState();
      });

      shouldRevertBasicFunctions(userAccount);
    });
  });

  describe('AND the user gets blacklisted', function() {
    before(async function() {
      await reserveToken.blacklistAccount(userAccount);
    });

    shouldRevertBasicFunctions(userAccount);
  });
});
