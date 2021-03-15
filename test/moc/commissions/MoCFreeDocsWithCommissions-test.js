const testHelperBuilder = require('../../mocHelper.js');

let mocHelper;
let toContractBN;

// eslint-disable-next-line quotes
const NOT_ENOUGH_FUNDS_ERROR = "sender doesn't have enough funds to send tx";

// TODO: test free StableTokens redeems with interests
contract('MoC', function([owner, userAccount, commissionsAccount, vendorAccount, otherAddress]) {
  before(async function() {
    const accounts = [owner, userAccount, commissionsAccount, vendorAccount, otherAddress];
    mocHelper = await testHelperBuilder({ owner, accounts, useMock: true });
    ({ toContractBN } = mocHelper);
    this.moc = mocHelper.moc;
    this.mocState = mocHelper.mocState;
    this.mockMocInrateChanger = mocHelper.mockMocInrateChanger;
    this.governor = mocHelper.governor;
    this.mocToken = mocHelper.mocToken;
    this.mockMocStateChanger = mocHelper.mockMocStateChanger;
    this.mocVendors = mocHelper.mocVendors;
  });

  describe('Free StableToken redeem with commissions and without interests', function() {
    describe('Redeem free StableTokens', function() {
      const scenarios = [
        // ReserveToken commission
        {
          // redeem 100 StableTokens when has 1000 free StableTokens
          params: {
            stableTokensToMint: 1000,
            stableTokensToRedeem: 100,
            // commissionsRate: 4, // REDEEM_STABLETOKENS_FEES_RESERVE = 0.004
            riskProToMint: 1,
            initialReserveTokenPrice: 10000,
            mocAmount: 0,
            vendorStaking: 100
          },
          expect: {
            stableTokensToRedeem: 100,
            // eslint-disable-next-line max-len
            stableTokensToRedeemOnReserveToken: 0.00986, // (stableTokensToRedeem / reserveTokenPrice) - ((stableTokensToRedeem / reserveTokenPrice) * commissionRate) - vendorAmountReserveToken
            commissionAddressBalance: 0.00004,
            commissionAmountMoC: 0,
            vendorAmountReserveToken: 0.0001, // ((stableTokensToRedeem / reserveTokenPrice) * markup = 0.01)
            vendorAmountMoC: 0
          }
        },
        {
          // Redeeming limited by free StableToken amount and user StableToken balance.
          params: {
            stableTokensToMint: 500,
            stableTokensToRedeem: 600,
            // commissionsRate: 0.2,
            riskProToMint: 1,
            initialReserveTokenPrice: 10000,
            mocAmount: 0,
            vendorStaking: 100
          },
          expect: {
            stableTokensToRedeem: 500,
            // eslint-disable-next-line max-len
            stableTokensToRedeemOnReserveToken: 0.0493, // (stableTokensToRedeem / reserveTokenPrice) - ((stableTokensToRedeem / reserveTokenPrice) * commissionRate) - vendorAmountReserveToken
            commissionAddressBalance: 0.0002,
            commissionAmountMoC: 0,
            vendorAmountReserveToken: 0.0005, // ((stableTokensToRedeem / reserveTokenPrice) * markup = 0.01)
            vendorAmountMoC: 0
          }
        },
        // MoC commission
        {
          // redeem 100 StableTokens when has 1000 free StableTokens
          params: {
            stableTokensToMint: 1000,
            stableTokensToRedeem: 100,
            // commissionsRate: 0,
            riskProToMint: 1,
            initialReserveTokenPrice: 10000,
            mocAmount: 1000,
            vendorStaking: 100
          },
          expect: {
            stableTokensToRedeem: 100,
            stableTokensToRedeemOnReserveToken: 0.01,
            commissionAddressBalance: 0,
            // eslint-disable-next-line max-len
            commissionAmountMoC: 0.0001, // (reserveTokenPrice * stableTokensToRedeemOnReserveToken / mocPrice) * REDEEM_STABLETOKENS_FEES_MOC = 0.01
            vendorAmountReserveToken: 0,
            vendorAmountMoC: 0.0001 // (reserveTokenPrice * stableTokensToRedeemOnReserveToken / mocPrice) * markup = 0.01
          }
        },
        {
          // Redeeming limited by free StableToken amount and user StableToken balance.
          params: {
            stableTokensToMint: 500,
            stableTokensToRedeem: 600,
            // commissionsRate: 0,
            riskProToMint: 1,
            initialReserveTokenPrice: 10000,
            mocAmount: 1000,
            vendorStaking: 100
          },
          expect: {
            stableTokensToRedeem: 500,
            stableTokensToRedeemOnReserveToken: 0.05,
            commissionAddressBalance: 0,
            // eslint-disable-next-line max-len
            commissionAmountMoC: 0.0005, // (reserveTokenPrice * stableTokensToRedeemOnReserveToken / mocPrice) * REDEEM_STABLETOKENS_FEES_MOC = 0.01
            vendorAmountReserveToken: 0,
            vendorAmountMoC: 0.0005 // (reserveTokenPrice * stableTokensToRedeemOnReserveToken / mocPrice) * markup = 0.01
          }
        }
      ];

      scenarios.forEach(async scenario => {
        describe(`GIVEN ${scenario.params.riskProToMint} RiskPro is minted and ReserveToken price is ${scenario.params.initialReserveTokenPrice} usd`, function() {
          let prevUserReserveTokenBalance;
          let prevUserStableTokenBalance;
          let prevCommissionsAccountReserveTokenBalance;
          let prevUserMoCBalance; // If user has MoC balance, then commission fees will be in MoC
          let prevCommissionsAccountMoCBalance;
          let prevVendorAccountReserveTokenBalance;
          let prevVendorAccountMoCBalance;

          beforeEach(async function() {
            await mocHelper.revertState();

            // Register vendor for test
            await mocHelper.registerVendor(vendorAccount, 0.01, owner);

            // this make the interests zero
            await this.mocState.setDaysToSettlement(0);

            // Commission rates for test are set in functionHelper.js
            await this.mockMocInrateChanger.setCommissionRates(
              await mocHelper.getCommissionsArrayNonZero()
            );

            // set commissions address
            await this.mockMocInrateChanger.setCommissionsAddress(commissionsAccount);
            // update params
            await this.governor.executeChange(this.mockMocInrateChanger.address);

            await mocHelper.mintMoCToken(userAccount, scenario.params.mocAmount, owner);
            await mocHelper.approveMoCToken(
              mocHelper.moc.address,
              scenario.params.mocAmount,
              userAccount
            );
            await mocHelper.mintMoCToken(vendorAccount, scenario.params.vendorStaking, owner);
            await mocHelper.approveMoCToken(
              this.mocVendors.address,
              scenario.params.vendorStaking,
              vendorAccount
            );
            await this.mocVendors.addStake(
              toContractBN(scenario.params.vendorStaking * mocHelper.MOC_PRECISION),
              { from: vendorAccount }
            );

            // Mint according to scenario
            const txTypeMintRiskPro =
              scenario.params.mocAmount === 0
                ? await mocHelper.mocInrate.MINT_RISKPRO_FEES_RESERVE()
                : await mocHelper.mocInrate.MINT_RISKPRO_FEES_MOC();
            const txTypeMintStableToken =
              scenario.params.mocAmount === 0
                ? await mocHelper.mocInrate.MINT_STABLETOKEN_FEES_RESERVE()
                : await mocHelper.mocInrate.MINT_STABLETOKEN_FEES_MOC();
            await mocHelper.mintRiskProAmount(
              userAccount,
              scenario.params.riskProToMint,
              vendorAccount,
              txTypeMintRiskPro
            );
            await mocHelper.mintStableTokenAmount(
              userAccount,
              scenario.params.stableTokensToMint,
              vendorAccount,
              txTypeMintStableToken
            );
            // Calculate balances before redeeming
            prevUserReserveTokenBalance = toContractBN(
              await mocHelper.getReserveBalance(userAccount)
            );
            prevUserStableTokenBalance = toContractBN(
              await mocHelper.getStableTokenBalance(userAccount)
            );
            prevCommissionsAccountReserveTokenBalance = toContractBN(
              await mocHelper.getReserveBalance(commissionsAccount)
            );
            prevUserMoCBalance = await mocHelper.getMoCBalance(userAccount);
            prevCommissionsAccountMoCBalance = await mocHelper.getMoCBalance(commissionsAccount);
            prevVendorAccountReserveTokenBalance = toContractBN(
              await mocHelper.getReserveBalance(vendorAccount)
            );
            prevVendorAccountMoCBalance = await mocHelper.getMoCBalance(vendorAccount);

            await mocHelper.redeemFreeStableToken({
              userAccount,
              stableTokenAmount: scenario.params.stableTokensToRedeem,
              vendorAccount
            });
          });
          describe(`WHEN ${scenario.params.stableTokensToRedeem} StableToken are redeeming`, function() {
            it(`THEN the user has ${scenario.expect.stableTokensToRedeemOnReserveToken} more ReserveToken`, async function() {
              const userReserveTokenBalance = toContractBN(
                await mocHelper.getReserveBalance(userAccount)
              );
              const diff = userReserveTokenBalance.sub(prevUserReserveTokenBalance);
              mocHelper.assertBigReserve(
                diff,
                scenario.expect.stableTokensToRedeemOnReserveToken,
                'user ReserveToken balance is incorrect'
              );
            });
            it(`THEN the user StableTokens balance decreased ${scenario.params.stableTokensToRedeem} StableTokens`, async function() {
              const userStableTokenBalance = toContractBN(
                await mocHelper.getStableTokenBalance(userAccount)
              );
              const diff = prevUserStableTokenBalance.sub(userStableTokenBalance);
              mocHelper.assertBigReserve(
                diff,
                scenario.expect.stableTokensToRedeem,
                'user StableToken balance is incorrect'
              );
            });
            it(`AND commissions account increase balance by ${scenario.expect.commissionAddressBalance} ReserveToken`, async function() {
              const reserveTokenBalance = toContractBN(
                await mocHelper.getReserveBalance(commissionsAccount)
              );
              const diff = reserveTokenBalance.sub(prevCommissionsAccountReserveTokenBalance);
              mocHelper.assertBigReserve(
                diff,
                scenario.expect.commissionAddressBalance,
                `Balance does not increase by ${scenario.expect.commissionAddressBalance} ReserveToken`
              );
            });
            it(`THEN the vendor account ReserveToken balance has increase by ${scenario.expect.vendorAmountReserveToken} StableTokens`, async function() {
              const vendorAccountReserveTokenBalance = toContractBN(
                await mocHelper.getReserveBalance(vendorAccount)
              );
              const diff = vendorAccountReserveTokenBalance.sub(
                prevVendorAccountReserveTokenBalance
              );

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
              const commissionsAccountMoCBalance = await mocHelper.getMoCBalance(
                commissionsAccount
              );
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
      });
    });

    describe('Non-scenario tests', function() {
      beforeEach(async function() {
        await mocHelper.revertState();
        // this make the interests zero
        await this.mocState.setDaysToSettlement(0);

        // Register vendor for test
        await mocHelper.registerVendor(vendorAccount, 0.01, owner);

        // MoC token for vendor
        const vendorStaking = 100;
        await mocHelper.mintMoCToken(vendorAccount, vendorStaking, owner);
        await mocHelper.approveMoCToken(this.mocVendors.address, vendorStaking, vendorAccount);
        await this.mocVendors.addStake(toContractBN(vendorStaking * mocHelper.MOC_PRECISION), {
          from: vendorAccount
        });

        // Commission rates for test are set in functionHelper.js
        await this.mockMocInrateChanger.setCommissionRates(
          await mocHelper.getCommissionsArrayNonZero()
        );

        // set commissions address
        await this.mockMocInrateChanger.setCommissionsAddress(commissionsAccount);
        // update params
        await this.governor.executeChange(this.mockMocInrateChanger.address);
      });
      describe('GIVEN since there is no allowance to pay fees in MoC', function() {
        it('WHEN a user tries to redeem StableToken with no MoC allowance, THEN fees are paid in ReserveToken', async function() {
          const mocAmountToMint = 1000;
          const mocAmountToApprove = 0;
          const ReserveTokenExpectedBalance = 0;
          await mocHelper.mintMoCToken(userAccount, mocAmountToMint, owner);
          await mocHelper.approveMoCToken(mocHelper.moc.address, mocAmountToApprove, userAccount);
          const prevUserMoCBalance = await mocHelper.getMoCBalance(userAccount);
          const prevUserReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(userAccount)
          );
          await mocHelper.redeemFreeStableToken({
            userAccount,
            stableTokenAmount: 10,
            vendorAccount
          });
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
            ReserveTokenExpectedBalance,
            'user ReserveToken balance is incorrect'
          );
        });
      });
      describe('GIVEN since the user does not have MoC, but there is MoC allowance AND ReserveToken balance', function() {
        it('WHEN a user tries to redeem StableToken with MoC allowance, THEN fees are paid in ReserveToken', async function() {
          // DO NOT mint MoC token on purpose
          await mocHelper.mintMoCToken(userAccount, 0, owner);
          await mocHelper.approveMoCToken(mocHelper.moc.address, 1000, otherAddress);
          const expectedMoCFees = 0; // commission + vendor fee
          const mintRiskProAmount = 1;
          const mintAmount = 1000;
          const redeemAmount = 100;
          const expectedReserveTokenCommission = 0.00004; // redeemAmount * REDEEM_STABLETOKENS_FEES_RESERVE() / reserveTokenPrice
          const expectedReserveTokenVendorFee = 0.0001; // redeemAmount * markup / reserveTokenPrice

          // Mint
          await mocHelper.mintRiskProAmount(
            otherAddress,
            mintRiskProAmount,
            vendorAccount,
            await mocHelper.mocInrate.MINT_RISKPRO_FEES_RESERVE()
          );
          await mocHelper.mintStableTokenAmount(
            otherAddress,
            mintAmount,
            vendorAccount,
            await mocHelper.mocInrate.MINT_STABLETOKEN_FEES_RESERVE()
          );

          // Calculate balances before redeeming
          const prevCommissionAccountBalance = toContractBN(
            await mocHelper.getReserveBalance(commissionsAccount)
          );
          const prevVendorAccountReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(vendorAccount)
          );
          const prevUserMoCBalance = await mocHelper.getMoCBalance(otherAddress);

          // Redeem
          await mocHelper.redeemFreeStableToken({
            userAccount: otherAddress,
            stableTokenAmount: redeemAmount,
            vendorAccount
          });

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
            prevVendorAccountReserveTokenBalance
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
      describe('GIVEN since the user does not have MoC nor StableToken balance, but there is MoC allowance', function() {
        it('WHEN a user tries to redeem StableToken, THEN expect exception', async function() {
          const password = '!@superpassword';
          const failingAddress = await web3.eth.personal.newAccount(password);
          await web3.eth.personal.unlockAccount(failingAddress, password, 600);
          // User does not have StableToken to redeem

          try {
            await mocHelper.mintMoCToken(failingAddress, 0, owner);
            await mocHelper.approveMoCToken(mocHelper.moc.address, 0, failingAddress);
            const tx = await mocHelper.redeemFreeStableToken({
              userAccount: failingAddress,
              stableTokenAmount: 10,
              vendorAccount
            });
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
        it('WHEN a user tries to redeem StableToken, THEN fees are paid in ReserveToken', async function() {
          const mocTokenAddress = this.mocToken.address;

          // Set MoCToken address to 0
          const zeroAddress = '0x0000000000000000000000000000000000000000';
          await this.mockMocStateChanger.setMoCToken(zeroAddress);
          await this.governor.executeChange(mocHelper.mockMocStateChanger.address);

          const expectedMoCFees = 0; // commission + vendor fee
          const mintRiskProAmount = 1;
          const mintAmount = 1000;
          const redeemAmount = 100;
          const expectedReserveTokenCommission = 0.00004; // redeemAmount * REDEEM_STABLETOKENS_FEES_RESERVE() / reserveTokenPrice
          const expectedReserveTokenVendorFee = 0.0001; // redeemAmount * markup / reserveTokenPrice

          // Mint
          await mocHelper.mintRiskProAmount(
            otherAddress,
            mintRiskProAmount,
            vendorAccount,
            await mocHelper.mocInrate.MINT_RISKPRO_FEES_RESERVE()
          );
          await mocHelper.mintStableTokenAmount(
            otherAddress,
            mintAmount,
            vendorAccount,
            await mocHelper.mocInrate.MINT_STABLETOKEN_FEES_RESERVE()
          );

          // Calculate balances before redeeming
          const prevCommissionAccountBalance = toContractBN(
            await mocHelper.getReserveBalance(commissionsAccount)
          );
          const prevVendorAccountReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(vendorAccount)
          );
          const prevUserMoCBalance = await mocHelper.getMoCBalance(otherAddress);

          // Redeem
          await mocHelper.redeemFreeStableToken({
            userAccount: otherAddress,
            stableTokenAmount: redeemAmount,
            vendorAccount
          });

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
            prevVendorAccountReserveTokenBalance
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
        let prevUserStableTokenBalance;
        let prevCommissionsAccountReserveTokenBalance;
        let prevUserMoCBalance; // If user has MoC balance, then commission fees will be in MoC
        let prevCommissionsAccountMoCBalance;
        let prevVendorAccountReserveTokenBalance;
        let prevVendorAccountMoCBalance;

        // redeem 100 StableTokens when has 1000 free StableTokens
        const mocPrice = 5000;
        const riskProToMint = 1;
        const stableTokensToMint = 1000;
        const stableTokensToRedeem = 100;
        const stableTokensToRedeemOnReserveToken = 0.01;
        const stableTokensToRedeemExpected = 100;
        const commissionAddressBalance = 0;
        const vendorAmountReserveToken = 0;
        // eslint-disable-next-line max-len
        const commissionAmountMoC = 0.0002; // (reserveTokenPrice * stableTokensToRedeemOnReserveToken / mocPrice) * REDEEM_STABLETOKENS_FEES_MOC = 0.01
        const vendorAmountMoC = 0.0002; // (reserveTokenPrice * stableTokensToRedeemOnReserveToken / mocPrice) * markup = 0.01
        const mocAmount = 1000;

        beforeEach(async function() {
          // Set MoC price
          await mocHelper.setMoCPrice(mocPrice * mocHelper.MOC_PRECISION);

          await mocHelper.mintMoCToken(userAccount, mocAmount, owner);
          await mocHelper.approveMoCToken(mocHelper.moc.address, mocAmount, userAccount);

          // Mint according to scenario
          const txTypeMintRiskPro = await mocHelper.mocInrate.MINT_RISKPRO_FEES_MOC();
          const txTypeMintStableToken = await mocHelper.mocInrate.MINT_STABLETOKEN_FEES_MOC();
          await mocHelper.mintRiskProAmount(
            userAccount,
            riskProToMint,
            vendorAccount,
            txTypeMintRiskPro
          );
          await mocHelper.mintStableTokenAmount(
            userAccount,
            stableTokensToMint,
            vendorAccount,
            txTypeMintStableToken
          );
          // Calculate balances before redeeming
          prevUserReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(userAccount)
          );
          prevUserStableTokenBalance = toContractBN(
            await mocHelper.getStableTokenBalance(userAccount)
          );
          prevCommissionsAccountReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(commissionsAccount)
          );
          prevVendorAccountReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(vendorAccount)
          );
          prevUserMoCBalance = await mocHelper.getMoCBalance(userAccount);
          prevCommissionsAccountMoCBalance = await mocHelper.getMoCBalance(commissionsAccount);
          prevVendorAccountMoCBalance = await mocHelper.getMoCBalance(vendorAccount);

          await mocHelper.redeemFreeStableToken({
            userAccount,
            stableTokenAmount: stableTokensToRedeem,
            vendorAccount
          });
        });
        describe(`WHEN ${stableTokensToRedeem} StableToken are redeeming`, function() {
          it(`THEN the user has ${stableTokensToRedeemOnReserveToken} more ReserveToken`, async function() {
            const userReserveTokenBalance = toContractBN(
              await mocHelper.getReserveBalance(userAccount)
            );
            const diff = userReserveTokenBalance.sub(prevUserReserveTokenBalance);
            mocHelper.assertBigReserve(
              diff,
              stableTokensToRedeemOnReserveToken,
              'user ReserveToken balance is incorrect'
            );
          });
          it(`THEN the user StableTokens balance decreased ${stableTokensToRedeem} StableTokens`, async function() {
            const userStableTokenBalance = toContractBN(
              await mocHelper.getStableTokenBalance(userAccount)
            );
            const diff = prevUserStableTokenBalance.sub(userStableTokenBalance);
            mocHelper.assertBigReserve(
              diff,
              stableTokensToRedeemExpected,
              'user StableToken balance is incorrect'
            );
          });
          it(`AND commissions account increase balance by ${commissionAddressBalance} ReserveToken`, async function() {
            const reserveTokenBalance = toContractBN(
              await mocHelper.getReserveBalance(commissionsAccount)
            );
            const diff = reserveTokenBalance.sub(prevCommissionsAccountReserveTokenBalance);
            mocHelper.assertBigReserve(
              diff,
              commissionAddressBalance,
              `Balance does not increase by ${commissionAddressBalance} ReserveToken`
            );
          });
          it(`THEN the vendor account ReserveToken balance has increase by ${vendorAmountReserveToken} StableTokens`, async function() {
            const vendorAccountReserveTokenBalance = toContractBN(
              await mocHelper.getReserveBalance(vendorAccount)
            );
            const diff = vendorAccountReserveTokenBalance.sub(prevVendorAccountReserveTokenBalance);

            mocHelper.assertBigReserve(
              diff,
              vendorAmountReserveToken,
              'vendor account balance is incorrect'
            );
          });
          it(`THEN the user MoC balance has decreased by ${commissionAmountMoC} MoCs by commissions`, async function() {
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
