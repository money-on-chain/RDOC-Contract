const testHelperBuilder = require('../mocHelper.js');

let mocHelper;
const NOT_AUTHORIZED_CHANGER = 'not_authorized_changer';
const scenario = {
  riskProxTmin: 4,
  riskProxTmax: 7777777,
  riskProxPower: 7,
  commissionRate: 50,
  riskProInterestBlockSpan: 50 * 80 * 12,
  riskProRate: 78
};

contract('MoCInrate Governed', function([owner, account2]) {
  before(async function() {
    mocHelper = await testHelperBuilder({ owner });
    this.mocInrate = mocHelper.mocInrate;
    this.governor = mocHelper.governor;
    this.mockMocInrateChanger = mocHelper.mockMocInrateChanger;
  });

  beforeEach(function() {
    return mocHelper.revertState();
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

    describe('GIVEN the default commissionRate', function() {
      it(`THEN an unauthorized account ${account2} tries to change commissionRate to ${scenario.commissionRate}`, async function() {
        try {
          await this.mocInrate.setCommissionRate(scenario.commissionRate, { from: account2 });
        } catch (err) {
          assert(
            NOT_AUTHORIZED_CHANGER === err.reason,
            `${account2} Should not be authorized to set commissionRate`
          );
        }
      });
      it(`THEN an authorized contract tries to change commissionRate to ${scenario.commissionRate}`, async function() {
        await this.mockMocInrateChanger.setCommissionRate(scenario.commissionRate);
        await this.governor.executeChange(this.mockMocInrateChanger.address);
        const newCommissionRate = await this.mocInrate.getCommissionRate();
        mocHelper.assertBig(
          newCommissionRate,
          scenario.commissionRate,
          `commissionRate should be ${scenario.commissionRate}`
        );
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
});
