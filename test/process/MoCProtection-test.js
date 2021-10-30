const { expectRevert } = require('openzeppelin-test-helpers');
const BigNumber = require('bignumber.js');
const testHelperBuilder = require('../mocHelper.js');

let mocHelper;

contract('MoC: Protection mode', function([owner, userAccount, otherAccount, vendorAccount]) {
  before(async function() {
    const accounts = [owner, userAccount, otherAccount, vendorAccount];
    mocHelper = await testHelperBuilder({ owner, accounts });
    this.moc = mocHelper.moc;
    this.mocState = mocHelper.mocState;
    this.mocConnector = mocHelper.mocConnector;
    this.riskProx = mocHelper.riskProx;
  });

  beforeEach(async function() {
    await mocHelper.revertState();

    // Register vendor for test
    await mocHelper.registerVendor(vendorAccount, 0, owner);
  });

  describe('GIVEN there are RiskPros and StableTokens for a target coverage AND Reserve price drops to 3400', function() {
    beforeEach(async function() {
      await mocHelper.mintRiskProAmount(userAccount, 1, vendorAccount);
      await mocHelper.mintStableTokenAmount(userAccount, 5000, vendorAccount);
      const liquidationReached = await this.mocState.isLiquidationReached();
      assert(!liquidationReached, 'Liquidation state should not be reached');
      await mocHelper.setReserveTokenPrice(3400 * mocHelper.MOC_PRECISION);

      const state = await this.mocState.state();
      mocHelper.assertBig(state, 3, 'State should be AboveCobj');
    });
    [
      { name: 'mintRiskProVendors', args: [1, vendorAccount], value: 0, event: 'RiskProMint' },
      {
        name: 'redeemFreeStableTokenVendors',
        args: [1, vendorAccount],
        event: 'FreeStableTokenRedeem'
      }
    ].forEach(fn => {
      describe(`WHEN someone executes ${fn.name}`, function() {
        let tx;
        it('THEN Moc enters protected mode', async function() {
          const coverage = await this.mocState.globalCoverage();
          const _protected = await this.mocState.getProtected();
          const expected = new BigNumber(coverage).lt(new BigNumber(_protected));

          assert(expected === true, 'coverage should be below protected threshold');
        });
        it(`${fn.name} cannot be executed because MoC is in protected mode`, async function() {
          tx = this.moc[fn.name](...fn.args, {
            from: otherAccount,
            value: fn.value ? fn.value * mocHelper.RESERVE_PRECISION : 0
          });

          await expectRevert(tx, 'Function cannot be called at protection mode');
        });
      });
    });
  });
});
