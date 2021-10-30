const testHelperBuilder = require('../mocHelper.js');

let mocHelper;
const NOT_AUTORIZED_CHANGER = 'not_authorized_changer';
const scenario = {
  peg: 2,
  liq: 2,
  utpdu: 10,
  blockSpan: 20 * 3,
  riskProMaxDiscountRate: 250,
  emaCalculationBlockSpan: 20,
  smoothingFactor: 2,
  maxMintRiskPro: 2,
  liquidationEnabled: true,
  protected: 2
};

const PriceProviderMock = artifacts.require('./contracts/mocks/PriceProviderMock.sol');
const MoCPriceProviderMock = artifacts.require('./contracts/mocks/MoCPriceProviderMock.sol');

contract('MoCState Governed', function([owner, account2]) {
  before(async function() {
    mocHelper = await testHelperBuilder({ owner });
    this.mocState = mocHelper.mocState;
    this.governor = mocHelper.governor;
    this.mockMocStateChanger = mocHelper.mockMocStateChanger;
  });

  beforeEach(function() {
    return mocHelper.revertState();
  });

  describe('MoCState settings params', function() {
    describe('GIVEN the default peg value of 1', function() {
      it(`THEN an unathorized account ${account2} tries to change peg to ${scenario.peg}`, async function() {
        const oldPeg = await this.mocState.getPeg();
        mocHelper.assertBig(oldPeg, 1, 'PEG should be 1 by default');
        try {
          await this.mocState.setPeg(scenario.peg, { from: account2 });
        } catch (err) {
          assert(
            NOT_AUTORIZED_CHANGER === err.reason,
            `${account2} Should not be authorized to set peg`
          );
        }
      });
      it(`THEN an authorized contract tries to change peg to ${scenario.peg}`, async function() {
        const oldPeg = await this.mocState.getPeg();
        mocHelper.assertBig(oldPeg, 1, 'PEG should be 1 by default');
        await this.mockMocStateChanger.updatePegValue(scenario.peg);
        await this.governor.executeChange(this.mockMocStateChanger.address);
        const newPeg = await this.mocState.getPeg();
        mocHelper.assertBig(newPeg, scenario.peg, `PEG should be ${scenario.peg}`);
      });
    });

    describe('GIVEN the liq value (currently 1.04)', function() {
      it(`THEN an unathorized account ${account2} tries to change liq to ${scenario.liq}`, async function() {
        try {
          await this.mocState.setLiq(scenario.liq, { from: account2 });
        } catch (err) {
          assert(
            NOT_AUTORIZED_CHANGER === err.reason,
            `${account2} Should not be authorized to set liq`
          );
        }
      });
      it(`THEN an authorized contract tries to change liq to ${scenario.liq}`, async function() {
        const oldLiq = await this.mocState.getLiq();
        assert(oldLiq > 0, 'LIQ should be greater than 0');
        await this.mockMocStateChanger.updateLiqValue(scenario.liq);
        await this.governor.executeChange(this.mockMocStateChanger.address);
        const newLiq = await this.mocState.getLiq();
        mocHelper.assertBig(newLiq, scenario.liq, `LIQ should be ${scenario.liq}`);
      });
    });

    describe('GIVEN the utpdu value', function() {
      it(`THEN an unathorized account ${account2} tries to change utpdu to ${scenario.utpdu}`, async function() {
        const oldTpdu = await this.mocState.getUtpdu();
        assert(oldTpdu > 0, 'utpdu should be greater than 0');
        try {
          await this.mocState.setUtpdu(scenario.utpdu, { from: account2 });
        } catch (err) {
          assert(
            NOT_AUTORIZED_CHANGER === err.reason,
            `${account2} Should not be authorized to set utpdu`
          );
        }
      });
      it(`THEN an authorized contract tries to change utpdu to ${scenario.utpdu}`, async function() {
        const oldUtpdu = await this.mocState.getUtpdu();
        assert(oldUtpdu > 0, 'utpdu should be greater than 0');
        await this.mockMocStateChanger.updateUtpduValue(scenario.utpdu);
        await this.governor.executeChange(this.mockMocStateChanger.address);
        const newUtpdu = await this.mocState.getUtpdu();
        mocHelper.assertBig(newUtpdu, scenario.utpdu, `UTPDU should be ${scenario.utpdu}`);
      });
    });

    describe('GIVEN the blockSpan value', function() {
      it(`THEN an unathorized account ${account2} tries to change blockSpan to ${scenario.blockSpan}`, async function() {
        const oldDaySpan = await this.mocState.getDayBlockSpan();
        assert(oldDaySpan > 0, 'blockSpan should be greater than 0');
        try {
          await this.mocState.setDayBlockSpan(scenario.utpdu, { from: account2 });
        } catch (err) {
          assert(
            NOT_AUTORIZED_CHANGER === err.reason,
            `${account2} Should not be authorized to set blockSpan`
          );
        }
      });
      it(`THEN an authorized contract tries to change blockSpan to ${scenario.blockSpan}`, async function() {
        const oldDaySpan = await this.mocState.getDayBlockSpan();
        assert(oldDaySpan > 0, 'blockSpan should be greater than 0');
        await this.mockMocStateChanger.updateDayBlockSpanValue(scenario.blockSpan);
        await this.governor.executeChange(this.mockMocStateChanger.address);
        const newBlockSpan = await this.mocState.getDayBlockSpan();
        mocHelper.assertBig(
          newBlockSpan,
          scenario.blockSpan,
          `blockSpan should be ${scenario.blockSpan}`
        );
      });
    });

    describe('GIVEN the riskProMaxDiscountRate value', function() {
      it(`THEN an authorized contract tries to change riskProMaxDiscountRate to ${scenario.riskProMaxDiscountRate}`, async function() {
        const oldMax = await this.mocState.getMaxDiscountRate();
        assert(oldMax > 0, 'riskProMaxDiscountRate should be greater than 0');
        await this.mockMocStateChanger.updatemaxDiscRateValue(scenario.riskProMaxDiscountRate);
        await this.governor.executeChange(this.mockMocStateChanger.address);
        const newDisc = await this.mocState.getMaxDiscountRate();
        mocHelper.assertBig(
          newDisc,
          scenario.riskProMaxDiscountRate,
          `blockSpan should be ${scenario.riskProMaxDiscountRate}`
        );
      });
    });

    describe('GIVEN on old priceProvider', function() {
      describe('AND an authorized contract tries to set a new PriceProvider', function() {
        let tx;
        let newPriceProvider;
        let oldPriceProvider;
        beforeEach(async function() {
          oldPriceProvider = await mocHelper.mocState.getPriceProvider();
          newPriceProvider = await PriceProviderMock.new(1000003333);
          await mocHelper.mockMocStateChanger.setPriceProvider(newPriceProvider.address);
          tx = await mocHelper.governor.executeChange(mocHelper.mockMocStateChanger.address);
        });
        it('THEN the PriceProvider address must be updated', async function() {
          const priceProviderAddress = await mocHelper.mocState.getPriceProvider();
          assert(
            priceProviderAddress === newPriceProvider.address,
            'ReserveTokens Price provider not updates.'
          );
        });
        it('THEN PriceProviderUpdated event is emitted', async function() {
          const [priceProviderUpdatedEvent] = await mocHelper.findEvents(
            tx,
            'PriceProviderUpdated'
          );
          assert(
            priceProviderUpdatedEvent.oldAddress === oldPriceProvider,
            'Old address is different'
          );
          assert(
            priceProviderUpdatedEvent.newAddress === newPriceProvider.address,
            'New address is different'
          );
        });
      });

      it(`THEN an unathorized account ${account2} tries to change PriceProvider`, async function() {
        try {
          const newPriceProvider = await PriceProviderMock.new(1000003333);
          await mocHelper.mocState.setPriceProvider(newPriceProvider.address, {
            from: account2
          });
        } catch (err) {
          assert(
            NOT_AUTORIZED_CHANGER === err.reason,
            `${account2} Should not be authorized to set PriceProvider`
          );
        }
      });
    });

    describe('GIVEN on old mocPriceProvider', function() {
      describe('AND an authorized contract tries to set a new MoCPriceProvider', function() {
        let tx;
        let newMoCPriceProvider;
        let oldMoCPriceProvider;
        beforeEach(async function() {
          oldMoCPriceProvider = await mocHelper.mocState.getMoCPriceProvider();
          newMoCPriceProvider = await MoCPriceProviderMock.new(1000003333);
          await mocHelper.mockMocStateChanger.setMoCPriceProvider(newMoCPriceProvider.address);
          tx = await mocHelper.governor.executeChange(mocHelper.mockMocStateChanger.address);
        });
        it('THEN the MoCPriceProvider address must be updated', async function() {
          const mocPriceProviderAddress = await mocHelper.mocState.getMoCPriceProvider();
          assert(
            mocPriceProviderAddress === newMoCPriceProvider.address,
            'MoC Price provider not updates.'
          );
        });
        it('THEN MoCPriceProviderUpdated event is emitted', async function() {
          const [mocPriceProviderUpdatedEvent] = await mocHelper.findEvents(
            tx,
            'MoCPriceProviderUpdated'
          );
          assert(
            mocPriceProviderUpdatedEvent.oldAddress === oldMoCPriceProvider,
            'Old address is different'
          );
          assert(
            mocPriceProviderUpdatedEvent.newAddress === newMoCPriceProvider.address,
            'New address is different'
          );
        });
      });

      it(`THEN an unathorized account ${account2} tries to change MoCPriceProvider`, async function() {
        try {
          const newMoCPriceProvider = await MoCPriceProviderMock.new(1000003333);
          await mocHelper.mocState.setMoCPriceProvider(newMoCPriceProvider.address, {
            from: account2
          });
        } catch (err) {
          assert(
            NOT_AUTORIZED_CHANGER === err.reason,
            `${account2} Should not be authorized to set MoCPriceProvider`
          );
        }
      });
    });

    describe('GIVEN an old mocToken', function() {
      describe('AND an authorized contract tries to set a new MoCToken', function() {
        let tx;
        const zeroAddress = '0x0000000000000000000000000000000000000000';
        beforeEach(async function() {
          await mocHelper.mockMocStateChanger.setMoCToken(zeroAddress);
          tx = await mocHelper.governor.executeChange(mocHelper.mockMocStateChanger.address);
        });
        it('THEN the MoCToken address must be updated', async function() {
          const mocTokenAddress = await mocHelper.mocState.getMoCToken();
          assert(mocTokenAddress === zeroAddress, 'MoC Token not updates.');
        });
        it('THEN MoCTokenChanged event is emitted', async function() {
          const [mocTokenChangedEvent] = await mocHelper.findEvents(tx, 'MoCTokenChanged');
          assert(mocTokenChangedEvent.mocTokenAddress === zeroAddress, 'New address is different');
        });
      });
      it(`THEN an unauthorized account ${account2} tries to change MoCToken`, async function() {
        try {
          const zeroAddress = '0x0000000000000000000000000000000000000000';
          await mocHelper.mocState.setMoCToken(zeroAddress, {
            from: account2
          });
        } catch (err) {
          assert(
            NOT_AUTORIZED_CHANGER === err.reason,
            `${account2} Should not be authorized to set MoCToken`
          );
        }
      });
    });

    describe('GIVEN an old mocVendors', function() {
      describe('AND an authorized contract tries to set a new MoCVendors', function() {
        let tx;
        const zeroAddress = '0x0000000000000000000000000000000000000000';
        beforeEach(async function() {
          await mocHelper.mockMocStateChanger.setMoCVendors(zeroAddress);
          tx = await mocHelper.governor.executeChange(mocHelper.mockMocStateChanger.address);
        });
        it('THEN the MoCVendors address must be updated', async function() {
          const mocVendorAddress = await mocHelper.mocState.getMoCVendors();
          assert(mocVendorAddress === zeroAddress, 'MoC Vendors not updates.');
        });
        it('THEN MoCVendorsChanged event is emitted', async function() {
          const [mocVendorsChangedEvent] = await mocHelper.findEvents(tx, 'MoCVendorsChanged');
          assert(
            mocVendorsChangedEvent.mocVendorsAddress === zeroAddress,
            'New address is different'
          );
        });
      });
      it(`THEN an unauthorized account ${account2} tries to change MoCVendor`, async function() {
        try {
          const zeroAddress = '0x0000000000000000000000000000000000000000';
          await mocHelper.mocState.setMoCVendors(zeroAddress, {
            from: account2
          });
        } catch (err) {
          assert(
            NOT_AUTORIZED_CHANGER === err.reason,
            `${account2} Should not be authorized to set MoCVendors`
          );
        }
      });
    });

    describe('GIVEN the emaCalculationBlockSpan value', function() {
      it(`THEN an unauthorized account ${account2} tries to change emaCalculationBlockSpan to ${scenario.emaCalculationBlockSpan}`, async function() {
        try {
          await this.mocState.setEmaCalculationBlockSpan(scenario.emaCalculationBlockSpan, {
            from: account2
          });
        } catch (err) {
          assert(
            NOT_AUTORIZED_CHANGER === err.reason,
            `${account2} Should not be authorized to set emaCalculationBlockSpan`
          );
        }
      });
      it(`THEN an authorized contract tries to change emaCalculationBlockSpan to ${scenario.emaCalculationBlockSpan}`, async function() {
        const oldEmaCalculationBlockSpan = await this.mocState.getEmaCalculationBlockSpan();
        assert(oldEmaCalculationBlockSpan > 0, 'emaCalculationBlockSpan should be greater than 0');
        await this.mockMocStateChanger.setEmaCalculationBlockSpan(scenario.emaCalculationBlockSpan);
        await this.governor.executeChange(this.mockMocStateChanger.address);
        const newEmaCalculationBlockSpan = await this.mocState.getEmaCalculationBlockSpan();
        mocHelper.assertBig(
          newEmaCalculationBlockSpan,
          scenario.emaCalculationBlockSpan,
          `emaCalculationBlockSpan should be ${scenario.emaCalculationBlockSpan}`
        );
      });
    });

    describe('GIVEN the smoothingFactor value', function() {
      it(`THEN an unauthorized account ${account2} tries to change smoothingFactor to ${scenario.smoothingFactor}`, async function() {
        try {
          await this.mocState.setSmoothingFactor(scenario.smoothingFactor, { from: account2 });
        } catch (err) {
          assert(
            NOT_AUTORIZED_CHANGER === err.reason,
            `${account2} Should not be authorized to set smoothingFactor`
          );
        }
      });
      it(`THEN an authorized contract tries to change smoothingFactor to ${scenario.smoothingFactor}`, async function() {
        const oldSmoothingFactor = await this.mocState.getSmoothingFactor();
        assert(oldSmoothingFactor > 0, 'smoothingFactor should be greater than 0');
        await this.mockMocStateChanger.setSmoothingFactor(scenario.smoothingFactor);
        await this.governor.executeChange(this.mockMocStateChanger.address);
        const newSmoothingFactor = await this.mocState.getSmoothingFactor();
        mocHelper.assertBig(
          newSmoothingFactor,
          scenario.smoothingFactor,
          `smoothingFactor should be ${scenario.smoothingFactor}`
        );
      });
    });

    describe('GIVEN the maxMintRiskPro value', function() {
      it(`THEN an unauthorized account ${account2} tries to change maxMintRiskPro to ${scenario.maxMintRiskPro}`, async function() {
        try {
          await this.mocState.setMaxMintRiskPro(scenario.maxMintRiskPro, { from: account2 });
        } catch (err) {
          assert(
            NOT_AUTORIZED_CHANGER === err.reason,
            `${account2} Should not be authorized to set maxMintRiskPro`
          );
        }
      });
      it(`THEN an authorized contract tries to change maxMintRiskPro to ${scenario.maxMintRiskPro}`, async function() {
        const oldMaxMintRiskPro = await this.mocState.getMaxMintRiskPro();
        assert(oldMaxMintRiskPro > 0, 'maxMintRiskPro should be greater than 0');
        await this.mockMocStateChanger.setMaxMintRiskPro(scenario.maxMintRiskPro);
        await this.governor.executeChange(this.mockMocStateChanger.address);
        const newMaxMintRiskPro = await this.mocState.getMaxMintRiskPro();
        mocHelper.assertBig(
          newMaxMintRiskPro,
          scenario.maxMintRiskPro,
          `maxMintRiskPro should be ${scenario.maxMintRiskPro}`
        );
      });
    });

    describe('GIVEN the liquidationEnabled value', function() {
      it(`THEN an unauthorized account ${account2} tries to change liquidationEnabled to ${scenario.liquidationEnabled}`, async function() {
        try {
          await this.mocState.setLiquidationEnabled(scenario.liquidationEnabled, {
            from: account2
          });
        } catch (err) {
          assert(
            NOT_AUTORIZED_CHANGER === err.reason,
            `${account2} Should not be authorized to set liquidationEnabled`
          );
        }
      });
      it(`THEN an authorized contract tries to change liquidationEnabled to ${scenario.liquidationEnabled}`, async function() {
        await this.mockMocStateChanger.setLiquidationEnabled(scenario.liquidationEnabled);
        await this.governor.executeChange(this.mockMocStateChanger.address);
        const newLiquidationEnabled = await this.mocState.getLiquidationEnabled();
        assert(
          newLiquidationEnabled === scenario.liquidationEnabled,
          `liquidationEnabled should be ${scenario.liquidationEnabled}`
        );
      });
    });

    describe('GIVEN the protected value', function() {
      it(`THEN an unauthorized account ${account2} tries to change protected to ${scenario.protected}`, async function() {
        try {
          await this.mocState.setProtected(scenario.protected, { from: account2 });
        } catch (err) {
          assert(
            NOT_AUTORIZED_CHANGER === err.reason,
            `${account2} Should not be authorized to set protected`
          );
        }
      });
      it(`THEN an authorized contract tries to change protected to ${scenario.protected}`, async function() {
        const oldProtected = await this.mocState.getProtected();
        assert(oldProtected > 0, 'protected should be greater than 0');
        await this.mockMocStateChanger.setProtected(scenario.protected);
        await this.governor.executeChange(this.mockMocStateChanger.address);
        const newProtected = await this.mocState.getProtected();
        mocHelper.assertBig(
          newProtected,
          scenario.protected,
          `protected should be ${scenario.protected}`
        );
      });
    });
  });
});
