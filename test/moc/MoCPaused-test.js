const { expectRevert } = require('openzeppelin-test-helpers');

const testHelperBuilder = require('../mocHelper.js');

const CONTRACT_IS_PAUSED = 'contract_is_paused';
const UNSTOPPABLE = 'unstoppable';
let mocHelper;
let toContractBN;
let BUCKET_X2;

const assertAllMintReedemMocHelperPausedFunctions = (userAccount, vendorAccount) => {
  const testFunctions = [
    { name: 'mintRiskPro', args: [userAccount, 10, vendorAccount] },
    { name: 'mintStableToken', args: [userAccount, 10000, vendorAccount] },
    /* {
      name: 'mintRiskProx',
      args: [userAccount, BUCKET_X2, toContractBN(10), vendorAccount, toContractBN(9000)]
    }, */
    { name: 'redeemFreeStableToken', args: [{ userAccount, stableTokenAmount: 3, vendorAccount }] },
    { name: 'redeemRiskPro', args: [userAccount, 10, vendorAccount] }
  ];

  // Get all tx promises
  const txs = testFunctions.map(func => mocHelper[func.name](...func.args));

  return Promise.all(txs.map(tx => expectRevert(tx, CONTRACT_IS_PAUSED)));
};

const assertAllMocPausedFunctions = (owner, userAccount, vendorAccount) => {
  const testFunctions = [
    { name: 'redeemRiskProxVendors', args: [BUCKET_X2, 3, vendorAccount] },
    { name: 'alterRedeemRequestAmount', args: [false, 100] },
    { name: 'runSettlement', args: [1] },
    { name: 'dailyInratePayment', args: [{ from: owner }] },
    { name: 'payRiskProHoldersInterestPayment', args: [{ from: owner }] }
  ];
  const txs = testFunctions.map(func => mocHelper.moc[func.name](...func.args));

  return Promise.all(txs.map(tx => expectRevert(tx, CONTRACT_IS_PAUSED)));
};

contract('MoC', function([owner, userAccount, vendorAccount]) {
  before(async function() {
    mocHelper = await testHelperBuilder({ owner, accounts: [owner, userAccount, vendorAccount] });
    ({ toContractBN } = mocHelper);
    this.moc = mocHelper.moc;
    this.governor = mocHelper.governor;
    this.stopper = mocHelper.stopper;
    ({ BUCKET_X2 } = mocHelper);
  });

  beforeEach(async function() {
    await mocHelper.revertState();

    // Register vendor for test
    await mocHelper.registerVendor(vendorAccount, 0, owner);

    await mocHelper.mintRiskPro(owner, 10);
    await mocHelper.mintStableToken(userAccount, 10000);
    await mocHelper.stopper.pause(mocHelper.moc.address);
    const paused = await mocHelper.moc.paused();
    assert(paused, 'MoC contract must be paused');
  });

  describe('GIVEN the MoC contract is paused', function() {
    describe('AND a user tries to do mint and reedem operations', function() {
      it('THEN all must revert', async function() {
        await assertAllMintReedemMocHelperPausedFunctions(userAccount, vendorAccount);
      });
    });
    describe('AND a user tries to do redeem operations', function() {
      it('THEN redeemRiskProx must revert', async function() {
        await assertAllMocPausedFunctions(owner, userAccount, vendorAccount);
      });
      it('THEN redeemStableTokenRequest must revert', async function() {
        await expectRevert(mocHelper.moc.redeemStableTokenRequest(100), CONTRACT_IS_PAUSED);
      });
    });
    describe('AND the MoC contract is unpaused', function() {
      beforeEach(async function() {
        await mocHelper.stopper.unpause(mocHelper.moc.address);
        const paused = await mocHelper.moc.paused();
        assert(!paused, 'MoC contract must not be paused');
      });
      it('THEN reedem FreeStableTokens must be executed', async function() {
        await mocHelper.redeemFreeStableToken({ userAccount, stableTokenAmount: 3, vendorAccount });
      });
      it('THEN mintRiskPro must be executed', async function() {
        mocHelper.mintRiskPro(owner, 10, vendorAccount);
      });
    });
  });

  describe('GIVEN a the MoC contract is unpaused', function() {
    describe('AND governor makes unstopable MoC', function() {
      it('THEN Moc.pause() must revert as unstoppable', async function() {
        await mocHelper.stopper.unpause(mocHelper.moc.address);
        await mocHelper.mockMocChanger.setStoppable(false);
        await mocHelper.governor.executeChange(mocHelper.mockMocChanger.address);
        await expectRevert(mocHelper.moc.pause(), UNSTOPPABLE);
      });
    });
  });
});
