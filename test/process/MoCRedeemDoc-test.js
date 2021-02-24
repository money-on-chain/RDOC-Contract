const { expectRevert } = require('openzeppelin-test-helpers');
const testHelperBuilder = require('../mocHelper.js');

const StableToken = artifacts.require('./contracts/StableToken.sol');

let mocHelper;
let toContractBN;
let BUCKET_C0;

contract('MoC', function([owner, userAccount, blacklisted, vendorAccount, ...allAccounts]) {
  const accounts = allAccounts.slice(0, 9);
  // FIXME: This number is pretty tricky, ganache-cli will mint blocks on every operation
  // so it could happen that when adding transacctions in middle of the test,
  // the blockspan should be adjusted
  const blockSpan = 100;

  before(async function() {
    mocHelper = await testHelperBuilder({
      owner,
      accounts: [owner, userAccount, blacklisted, vendorAccount, ...accounts],
      useMock: true
    });
    ({ toContractBN, BUCKET_C0 } = mocHelper);
    this.moc = mocHelper.moc;
    this.mocState = mocHelper.mocState;
    this.mocConnector = mocHelper.mocConnector;
    this.mocSettlement = mocHelper.mocSettlement;
    this.mockMoCSettlementChanger = mocHelper.mockMoCSettlementChanger;
    this.governor = mocHelper.governor;
    this.mockMoCVendorsChanger = mocHelper.mockMoCVendorsChanger;
  });

  beforeEach(async function() {
    await mocHelper.revertState();

    // Register vendor for test
    await this.mockMoCVendorsChanger.setVendorsToRegister(
      await mocHelper.getVendorToRegisterAsArray(vendorAccount, 0)
    );
    await this.governor.executeChange(this.mockMoCVendorsChanger.address);
  });

  describe('StableToken Redeem DoS attack mitigation', function() {
    describe('GIVEN an honest user adds a StableToken redeem request for 1000 StableTokens AND a blacklisted account adds a request for 100 StableTokens', function() {
      const from = userAccount;
      beforeEach(async function() {
        await mocHelper.setReserveTokenPrice(10000 * mocHelper.MOC_PRECISION);

        await mocHelper.mintRiskProAmount(owner, 3, vendorAccount);
        await mocHelper.mintStableTokenAmount(from, 1000, vendorAccount);
        await mocHelper.redeemStableTokenRequest(from, 1000);
        // Account is not yet blacklisted. Mints stableTokens and adds redeem requests
        await mocHelper.mintStableTokenAmount(blacklisted, 1000, vendorAccount);
        await mocHelper.redeemStableTokenRequest(blacklisted, 1000, vendorAccount);
        // Gets blacklisted
        await mocHelper.reserveToken.blacklistAccount(blacklisted);

        // Enabling Settlement
        await mocHelper.mockMoCSettlementChanger.setBlockSpan(1);
        await mocHelper.governor.executeChange(mocHelper.mockMoCSettlementChanger.address);
      });

      describe('WHEN a settlement is run', function() {
        beforeEach(async function() {
          await mocHelper.executeSettlement();
        });
        it('AND the queue is empty', async function() {
          const redeemQueueSize = await this.moc.redeemQueueSize();

          mocHelper.assertBig(redeemQueueSize, 0, 'The redeem queue is not empty');
        });
        it('AND the honest user gets redeemed AND the attacker dont', async function() {
          const finalHonestStableTokenBalance = await mocHelper.getStableTokenBalance(userAccount);
          const finalAttackerBalance = await mocHelper.getStableTokenBalance(blacklisted);

          mocHelper.assertBig(
            finalHonestStableTokenBalance,
            0,
            'Honest StableToken balance should be zero'
          );
          mocHelper.assertBigDollar(
            finalAttackerBalance,
            1000,
            'Attackers StableToken balance should be 1000'
          );
        });
      });
    });
  });

  describe('StableToken Redeem', function() {
    describe(`GIVEN a user owns 1000 StableTokens, ReserveTokens price is 4000 USD, there is 1 ReserveTokens in Bucket 0 AND blockSpan is ${blockSpan}`, function() {
      const from = userAccount;
      beforeEach(async function() {
        await mocHelper.setReserveTokenPrice(4000 * mocHelper.MOC_PRECISION);
        await mocHelper.mintRiskProAmount(from, 1, vendorAccount);
        await mocHelper.mintStableToken(from, 0.25, vendorAccount);
        await mocHelper.mockMoCSettlementChanger.setBlockSpan(blockSpan);
        await mocHelper.governor.executeChange(mocHelper.mockMoCSettlementChanger.address);
      });
      it(`THEN blockSpan should be ${blockSpan}`, async function() {
        const actualBlockSpan = await this.mocSettlement.getBlockSpan();
        await mocHelper.assertBig(actualBlockSpan, blockSpan, 'Should be what we set it to be');
      });
      describe('WHEN a user tries to get element 1 of an empty queue', function() {
        it('THEN it reverts', async function() {
          const getRedeemRequestAtPromise = this.moc.getRedeemRequestAt(1);
          await expectRevert.unspecified(getRedeemRequestAtPromise);
        });
      });
      describe('WHEN he tries to redeem 2000 StableTokens', function() {
        describe(`AND after ${blockSpan} blocks, the settlement is executed`, function() {
          let userPreBalance;
          beforeEach(async function() {
            userPreBalance = toContractBN(await mocHelper.getReserveBalance(userAccount));
            const centsToRedeem = toContractBN(2000 * mocHelper.MOC_PRECISION);
            await this.moc.redeemStableTokenRequest(centsToRedeem, { from });

            await mocHelper.waitNBlocks(blockSpan);
            await mocHelper.executeSettlement();
          });
          it('THEN all his 1000 StableTokens get redeemed', async function() {
            const userBalance = toContractBN(await mocHelper.getReserveBalance(userAccount));
            const balanceDiff = userPreBalance.sub(userBalance);
            mocHelper.assertBigReserve(balanceDiff, -0.25, 'He should receive 0.25 ReserveTokens');
            const stableTokenBalance = await mocHelper.getStableTokenBalance(userAccount);
            mocHelper.assertBigDollar(stableTokenBalance, 0, 'Should be 0');
          });
          it('AND amount to redeem value should be 0', async function() {
            const toRedeem = await this.moc.stableTokenAmountToRedeem(from);
            mocHelper.assertBigDollar(toRedeem, 0, 'Amount to redeem value is incorrect');
          });
        });
      });
      describe('WHEN he push a 400 StableTokens redeem request', function() {
        describe(`AND ${blockSpan} blocks are mined`, function() {
          let userPreBalance;
          let c0PrevStableTokenBalance;
          let c0PrevReserveTokenBalance;
          beforeEach(async function() {
            userPreBalance = toContractBN(await mocHelper.getReserveBalance(userAccount));

            c0PrevStableTokenBalance = await this.mocState.getBucketNStableToken(BUCKET_C0);
            c0PrevReserveTokenBalance = await this.mocState.getBucketNReserve(BUCKET_C0);
            const tx = await this.moc.redeemStableTokenRequest(toContractBN(400, 'USD'), { from });
            const redeemQueueSize = await this.moc.redeemQueueSize();
            mocHelper.assertBig(redeemQueueSize, 1, 'Size should be one');
            const redeemRequest = await this.moc.getRedeemRequestAt(0);
            assert.equal(redeemRequest[0], from, 'Redeemer should be sender');
            mocHelper.assertBigDollar(redeemRequest[1], 400, 'Redeem amount should be 400');

            // Redeem StableToken Request should emit an Event
            const [redeemEvent] = await mocHelper.findEvents(tx, 'RedeemRequestAlter');
            mocHelper.assertBigDollar(redeemEvent.delta, 400, 'Event amount should be 400');

            await mocHelper.waitNBlocks(blockSpan);
          });
          describe('AND settlement is executed', function() {
            it('THEN he receives 0.1 ReserveTokens, his StableToken balance is 600 AND redeemQueue is empty', async function() {
              const settlementTx = await mocHelper.executeSettlement();
              const redeemQueueSizeAfter = await this.moc.redeemQueueSize();
              mocHelper.assertBig(
                redeemQueueSizeAfter,
                0,
                'After settlement, queue should be empty'
              );

              // Settlement should be disabled
              const isSettlementEnable = await this.moc.isSettlementEnabled();
              assert.isFalse(isSettlementEnable, 'Settlement should be disabled');
              // Settlement execution should emit an Event
              const [event] = await mocHelper.findEvents(
                settlementTx,
                'SettlementRedeemStableToken'
              );
              mocHelper.assertBig(event.queueSize, 1, 'Queue size should be one');
              mocHelper.assertBigDollar(
                event.reservePrice,
                4000,
                'ReserveToken Price should not had changed'
              );
              // Assert RedeemRequestProcessed Event as well
              const expect = { redeemer: from };
              const [redeemEvent] = await mocHelper.findEvents(
                settlementTx,
                'RedeemRequestProcessed',
                expect
              );
              mocHelper.assertBigDollar(redeemEvent.amount, 400, 'Amount should be 400');

              // User post settlement balances should have changed
              const userBalance = toContractBN(await mocHelper.getReserveBalance(userAccount));
              const balanceDiff = userPreBalance.sub(userBalance);
              mocHelper.assertBigReserve(balanceDiff, -0.1, 'He should receive 0.1 ReserveTokens');
              const stableTokenBalance = await mocHelper.getStableTokenBalance(userAccount);
              mocHelper.assertBigDollar(stableTokenBalance, 600, 'Should be 1000 - 400');

              // If he places a second redeem request
              await this.moc.redeemStableTokenRequest(toContractBN(200 * mocHelper.MOC_PRECISION), {
                from
              });
              const newRedeemQueueSize = await this.moc.redeemQueueSize();
              mocHelper.assertBig(newRedeemQueueSize, 1, 'New size should be one');
              const newStableTokenBalance = await mocHelper.getStableTokenBalance(userAccount);
              mocHelper.assertBigDollar(
                newStableTokenBalance,
                600,
                'StableToken Balance should not be affected'
              );
            });

            it('AND the C0 contract balances decreases on 0.1 ReserveTokens and 600 StableTokens', async function() {
              await mocHelper.executeSettlement();
              const c0ReserveTokenBalance = await this.mocState.getBucketNReserve(BUCKET_C0);
              const reserveTokenDiff = c0ReserveTokenBalance.sub(c0PrevReserveTokenBalance);
              mocHelper.assertBigReserve(
                reserveTokenDiff,
                -0.1,
                'C0 ReserveTokens amount should decrease 0.1 ReserveTokens'
              );
              const c0StableTokenBalance = await this.mocState.getBucketNStableToken(BUCKET_C0);
              const stableTokenDiff = c0StableTokenBalance.sub(c0PrevStableTokenBalance);
              mocHelper.assertBigDollar(
                stableTokenDiff,
                -400,
                'C0 ReserveTokens amount should decrease 400 StableToken'
              );
            });
          });
          describe('AND he then transfers 800 StableTokens to someone else', function() {
            it('THEN when settlement is executed, the redeem only fills 200 StableTokens', async function() {
              const stableToken = await StableToken.at(await this.mocConnector.stableToken());
              await stableToken.transfer(accounts[2], toContractBN(800 * mocHelper.MOC_PRECISION), {
                from
              });
              const userBalance = toContractBN(await mocHelper.getReserveBalance(userAccount));

              // Assert Amount to redeem function
              const toRedeem = await this.moc.stableTokenAmountToRedeem(from);
              mocHelper.assertBigDollar(toRedeem, 400, 'Amount to redeem value is incorrect');

              // Settlement is run
              const tx = await mocHelper.executeSettlement();
              // Assert SettlementRedeemStableToken Event
              const [redeemEvent] = await mocHelper.findEvents(tx, 'SettlementRedeemStableToken');
              mocHelper.assertBig(redeemEvent.queueSize, 1, 'Queue size should be one');

              // Assert RedeemRequestProcessed Event
              const expect = { redeemer: from };
              const [redeemProcEvent] = await mocHelper.findEvents(
                tx,
                'RedeemRequestProcessed',
                expect
              );
              mocHelper.assertBigDollar(redeemProcEvent.amount, 200, 'Amount should be 200');

              // User post settlement balances should have changed the total of the redemption
              const userPostSettlementBalance = toContractBN(
                await mocHelper.getReserveBalance(userAccount)
              );
              const balanceDiff = userBalance.sub(userPostSettlementBalance);
              mocHelper.assertBigReserve(
                balanceDiff,
                -0.05,
                'He should receive 0.05 ReserveTokens'
              );
              const stableTokenBalance = await mocHelper.getStableTokenBalance(userAccount);
              mocHelper.assertBigDollar(stableTokenBalance, 0, 'Should be 1000-800-200 = 0 left');

              // Other user balance should not be affected
              const otherUserStableTokenBalance = await mocHelper.getStableTokenBalance(
                accounts[2]
              );
              mocHelper.assertBigDollar(otherUserStableTokenBalance, 800, 'Should be 800');
            });
          });
        });
      });
    });
  });

  describe('StableToken Redeem Alter', function() {
    describe('GIVEN a user with 1000 StableToken and a redeem position of 200', function() {
      const from = userAccount;
      beforeEach(async function() {
        await mocHelper.setReserveTokenPrice(toContractBN(4000 * mocHelper.MOC_PRECISION));
        await mocHelper.mintRiskProAmount(from, 1, vendorAccount);
        const toMint = 0.25;
        await mocHelper.mintStableToken(from, toMint, vendorAccount);
        await this.moc.redeemStableTokenRequest(toContractBN(200 * mocHelper.MOC_PRECISION), {
          from
        });

        // Add other redeemer
        await mocHelper.mintStableToken(accounts[2], toMint, vendorAccount);
        await this.moc.redeemStableTokenRequest(toContractBN(200 * mocHelper.MOC_PRECISION), {
          from: accounts[2]
        });

        await mocHelper.mockMoCSettlementChanger.setBlockSpan(1);
        await mocHelper.governor.executeChange(mocHelper.mockMoCSettlementChanger.address);
      });
      describe('WHEN another user without position tries to cancel', function() {
        it('THEN tx reverts', async function() {
          const toCancel = toContractBN(200 * mocHelper.MOC_PRECISION);
          const tx = this.moc.alterRedeemRequestAmount(false, toCancel, { from: accounts[1] });
          expectRevert(tx, 'This is not an active redeemer');
        });
      });
      describe('WHEN another user without position tries to use alter to add it', function() {
        it('THEN tx reverts', async function() {
          const toCancel = toContractBN(200 * mocHelper.MOC_PRECISION);
          const tx = this.moc.alterRedeemRequestAmount(false, toCancel, { from: accounts[1] });
          expectRevert(tx, 'This is not an active redeemer');
        });
      });
      describe('WHEN he cancels it AND settlement is executed', function() {
        let toCancel;
        let tx;
        beforeEach(async function() {
          toCancel = toContractBN(200 * mocHelper.MOC_PRECISION);
          tx = await this.moc.alterRedeemRequestAmount(false, toCancel, { from });
        });
        it('THEN he still have his 1000 StableTokens', async function() {
          // Assert RedeemRequestAlter Event
          const expect = { redeemer: from };
          const r = await mocHelper.findEvents(tx, 'RedeemRequestAlter', expect);
          const [redeemEvent] = r;
          mocHelper.assertBigDollar(redeemEvent.delta, 200, 'Amount should be 200');

          // Assert Amount to redeem function
          const toRedeem = await this.moc.stableTokenAmountToRedeem(from);
          mocHelper.assertBigDollar(toRedeem, 0, 'Amount to redeem value is incorrect');

          await mocHelper.executeSettlement();
          const stableTokenBalance = await mocHelper.getStableTokenBalance(from);
          mocHelper.assertBigDollar(stableTokenBalance, 1000, 'Balance should not change');
        });
        it('AND other redeem requests are not affected', async function() {
          await mocHelper.executeSettlement();
          const stableTokenBalance = await mocHelper.getStableTokenBalance(accounts[2]);
          mocHelper.assertBigDollar(stableTokenBalance, 800, 'Balance should had decrease by 200');
        });
      });
      describe('WHEN he adds 300 more to redeem', function() {
        let tx;
        beforeEach(async function() {
          const toAdd = toContractBN(300 * mocHelper.MOC_PRECISION);
          tx = await this.moc.alterRedeemRequestAmount(true, toAdd, { from });
        });
        it('THEN his amount to redeem should be 500', async function() {
          const toRedeem = await this.moc.stableTokenAmountToRedeem(from);
          mocHelper.assertBigDollar(toRedeem, 500, 'Amount to redeem value is incorrect');
        });
        it('AND RedeemRequestAlter has change in 300', async function() {
          // Assert RedeemRequestAlter Event
          const expect = { redeemer: from, isAddition: false };
          const r = await mocHelper.findEvents(tx, 'RedeemRequestAlter', expect);
          const [redeemEvent] = r;
          mocHelper.assertBigDollar(redeemEvent.delta, 300, 'Delta Amount should be 300');
        });
        describe('AND settlement is run', function() {
          it('THEN his StableToken balance is 500', async function() {
            await mocHelper.executeSettlement();
            const stableTokenBalance = await mocHelper.getStableTokenBalance(from);
            mocHelper.assertBigDollar(stableTokenBalance, 500, 'Remaining should be 1000-200-300');
          });
        });
      });
      describe('AND puts a new redeem position of 300', function() {
        let tx;
        const alterExecAssert = (cancelAmount, expectBalance) =>
          async function() {
            const toCancel = toContractBN(cancelAmount * mocHelper.MOC_PRECISION);
            tx = await this.moc.alterRedeemRequestAmount(false, toCancel, { from });
            await mocHelper.executeSettlement();
            const stableTokenBalance = await mocHelper.getStableTokenBalance(from);
            mocHelper.assertBigDollar(
              stableTokenBalance,
              expectBalance,
              'Incorrect balance after redeem'
            );
          };
        beforeEach(async function() {
          await this.moc.redeemStableTokenRequest(toContractBN(300 * mocHelper.MOC_PRECISION), {
            from
          });
        });
        describe('WHEN he cancels 400', function() {
          it('THEN he redeem 100 DOCs', alterExecAssert(400, 900));
        });
        describe('WHEN he cancels 10000 (more than what he has)', function() {
          it('THEN does not redeem any DOCs', alterExecAssert(10000, 1000));
          it('AND RedeemRequestAlter change delta is just 500', async function() {
            // Assert RedeemRequestAlter Event
            const expect = { redeemer: from, isAddition: false };
            const r = await mocHelper.findEvents(tx, 'RedeemRequestAlter', expect);
            const [redeemEvent] = r;
            mocHelper.assertBigDollar(redeemEvent.delta, 500, 'Delta Amount should be 500');
          });
        });
      });
    });
  });
});
