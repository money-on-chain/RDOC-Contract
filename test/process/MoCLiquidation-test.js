const testHelperBuilder = require('../mocHelper.js');

const RiskPro = artifacts.require('./contracts/RiskProToken.sol');

let mocHelper;
let toContractBN;
let comAccountInitialBalance;
const BUCKET_X2 = web3.utils.asciiToHex('X2', 32);

const setCommissionAccount = async commissionAccount => {
  // set commissions address
  await mocHelper.mockMocInrateChanger.setCommissionsAddress(commissionAccount);
  // update params
  await mocHelper.governor.executeChange(mocHelper.mockMocInrateChanger.address);

  comAccountInitialBalance = await mocHelper.getReserveBalance(commissionAccount);
};

contract('MoC: Liquidation', function([
  owner,
  commissionAccount,
  userAccount,
  otherAccount,
  vendorAccount
]) {
  before(async function() {
    const accounts = [owner, commissionAccount, userAccount, otherAccount, vendorAccount];
    mocHelper = await testHelperBuilder({ owner, accounts });
    ({ toContractBN } = mocHelper);
    this.moc = mocHelper.moc;
    this.mocState = mocHelper.mocState;
    this.mocConnector = mocHelper.mocConnector;
    this.riskProx = mocHelper.riskProx;
    this.governor = mocHelper.governor;
    this.mockMoCBucketContainerChanger = mocHelper.mockMoCBucketContainerChanger;
    this.mockMocStateChanger = mocHelper.mockMocStateChanger;
  });

  beforeEach(async function() {
    await mocHelper.revertState();

    // Register vendor for test
    await mocHelper.registerVendor(vendorAccount, 0, owner);
  });

  describe('GIVEN there are RiskPros and StableTokens for a target coverage AND ReserveTokens price drops to 3400', function() {
    beforeEach(async function() {
      await mocHelper.mintRiskProAmount(userAccount, 1, vendorAccount);
      await mocHelper.mintStableTokenAmount(userAccount, 5000, vendorAccount);
      const liquidationReached = await this.mocState.isLiquidationReached();
      assert(!liquidationReached, 'Liquidation state should not be reached');
      await mocHelper.setReserveTokenPrice(3400 * mocHelper.MOC_PRECISION);

      // Enable liquidation
      await this.mockMocStateChanger.setLiquidationEnabled(true);
      await this.governor.executeChange(this.mockMocStateChanger.address);

      const state = await this.mocState.state();
      mocHelper.assertBig(state, 3, 'State should be AboveCobj');
    });
    [
      {
        name: 'mintStableTokenVendors',
        args: [1, vendorAccount],
        value: 0,
        event: 'StableTokenMint'
      },
      { name: 'mintRiskProVendors', args: [1, vendorAccount], value: 0, event: 'RiskProMint' },
      { name: 'redeemRiskProVendors', args: [1, vendorAccount], event: 'RiskProxRedeem' },
      /*  { name: 'mintRiskProxVendors', args: [BUCKET_X2, 0, vendorAccount], event: 'RiskProxMint' }, */
      // {
      //   name: 'redeemRiskProxVendors',
      //   args: [BUCKET_X2, 1, vendorAccount],
      //   event: 'RiskProxRedeem'
      // },
      { name: 'evalLiquidation', args: [] },
      { name: 'runSettlement', args: [100] }
    ].forEach(fn => {
      describe(`WHEN someone executes ${fn.name}`, function() {
        let tx;
        beforeEach(async function() {
          tx = await this.moc[fn.name](...fn.args, {
            from: otherAccount,
            value: fn.value ? fn.value * mocHelper.RESERVE_PRECISION : 0
          });
        });
        it('THEN Moc enters liquidation state', async function() {
          const state = await this.mocState.state();
          mocHelper.assertBig(state, 0, 'State should be Liquidated');
          if (fn.event) {
            const events = mocHelper.findEvents(tx, fn.event);
            assert.equal(events.length, 0, `There is no ${fn.event} action`);
          }
        });
      });
    });
    describe('WHEN liquidation State is met and MoC System is Stopped', function() {
      let evalLiquidationTx;

      beforeEach(async function() {
        await mocHelper.stopper.pause(mocHelper.moc.address);
        const paused = await mocHelper.moc.paused();
        assert(paused, 'Not paused');
        const liquidationReached = await this.mocState.isLiquidationReached();
        assert(liquidationReached, 'Liquidation state should be reached');
        evalLiquidationTx = await this.moc.evalLiquidation();
        const state = await this.mocState.state();
        mocHelper.assertBig(state, 0, 'State should be Liquidated');
      });
      it('THEN RiskPro is paused', async function() {
        const riskPro = await RiskPro.at(await this.mocConnector.riskProToken());
        assert.isTrue(await riskPro.paused(), 'RiskPro should be paused');
      });
      it('THEN ContractLiquidated event is emitted', async function() {
        const [contractLiquidatedEvent] = await mocHelper.findEvents(
          evalLiquidationTx,
          'ContractLiquidated'
        );

        assert(contractLiquidatedEvent, 'Event was not emitted');
      });
      it('THEN the user can redeem his StableTokens, receiving 1.3 ReserveTokens in return', async function() {
        const tx = await this.moc.redeemAllStableToken({ from: userAccount });
        const redeemEvent = mocHelper.findEvents(tx, 'StableTokenRedeem')[0];

        mocHelper.assertBigDollar(redeemEvent.amount, 5000, 'Incorrect StableToken amount');
        mocHelper.assertBigReserve(
          redeemEvent.reserveTotal,
          '1.470588235294117647',
          'Incorrect ReserveTokens amount',
          {
            significantDigits: 18
          }
        );

        mocHelper.assertBigDollar(redeemEvent.reservePrice, 3400, 'Incorrect ReserveTokens Price', {
          significantDigits: 17
        });
      });
    });

    describe('WHEN liquidation State is met', function() {
      beforeEach(async function() {
        const liquidationReached = await this.mocState.isLiquidationReached();
        assert(liquidationReached, 'Liquidation state should be reached');
        await setCommissionAccount(commissionAccount);
        await this.moc.evalLiquidation(); // 100 Steps should be enough
        const state = await this.mocState.state();
        mocHelper.assertBig(state, 0, 'State should be Liquidated');
      });
      it('THEN Commission Address receives the reserveToken remainder', async function() {
        const commissionBalance = await mocHelper.getReserveBalance(commissionAccount);
        const diff = toContractBN(commissionBalance).sub(toContractBN(comAccountInitialBalance));

        mocHelper.assertBigReserve(
          diff,
          '0.029411764705882353',
          'Commission account does not receive the correct value of reserveToken remainder'
        );
      });
      it('AND RiskPro is paused', async function() {
        const riskPro = await RiskPro.at(await this.mocConnector.riskProToken());
        assert.isTrue(await riskPro.paused(), 'RiskPro should be paused');
      });

      [10000, 2000, 100].forEach(reservePrice => {
        describe(`WHEN price goes to ${reservePrice}`, function() {
          it('THEN the user can redeem his StableTokens, receiving 1.5 ReserveTokens in return', async function() {
            await mocHelper.setReserveTokenPrice(reservePrice * mocHelper.MOC_PRECISION);

            const tx = await this.moc.redeemAllStableToken({ from: userAccount });
            const redeemEvent = mocHelper.findEvents(tx, 'StableTokenRedeem')[0];

            mocHelper.assertBigDollar(redeemEvent.amount, 5000, 'Incorrect StableToken amount');
            mocHelper.assertBigReserve(
              redeemEvent.reserveTotal,
              '1.470588235294117647',
              'Incorrect ReserveTokens amount',
              {
                significantDigits: 18
              }
            );

            mocHelper.assertBigDollar(
              redeemEvent.reservePrice,
              3400,
              'Incorrect ReserveTokens Price',
              {
                significantDigits: 17
              }
            );
          });
        });
      });
    });
  });
});
