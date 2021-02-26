const { expectRevert } = require('openzeppelin-test-helpers');
const testHelperBuilder = require('../mocHelper.js');

let mocHelper;
let toContractBN;

const NOT_AUTHORIZED_CHANGER = 'not_authorized_changer';
// eslint-disable-next-line quotes
const INVALID_TXTYPE_ERROR = "Invalid transaction type 'txType'";

const scenario = {
  riskProxTmin: 4,
  riskProxTmax: 7777777,
  riskProxPower: 7,
  riskProInterestBlockSpan: 50 * 80 * 12,
  riskProRate: 78,
  reserveAmount: 20,
  commissionAmount: 0.04,
  invalidTxType: 0,
  validTxType: 2,
  nonexistentTxType: 15,
  commissionAmountZero: 0
};

contract('MoCInrate Governed', function([owner, account2, vendorAccount]) {
  before(async function() {
    mocHelper = await testHelperBuilder({ owner });
    ({ toContractBN } = mocHelper);
    this.mocInrate = mocHelper.mocInrate;
    this.governor = mocHelper.governor;
    this.mockMocInrateChanger = mocHelper.mockMocInrateChanger;
    this.mockMoCVendorsChanger = mocHelper.mockMoCVendorsChanger;
  });

  beforeEach(async function() {
    await mocHelper.revertState();

    // Register vendor for test
    await this.mockMoCVendorsChanger.setVendorsToRegister(
      await mocHelper.getVendorToRegisterAsArray(vendorAccount, 0.01)
    );
    await this.governor.executeChange(this.mockMoCVendorsChanger.address);

    // Commission rates for test are set in functionHelper.js
    await mocHelper.mockMocInrateChanger.setCommissionRates(
      await mocHelper.getCommissionsArrayNonZero()
    );
    await this.governor.executeChange(this.mockMocInrateChanger.address);
  });

  describe('MoCInrate settings params', function() {
    describe('GIVEN the default tMin (RiskProx)', function() {
      it(`THEN an unauthorized account ${account2} tries to change btxcTmin to ${scenario.riskProxTmin}`, async function() {
        try {
          await this.mocInrate.setRiskProxTmin(scenario.riskProxTmin, { from: account2 });
        } catch (err) {
          assert(
            NOT_AUTHORIZED_CHANGER === err.reason,
            `${account2} Should not be authorized to set btxcTmin`
          );
        }
      });
      it(`THEN an authorized contract tries to change btxcTmin to ${scenario.riskProxTmin}`, async function() {
        await this.mockMocInrateChanger.setRiskProxTmin(scenario.riskProxTmin);
        await this.governor.executeChange(this.mockMocInrateChanger.address);
        const newPeg = await this.mocInrate.getRiskProxTmin();
        mocHelper.assertBig(
          newPeg,
          scenario.riskProxTmin,
          `tMin (RiskProx) should be ${scenario.riskProxTmin}`
        );
      });
    });

    describe('GIVEN the default tMax (RiskProx)', function() {
      it(`THEN an unauthorized account ${account2} tries to change btxcTmax to ${scenario.riskProxTmax}`, async function() {
        try {
          await this.mocInrate.setRiskProxTmax(scenario.riskProxTmax, { from: account2 });
        } catch (err) {
          assert(
            NOT_AUTHORIZED_CHANGER === err.reason,
            `${account2} Should not be authorized to set riskProxTmax`
          );
        }
      });
      it(`THEN an authorized contract tries to change riskProxTmax to ${scenario.riskProxTmax}`, async function() {
        await this.mockMocInrateChanger.setRiskProxTmax(scenario.riskProxTmax);
        await this.governor.executeChange(this.mockMocInrateChanger.address);
        const newRiskProxTmax = await this.mocInrate.getRiskProxTmax();
        mocHelper.assertBig(
          newRiskProxTmax,
          scenario.riskProxTmax,
          `tMax (RiskProx) should be ${scenario.riskProxTmax}`
        );
      });
    });

    describe('GIVEN the default power (RiskProx)', function() {
      it(`THEN an unauthorized account ${account2} tries to change riskProxPower to ${scenario.riskProxPower}`, async function() {
        try {
          await this.mocInrate.setRiskProxPower(scenario.riskProxPower, { from: account2 });
        } catch (err) {
          assert(
            NOT_AUTHORIZED_CHANGER === err.reason,
            `${account2} Should not be authorized to set riskProxPower`
          );
        }
      });
      it(`THEN an authorized contract tries to change riskProxPower to ${scenario.riskProxPower}`, async function() {
        await this.mockMocInrateChanger.setRiskProxPower(scenario.riskProxPower);
        await this.governor.executeChange(this.mockMocInrateChanger.address);
        const newRiskProxPower = await this.mocInrate.getRiskProxPower();
        mocHelper.assertBig(
          newRiskProxPower,
          scenario.riskProxPower,
          `power (RiskProx) should be ${scenario.riskProxPower}`
        );
      });
    });

    describe('GIVEN different transaction types and their fees to calculate commission rate (calcCommissionValue)', function() {
      it(`THEN transaction type ${scenario.invalidTxType} is invalid`, async function() {
        try {
          const newCommisionRateInvalidTxType = await this.mocInrate.calcCommissionValue(
            (scenario.reserveAmount * mocHelper.MOC_PRECISION).toString(),
            scenario.invalidTxType
          );
          assert(newCommisionRateInvalidTxType === null, 'This should not happen');
        } catch (err) {
          assert(
            err.message.search(INVALID_TXTYPE_ERROR) >= 0,
            `Transaction type ${scenario.invalidTxType} is invalid`
          );
        }
      });
      it(`THEN transaction type ${scenario.validTxType} is valid`, async function() {
        const newCommisionRateValidTxType = await this.mocInrate.calcCommissionValue(
          (scenario.reserveAmount * mocHelper.MOC_PRECISION).toString(),
          scenario.validTxType.toString()
        );
        mocHelper.assertBig(
          newCommisionRateValidTxType.toString(),
          (scenario.commissionAmount * mocHelper.MOC_PRECISION).toString(),
          `final commission amount should be ${scenario.commissionAmount} ether`
        );
      });
      it(`THEN transaction type ${scenario.nonexistentTxType} is non-existent`, async function() {
        const newCommisionRateNonExistentTxType = await this.mocInrate.calcCommissionValue(
          (scenario.reserveAmount * mocHelper.MOC_PRECISION).toString(),
          scenario.nonexistentTxType
        );
        mocHelper.assertBig(
          newCommisionRateNonExistentTxType,
          scenario.commissionAmountZero,
          `final commission amount should be ${scenario.commissionAmountZero} ether`
        );
      });
    });

    describe('GIVEN different *valid* transaction types and their fees to calculate commission rate (calcCommissionValue)', function() {
      it('THEN the transaction types defined in the "commissionRates" array are valid', async function() {
        const commissionRatesArrayLength = await this.mockMocInrateChanger.commissionRatesLength();

        // Iterate through array
        for (let i = 0; i < commissionRatesArrayLength; i++) {
          /* eslint-disable no-await-in-loop */
          const commissionRate = await this.mockMocInrateChanger.commissionRates(i);

          const newCommisionRateValidTxType = await this.mocInrate.calcCommissionValue(
            (scenario.reserveAmount * mocHelper.MOC_PRECISION).toString(),
            commissionRate.txType
          );

          /* eslint-enable no-await-in-loop */
          // The fee from the commissionRatesArray is already converted to wei
          const testCommissionValue = scenario.reserveAmount * commissionRate.fee;

          mocHelper.assertBig(
            newCommisionRateValidTxType.toString(),
            testCommissionValue.toString(),
            `final commission amount should be ${testCommissionValue.toString()}`
          );
        }
      });
    });

    describe('GIVEN the default commissionRates', function() {
      it(`THEN an unauthorized account ${account2} tries to change commissionRates with another array`, async function() {
        const setCommissionRates = this.mockMocInrateChanger.setCommissionRates(
          await mocHelper.getCommissionsArrayChangingTest(),
          { from: account2 }
        );
        await expectRevert(setCommissionRates, 'Ownable: caller is not the owner');
      });
      it('THEN an authorized contract tries to change commissionRate with another array', async function() {
        await this.mockMocInrateChanger.setCommissionRates(
          await mocHelper.getCommissionsArrayChangingTest()
        );
        await this.governor.executeChange(this.mockMocInrateChanger.address);
        const newCommissionRate = await this.mocInrate.commissionRatesByTxType(
          await mocHelper.mocInrate.MINT_RISKPRO_FEES_RESERVE()
        );
        const expectedValue = '2000000000000000000';
        mocHelper.assertBig(
          newCommissionRate,
          expectedValue,
          `commissionRate should be ${expectedValue}`
        );
      });
    });

    describe('GIVEN a commissionRates array with invalid length', function() {
      it('THEN setting this new array will fail and revert', async function() {
        const setCommissionRates = this.mockMocInrateChanger.setCommissionRates(
          await mocHelper.getCommissionsArrayInvalidLength()
        );
        await expectRevert(setCommissionRates, 'commissionRates length must be between 1 and 50');
      });
    });

    describe('GIVEN the default riskProInterestBlockSpan', function() {
      it(`THEN an unauthorized account ${account2} tries to change riskProInterestBlockSpan to ${scenario.riskProInterestBlockSpan}`, async function() {
        try {
          await this.mocInrate.setRiskProInterestBlockSpan(scenario.riskProInterestBlockSpan, {
            from: account2
          });
        } catch (err) {
          assert(
            NOT_AUTHORIZED_CHANGER === err.reason,
            `${account2} Should not be authorized to set riskProInterestBlockSpan`
          );
        }
      });
      it(`THEN an authorized contract tries to change riskProInterestBlockSpan to ${scenario.riskProInterestBlockSpan}`, async function() {
        await this.mockMocInrateChanger.setRiskProInterestBlockSpan(
          scenario.riskProInterestBlockSpan
        );
        await this.governor.executeChange(this.mockMocInrateChanger.address);
        const newRiskProInterestBlockSpan = await this.mocInrate.getRiskProInterestBlockSpan();
        mocHelper.assertBig(
          newRiskProInterestBlockSpan,
          scenario.riskProInterestBlockSpan,
          `riskProInterestBlockSpan should be ${scenario.riskProInterestBlockSpan}`
        );
      });
    });

    describe('GIVEN the default riskProRate', function() {
      it(`THEN an unauthorized account ${account2} tries to change riskProRate to ${scenario.riskProRate}`, async function() {
        try {
          await this.mocInrate.setRiskProRate(scenario.riskProRate, {
            from: account2
          });
        } catch (err) {
          assert(
            NOT_AUTHORIZED_CHANGER === err.reason,
            `${account2} Should not be authorized to set riskProRate`
          );
        }
      });
      it(`THEN an authorized contract tries to change riskProRate to ${scenario.riskProRate}`, async function() {
        await this.mockMocInrateChanger.setRiskProRate(scenario.riskProRate);
        await this.governor.executeChange(this.mockMocInrateChanger.address);
        const newRiskProRate = await this.mocInrate.getRiskProRate();
        mocHelper.assertBig(
          newRiskProRate,
          scenario.riskProRate,
          `riskProRate should be ${scenario.riskProRate}`
        );
      });
    });
  });
  describe('MoCInrate calculate markup', function() {
    it('WHEN address of vendorAccount is 0x0, THEN markup is 0', async function() {
      const zeroAddress = '0x0000000000000000000000000000000000000000';
      const markup = await this.mocInrate.calculateVendorMarkup(
        zeroAddress,
        toContractBN(1000 * mocHelper.MOC_PRECISION)
      );
      mocHelper.assertBig(markup.toString(), 0, 'vendor markup should be 0');
    });
    it('WHEN address of vendorAccount is valid, THEN markup is calculated correctly', async function() {
      const vendorMarkup = 10;
      const markup = await this.mocInrate.calculateVendorMarkup(
        vendorAccount,
        toContractBN(1000 * mocHelper.MOC_PRECISION)
      );
      mocHelper.assertBig(
        markup.toString(),
        (vendorMarkup * mocHelper.MOC_PRECISION).toString(),
        `vendor markup should be ${vendorMarkup}`
      );
    });
  });
});
