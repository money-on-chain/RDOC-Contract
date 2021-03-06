const { expectRevert, constants } = require('openzeppelin-test-helpers');
const testHelperBuilder = require('../mocHelper.js');

const { ZERO_ADDRESS } = constants;

let mocHelper;

let toContractBN;

contract('MoC - MoCBurnout', function([
  owner,
  account1,
  burnout1,
  burnout2b,
  account2,
  burnout2,
  account3,
  burnout3,
  blacklisted
]) {
  before(async function() {
    const accounts = [
      owner,
      account1,
      burnout1,
      burnout2b,
      account2,
      burnout2,
      account3,
      burnout3,
      blacklisted
    ];
    mocHelper = await testHelperBuilder({ owner, accounts, useMock: true });
    this.moc = mocHelper.moc;
    this.mocBurnout = mocHelper.mocBurnout;
  });

  beforeEach(async function() {
    await mocHelper.revertState();
    ({ toContractBN } = mocHelper);
  });

  describe('Burnout complete process', function() {
    describe('GIVEN no burnout address was set', function() {
      it('THEN burnout queue size should be 0', async function() {
        const size = await this.mocBurnout.burnoutQueueSize();
        assert(size, 0, 'Burnout queue is not 0');
      });
    });
    describe('GIVEN an account has set his burnout address', function() {
      let tx;
      beforeEach(async function() {
        tx = await this.moc.setBurnoutAddress(burnout1, { from: account1 });
      });
      it('THEN an event is emmited', function() {
        const [event] = mocHelper.findEvents(tx, 'BurnoutAddressSet', { account: account1 });

        assert(event.burnoutAddress, burnout1, 'Address in event is incorrect');
      });
      describe('WHEN he set a burnout address again', function() {
        it('THEN his burnout address is replaced and queue size is still 1', async function() {
          await this.moc.setBurnoutAddress(burnout2b, { from: account1 });

          const burn1 = await this.moc.getBurnoutAddress({ from: account1 });
          assert(burn1, burnout2b, 'Burnout address is not correct');

          const size = await this.mocBurnout.burnoutQueueSize();
          assert(size, 1, 'Burnout queue size changed');
        });
      });
    });
    describe('GIVEN account1 have 6000 StableTokens, account2 have 4000 StableTokens, and account3 have none', function() {
      let burn1PrevBalance;
      let burn2PrevBalance;
      let burn3PrevBalance;
      beforeEach(async function() {
        await mocHelper.setReserveTokenPrice(10000 * mocHelper.MOC_PRECISION);
        await mocHelper.mintRiskProAmount(owner, 3);
        await mocHelper.mintStableTokenAmount(account1, 6000);
        await mocHelper.mintStableTokenAmount(account2, 4000);

        burn1PrevBalance = toContractBN(await mocHelper.getReserveBalance(burnout1));
        burn2PrevBalance = toContractBN(await mocHelper.getReserveBalance(burnout2));
        burn3PrevBalance = toContractBN(await mocHelper.getReserveBalance(burnout3));
      });
      describe('WHEN an account tries to set their burnout address to 0x0', function() {
        it('THEN reverts', async function() {
          const tx = this.moc.setBurnoutAddress(ZERO_ADDRESS, { from: account1 });
          await expectRevert.unspecified(tx);
        });
      });
      describe('AND all accounts sets their burnout addresses', function() {
        beforeEach(async function() {
          await this.moc.setBurnoutAddress(burnout1, { from: account1 });
          await this.moc.setBurnoutAddress(burnout2, { from: account2 });
          await this.moc.setBurnoutAddress(burnout3, { from: account3 });
        });
        it('THEN the addresses can be obtained and are the same as setted', async function() {
          const burn1 = await this.moc.getBurnoutAddress({ from: account1 });
          const burn2 = await this.moc.getBurnoutAddress({ from: account2 });
          const burn3 = await this.moc.getBurnoutAddress({ from: account3 });

          assert(burn1, burnout1, 'Burnout address is not correct');
          assert(burn2, burnout2, 'Burnout address is not correct');
          assert(burn3, burnout3, 'Burnout address is not correct');
        });
        describe('WHEN liquidation happens', function() {
          let tx;
          beforeEach(async function() {
            await mocHelper.setReserveTokenPrice(2000 * mocHelper.MOC_PRECISION);
            // Set 100 steps to liquidation, should be enough
            tx = await this.moc.evalLiquidation(100);
          });
          it('THEN both accounts have 0 stableTokens', async function() {
            const stableToken1 = await mocHelper.getStableTokenBalance(account1);
            const stableToken2 = await mocHelper.getStableTokenBalance(account2);
            const stableToken3 = await mocHelper.getStableTokenBalance(account3);

            mocHelper.assertBig(stableToken1, 0, 'StableToken balance is not zero');
            mocHelper.assertBig(stableToken2, 0, 'StableToken balance is not zero');
            mocHelper.assertBig(stableToken3, 0, 'StableToken balance is not zero');
          });
          it('THEN burnout address received the proportional ReserveTokens amount', async function() {
            const burn1FinalBalance = toContractBN(await mocHelper.getReserveBalance(burnout1));
            const burn2FinalBalance = toContractBN(await mocHelper.getReserveBalance(burnout2));
            const burn3FinalBalance = toContractBN(await mocHelper.getReserveBalance(burnout3));

            const diff1 = burn1FinalBalance.sub(burn1PrevBalance);
            const diff2 = burn2FinalBalance.sub(burn2PrevBalance);
            const diff3 = burn3FinalBalance.sub(burn3PrevBalance);

            mocHelper.assertBigReserve(diff1, 2.4, 'Burnout address one balance es incorrect');
            mocHelper.assertBigReserve(diff2, 1.6, 'Burnout address two balance es incorrect');
            mocHelper.assertBigReserve(diff3, 0, 'Burnout address three balance es incorrect');
          });
          it('THEN BurnoutExecuted event is emitted', async function() {
            const events = mocHelper.findEvents(tx, 'BurnoutExecuted');

            assert(events.length === 1, 'Event was not emmited');
          });
          it('THEN BurnoutAddressProcessed events should be emitted for each account', async function() {
            const events = mocHelper.findEvents(tx, 'BurnoutAddressProcessed');

            assert(events.length === 3, 'Events count emmited is not correct');
          });
        });
      });
    });
  });
  describe('DoS attack mitigation', function() {
    describe('GIVEN account1 have 6000 StableTokens, account2 have 2000 StableTokens, and account3 have 2000', function() {
      beforeEach(async function() {
        await mocHelper.setReserveTokenPrice(10000 * mocHelper.MOC_PRECISION);

        await mocHelper.mintRiskProAmount(owner, 3);
        await mocHelper.mintStableTokenAmount(account1, 6000);
        await mocHelper.mintStableTokenAmount(account2, 2000);
        await mocHelper.mintStableTokenAmount(account3, 2000);
      });
      describe('AND all accounts sets their burnout addresses being the account 2 a blacklisted one', function() {
        beforeEach(async function() {
          // Blacklisting account to make transfer revert
          await mocHelper.reserveToken.blacklistAccount(blacklisted);
          await this.moc.setBurnoutAddress(account1, { from: account1 });
          await this.moc.setBurnoutAddress(blacklisted, { from: account2 });
          await this.moc.setBurnoutAddress(account3, { from: account3 });
        });
        describe('WHEN liquidation happens', function() {
          let tx;
          beforeEach(async function() {
            await mocHelper.setReserveTokenPrice(2000 * mocHelper.MOC_PRECISION);
            tx = await this.moc.evalLiquidation(3); // 3 Steps should be enough
          });
          it('THEN tx should not revert', function() {
            assert(tx.receipt.status, '0x01', 'Transaction does not succed');
          });
          it('AND valid accounts get their StableTokens redeemed AND invalid accounts does not get their StableTokens redeemed', async function() {
            const stableToken1 = await mocHelper.getStableTokenBalance(account1);
            const stableToken2 = await mocHelper.getStableTokenBalance(account2);
            const stableToken3 = await mocHelper.getStableTokenBalance(account3);

            mocHelper.assertBigDollar(stableToken1, 0, 'StableToken balance is not zero');
            mocHelper.assertBigDollar(stableToken2, 2000, 'StableToken balance is not correct');
            mocHelper.assertBigDollar(stableToken3, 0, 'StableToken balance is not zero');
          });
        });
      });
    });
  });
});
