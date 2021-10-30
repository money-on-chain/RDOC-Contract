const testHelperBuilder = require('../../mocHelper.js');

let mocHelper;
let toContractBN;

// eslint-disable-next-line quotes
const NOT_ENOUGH_FUNDS_ERROR = "sender doesn't have enough funds to send tx";
const zeroAddress = '0x0000000000000000000000000000000000000000';

contract('MoC: MoCExchange', function([
  owner,
  userAccount,
  commissionsAccount,
  vendorAccount,
  otherAddress
]) {
  before(async function() {
    const accounts = [owner, userAccount, commissionsAccount, vendorAccount, otherAddress];
    mocHelper = await testHelperBuilder({ owner, accounts });
    ({ toContractBN } = mocHelper);
    this.moc = mocHelper.moc;
    this.mockMocInrateChanger = mocHelper.mockMocInrateChanger;
    this.governor = mocHelper.governor;
    this.mocToken = mocHelper.mocToken;
    this.mockMocStateChanger = mocHelper.mockMocStateChanger;
    this.mocVendors = mocHelper.mocVendors;
  });

  beforeEach(async function() {
    await mocHelper.revertState();

    // Register vendor for test
    await mocHelper.registerVendor(vendorAccount, 0.01, owner);

    // Commission rates for test are set in functionHelper.js
    await this.mockMocInrateChanger.setCommissionRates(
      await mocHelper.getCommissionsArrayNonZero()
    );

    // set commissions address
    await this.mockMocInrateChanger.setCommissionsAddress(commissionsAccount);
    // update params
    await this.governor.executeChange(this.mockMocInrateChanger.address);
  });

  describe('RiskPro redeeming with commissions', function() {
    const scenarios = [
      // Reserve fees
      {
        params: {
          riskProToMint: 100,
          riskProToRedeem: 100,
          mocAmount: 0,
          vendorStaking: 100,
          vendorAccount
        },
        expect: {
          riskProRedeemed: 100,
          // eslint-disable-next-line max-len
          riskProToRedeemOnReserveToken: 98.8, // (riskProToRedeem) - (riskProToRedeem * commissionRate) - (riskProToRedeem * markup)
          commissionAmountReserveToken: 0.2, // (riskProToRedeem * REDEEM_RISKPRO_FEES_RESERVE = 0.002)
          commissionAmountMoC: 0,
          vendorAmountReserveToken: 1, // (riskProToMint * markup = 0.01)
          vendorAmountMoC: 0
        }
      },
      {
        params: {
          riskProToMint: 100,
          riskProToRedeem: 50,
          mocAmount: 0,
          vendorStaking: 100,
          vendorAccount
        },
        expect: {
          riskProRedeemed: 50,
          commissionAmountReserveToken: 0.1, // (riskProToRedeem * REDEEM_RISKPRO_FEES_RESERVE = 0.002)
          // eslint-disable-next-line max-len
          riskProToRedeemOnReserveToken: 49.4, // (riskProToRedeem) - (riskProToRedeem * commissionRate) - (riskProToRedeem * markup)
          commissionAmountMoC: 0,
          vendorAmountReserveToken: 0.5, // (riskProToRedeem * markup = 0.01)
          vendorAmountMoC: 0
        }
      },
      // MoC fees
      {
        params: {
          riskProToMint: 100,
          riskProToRedeem: 100,
          mocAmount: 1000,
          vendorStaking: 100,
          vendorAccount
        },
        expect: {
          riskProRedeemed: 100,
          riskProToRedeemOnReserveToken: 100,
          commissionAmountReserveToken: 0,
          commissionAmountMoC: 0.8, // (riskProToRedeem * REDEEM_RISKPRO_FEES_MOC = 0.008)
          vendorAmountReserveToken: 0,
          vendorAmountMoC: 1 // (riskProToRedeem * markup = 0.01)
        }
      },
      {
        params: {
          riskProToMint: 100,
          riskProToRedeem: 50,
          mocAmount: 1000,
          vendorStaking: 100,
          vendorAccount
        },
        expect: {
          riskProRedeemed: 50,
          commissionAmountReserveToken: 0,
          riskProToRedeemOnReserveToken: 50,
          commissionAmountMoC: 0.4, // (riskProToRedeem * REDEEM_RISKPRO_FEES_MOC = 0.008)
          vendorAmountReserveToken: 0,
          vendorAmountMoC: 0.5 // (riskProToRedeem * markup = 0.01)
        }
      },
      // MoC fees NO VENDOR
      {
        params: {
          riskProToMint: 100,
          riskProToRedeem: 100,
          mocAmount: 1000,
          vendorStaking: 100,
          vendorAccount: zeroAddress
        },
        expect: {
          riskProRedeemed: 100,
          riskProToRedeemOnReserveToken: 100,
          commissionAmountReserveToken: 0,
          commissionAmountMoC: 0.8, // (riskProToRedeem * REDEEM_RISKPRO_FEES_MOC = 0.008)
          vendorAmountReserveToken: 0,
          vendorAmountMoC: 0
        }
      },
      {
        params: {
          riskProToMint: 100,
          riskProToRedeem: 50,
          mocAmount: 1000,
          vendorStaking: 100,
          vendorAccount: zeroAddress
        },
        expect: {
          riskProRedeemed: 50,
          commissionAmountReserveToken: 0,
          riskProToRedeemOnReserveToken: 50,
          commissionAmountMoC: 0.4, // (riskProToRedeem * REDEEM_RISKPRO_FEES_MOC = 0.008)
          vendorAmountReserveToken: 0,
          vendorAmountMoC: 0
        }
      }
    ];

    scenarios.forEach(async scenario => {
      describe(`WHEN he tries to redeem ${scenario.params.riskProToRedeem} ReserveTokens`, function() {
        let initialRiskProBalance;
        let prevCommissionAccountBalance;
        let prevUserReserveTokenBalance;
        let prevUserMoCBalance; // If user has MoC balance, then commission fees will be in MoC
        let prevCommissionsAccountMoCBalance;
        let prevvendorAccountReserveTokenBalance;
        let prevVendorAccountMoCBalance;

        beforeEach(async function() {
          await mocHelper.mintMoCToken(userAccount, scenario.params.mocAmount, owner);
          await mocHelper.approveMoCToken(
            mocHelper.moc.address,
            scenario.params.mocAmount,
            userAccount
          );
          if (scenario.params.vendorAccount !== zeroAddress) {
            await mocHelper.mintMoCToken(
              scenario.params.vendorAccount,
              scenario.params.vendorStaking,
              owner
            );
            await mocHelper.approveMoCToken(
              this.mocVendors.address,
              scenario.params.vendorStaking,
              scenario.params.vendorAccount
            );
            await this.mocVendors.addStake(
              toContractBN(scenario.params.vendorStaking * mocHelper.MOC_PRECISION),
              { from: scenario.params.vendorAccount }
            );
          }
          // Mint according to scenario
          const txTypeMint =
            scenario.params.mocAmount === 0
              ? await mocHelper.mocInrate.MINT_RISKPRO_FEES_RESERVE()
              : await mocHelper.mocInrate.MINT_RISKPRO_FEES_MOC();
          await mocHelper.mintRiskProAmount(
            userAccount,
            scenario.params.riskProToMint,
            scenario.params.vendorAccount,
            txTypeMint
          );
          // Calculate balances before redeeming
          initialRiskProBalance = await mocHelper.getRiskProBalance(userAccount);
          prevCommissionAccountBalance = toContractBN(
            await mocHelper.getReserveBalance(commissionsAccount)
          );
          prevUserReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(userAccount)
          );
          prevUserMoCBalance = await mocHelper.getMoCBalance(userAccount);
          prevCommissionsAccountMoCBalance = await mocHelper.getMoCBalance(commissionsAccount);
          prevvendorAccountReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(scenario.params.vendorAccount)
          );
          prevVendorAccountMoCBalance = await mocHelper.getMoCBalance(
            scenario.params.vendorAccount
          );

          await mocHelper.redeemRiskPro(
            userAccount,
            scenario.params.riskProToRedeem,
            scenario.params.vendorAccount
          );
        });

        it(`THEN the user has ${scenario.expect.riskProToRedeemOnReserveToken} more ReserveToken`, async function() {
          const userReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(userAccount)
          );
          const diff = userReserveTokenBalance.sub(prevUserReserveTokenBalance);

          mocHelper.assertBigReserve(
            diff,
            scenario.expect.riskProToRedeemOnReserveToken,
            'user ReserveToken balance is incorrect'
          );
        });
        it('THEN he receives only the max redeem amount', async function() {
          const riskProBalance = await mocHelper.getRiskProBalance(userAccount);
          const balanceDiff = initialRiskProBalance.sub(riskProBalance);

          mocHelper.assertBigReserve(
            balanceDiff,
            scenario.expect.riskProRedeemed,
            'The redemption RiskPro amount was incorrect'
          );
        });
        it(`THEN commission account balance increase by ${scenario.expect.commissionAmountReserveToken} ReserveTokens`, async function() {
          const reserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(commissionsAccount)
          );
          const balanceDiff = reserveTokenBalance.sub(prevCommissionAccountBalance);

          mocHelper.assertBigReserve(
            balanceDiff,
            scenario.expect.commissionAmountReserveToken,
            'The commission account balance is incorrect'
          );
        });
        it(`THEN the vendor account ReserveToken balance has increase by ${scenario.expect.vendorAmountReserveToken} ReserveTokens`, async function() {
          const vendorAccountReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(scenario.params.vendorAccount)
          );
          const diff = vendorAccountReserveTokenBalance.sub(prevvendorAccountReserveTokenBalance);

          mocHelper.assertBigReserve(
            diff,
            scenario.expect.vendorAmountReserveToken,
            'vendor account balance is incorrect'
          );
        });
        it(`THEN the user MoC balance has decreased by ${scenario.expect.commissionAmountMoC} MoCs by commissions + ${scenario.expect.vendorAmountMoC} MoCs by vendor markup`, async function() {
          const userMoCBalance = await mocHelper.getMoCBalance(userAccount);
          const fees = toContractBN(
            scenario.expect.commissionAmountMoC * mocHelper.MOC_PRECISION
          ).add(toContractBN(scenario.expect.vendorAmountMoC * mocHelper.MOC_PRECISION));
          const diffFees = prevUserMoCBalance.sub(userMoCBalance);

          mocHelper.assertBig(diffFees, fees, 'MoC fees are incorrect');
        });
        it(`THEN the commissions account MoC balance has increased by ${scenario.expect.commissionAmountMoC} MoCs`, async function() {
          const commissionsAccountMoCBalance = await mocHelper.getMoCBalance(commissionsAccount);
          const diff = commissionsAccountMoCBalance.sub(prevCommissionsAccountMoCBalance);

          mocHelper.assertBigReserve(
            diff,
            scenario.expect.commissionAmountMoC,
            'commissions account MoC balance is incorrect'
          );
        });
        it(`THEN the vendor account MoC balance has increased by ${scenario.expect.vendorAmountMoC} MoCs`, async function() {
          const vendorAccountMoCBalance = await mocHelper.getMoCBalance(vendorAccount);
          const diff = vendorAccountMoCBalance.sub(prevVendorAccountMoCBalance);
          mocHelper.assertBigReserve(
            diff,
            scenario.expect.vendorAmountMoC,
            'vendor account MoC balance is incorrect'
          );
        });
      });
    });

    describe('Non-scenario tests', function() {
      beforeEach(async function() {
        // MoC token for vendor
        const vendorStaking = 100;
        await mocHelper.mintMoCToken(vendorAccount, vendorStaking, owner);
        await mocHelper.approveMoCToken(this.mocVendors.address, vendorStaking, vendorAccount);
        await this.mocVendors.addStake(toContractBN(vendorStaking * mocHelper.MOC_PRECISION), {
          from: vendorAccount
        });
      });
      describe('GIVEN since there is no allowance to pay fees in MoC', function() {
        it('WHEN a user tries to redeem ReserveTokens with no MoC allowance, THEN fees are paid in ReserveToken', async function() {
          const mocAmountToMint = 1000;
          const mocAmountToApprove = 0;
          const reserveTokenExpectedBalance = 0;
          await mocHelper.mintMoCToken(userAccount, mocAmountToMint, owner);
          await mocHelper.approveMoCToken(mocHelper.moc.address, mocAmountToApprove, userAccount);
          const prevUserMoCBalance = await mocHelper.getMoCBalance(userAccount);
          const prevUserReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(userAccount)
          );
          await mocHelper.redeemRiskPro(userAccount, 10, vendorAccount);
          const userMoCBalance = await mocHelper.getMoCBalance(userAccount);
          const diffMoC = prevUserMoCBalance.sub(userMoCBalance);
          const userReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(userAccount)
          );
          const diffReserveToken = prevUserReserveTokenBalance.sub(userReserveTokenBalance);

          // Check that the used paid in ReserveToken because MoC allowance is 0
          mocHelper.assertBigReserve(diffMoC, mocAmountToApprove, 'user MoC balance is incorrect');

          mocHelper.assertBigReserve(
            diffReserveToken,
            reserveTokenExpectedBalance,
            'user ReserveToken balance is incorrect'
          );
        });
      });
      describe('GIVEN since the user does not have MoC, but there is MoC allowance AND ReserveToken balance', function() {
        it('WHEN a user tries to redeem ReserveTokens with MoC allowance, THEN fees are paid in ReserveToken', async function() {
          // DO NOT mint MoC token on purpose
          await mocHelper.approveMoCToken(mocHelper.moc.address, 1000, otherAddress);
          const expectedMoCFees = 0; // commission + vendor fee
          const mintAmount = 100;
          const redeemAmount = 100;
          const expectedReserveTokenCommission = 0.2; // redeemAmount * REDEEM_RISKPRO_FEES_RESERVE()
          const expectedReserveTokenVendorFee = 1; // redeemAmount * markup

          // Mint
          await mocHelper.mintRiskProAmount(
            otherAddress,
            mintAmount,
            vendorAccount,
            await mocHelper.mocInrate.MINT_RISKPRO_FEES_RESERVE()
          );

          // Calculate balances before redeeming
          const prevCommissionAccountBalance = toContractBN(
            await mocHelper.getReserveBalance(commissionsAccount)
          );
          const prevvendorAccountReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(vendorAccount)
          );
          const prevUserMoCBalance = await mocHelper.getMoCBalance(otherAddress);

          // Redeem
          await mocHelper.redeemRiskPro(otherAddress, redeemAmount, vendorAccount);

          const userMoCBalance = await mocHelper.getMoCBalance(otherAddress);
          const diffMoCFees = prevUserMoCBalance.sub(userMoCBalance);

          const commissionsBalance = toContractBN(
            await mocHelper.getReserveBalance(commissionsAccount)
          );
          const diffReserveTokenCommission = commissionsBalance.sub(prevCommissionAccountBalance);

          const vendorAccountReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(vendorAccount)
          );
          const diffReserveTokenVendorFee = vendorAccountReserveTokenBalance.sub(
            prevvendorAccountReserveTokenBalance
          );

          mocHelper.assertBigReserve(diffMoCFees, expectedMoCFees, 'MoC fees are incorrect');
          mocHelper.assertBigReserve(
            diffReserveTokenCommission,
            expectedReserveTokenCommission,
            'commissions account balance is incorrect'
          );
          mocHelper.assertBigReserve(
            diffReserveTokenVendorFee,
            expectedReserveTokenVendorFee,
            'vendor account ReserveToken balance is incorrect'
          );
        });
      });
      describe('GIVEN since the user does not have MoC nor RiskPro balance, but there is MoC allowance', function() {
        it('WHEN a user tries to redeem ReserveTokens, THEN expect exception', async function() {
          const password = '!@superpassword';
          const failingAddress = await web3.eth.personal.newAccount(password);
          await web3.eth.personal.unlockAccount(failingAddress, password, 600);
          // User does not have RiskPro to redeem

          try {
            await mocHelper.mintMoCToken(failingAddress, 0, owner);
            await mocHelper.approveMoCToken(mocHelper.moc.address, 0, failingAddress);
            const tx = await mocHelper.redeemRiskPro(failingAddress, 10, vendorAccount);
            assert(tx === null, 'This should not happen');
          } catch (err) {
            assert(
              err.message.search(NOT_ENOUGH_FUNDS_ERROR) >= 0,
              'Sender does not have enough funds'
            );
          }
        });
      });
      describe('GIVEN since the address of the MoCToken is 0x0', function() {
        it('WHEN a user tries to redeem ReserveTokens, THEN fees are paid in ReserveToken', async function() {
          const mocTokenAddress = this.mocToken.address;

          // Set MoCToken address to 0
          await this.mockMocStateChanger.setMoCToken(zeroAddress);
          await this.governor.executeChange(mocHelper.mockMocStateChanger.address);

          const expectedMoCFees = 0; // commission + markup
          const mintAmount = 100;
          const redeemAmount = 100;
          const expectedReserveTokenCommission = 0.2; // redeemAmount * REDEEM_RISKPRO_FEES_RESERVE()
          const expectedReserveTokenVendorFee = 1; // redeemAmount * markup

          // Mint
          await mocHelper.mintRiskProAmount(
            otherAddress,
            mintAmount,
            vendorAccount,
            await mocHelper.mocInrate.MINT_RISKPRO_FEES_RESERVE()
          );

          // Calculate balances before redeeming
          const prevCommissionAccountBalance = toContractBN(
            await mocHelper.getReserveBalance(commissionsAccount)
          );
          const prevvendorAccountReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(vendorAccount)
          );
          const prevUserMoCBalance = await mocHelper.getMoCBalance(otherAddress);

          // Redeem
          await mocHelper.redeemRiskPro(otherAddress, redeemAmount, vendorAccount);

          const userMoCBalance = await mocHelper.getMoCBalance(otherAddress);
          const diffMoCFees = prevUserMoCBalance.sub(userMoCBalance);

          const commissionsBalance = toContractBN(
            await mocHelper.getReserveBalance(commissionsAccount)
          );
          const diffReserveTokenCommission = commissionsBalance.sub(prevCommissionAccountBalance);

          const vendorAccountReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(vendorAccount)
          );
          const diffReserveTokenVendorFee = vendorAccountReserveTokenBalance.sub(
            prevvendorAccountReserveTokenBalance
          );

          // Set MoCToken address back to its original address
          await this.mockMocStateChanger.setMoCToken(mocTokenAddress);
          await this.governor.executeChange(mocHelper.mockMocStateChanger.address);

          mocHelper.assertBigReserve(diffMoCFees, expectedMoCFees, 'MoC fees are incorrect');
          mocHelper.assertBigReserve(
            diffReserveTokenCommission,
            expectedReserveTokenCommission,
            'commissions account balance is incorrect'
          );
          mocHelper.assertBigReserve(
            diffReserveTokenVendorFee,
            expectedReserveTokenVendorFee,
            'vendor account ReserveToken balance is incorrect'
          );
        });
      });
      describe('GIVEN since the MoC price drops to 5000', function() {
        let prevUserReserveTokenBalance;
        let prevCommissionAccountBalance;
        let prevUserMoCBalance;
        let prevCommissionsAccountMoCBalance;
        let prevvendorAccountReserveTokenBalance;
        let prevVendorAccountMoCBalance;

        const mocPrice = 5000;
        const riskProToMint = 1000;
        const riskProToRedeem = 1000;
        const riskProToRedeemOnReserveToken = 1000;
        const commissionAmountReserveToken = 0;
        const vendorAmountReserveToken = 0;
        const commissionAmountMoC = 16;
        const vendorAmountMoC = 20;
        const mocAmount = 1000;

        beforeEach(async function() {
          // Set MoC price
          await mocHelper.setMoCPrice(mocPrice * mocHelper.MOC_PRECISION);

          await mocHelper.mintMoCToken(userAccount, mocAmount, owner);
          await mocHelper.approveMoCToken(mocHelper.moc.address, mocAmount, userAccount);

          // Mint
          const txTypeMint = await mocHelper.mocInrate.MINT_RISKPRO_FEES_MOC();
          await mocHelper.mintRiskProAmount(userAccount, riskProToMint, vendorAccount, txTypeMint);

          // Calculate balances before redeeming
          prevUserReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(userAccount)
          );
          prevCommissionAccountBalance = toContractBN(
            await mocHelper.getReserveBalance(commissionsAccount)
          );
          prevvendorAccountReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(vendorAccount)
          );
          prevUserMoCBalance = await mocHelper.getMoCBalance(userAccount);
          prevCommissionsAccountMoCBalance = await mocHelper.getMoCBalance(commissionsAccount);
          prevVendorAccountMoCBalance = await mocHelper.getMoCBalance(vendorAccount);

          await mocHelper.redeemRiskPro(userAccount, riskProToRedeem, vendorAccount);
        });
        describe('WHEN user tries to redeem ReserveTokens and fees are paid in MoC', function() {
          it(`THEN the user has ${riskProToRedeemOnReserveToken} more ReserveToken`, async function() {
            const userReserveTokenBalance = toContractBN(
              await mocHelper.getReserveBalance(userAccount)
            );
            const diff = userReserveTokenBalance.sub(prevUserReserveTokenBalance);

            mocHelper.assertBigReserve(
              diff,
              riskProToRedeemOnReserveToken,
              'user ReserveToken balance is incorrect'
            );
          });
          it(`THEN commission account balance increase by ${commissionAmountReserveToken} ReserveTokens`, async function() {
            const reserveTokenBalance = toContractBN(
              await mocHelper.getReserveBalance(commissionsAccount)
            );
            const balanceDiff = reserveTokenBalance.sub(prevCommissionAccountBalance);

            mocHelper.assertBigReserve(
              balanceDiff,
              commissionAmountReserveToken,
              'The commission account balance is incorrect'
            );
          });
          it(`THEN the vendor account ReserveToken balance has increase by ${vendorAmountReserveToken} ReserveTokens`, async function() {
            const vendorAccountReserveTokenBalance = toContractBN(
              await mocHelper.getReserveBalance(vendorAccount)
            );
            const diff = vendorAccountReserveTokenBalance.sub(prevvendorAccountReserveTokenBalance);

            mocHelper.assertBigReserve(
              diff,
              vendorAmountReserveToken,
              'vendor account balance is incorrect'
            );
          });
          it(`THEN the user MoC balance has decreased by ${commissionAmountMoC} MoCs by commissions + ${vendorAmountMoC} MoCs by vendor markup`, async function() {
            const userMoCBalance = await mocHelper.getMoCBalance(userAccount);
            const fees = toContractBN(commissionAmountMoC * mocHelper.MOC_PRECISION).add(
              toContractBN(vendorAmountMoC * mocHelper.MOC_PRECISION)
            );
            const diffFees = prevUserMoCBalance.sub(userMoCBalance);

            mocHelper.assertBig(diffFees, fees, 'MoC fees are incorrect');
          });
          it(`THEN the commissions account MoC balance has increased by ${commissionAmountMoC} MoCs`, async function() {
            const commissionsAccountMoCBalance = await mocHelper.getMoCBalance(commissionsAccount);
            const diff = commissionsAccountMoCBalance.sub(prevCommissionsAccountMoCBalance);

            mocHelper.assertBigReserve(
              diff,
              commissionAmountMoC,
              'commissions account MoC balance is incorrect'
            );
          });
          it(`THEN the vendor account MoC balance has increased by ${vendorAmountMoC} MoCs`, async function() {
            const vendorAccountMoCBalance = await mocHelper.getMoCBalance(vendorAccount);
            const diff = vendorAccountMoCBalance.sub(prevVendorAccountMoCBalance);
            mocHelper.assertBigReserve(
              diff,
              vendorAmountMoC,
              'vendor account MoC balance is incorrect'
            );
          });
        });
      });
    });
  });
});
