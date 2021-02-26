const testHelperBuilder = require('../../mocHelper.js');

let mocHelper;
let toContractBN;
let BUCKET_X2;

// eslint-disable-next-line quotes
const NOT_ENOUGH_FUNDS_ERROR = "sender doesn't have enough funds to send tx";

// TODO: test RiskProx redeems with interests
contract('MoC', function([owner, userAccount, commissionsAccount, vendorAccount, otherAddress]) {
  before(async function() {
    mocHelper = await testHelperBuilder({ owner, useMock: true });
    ({ toContractBN } = mocHelper);
    this.moc = mocHelper.moc;
    this.mocState = mocHelper.mocState;
    this.mockMocInrateChanger = mocHelper.mockMocInrateChanger;
    this.governor = mocHelper.governor;
    ({ BUCKET_X2 } = mocHelper);
    this.mocToken = mocHelper.mocToken;
    this.mockMocStateChanger = mocHelper.mockMocStateChanger;
    this.mockMoCVendorsChanger = mocHelper.mockMoCVendorsChanger;
    this.mocVendors = mocHelper.mocVendors;
  });

  describe('RiskProx redeem with commissions and without interests', function() {
    describe('Redeem RiskProxs', function() {
      const scenarios = [
        // ReserveToken commission
        {
          // redeem 1 RiskProx
          params: {
            stableTokensToMint: 10000,
            riskProxsToRedeem: 1,
            commissionRate: 0.006,
            riskProxToMint: 1,
            riskProToMint: 100,
            mocAmount: 0,
            vendorStaking: 100
          },
          expect: {
            riskProxsToRedeem: 1,
            riskProxsToRedeemOnReserveToken: 0.984,
            commissionAddressBalance: 0.006,
            commissionsOnReserveToken: 0.006, // (REDEEM_RISKPROX_FEES_RESERVE = 0.006)
            commissionAmountMoC: 0,
            vendorAmountReserveToken: 0.01, // (riskProxsToRedeem * markup = 0.01)
            vendorAmountMoC: 0
          }
        },
        {
          // Redeeming limited by max available to redeem.
          params: {
            stableTokensToMint: 50000,
            riskProxsToRedeem: 50,
            commissionRate: 0.006,
            riskProxToMint: 5,
            riskProToMint: 100,
            mocAmount: 0,
            vendorStaking: 100
          },
          expect: {
            riskProxsToRedeem: 5,
            riskProxsToRedeemOnReserveToken: 4.92,
            commissionAddressBalance: 0.03,
            commissionsOnReserveToken: 0.03, // (REDEEM_RISKPROX_FEES_RESERVE = 0.006)
            commissionAmountMoC: 0,
            vendorAmountReserveToken: 0.05, // (riskProxsToRedeem * markup = 0.01)
            vendorAmountMoC: 0
          }
        },
        // MoC commission
        {
          // redeem 1 RiskProx
          params: {
            stableTokensToMint: 10000,
            riskProxsToRedeem: 1,
            commissionRate: 0,
            riskProxToMint: 1,
            riskProToMint: 100,
            mocAmount: 1000,
            vendorStaking: 100
          },
          expect: {
            riskProxsToRedeem: 1,
            riskProxsToRedeemOnReserveToken: 1,
            commissionAddressBalance: 0,
            commissionsOnReserveToken: 0,
            commissionAmountMoC: 0.012, // (riskProxsToRedeem * REDEEM_RISKPROX_FEES_MOC = 0.012)
            vendorAmountReserveToken: 0,
            vendorAmountMoC: 0.01 // (riskProxsToRedeem * markup = 0.01)
          }
        },
        {
          // Redeeming limited by max available to redeem.
          params: {
            stableTokensToMint: 50000,
            riskProxsToRedeem: 50,
            commissionRate: 0,
            riskProxToMint: 5,
            riskProToMint: 100,
            mocAmount: 1000,
            vendorStaking: 100
          },
          expect: {
            riskProxsToRedeem: 5,
            riskProxsToRedeemOnReserveToken: 5,
            commissionAddressBalance: 0,
            commissionsOnReserveToken: 0,
            commissionAmountMoC: 0.06, // (riskProxsToRedeem * REDEEM_RISKPROX_FEES_MOC = 0.012)
            vendorAmountReserveToken: 0,
            vendorAmountMoC: 0.05 // (riskProxsToRedeem * markup = 0.01)
          }
        }
      ];

      scenarios.forEach(async scenario => {
        describe(`GIVEN ${scenario.params.riskProToMint} RiskPro and StableToken is minted`, function() {
          let prevUserReserveTokenBalance;
          let prevUserRiskProxBalance;
          let prevCommissionsAccountReserveTokenBalance;
          let prevUserMoCBalance; // If user has MoC balance, then commission fees will be in MoC
          let prevCommissionsAccountMoCBalance;
          let prevVendorAccountReserveTokenBalance;
          let prevVendorAccountMoCBalance;

          beforeEach(async function() {
            await mocHelper.revertState();

            // Register vendor for test
            await this.mockMoCVendorsChanger.setVendorsToRegister(
              await mocHelper.getVendorToRegisterAsArray(vendorAccount, 0.01)
            );
            await this.governor.executeChange(this.mockMoCVendorsChanger.address);

            // this make the interests zero
            await this.mocState.setDaysToSettlement(0);

            // Commission rates for test are set in functionHelper.js
            await mocHelper.mockMocInrateChanger.setCommissionRates(
              await mocHelper.getCommissionsArrayNonZero()
            );

            // set commissions address
            await mocHelper.mockMocInrateChanger.setCommissionsAddress(commissionsAccount);
            // update params
            await mocHelper.governor.executeChange(mocHelper.mockMocInrateChanger.address);

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
            const txTypeMintRiskProx =
              scenario.params.mocAmount === 0
                ? await mocHelper.mocInrate.MINT_RISKPROX_FEES_RESERVE()
                : await mocHelper.mocInrate.MINT_RISKPROX_FEES_MOC();
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
            await mocHelper.mintRiskProxAmount(
              userAccount,
              BUCKET_X2,
              scenario.params.riskProxToMint,
              vendorAccount,
              txTypeMintRiskProx
            );

            // Calculate balances before redeeming
            prevUserReserveTokenBalance = toContractBN(
              await mocHelper.getReserveBalance(userAccount)
            );
            prevUserRiskProxBalance = toContractBN(
              await mocHelper.getRiskProxBalance(BUCKET_X2, userAccount)
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

            const redeemTx = await mocHelper.redeemRiskProx(
              userAccount,
              BUCKET_X2,
              scenario.params.riskProxsToRedeem,
              vendorAccount
            );
          });
          describe(`WHEN ${scenario.params.riskProxsToRedeem} RiskProxs to redeeming`, function() {
            it(`THEN the user has ${scenario.expect.riskProxsToRedeemOnReserveToken} more ReserveToken`, async function() {
              const userReserveTokenBalance = toContractBN(
                await mocHelper.getReserveBalance(userAccount)
              );
              const diff = userReserveTokenBalance.sub(prevUserReserveTokenBalance);
              mocHelper.assertBigReserve(
                diff,
                scenario.expect.riskProxsToRedeemOnReserveToken,
                'user ReserveToken balance is incorrect'
              );
            });
            it(`THEN the user RiskProx balance  decreased ${scenario.params.riskProxsToRedeem} RiskProxs`, async function() {
              const userRiskProxBalance = toContractBN(
                await mocHelper.getRiskProxBalance(BUCKET_X2, userAccount)
              );
              const diff = prevUserRiskProxBalance.sub(userRiskProxBalance);
              mocHelper.assertBigReserve(
                diff,
                scenario.expect.riskProxsToRedeem,
                'user RiskProx balance  is incorrect'
              );
            });
            it(`THEN commissions account increase balance by ${scenario.expect.commissionAddressBalance} ReserveToken`, async function() {
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
            it(`THEN the vendor account ReserveToken balance has increase by ${scenario.expect.vendorAmountReserveToken} ReserveTokens`, async function() {
              const vendorAccountreserveTokenBalance = toContractBN(
                await mocHelper.getReserveBalance(vendorAccount)
              );
              const diff = vendorAccountreserveTokenBalance.sub(
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
        await this.mockMoCVendorsChanger.setVendorsToRegister(
          await mocHelper.getVendorToRegisterAsArray(vendorAccount, 0.01)
        );
        await this.governor.executeChange(this.mockMoCVendorsChanger.address);

        // MoC token for vendor
        const vendorStaking = 100;
        await mocHelper.mintMoCToken(vendorAccount, vendorStaking, owner);
        await mocHelper.approveMoCToken(this.mocVendors.address, vendorStaking, vendorAccount);
        await this.mocVendors.addStake(toContractBN(vendorStaking * mocHelper.MOC_PRECISION), {
          from: vendorAccount
        });

        // Commission rates for test are set in functionHelper.js
        await mocHelper.mockMocInrateChanger.setCommissionRates(
          await mocHelper.getCommissionsArrayNonZero()
        );

        // set commissions address
        await mocHelper.mockMocInrateChanger.setCommissionsAddress(commissionsAccount);
        // update params
        await mocHelper.governor.executeChange(mocHelper.mockMocInrateChanger.address);
      });
      describe('GIVEN since there is no allowance to pay fees in MoC', function() {
        it('WHEN a user tries to redeem RiskProx with no MoC allowance, THEN fees are paid in ReserveToken', async function() {
          const mocAmountToMint = 1000;
          const mocAmountToApprove = 0;
          const reserveTokenExpectedBalance = 0;
          await mocHelper.mintMoCToken(userAccount, mocAmountToMint, owner);
          await mocHelper.approveMoCToken(mocHelper.moc.address, mocAmountToApprove, userAccount);
          const prevUserMoCBalance = await mocHelper.getMoCBalance(userAccount);
          const prevUserReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(userAccount)
          );
          const tx = await mocHelper.redeemRiskProx(userAccount, BUCKET_X2, 10, vendorAccount);
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
        it('WHEN a user tries to redeem RiskProx with MoC allowance, THEN fees are paid in ReserveToken', async function() {
          // DO NOT mint MoC token on purpose
          await mocHelper.approveMoCToken(mocHelper.moc.address, 1000, otherAddress);
          const expectedMoCFees = 0; // commission + vendor fee
          const stableTokensToMint = 10000;
          const riskProxToMint = 1;
          const riskProxsToRedeem = 1;
          const riskProToMint = 100;
          const expectedReserveTokenCommission = 0.006; // riskProxsToRedeem * REDEEM_RISKPROX_FEES_RESERVE()
          const expectedReserveTokenVendorFee = 0.01; // riskProxsToRedeem * markup

          // Mint
          const txTypeMintRiskPro = await mocHelper.mocInrate.MINT_RISKPRO_FEES_RESERVE();
          const txTypeMintStableToken = await mocHelper.mocInrate.MINT_STABLETOKEN_FEES_RESERVE();
          const txTypeMintRiskProx = await mocHelper.mocInrate.MINT_RISKPROX_FEES_RESERVE();
          await mocHelper.mintRiskProAmount(
            otherAddress,
            riskProToMint,
            vendorAccount,
            txTypeMintRiskPro
          );
          await mocHelper.mintStableTokenAmount(
            otherAddress,
            stableTokensToMint,
            vendorAccount,
            txTypeMintStableToken
          );
          await mocHelper.mintRiskProxAmount(
            otherAddress,
            BUCKET_X2,
            riskProxToMint,
            vendorAccount,
            txTypeMintRiskProx
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
          await mocHelper.redeemRiskProx(otherAddress, BUCKET_X2, riskProxsToRedeem, vendorAccount);

          const userMoCBalance = await mocHelper.getMoCBalance(otherAddress);
          const diffMoCFees = prevUserMoCBalance.sub(userMoCBalance);

          const commissionsBalance = toContractBN(
            await mocHelper.getReserveBalance(commissionsAccount)
          );
          const diffReserveTokenCommission = commissionsBalance.sub(prevCommissionAccountBalance);

          const vendorAccountreserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(vendorAccount)
          );
          const diffReserveTokenVendorFee = vendorAccountreserveTokenBalance.sub(
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
      describe('GIVEN since the user does not have MoC nor RiskPro balance, but there is MoC allowance', function() {
        it('WHEN a user tries to redeem RiskProx, THEN expect exception', async function() {
          const password = '!@superpassword';
          const failingAddress = await web3.eth.personal.newAccount(password);
          await web3.eth.personal.unlockAccount(failingAddress, password, 600);
          // User does not have RiskPro to redeem

          try {
            await mocHelper.mintMoCToken(failingAddress, 0, owner);
            await mocHelper.approveMoCToken(mocHelper.moc.address, 0, failingAddress);
            const tx = await mocHelper.redeemRiskProx(userAccount, BUCKET_X2, 10, vendorAccount);
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
        it('WHEN a user tries to redeem RiskProx, THEN fees are paid in ReserveToken', async function() {
          const mocTokenAddress = this.mocToken.address;

          // Set MoCToken address to 0
          const zeroAddress = '0x0000000000000000000000000000000000000000';
          await this.mockMocStateChanger.setMoCToken(zeroAddress);
          await mocHelper.governor.executeChange(mocHelper.mockMocStateChanger.address);

          const expectedMoCFees = 0; // commission + vendor fee
          const stableTokensToMint = 10000;
          const riskProxToMint = 1;
          const riskProxsToRedeem = 1;
          const riskProToMint = 100;
          const expectedReserveTokenCommission = 0.006; // riskProxsToRedeem * REDEEM_RISKPROX_FEES_RESERVE()
          const expectedReserveTokenVendorFee = 0.01; // riskProxsToRedeem * markup

          // Mint
          const txTypeMintRiskPro = await mocHelper.mocInrate.MINT_RISKPRO_FEES_RESERVE();
          const txTypeMintStableToken = await mocHelper.mocInrate.MINT_STABLETOKEN_FEES_RESERVE();
          const txTypeMintRiskProx = await mocHelper.mocInrate.MINT_RISKPROX_FEES_RESERVE();
          await mocHelper.mintRiskProAmount(
            otherAddress,
            riskProToMint,
            vendorAccount,
            txTypeMintRiskPro
          );
          await mocHelper.mintStableTokenAmount(
            otherAddress,
            stableTokensToMint,
            vendorAccount,
            txTypeMintStableToken
          );
          await mocHelper.mintRiskProxAmount(
            otherAddress,
            BUCKET_X2,
            riskProxToMint,
            vendorAccount,
            txTypeMintRiskProx
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
          await mocHelper.redeemRiskProx(otherAddress, BUCKET_X2, riskProxsToRedeem, vendorAccount);

          const userMoCBalance = await mocHelper.getMoCBalance(otherAddress);
          const diffMoCFees = prevUserMoCBalance.sub(userMoCBalance);

          const commissionsBalance = toContractBN(
            await mocHelper.getReserveBalance(commissionsAccount)
          );
          const diffReserveTokenCommission = commissionsBalance.sub(prevCommissionAccountBalance);

          const vendorAccountreserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(vendorAccount)
          );
          const diffReserveTokenVendorFee = vendorAccountreserveTokenBalance.sub(
            prevVendorAccountReserveTokenBalance
          );

          // Set MoCToken address back to its original address
          await this.mockMocStateChanger.setMoCToken(mocTokenAddress);
          await mocHelper.governor.executeChange(mocHelper.mockMocStateChanger.address);

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
        let prevUserRiskProxBalance;
        let prevCommissionsAccountReserveTokenBalance;
        let prevUserMoCBalance; // If user has MoC balance, then commission fees will be in MoC
        let prevCommissionsAccountMoCBalance;
        let prevVendorAccountReserveTokenBalance;
        let prevVendorAccountMoCBalance;

        const mocPrice = 5000;
        const mocAmount = 1000;
        const riskProToMint = 100;
        const stableTokensToMint = 10000;
        const riskProxToMint = 1;
        const riskProxsToRedeem = 1;
        const riskProxsToRedeemOnReserveToken = 1;
        const commissionAddressBalance = 0;
        const commissionAmountMoC = 0.024;
        const vendorAmountReserveToken = 0;
        const vendorAmountMoC = 0.02;

        beforeEach(async function() {
          // Set MoC price
          await mocHelper.setMoCPrice(mocPrice * mocHelper.MOC_PRECISION);

          await mocHelper.mintMoCToken(userAccount, mocAmount, owner);
          await mocHelper.approveMoCToken(mocHelper.moc.address, mocAmount, userAccount);

          // Mint
          const txTypeMintRiskPro = await mocHelper.mocInrate.MINT_RISKPRO_FEES_MOC();
          const txTypeMintStableToken = await mocHelper.mocInrate.MINT_STABLETOKEN_FEES_MOC();
          const txTypeMintRiskProx = await mocHelper.mocInrate.MINT_RISKPROX_FEES_MOC();
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
          await mocHelper.mintRiskProxAmount(
            userAccount,
            BUCKET_X2,
            riskProxToMint,
            vendorAccount,
            txTypeMintRiskProx
          );

          // Calculate balances before redeeming
          prevUserReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(userAccount)
          );
          prevUserRiskProxBalance = toContractBN(
            await mocHelper.getRiskProxBalance(BUCKET_X2, userAccount)
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

          const redeemTx = await mocHelper.redeemRiskProx(
            userAccount,
            BUCKET_X2,
            riskProxsToRedeem,
            vendorAccount
          );
        });
        describe(`WHEN ${riskProxsToRedeem} RiskProxs to redeeming`, function() {
          it(`THEN the user has ${riskProxsToRedeemOnReserveToken} more ReserveToken`, async function() {
            const userReserveTokenBalance = toContractBN(
              await mocHelper.getReserveBalance(userAccount)
            );
            const diff = userReserveTokenBalance.sub(prevUserReserveTokenBalance);
            mocHelper.assertBigReserve(
              diff,
              riskProxsToRedeemOnReserveToken,
              'user ReserveToken balance is incorrect'
            );
          });
          it(`THEN the user RiskProx balance  decreased ${riskProxsToRedeem} RiskProxs`, async function() {
            const userRiskProxBalance = toContractBN(
              await mocHelper.getRiskProxBalance(BUCKET_X2, userAccount)
            );
            const diff = prevUserRiskProxBalance.sub(userRiskProxBalance);
            mocHelper.assertBigReserve(
              diff,
              riskProxsToRedeem,
              'user RiskProx balance  is incorrect'
            );
          });
          it(`THEN commissions account increase balance by ${commissionAddressBalance} ReserveToken`, async function() {
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
          it(`THEN the vendor account ReserveToken balance has increase by ${vendorAmountReserveToken} ReserveTokens`, async function() {
            const vendorAccountreserveTokenBalance = toContractBN(
              await mocHelper.getReserveBalance(vendorAccount)
            );
            const diff = vendorAccountreserveTokenBalance.sub(prevVendorAccountReserveTokenBalance);

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
