const testHelperBuilder = require('../../mocHelper.js');

let mocHelper;
let toContractBN;

contract('MoC: MoCExchange', function([
  owner,
  userAccount,
  commissionsAccount,
  vendorAccount1,
  vendorAccount2
]) {
  before(async function() {
    mocHelper = await testHelperBuilder({ owner });
    ({ toContractBN } = mocHelper);
    this.moc = mocHelper.moc;
    this.mockMocInrateChanger = mocHelper.mockMocInrateChanger;
    this.governor = mocHelper.governor;
    this.mockMoCVendorsChanger = mocHelper.mockMoCVendorsChanger;
    this.mocVendors = mocHelper.mocVendors;
  });

  beforeEach(async function() {
    await mocHelper.revertState();

    const vendor1 = await mocHelper.getVendorToRegisterAsArray(vendorAccount1, 0.01);
    const vendor2 = await mocHelper.getVendorToRegisterAsArray(vendorAccount2, 0.002);
    const vendors = vendor1.concat(vendor2);

    // Register vendors for test
    await this.mockMoCVendorsChanger.setVendorsToRegister(vendors);
    await this.governor.executeChange(this.mockMoCVendorsChanger.address);

    // Commission rates for test are set in functionHelper.js
    await mocHelper.mockMocInrateChanger.setCommissionRates(
      await mocHelper.getCommissionsArrayNonZero()
    );

    // set commissions address
    await mocHelper.mockMocInrateChanger.setCommissionsAddress(commissionsAccount);
    // update params
    await mocHelper.governor.executeChange(mocHelper.mockMocInrateChanger.address);
  });

  describe('Calculate commissions with prices', function() {
    const scenarios = [
      {
        params: {
          reservePrice: 10000,
          mocPrice: 10000,
          mocAmount: 1000,
          reserveAmount: 1000
        },
        expect: {
          commissionAmountReserve: 0, // rate: 0.001
          commissionAmountMoC: 7, // rate: 0.007
          markupAmountReserve: 0,
          markupAmountMoC: 10
        }
      },
      {
        params: {
          reservePrice: 10000,
          mocPrice: 10000,
          mocAmount: 0,
          reserveAmount: 1000
        },
        expect: {
          commissionAmountReserve: 1, // rate: 0.001
          commissionAmountMoC: 0, // rate: 0.007
          markupAmountReserve: 10,
          markupAmountMoC: 0
        }
      },
      {
        params: {
          reservePrice: 10000,
          mocPrice: 5000,
          mocAmount: 1000,
          reserveAmount: 1000
        },
        expect: {
          commissionAmountReserve: 0, // rate: 0.001
          commissionAmountMoC: 14, // rate: 0.007
          markupAmountReserve: 0,
          markupAmountMoC: 20
        }
      },
      {
        params: {
          reservePrice: 5000,
          mocPrice: 10000,
          mocAmount: 1000,
          reserveAmount: 1000
        },
        expect: {
          commissionAmountReserve: 0, // rate: 0.001
          commissionAmountMoC: 3.5, // rate: 0.007
          markupAmountReserve: 0,
          markupAmountMoC: 5
        }
      },
      {
        params: {
          reservePrice: 5000,
          mocPrice: 10000,
          mocAmount: 0,
          reserveAmount: 1000
        },
        expect: {
          commissionAmountReserve: 1, // rate: 0.001
          commissionAmountMoC: 0, // rate: 0.007
          markupAmountReserve: 10,
          markupAmountMoC: 0
        }
      }
    ];

    scenarios.forEach(async scenario => {
      describe(`GIVEN Reserve price is ${scenario.params.reservePrice}, MoC price is ${scenario.params.mocPrice} and MoC allowance is ${scenario.params.mocAmount}`, function() {
        let reserveCommission;
        let mocCommission;
        let reserveMarkup;
        let mocMarkup;

        beforeEach(async function() {
          // Set Reserve price
          await mocHelper.setReserveTokenPrice(scenario.params.reservePrice * mocHelper.MOC_PRECISION);

          // Set MoC price
          await mocHelper.setMoCPrice(scenario.params.mocPrice * mocHelper.MOC_PRECISION);

          await mocHelper.mintMoCToken(userAccount, scenario.params.mocAmount, owner);
          await mocHelper.approveMoCToken(
            mocHelper.moc.address,
            scenario.params.mocAmount,
            userAccount
          );
          // Set transaction types
          const txTypeFeesReserve = await mocHelper.mocInrate.MINT_RISKPRO_FEES_RESERVE();
          const txTypeFeesMOC = await mocHelper.mocInrate.MINT_RISKPRO_FEES_MOC();

          const params = {
            account: userAccount,
            amount: toContractBN(scenario.params.reserveAmount * mocHelper.MOC_PRECISION).toString(),
            txTypeFeesMOC: txTypeFeesMOC.toString(),
            txTypeFeesReserve: txTypeFeesReserve.toString(),
            vendorAccount: vendorAccount1
          };

          ({
            reserveCommission,
            mocCommission,
            reserveMarkup,
            mocMarkup
          } = await mocHelper.mocExchange.calculateCommissionsWithPrices(params, { from: owner }));
        });
        it(`THEN the commission amount in Reserve of ${scenario.expect.commissionAmountReserve} is correct`, async function() {
          mocHelper.assertBigReserve(
            reserveCommission,
            scenario.expect.commissionAmountReserve,
            'Commission amount in Reserve is incorrect'
          );
        });
        it(`THEN the commission amount in MoC of ${scenario.expect.commissionAmountMoC} is correct`, async function() {
          mocHelper.assertBigReserve(
            mocCommission,
            scenario.expect.commissionAmountMoC,
            'Commission amount in MoC is incorrect'
          );
        });
        it(`THEN the markup amount in Reserve of ${scenario.expect.markupAmountReserve} is correct`, async function() {
          mocHelper.assertBigReserve(
            reserveMarkup,
            scenario.expect.markupAmountReserve,
            'Markup amount in Reserve is incorrect'
          );
        });
        it(`THEN the markup amount in MoC of ${scenario.expect.markupAmountMoC} is correct`, async function() {
          mocHelper.assertBigReserve(
            mocMarkup,
            scenario.expect.markupAmountMoC,
            'Markup amount in MoC is incorrect'
          );
        });
      });
    });
  });
});