const { expectRevert } = require('openzeppelin-test-helpers');
const testHelperBuilder = require('../../mocHelper.js');

let mocHelper;
let toContractBN;
const { BN } = web3.utils;
// eslint-disable-next-line quotes
const NOT_ENOUGH_FUNDS_ERROR = "sender doesn't have enough funds to send tx";

contract('MoC', function([owner, userAccount, commissionsAccount, vendorAccount, otherAddress]) {
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

  describe('StableToken minting paying Commissions', function() {
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

    // ReserveToken fees
    describe('(ReserveToken fees) GIVEN the max StableToken available is 5000', function() {
      beforeEach(async function() {
        // Add vendor stake
        await mocHelper.mintMoCToken(vendorAccount, 100, owner);
        await mocHelper.approveMoCToken(this.mocVendors.address, 100, vendorAccount);
        await this.mocVendors.addStake(toContractBN(100 * mocHelper.MOC_PRECISION), {
          from: vendorAccount
        });

        await mocHelper.mintRiskProAmount(
          userAccount,
          1,
          vendorAccount,
          await mocHelper.mocInrate.MINT_RISKPRO_FEES_RESERVE()
        );
      });
      describe('WHEN a user tries to mint 10000 StableTokens using ReserveToken fees', function() {
        let prevReserveTokenBalance;
        let prevCommissionsAccountReserveTokenBalance;
        let prevVendorAccountReserveTokenBalance;

        beforeEach(async function() {
          prevReserveTokenBalance = toContractBN(
            await mocHelper.getReserveTokenBalance(userAccount)
          );
          prevCommissionsAccountReserveTokenBalance = toContractBN(
            await mocHelper.getReserveTokenBalance(commissionsAccount)
          );
          prevVendorAccountReserveTokenBalance = toContractBN(
            await mocHelper.getReserveTokenBalance(vendorAccount)
          );

          await mocHelper.mintStableTokenAmount(
            userAccount,
            10000,
            vendorAccount,
            await mocHelper.mocInrate.MINT_STABLETOKEN_FEES_RESERVE()
          );
        });
        it('AND only spent 0.5 ReserveTokens + 0.0015 ReserveTokens commission + 0.005 ReserveTokens markup', async function() {
          // commission = 5000 * 0.003; markup = 5000 * 0.01
          const reserveTokenBalance = toContractBN(
            await mocHelper.getReserveTokenBalance(userAccount)
          );
          const diff = prevReserveTokenBalance.sub(toContractBN(reserveTokenBalance));

          mocHelper.assertBig(
            diff,
            '506500000000000000',
            'Balance does not decrease by 0.5 ReserveTokens + 0.0015 ReserveTokens commission + 0.005 ReserveTokens markup'
          );
        });
        it('AND User only spent on fees for 0.0015 ReserveTokens commission + 0.005 ReserveTokens markup', async function() {
          const reserveTokenBalance = toContractBN(
            await mocHelper.getReserveTokenBalance(userAccount)
          );
          const diff = prevReserveTokenBalance
            .sub(toContractBN(reserveTokenBalance))
            .sub(toContractBN(500000000000000000));

          mocHelper.assertBig(
            diff,
            '6500000000000000',
            'Should decrease by fees cost, 6500000000000000 ReserveTokens'
          );
        });
        it('AND commissions account increase balance by 0.0015 ReserveTokens', async function() {
          const reserveTokenBalance = toContractBN(
            await mocHelper.getReserveTokenBalance(commissionsAccount)
          );
          const diff = reserveTokenBalance.sub(
            toContractBN(prevCommissionsAccountReserveTokenBalance)
          );
          mocHelper.assertBig(
            diff,
            '1500000000000000',
            'Balance does not increase by 0.0015 ReserveTokens'
          );
        });
        it('AND vendors account increase balance by 0.005 ReserveTokens', async function() {
          const reserveTokenBalance = toContractBN(
            await mocHelper.getReserveTokenBalance(vendorAccount)
          );
          const diff = reserveTokenBalance.sub(toContractBN(prevVendorAccountReserveTokenBalance));
          mocHelper.assertBig(
            diff,
            '5000000000000000',
            'Balance does not increase by 0.005 ReserveTokens'
          );
        });
      });
    });

    describe('(ReserveToken fees) GIVEN ReserveTokens price is 10000', function() {
      let payAmount;
      let payComissionAmount;
      let payMarkupAmount;
      const reserveTokenPrice = 10000;
      [0, 10000].forEach(nStableTokens => {
        describe(`AND There are ${nStableTokens} StableTokens and 6 ReserveTokens`, function() {
          [
            { stableTokenAmount: 1300, commissionAmount: 3.9, markupAmount: 13 }, // commission = 1300 * 0.003, markup = 1300 * 0.01
            { stableTokenAmount: 1200, commissionAmount: 3.6, markupAmount: 12 } // commission = 1200 * 0.003 = 30, markup = 1200 * 0.01
          ].forEach(({ stableTokenAmount, commissionAmount, markupAmount }) => {
            describe(`WHEN he tries to mint ${stableTokenAmount} ReserveTokens`, function() {
              const prev = {};

              beforeEach(async function() {
                // Load Reserves on the contract to increase coverage
                await mocHelper.mintRiskProAmount(owner, 6, vendorAccount);

                // Add vendor stake
                await mocHelper.mintMoCToken(vendorAccount, 100, owner);
                await mocHelper.approveMoCToken(this.mocVendors.address, 100, vendorAccount);
                await this.mocVendors.addStake(toContractBN(100 * mocHelper.MOC_PRECISION), {
                  from: vendorAccount
                });

                if (nStableTokens) {
                  await mocHelper.mintStableTokenAmount(
                    owner,
                    nStableTokens,
                    vendorAccount,
                    await mocHelper.mocInrate.MINT_STABLETOKEN_FEES_RESERVE()
                  );
                }
                [
                  prev.userBalance,
                  prev.commissionsAccountBalance,
                  prev.mocBalance,
                  prev.vendorAccountBalance
                ] = await Promise.all([
                  mocHelper.getReserveTokenBalance(userAccount),
                  mocHelper.getReserveTokenBalance(commissionsAccount),
                  mocHelper.getReserveTokenBalance(this.moc.address),
                  mocHelper.getReserveTokenBalance(vendorAccount)
                ]);

                await mocHelper.mintStableTokenAmount(
                  userAccount,
                  stableTokenAmount,
                  vendorAccount,
                  await mocHelper.mocInrate.MINT_STABLETOKEN_FEES_RESERVE()
                );
                const _payAmount =
                  (stableTokenAmount * mocHelper.MOC_PRECISION) / reserveTokenPrice;
                payAmount = toContractBN(_payAmount);
                const _payComissionAmount =
                  (commissionAmount * mocHelper.MOC_PRECISION) / reserveTokenPrice;
                payComissionAmount = toContractBN(_payComissionAmount);
                const _payMarkupAmount =
                  (markupAmount * mocHelper.MOC_PRECISION) / reserveTokenPrice;
                payMarkupAmount = toContractBN(_payMarkupAmount);
              });

              // StableTokens received should be the dollar value of the total ReserveTokens sent
              it(`THEN he receives ${stableTokenAmount} StableTokens on his account`, async function() {
                const balance = await mocHelper.getStableTokenBalance(userAccount);

                mocHelper.assertBigDollar(
                  balance,
                  stableTokenAmount,
                  `${stableTokenAmount} was not in the first account`
                );
              });

              it('THEN global balance increases by the correct amount of ReserveTokens', async function() {
                const mocReserveTokenBalance = await mocHelper.getReserveTokenBalance(
                  this.moc.address
                );
                const diff = new BN(mocReserveTokenBalance).sub(new BN(prev.mocBalance));

                mocHelper.assertBig(diff, payAmount, 'Should increase sale total amount');
              });

              it('AND User Balance decreases by the correct amount of ReserveTokens, commission and markup', async function() {
                const userBalance = await mocHelper.getReserveTokenBalance(userAccount);
                const diff = new BN(prev.userBalance).sub(new BN(userBalance));
                const totalSpent = payAmount.add(payComissionAmount).add(payMarkupAmount);

                mocHelper.assertBig(
                  diff,
                  totalSpent,
                  `Should decrease by Tokens cost, ${totalSpent} ReserveTokens`
                );
              });
              it('AND Commissions Account Balance increase by the correct amount of commissions', async function() {
                const commissionsAccountBalance = await mocHelper.getReserveTokenBalance(
                  commissionsAccount
                );
                const diff = new BN(commissionsAccountBalance).sub(
                  new BN(prev.commissionsAccountBalance)
                );
                mocHelper.assertBig(
                  diff,
                  payComissionAmount,
                  `Should increase by Tokens commission, ${payComissionAmount} ReserveTokens`
                );
              });
              it('AND Vendor Account Balance increase by the correct amount of markup', async function() {
                const vendorAccountBalance = await mocHelper.getReserveTokenBalance(vendorAccount);
                const diff = new BN(vendorAccountBalance).sub(new BN(prev.vendorAccountBalance));
                mocHelper.assertBig(
                  diff,
                  payMarkupAmount,
                  `Should increase by Tokens commission, ${payMarkupAmount} ReserveTokens`
                );
              });
            });
          });
        });
      });
    });

    // MoC fees
    describe('(MoC fees) GIVEN the max StableToken available is 5000', function() {
      beforeEach(async function() {
        await mocHelper.mintMoCToken(userAccount, 100, owner);
        await mocHelper.approveMoCToken(mocHelper.moc.address, 100, userAccount);

        // Add vendor stake
        await mocHelper.mintMoCToken(vendorAccount, 100, owner);
        await mocHelper.approveMoCToken(this.mocVendors.address, 100, vendorAccount);
        await this.mocVendors.addStake(toContractBN(100 * mocHelper.MOC_PRECISION), {
          from: vendorAccount
        });

        await mocHelper.mintRiskProAmount(
          userAccount,
          1,
          vendorAccount,
          await mocHelper.mocInrate.MINT_RISKPRO_FEES_MOC()
        );
      });
      describe('WHEN a user tries to mint 10000 StableTokens using MoC commission', function() {
        let prevReserveTokenBalance;
        let prevUserMoCBalance; // If user has MoC balance, then commission fees will be in MoC
        let prevCommissionsAccountMoCBalance;
        let prevVendorAccountMoCBalance;
        beforeEach(async function() {
          prevReserveTokenBalance = toContractBN(
            await mocHelper.getReserveTokenBalance(userAccount)
          );
          prevUserMoCBalance = await mocHelper.getMoCBalance(userAccount);
          prevCommissionsAccountMoCBalance = await mocHelper.getMoCBalance(commissionsAccount);
          prevVendorAccountMoCBalance = await mocHelper.getMoCBalance(vendorAccount);

          await mocHelper.mintStableTokenAmount(
            userAccount,
            10000,
            vendorAccount,
            await mocHelper.mocInrate.MINT_STABLETOKEN_FEES_MOC()
          );
        });
        it('AND only spent 0.5 ReserveTokens + 0.0045 MoC commission + 0.005 MoC markup', async function() {
          // commission = 5000 * 0.009, markup = 5000 * 0.01
          const reserveTokenBalance = toContractBN(
            await mocHelper.getReserveTokenBalance(userAccount)
          );
          const diff = prevReserveTokenBalance.sub(toContractBN(reserveTokenBalance));
          // const expectedMoCCommission = '4500000000000000';
          // const expectedMoCMarkup = '5000000000000000';
          // const diffAmountMoC = new BN(prevUserMoCBalance).sub(
          //   new BN(expectedMoCCommission)).sub(new BN(expectedMoCMarkup));

          mocHelper.assertBig(
            diff,
            '500000000000000000',
            'Balance does not decrease by 0.5 ReserveTokens'
          );

          // mocHelper.assertBig(
          //   diffAmountMoC,
          //   '99988500000000000000',
          //   'Balance in MoC does not decrease by 0.0045 MoC'
          // );
        });
        it('AND User only spent on comissions and markup for 0.0045 MoC + 0.005 MoC', async function() {
          const reserveTokenBalance = await mocHelper.getReserveTokenBalance(userAccount);
          const userMoCBalance = await mocHelper.getMoCBalance(userAccount);
          const diff = prevReserveTokenBalance
            .sub(toContractBN(reserveTokenBalance))
            .sub(toContractBN('500000000000000000'));
          const expectedMoCFees = new BN('4500000000000000').add(new BN('5000000000000000'));
          const diffFeesMoC = new BN(prevUserMoCBalance).sub(new BN(userMoCBalance));

          mocHelper.assertBig(
            diff,
            0,
            'ReserveToken balance should not decrease by comission cost, which is paid in MoC'
          );

          mocHelper.assertBig(
            expectedMoCFees,
            diffFeesMoC,
            'Balance in MoC does not decrease by 0.045 + 0.005 MoC'
          );
        });
        it('AND commissions account increase balance by 0.0045 MoC', async function() {
          const commissionsAccountMoCBalance = await mocHelper.getMoCBalance(commissionsAccount);
          const expectedMoCCommission = '4500000000000000';
          const diff = new BN(commissionsAccountMoCBalance).sub(
            new BN(prevCommissionsAccountMoCBalance)
          );

          mocHelper.assertBig(
            diff.toString(),
            expectedMoCCommission,
            'Balance in MoC does not increase by 0.0045 ReserveTokens'
          );
        });
        it('AND vendor account increase balance by 0.005 MoC', async function() {
          const vendorAccountMoCBalance = await mocHelper.getMoCBalance(vendorAccount);
          const expectedMoCMarkup = '5000000000000000';
          const diff = new BN(vendorAccountMoCBalance).sub(new BN(prevVendorAccountMoCBalance));

          mocHelper.assertBig(
            diff.toString(),
            expectedMoCMarkup,
            'Balance in MoC does not increase by 0.0045 ReserveTokens'
          );
        });
      });
    });
    describe('GIVEN since the user sends not enough amount to pay comission', function() {
      it('WHEN a user tries to mint StableTokens with 1 ReserveTokens and does not send to pay fees, THEN expect revert', async function() {
        await mocHelper.mintRiskProAmount(
          userAccount,
          10,
          vendorAccount,
          await mocHelper.mocInrate.MINT_RISKPRO_FEES_RESERVE()
        );
        const mintStableToken = mocHelper.mintStableToken(
          userAccount,
          1,
          vendorAccount,
          await mocHelper.mocInrate.MINT_STABLETOKEN_FEES_RESERVE()
        );
        await expectRevert(mintStableToken, 'amount is not enough');
      });
    });
    describe('GIVEN since there is no allowance to pay comission in MoC', function() {
      it('WHEN a user tries to mint StableToken with no MoC allowance, THEN expect revert', async function() {
        await mocHelper.mintMoCToken(userAccount, 1000, owner);
        // DO NOT approve MoC token on purpose
        await mocHelper.mintRiskProAmount(
          userAccount,
          10,
          vendorAccount,
          await mocHelper.mocInrate.MINT_RISKPRO_FEES_RESERVE()
        );
        const mintStableToken = mocHelper.mintStableToken(
          userAccount,
          1,
          vendorAccount,
          await mocHelper.mocInrate.MINT_STABLETOKEN_FEES_RESERVE()
        );
        await expectRevert(mintStableToken, 'amount is not enough');
      });
    });
    describe('GIVEN since the user does not have MoC, but there is MoC allowance AND ReserveToken balance', function() {
      it('WHEN a user tries to mint StableToken with MoC allowance, THEN fees are paid in ReserveToken', async function() {
        // DO NOT mint MoC token on purpose
        await mocHelper.approveMoCToken(mocHelper.moc.address, 1000, otherAddress);
        const expectedMoCFees = 0; // commission + vendor fee
        const mintRiskProAmount = 1;
        const mintStableTokenAmount = 10;
        const expectedReserveTokenCommission = 0.000003; // mintStableTokenAmount / reserveTokenPrice * MINT_STABLETOKEN_FEES_RESERVE()
        const expectedReserveTokenVendorFee = 0.00001; // mintStableTokenAmount / reserveTokenPrice * markup

        // Add vendor stake
        await mocHelper.mintMoCToken(vendorAccount, 100, owner);
        await mocHelper.approveMoCToken(this.mocVendors.address, 100, vendorAccount);
        await this.mocVendors.addStake(toContractBN(100 * mocHelper.MOC_PRECISION), {
          from: vendorAccount
        });

        await mocHelper.mintRiskProAmount(
          userAccount,
          mintRiskProAmount,
          vendorAccount,
          await mocHelper.mocInrate.MINT_RISKPRO_FEES_RESERVE()
        );

        // Calculate balances before minting
        const prevCommissionAccountBalance = toContractBN(
          await mocHelper.getReserveTokenBalance(commissionsAccount)
        );
        const prevVendorAccountReserveTokenBalance = toContractBN(
          await mocHelper.getReserveTokenBalance(vendorAccount)
        );
        const prevUserMoCBalance = await mocHelper.getMoCBalance(otherAddress);

        // Mint
        await mocHelper.mintStableTokenAmount(
          otherAddress,
          mintStableTokenAmount,
          vendorAccount,
          await mocHelper.mocInrate.MINT_STABLETOKEN_FEES_RESERVE()
        );

        const userMoCBalance = await mocHelper.getMoCBalance(otherAddress);
        const diffMoCFees = prevUserMoCBalance.sub(userMoCBalance);

        const commissionsBalance = toContractBN(
          await mocHelper.getReserveTokenBalance(commissionsAccount)
        );
        const diffReserveTokenCommission = commissionsBalance.sub(prevCommissionAccountBalance);

        const vendorAccountreserveTokenBalance = toContractBN(
          await mocHelper.getReserveTokenBalance(vendorAccount)
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
    describe('GIVEN since the user does not have MoC nor ReserveToken balance, but there is MoC allowance', function() {
      it('WHEN a user tries to mint StableToken, THEN expect exception', async function() {
        const password = '!@superpassword';
        const failingAddress = await web3.eth.personal.newAccount(password);
        await web3.eth.personal.unlockAccount(failingAddress, password, 600);

        try {
          await web3.eth.sendTransaction({
            from: owner,
            to: failingAddress,
            value: '10000000000000'
          });
          await mocHelper.mintMoCToken(failingAddress, 0, owner);
          await mocHelper.approveMoCToken(mocHelper.moc.address, 0, failingAddress);
          const txType = await mocHelper.mocInrate.MINT_STABLETOKEN_FEES_MOC();
          const mint = await mocHelper.mintStableToken(failingAddress, 10, vendorAccount, txType);
          assert(mint === null, 'This should not happen');
        } catch (err) {
          assert(
            err.message.search(NOT_ENOUGH_FUNDS_ERROR) >= 0,
            'Sender does not have enough funds'
          );
        }
      });
    });
    describe('GIVEN since the address of the MoCToken is 0x0', function() {
      it('WHEN a user tries to mint StableToken, THEN fees are paid in ReserveToken', async function() {
        const mocTokenAddress = this.mocToken.address;

        // Add vendor stake
        await mocHelper.mintMoCToken(vendorAccount, 100, owner);
        await mocHelper.approveMoCToken(this.mocVendors.address, 100, vendorAccount);
        await this.mocVendors.addStake(toContractBN(100 * mocHelper.MOC_PRECISION), {
          from: vendorAccount
        });

        // Set MoCToken address to 0
        const zeroAddress = '0x0000000000000000000000000000000000000000';
        await this.mockMocStateChanger.setMoCToken(zeroAddress);
        await this.governor.executeChange(mocHelper.mockMocStateChanger.address);

        const expectedMoCFees = 0; // commission + vendor fee
        const mintRiskProAmount = 1;
        const mintStableTokenAmount = 10;
        const expectedReserveTokenCommission = 0.000003; // mintStableTokenAmount / reserveTokenPrice * MINT_STABLETOKEN_FEES_RESERVE()
        const expectedReserveTokenVendorFee = 0.00001; // mintStableTokenAmount / reserveTokenPrice * markup

        await mocHelper.mintRiskProAmount(
          userAccount,
          mintRiskProAmount,
          vendorAccount,
          await mocHelper.mocInrate.MINT_RISKPRO_FEES_RESERVE()
        );

        // Calculate balances before minting
        const prevCommissionAccountBalance = toContractBN(
          await mocHelper.getReserveTokenBalance(commissionsAccount)
        );
        const prevVendorAccountReserveTokenBalance = toContractBN(
          await mocHelper.getReserveTokenBalance(vendorAccount)
        );
        const prevUserMoCBalance = await mocHelper.getMoCBalance(otherAddress);

        // Mint
        await mocHelper.mintStableTokenAmount(
          otherAddress,
          mintStableTokenAmount,
          vendorAccount,
          await mocHelper.mocInrate.MINT_STABLETOKEN_FEES_RESERVE()
        );

        const userMoCBalance = await mocHelper.getMoCBalance(otherAddress);
        const diffMoCFees = prevUserMoCBalance.sub(userMoCBalance);

        const commissionsBalance = toContractBN(
          await mocHelper.getReserveTokenBalance(commissionsAccount)
        );
        const diffReserveTokenCommission = commissionsBalance.sub(prevCommissionAccountBalance);

        const vendorAccountreserveTokenBalance = toContractBN(
          await mocHelper.getReserveTokenBalance(vendorAccount)
        );
        const diffReserveTokenVendorFee = vendorAccountreserveTokenBalance.sub(
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

    describe('(MoC fees) GIVEN ReserveTokens price is 10000', function() {
      let payAmount;
      let payComissionAmount;
      let payMarkupAmount;
      const reserveTokenPrice = 10000;
      const mocPrice = 10000;
      [0, 10000].forEach(nStableTokens => {
        describe(`AND There are ${nStableTokens} StableTokens and 6 ReserveTokens`, function() {
          [
            { stableTokenAmount: 1300, commissionAmount: 11.7, markupAmount: 13 }, // commission = 1300 * 0.009, markup = 1300 * 0.01
            { stableTokenAmount: 1200, commissionAmount: 10.8, markupAmount: 12 } // commission = 1200 * 0.009, markup = 1200 * 0.01
          ].forEach(({ stableTokenAmount, commissionAmount, markupAmount }) => {
            describe(`WHEN he tries to mint ${stableTokenAmount} ReserveTokens`, function() {
              const prev = {};

              beforeEach(async function() {
                // Load ReserveTokens on the contract to increase coverage
                await mocHelper.mintRiskProAmount(owner, 6, vendorAccount);

                // Load MoC on the user account
                await mocHelper.mintMoCToken(userAccount, 100, owner);
                await mocHelper.approveMoCToken(mocHelper.moc.address, 100, userAccount);

                // Add vendor stake
                await mocHelper.mintMoCToken(vendorAccount, 100, owner);
                await mocHelper.approveMoCToken(this.mocVendors.address, 100, vendorAccount);
                await this.mocVendors.addStake(toContractBN(100 * mocHelper.MOC_PRECISION), {
                  from: vendorAccount
                });

                if (nStableTokens) {
                  // owner mints
                  await mocHelper.mintStableTokenAmount(
                    owner,
                    nStableTokens,
                    vendorAccount,
                    await mocHelper.mocInrate.MINT_STABLETOKEN_FEES_RESERVE()
                  );
                }
                [
                  prev.userBalance,
                  prev.commissionsAccountBalance,
                  prev.mocBalance,
                  prev.userMoCBalance,
                  prev.commissionsAccountMoCBalance,
                  prev.vendorAccountBalance
                ] = await Promise.all([
                  mocHelper.getReserveTokenBalance(userAccount),
                  mocHelper.getReserveTokenBalance(commissionsAccount),
                  mocHelper.getReserveTokenBalance(this.moc.address),
                  mocHelper.getMoCBalance(userAccount),
                  mocHelper.getMoCBalance(commissionsAccount),
                  mocHelper.getMoCBalance(vendorAccount)
                ]);

                // userAccount mints
                await mocHelper.mintStableTokenAmount(
                  userAccount,
                  stableTokenAmount,
                  vendorAccount,
                  await mocHelper.mocInrate.MINT_STABLETOKEN_FEES_MOC()
                );
                const _payAmount =
                  (stableTokenAmount * mocHelper.MOC_PRECISION) / reserveTokenPrice;
                payAmount = toContractBN(_payAmount);
                const _payComissionAmount = (commissionAmount * mocHelper.MOC_PRECISION) / mocPrice;
                payComissionAmount = toContractBN(_payComissionAmount);
                const _payMarkupAmount =
                  (markupAmount * mocHelper.MOC_PRECISION) / reserveTokenPrice;
                payMarkupAmount = toContractBN(_payMarkupAmount);
              });

              // StableTokens received should be the dollar value of the total ReserveTokens sent
              it(`THEN he receives ${stableTokenAmount} StableTokens on his account`, async function() {
                const balance = await mocHelper.getStableTokenBalance(userAccount);

                mocHelper.assertBigDollar(
                  balance,
                  stableTokenAmount,
                  `${stableTokenAmount} was not in the first account`
                );
              });

              it('THEN global balance increases by the correct amount of ReserveTokens', async function() {
                const mocReserveTokenBalance = await mocHelper.getReserveTokenBalance(
                  this.moc.address
                );
                const diff = new BN(mocReserveTokenBalance).sub(new BN(prev.mocBalance));

                mocHelper.assertBig(diff, payAmount, 'Should increase sale total amount');
              });

              it('AND User Balance decreases by the correct amount of ReserveTokens', async function() {
                const userBalance = await mocHelper.getReserveTokenBalance(userAccount);
                const diff = new BN(prev.userBalance).sub(new BN(userBalance));
                const totalSpent = payAmount;

                mocHelper.assertBig(
                  diff,
                  totalSpent,
                  `Should decrease by Tokens cost, ${totalSpent} ReserveTokens`
                );
              });

              it('AND Commissions Account Balance does not change because fees are paid in MoC', async function() {
                const commissionsAccountBalance = await mocHelper.getReserveTokenBalance(
                  commissionsAccount
                );
                const diff = new BN(commissionsAccountBalance).sub(
                  new BN(prev.commissionsAccountBalance)
                );
                mocHelper.assertBig(diff, 0, 'Should not change');
              });

              it('AND User MoC Balance decreases by the correct amount of MoCs', async function() {
                const userMoCBalance = await mocHelper.getMoCBalance(userAccount);
                const diff = new BN(prev.userMoCBalance).sub(new BN(userMoCBalance));
                const totalSpent = payComissionAmount.add(payMarkupAmount);

                mocHelper.assertBig(
                  diff,
                  totalSpent,
                  `Should decrease by Tokens cost, ${totalSpent} MoC`
                );
              });

              it('AND Commissions Account MoC Balance increase by the correct amount of commissions', async function() {
                const commissionsAccountBalance = await mocHelper.getMoCBalance(commissionsAccount);
                const diff = new BN(commissionsAccountBalance).sub(
                  new BN(prev.commissionsAccountMoCBalance)
                );
                mocHelper.assertBig(
                  diff,
                  payComissionAmount,
                  `Should increase by Tokens commission, ${payComissionAmount} MoC`
                );
              });

              it('AND Vendor Account Balance increase by the correct amount of markup', async function() {
                const vendorAccountBalance = await mocHelper.getMoCBalance(vendorAccount);
                const diff = new BN(vendorAccountBalance).sub(new BN(prev.vendorAccountBalance));
                mocHelper.assertBig(
                  diff,
                  payMarkupAmount,
                  `Should increase by Tokens commission, ${payMarkupAmount} ReserveTokens`
                );
              });
            });
          });
        });
      });
    });

    describe('(MoC fees) GIVEN ReserveTokens price is 10000 and MoC price drops to 5000', function() {
      let payAmount;
      let payComissionAmount;
      let payMarkupAmount;
      const reserveTokenPrice = 10000;
      const mocPrice = 5000;

      [0, 10000].forEach(nStableTokens => {
        describe(`AND There are ${nStableTokens} StableTokens and 6 ReserveTokens`, function() {
          [
            { stableTokenAmount: 1300, commissionAmount: 11.7, markupAmount: 13 }, // commission = 1300 * 0.009, markup = 1300 * 0.01
            { stableTokenAmount: 1200, commissionAmount: 10.8, markupAmount: 12 } // commission = 1200 * 0.009, markup = 1200 * 0.01
          ].forEach(({ stableTokenAmount, commissionAmount, markupAmount }) => {
            describe(`WHEN he tries to mint ${stableTokenAmount} ReserveTokens`, function() {
              const prev = {};

              beforeEach(async function() {
                // Load ReserveTokens on the contract to increase coverage
                await mocHelper.mintRiskProAmount(owner, 6, vendorAccount);

                // Set MoC price
                await mocHelper.setMoCPrice(mocPrice * mocHelper.MOC_PRECISION);

                // Load MoC on the user account
                await mocHelper.mintMoCToken(userAccount, 100, owner);
                await mocHelper.approveMoCToken(mocHelper.moc.address, 100, userAccount);

                // Add vendor stake
                await mocHelper.mintMoCToken(vendorAccount, 100, owner);
                await mocHelper.approveMoCToken(this.mocVendors.address, 100, vendorAccount);
                await this.mocVendors.addStake(toContractBN(100 * mocHelper.MOC_PRECISION), {
                  from: vendorAccount
                });

                if (nStableTokens) {
                  // owner mints
                  await mocHelper.mintStableTokenAmount(
                    owner,
                    nStableTokens,
                    vendorAccount,
                    await mocHelper.mocInrate.MINT_STABLETOKEN_FEES_RESERVE()
                  );
                }
                [
                  prev.userBalance,
                  prev.commissionsAccountBalance,
                  prev.mocBalance,
                  prev.userMoCBalance,
                  prev.commissionsAccountMoCBalance,
                  prev.vendorAccountBalance
                ] = await Promise.all([
                  mocHelper.getReserveTokenBalance(userAccount),
                  mocHelper.getReserveTokenBalance(commissionsAccount),
                  mocHelper.getReserveTokenBalance(this.moc.address),
                  mocHelper.getMoCBalance(userAccount),
                  mocHelper.getMoCBalance(commissionsAccount),
                  mocHelper.getMoCBalance(vendorAccount)
                ]);

                // userAccount mints
                await mocHelper.mintStableTokenAmount(
                  userAccount,
                  stableTokenAmount,
                  vendorAccount,
                  await mocHelper.mocInrate.MINT_STABLETOKEN_FEES_MOC()
                );
                const _payAmount =
                  (stableTokenAmount * mocHelper.MOC_PRECISION) / reserveTokenPrice;
                payAmount = toContractBN(_payAmount);
                const _payComissionAmount = (commissionAmount * mocHelper.MOC_PRECISION) / mocPrice;
                payComissionAmount = toContractBN(_payComissionAmount);
                const _payMarkupAmount = (markupAmount * mocHelper.MOC_PRECISION) / mocPrice;
                payMarkupAmount = toContractBN(_payMarkupAmount);
              });

              // StableTokens received should be the dollar value of the total ReserveTokens sent
              it(`THEN he receives ${stableTokenAmount} StableTokens on his account`, async function() {
                const balance = await mocHelper.getStableTokenBalance(userAccount);

                mocHelper.assertBigDollar(
                  balance,
                  stableTokenAmount,
                  `${stableTokenAmount} was not in the first account`
                );
              });

              it('THEN global balance increases by the correct amount of ReserveTokens', async function() {
                const mocReserveTokenBalance = await mocHelper.getReserveTokenBalance(
                  this.moc.address
                );
                const diff = new BN(mocReserveTokenBalance).sub(new BN(prev.mocBalance));

                mocHelper.assertBig(diff, payAmount, 'Should increase sale total amount');
              });

              it('AND User Balance decreases by the correct amount of ReserveTokens', async function() {
                const userBalance = await mocHelper.getReserveTokenBalance(userAccount);
                const diff = new BN(prev.userBalance).sub(new BN(userBalance));
                const totalSpent = payAmount;

                mocHelper.assertBig(
                  diff,
                  totalSpent,
                  `Should decrease by Tokens cost, ${totalSpent} ReserveTokens`
                );
              });

              it('AND Commissions Account Balance does not change because fees are paid in MoC', async function() {
                const commissionsAccountBalance = await mocHelper.getReserveTokenBalance(
                  commissionsAccount
                );
                const diff = new BN(commissionsAccountBalance).sub(
                  new BN(prev.commissionsAccountBalance)
                );

                mocHelper.assertBig(diff, 0, 'Should not change');
              });

              it('AND User MoC Balance decreases by the correct amount of MoCs', async function() {
                const userMoCBalance = await mocHelper.getMoCBalance(userAccount);
                const diff = new BN(prev.userMoCBalance).sub(new BN(userMoCBalance));
                const totalSpent = payComissionAmount.add(payMarkupAmount);

                mocHelper.assertBig(
                  diff,
                  totalSpent,
                  `Should decrease by Tokens cost, ${totalSpent} MoC`
                );
              });

              it('AND Commissions Account MoC Balance increase by the correct amount of commissions', async function() {
                const commissionsAccountBalance = await mocHelper.getMoCBalance(commissionsAccount);
                const diff = new BN(commissionsAccountBalance).sub(
                  new BN(prev.commissionsAccountMoCBalance)
                );

                mocHelper.assertBig(
                  diff,
                  payComissionAmount,
                  `Should increase by Tokens commission, ${payComissionAmount} MoC`
                );
              });

              it('AND Vendor Account Balance increase by the correct amount of markup', async function() {
                const vendorAccountBalance = await mocHelper.getMoCBalance(vendorAccount);
                const diff = new BN(vendorAccountBalance).sub(new BN(prev.vendorAccountBalance));
                mocHelper.assertBig(
                  diff,
                  payMarkupAmount,
                  `Should increase by Tokens commission, ${payMarkupAmount} ReserveTokens`
                );
              });
            });
          });
        });
      });
    });
  });
});
