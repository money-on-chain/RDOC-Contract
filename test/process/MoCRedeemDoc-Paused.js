const { expectRevert } = require('openzeppelin-test-helpers');
const testHelperBuilder = require('../mocHelper.js');

const CONTRACT_IS_PAUSED = 'contract_is_paused';

let mocHelper;
let toContractBN;
const blockSpan = 41;

contract('MoC Paused', function([owner, userAccount, vendorAccount, ...accounts]) {
  before(async function() {
    mocHelper = await testHelperBuilder({
      owner,
      accounts: [owner, userAccount, vendorAccount, ...accounts],
      useMock: true
    });
    ({ toContractBN } = mocHelper);
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

  describe('StableToken Redeem', function() {
    describe(`GIVEN a user owns 1000 StableTokens, ReserveTokens price is 4000 USD, 1 ReserveTokens in Bucket blockSpan is ${blockSpan}`, function() {
      const from = userAccount;
      beforeEach(async function() {
        await mocHelper.setReserveTokenPrice(4000 * mocHelper.MOC_PRECISION);
        await mocHelper.mintRiskProAmount(from, 1, vendorAccount);
        await mocHelper.mintStableToken(from, 0.25, vendorAccount);
        await mocHelper.mockMoCSettlementChanger.setBlockSpan(blockSpan);
        await mocHelper.governor.executeChange(mocHelper.mockMoCSettlementChanger.address);
      });
      describe('WHEN he tries to redeem 2000 StableTokens', function() {
        describe(`AND MoC contract is paused before ${blockSpan} blocks`, function() {
          let userPreBalance;
          let centsToRedeem;
          beforeEach(async function() {
            userPreBalance = toContractBN(await mocHelper.getReserveBalance(userAccount));
            centsToRedeem = toContractBN(2000, 'USD');
            await this.moc.redeemStableTokenRequest(centsToRedeem, { from });

            await mocHelper.stopper.pause(mocHelper.moc.address);
            const paused = await mocHelper.moc.paused();
            assert(paused, 'MoC contract must be paused');

            await mocHelper.waitNBlocks(blockSpan);
          });
          it('THEN runSettlement is executed and must revert', async function() {
            await expectRevert(
              mocHelper.moc.runSettlement(blockSpan, { from: owner }),
              CONTRACT_IS_PAUSED
            );
          });
          describe(`AND MoC contract is paused before ${blockSpan} blocks`, function() {
            beforeEach(async function() {
              await mocHelper.stopper.unpause(mocHelper.moc.address);
              const paused = await mocHelper.moc.paused();
              assert(!paused, 'MoC contract must not be paused');
            });
            it('THEN all his 1000 StableTokens get redeemed', async function() {
              await mocHelper.moc.runSettlement(blockSpan, { from: owner });
              const userBalance = toContractBN(await mocHelper.getReserveBalance(userAccount));
              const balanceDiff = userPreBalance.sub(userBalance);
              mocHelper.assertBigReserve(
                balanceDiff,
                -0.25,
                'He should receive 0.25 ReserveTokens'
              );
              const stableTokenBalance = await mocHelper.getStableTokenBalance(userAccount);
              mocHelper.assertBigDollar(stableTokenBalance, 0, 'Should be 0');
            });
          });
        });
      });
    });
  });

  describe('GIVEN a user with 1000 StableToken, ReserveTokens Prices 4000 and a redeem position of 200', function() {
    describe('AND Moc Contract is paused', function() {
      const from = userAccount;
      const toMint = 0.25;
      beforeEach(async function() {
        await mocHelper.setReserveTokenPrice(toContractBN(4000 * mocHelper.MOC_PRECISION));
        await mocHelper.mintRiskProAmount(from, 1, vendorAccount);
        await mocHelper.mockMoCSettlementChanger.setBlockSpan(1);
        await mocHelper.governor.executeChange(mocHelper.mockMoCSettlementChanger.address);
        await mocHelper.stopper.pause(mocHelper.moc.address);
        const paused = await mocHelper.moc.paused();
        assert(paused, 'MoC contract must be paused');
      });
      it('THEN mintStableToken and redeemStableTokenRequest must revert', async function() {
        await expectRevert(
          mocHelper.mintStableToken(from, toMint, vendorAccount),
          CONTRACT_IS_PAUSED
        );
        await expectRevert(
          this.moc.redeemStableTokenRequest(toContractBN(200, 'USD'), {
            from
          }),
          CONTRACT_IS_PAUSED
        );
      });
      describe('WHEN MoC contract is unpaused it AND settlement is executed', function() {
        let toCancel;
        let tx;
        beforeEach(async function() {
          await mocHelper.stopper.unpause(mocHelper.moc.address);
          const paused = await mocHelper.moc.paused();
          assert(!paused, 'MoC contract must not be paused');

          await mocHelper.mintStableToken(from, toMint, vendorAccount);
          await this.moc.redeemStableTokenRequest(toContractBN(200, 'USD'), {
            from
          });

          await mocHelper.mintStableToken(accounts[2], toMint, vendorAccount);
          await this.moc.redeemStableTokenRequest(toContractBN(200, 'USD'), {
            from: accounts[2]
          });
          toCancel = toContractBN(200, 'USD');
          tx = await this.moc.alterRedeemRequestAmount(false, toCancel, { from });
        });
        it('THEN he still have his 1000 StableTokens', async function() {
          const expect = { redeemer: from };
          const r = await mocHelper.findEvents(tx, 'RedeemRequestAlter', expect);
          const [redeemEvent] = r;
          mocHelper.assertBigDollar(redeemEvent.delta, 200, 'Amount must be 200');

          const toRedeem = await this.moc.stableTokenAmountToRedeem(from);
          mocHelper.assertBigDollar(toRedeem, 0, 'Amount to redeem value is incorrrect');

          await this.moc.runSettlement(blockSpan, { from: owner });
          const stableTokenBalance = await mocHelper.getStableTokenBalance(from);
          mocHelper.assertBigDollar(stableTokenBalance, 1000, 'Balance must not change');
        });
      });
    });
  });
});
