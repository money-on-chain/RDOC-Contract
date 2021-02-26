const { expectRevert } = require('openzeppelin-test-helpers');
const testHelperBuilder = require('../../mocHelper.js');

let mocHelper;
let toContractBN;
let BUCKET_X2;

// eslint-disable-next-line quotes
const NOT_ENOUGH_FUNDS_ERROR = "sender doesn't have enough funds to send tx";

contract('MoC : MoCExchange', function([
  owner,
  userAccount,
  commissionsAccount,
  vendorAccount,
  otherAddress
]) {
  before(async function() {
    const accounts = [owner, userAccount, commissionsAccount, vendorAccount, otherAddress];
    mocHelper = await testHelperBuilder({ owner, accounts, useMock: true });
    ({ toContractBN } = mocHelper);
    this.moc = mocHelper.moc;
    this.mocState = mocHelper.mocState;
    ({ BUCKET_X2 } = mocHelper);
    this.mocToken = mocHelper.mocToken;
    this.mockMocStateChanger = mocHelper.mockMocStateChanger;
    this.governor = mocHelper.governor;
    this.mockMoCVendorsChanger = mocHelper.mockMoCVendorsChanger;
    this.mocVendors = mocHelper.mocVendors;
  });

  beforeEach(async function() {
    await mocHelper.revertState();

    // Register vendor for test
    await this.mockMoCVendorsChanger.setVendorsToRegister(
      await mocHelper.getVendorToRegisterAsArray(vendorAccount, 0.01)
    );
    await this.governor.executeChange(this.mockMoCVendorsChanger.address);

    await this.mocState.setDaysToSettlement(toContractBN(0, 'DAY'));

    // Commission rates for test are set in functionHelper.js
    await mocHelper.mockMocInrateChanger.setCommissionRates(
      await mocHelper.getCommissionsArrayNonZero()
    );

    // set commissions address
    await mocHelper.mockMocInrateChanger.setCommissionsAddress(commissionsAccount);
    // update params
    await mocHelper.governor.executeChange(mocHelper.mockMocInrateChanger.address);
  });

  describe('RiskProx minting with commissions', function() {
    const scenarios = [
      // ReserveToken fees
      {
        params: {
          nRiskProx: 5,
          mocAmount: 0,
          vendorStaking: 100
        },
        expect: {
          nRiskProx: '5',
          nReserveToken: '5',
          totalCostOnReserveToken: '5.075',
          commission: {
            nReserveToken: '0.025' // (nRiskProx * MINT_RISKPROX_FEES_RESERVE = 0.005)
          },
          commissionAmountMoC: 0,
          vendorAmountReserveToken: 0.05, // (nRiskProx * markup = 0.01)
          vendorAmountMoC: 0
        }
      },
      {
        params: {
          nRiskProx: 10,
          mocAmount: 0,
          vendorStaking: 100
        },
        expect: {
          nRiskProx: '8',
          nReserveToken: '8',
          totalCostOnReserveToken: '8.12',
          commission: {
            nReserveToken: '0.04' // (nRiskProx * MINT_RISKPROX_FEES_RESERVE = 0.005)
          },
          commissionAmountMoC: 0,
          vendorAmountReserveToken: 0.08, // (nRiskProx * markup = 0.01)
          vendorAmountMoC: 0
        }
      },
      // MoC fees
      {
        params: {
          nRiskProx: 5,
          mocAmount: 1000,
          vendorStaking: 100
        },
        expect: {
          nRiskProx: '5',
          nReserveToken: '5',
          totalCostOnReserveToken: '5',
          commission: {
            nReserveToken: '0'
          },
          commissionAmountMoC: '0.055', // (nRiskProx * MINT_RISKPROX_FEES_MOC = 0.011)
          vendorAmountReserveToken: 0,
          vendorAmountMoC: 0.05 // (nRiskProx * markup = 0.01)
        }
      },
      {
        params: {
          nRiskProx: 10,
          mocAmount: 1000,
          vendorStaking: 100
        },
        expect: {
          nRiskProx: '8',
          nReserveToken: '8',
          totalCostOnReserveToken: '8',
          commission: {
            nReserveToken: '0'
          },
          commissionAmountMoC: '0.088', // (nRiskProx * MINT_RISKPROX_FEES_MOC = 0.011)
          vendorAmountReserveToken: 0,
          vendorAmountMoC: 0.08 // (nRiskProx * markup = 0.01)
        }
      }
    ];

    describe('GIVEN the user have 18 RiskPro and 8000 StableTokens and no interest is charged', function() {
      scenarios.forEach(async s => {
        describe(`WHEN a user sends ReserveTokens to mint ${s.params.nRiskProx} RiskProx`, function() {
          let initialCommissionAccountBalance;
          let prevUserReserveTokenBalance;
          let prevUserMoCBalance; // If user has MoC balance, then commission fees will be in MoC
          let prevCommissionsAccountMoCBalance;
          let prevVendorAccountReserveTokenBalance;
          let prevVendorAccountMoCBalance;

          beforeEach(async function() {
            await mocHelper.mintMoCToken(userAccount, s.params.mocAmount, owner);
            await mocHelper.approveMoCToken(mocHelper.moc.address, s.params.mocAmount, userAccount);
            await mocHelper.mintMoCToken(vendorAccount, s.params.vendorStaking, owner);
            await mocHelper.approveMoCToken(
              this.mocVendors.address,
              s.params.vendorStaking,
              vendorAccount
            );
            await this.mocVendors.addStake(
              toContractBN(s.params.vendorStaking * mocHelper.MOC_PRECISION),
              { from: vendorAccount }
            );
            // Mint according to scenario
            const txTypeMintRiskPro =
              s.params.mocAmount === 0
                ? await mocHelper.mocInrate.MINT_RISKPRO_FEES_RESERVE()
                : await mocHelper.mocInrate.MINT_RISKPRO_FEES_MOC();
            const txTypeMintStableToken =
              s.params.mocAmount === 0
                ? await mocHelper.mocInrate.MINT_STABLETOKEN_FEES_RESERVE()
                : await mocHelper.mocInrate.MINT_STABLETOKEN_FEES_MOC();
            await mocHelper.mintRiskProAmount(userAccount, 18, vendorAccount, txTypeMintRiskPro);
            await mocHelper.mintStableTokenAmount(
              userAccount,
              80000,
              vendorAccount,
              txTypeMintStableToken
            );

            // Calculate balances before minting
            initialCommissionAccountBalance = toContractBN(
              await mocHelper.getReserveBalance(commissionsAccount)
            );
            prevUserReserveTokenBalance = toContractBN(
              await mocHelper.getReserveBalance(userAccount)
            );
            initialCommissionAccountBalance = toContractBN(
              await mocHelper.getReserveBalance(commissionsAccount)
            );
            prevUserMoCBalance = await mocHelper.getMoCBalance(userAccount);
            prevCommissionsAccountMoCBalance = await mocHelper.getMoCBalance(commissionsAccount);
            prevVendorAccountReserveTokenBalance = toContractBN(
              await mocHelper.getReserveBalance(vendorAccount)
            );
            prevVendorAccountMoCBalance = await mocHelper.getMoCBalance(vendorAccount);

            // Set transaction type according to scenario
            const txType =
              s.params.mocAmount === 0
                ? await mocHelper.mocInrate.MINT_RISKPROX_FEES_RESERVE()
                : await mocHelper.mocInrate.MINT_RISKPROX_FEES_MOC();

            const tx = await mocHelper.mintRiskProxAmount(
              userAccount,
              BUCKET_X2,
              s.params.nRiskProx,
              vendorAccount,
              txType
            );
          });
          it(`THEN he receives ${s.expect.nRiskProx} RiskProx`, async function() {
            const balance = await mocHelper.getRiskProxBalance(BUCKET_X2, userAccount);
            mocHelper.assertBigReserveToken(
              balance,
              s.expect.nRiskProx,
              'RiskProx balance is incorrect'
            );
          });
          it(`THEN the user ReserveToken balance has decrease by ${s.expect.nReserveToken} ReserveTokens by Mint + ${s.expect.commission.nReserveToken} ReserveTokens by commissions + ${s.expect.vendorAmountReserveToken} ReserveTokens by markup`, async function() {
            const userReserveTokenBalance = toContractBN(
              await mocHelper.getReserveBalance(userAccount)
            );
            const diff = prevUserReserveTokenBalance.sub(userReserveTokenBalance);

            mocHelper.assertBigReserveToken(
              diff,
              s.expect.totalCostOnReserveToken,
              'user ReserveToken balance is incorrect'
            );
          });
          it('THEN the commissions accounts balance increase', async function() {
            const balance = toContractBN(await mocHelper.getReserveBalance(commissionsAccount));
            const diff = balance.sub(initialCommissionAccountBalance);
            const expected = toContractBN(s.expect.commission.nReserveToken, 'RES');
            mocHelper.assertBig(diff, expected, 'the commissions accounts balance is not correct');
          });
          it(`THEN the vendor account ReserveToken balance has increase by ${s.expect.vendorAmountReserveToken} ReserveTokens`, async function() {
            const vendorAccountReserveTokenBalance = toContractBN(
              await mocHelper.getReserveBalance(vendorAccount)
            );
            const diff = vendorAccountReserveTokenBalance.sub(prevVendorAccountReserveTokenBalance);

            mocHelper.assertBigReserveToken(
              diff,
              s.expect.vendorAmountReserveToken,
              'vendor account balance is incorrect'
            );
          });
          it(`THEN the user MoC balance has decreased by ${s.expect.commissionAmountMoC} MoCs by commissions + ${s.expect.vendorAmountMoC} MoCs by vendor markup`, async function() {
            const userMoCBalance = await mocHelper.getMoCBalance(userAccount);
            const fees = toContractBN(s.expect.commissionAmountMoC * mocHelper.MOC_PRECISION).add(
              toContractBN(s.expect.vendorAmountMoC * mocHelper.MOC_PRECISION)
            );
            const diffFees = prevUserMoCBalance.sub(userMoCBalance);

            mocHelper.assertBig(diffFees, fees, 'MoC fees are incorrect');
          });
          it(`THEN the commissions account MoC balance has increased by ${s.expect.commissionAmountMoC} MoCs`, async function() {
            const commissionsAccountMoCBalance = await mocHelper.getMoCBalance(commissionsAccount);
            const diff = commissionsAccountMoCBalance.sub(prevCommissionsAccountMoCBalance);
            mocHelper.assertBigReserveToken(
              diff,
              s.expect.commissionAmountMoC,
              'commissions account MoC balance is incorrect'
            );
          });
          it(`THEN the vendor account MoC balance has increased by ${s.expect.vendorAmountMoC} MoCs`, async function() {
            const vendorAccountMoCBalance = await mocHelper.getMoCBalance(vendorAccount);
            const diff = vendorAccountMoCBalance.sub(prevVendorAccountMoCBalance);
            mocHelper.assertBigReserveToken(
              diff,
              s.expect.vendorAmountMoC,
              'vendor account MoC balance is incorrect'
            );
          });
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
      describe('GIVEN since the user sends not enough amount to pay fees in ReserveToken', function() {
        it('WHEN a user tries to mint RiskProx with 10 ReserveTokens and does not send to pay fees, THEN expect revert', async function() {
          await mocHelper.mintRiskProAmount(
            userAccount,
            18,
            vendorAccount,
            await mocHelper.mocInrate.MINT_RISKPRO_FEES_RESERVE()
          );
          await mocHelper.mintStableToken(userAccount, 1000, vendorAccount);
          const mint = mocHelper.mintRiskProx(userAccount, BUCKET_X2, 8, vendorAccount, 8);
          await expectRevert(mint, 'amount is not enough');
        });
      });
      describe('GIVEN since there is no allowance to pay fees in MoC', function() {
        it('WHEN a user tries to mint RiskProx with no MoC allowance, THEN expect revert', async function() {
          await mocHelper.mintMoCToken(userAccount, 1000, owner);
          // DO NOT approve MoC token on purpose
          await mocHelper.mintRiskProAmount(
            userAccount,
            18,
            vendorAccount,
            await mocHelper.mocInrate.MINT_RISKPRO_FEES_RESERVE()
          );
          await mocHelper.mintStableToken(userAccount, 1000, vendorAccount);
          const mint = mocHelper.mintRiskProx(userAccount, BUCKET_X2, 8, vendorAccount, 8);
          await expectRevert(mint, 'amount is not enough');
        });
      });
      describe('GIVEN since the user does not have MoC, but there is MoC allowance AND ReserveToken balance', function() {
        it('WHEN a user tries to mint RiskProx with MoC allowance, THEN fees are paid in ReserveToken', async function() {
          // DO NOT mint MoC token on purpose
          await mocHelper.mintMoCToken(userAccount, 0, owner);
          await mocHelper.approveMoCToken(mocHelper.moc.address, 1000, otherAddress);
          const expectedMoCFees = 0; // commission + vendor fee
          const mintRiskProAmount = 1;
          const mintStableTokenAmount = 1000;
          const mintAmount = 0.1;
          const expectedReserveTokenCommission = 0.0005; // mintAmount * MINT_RISKPROX_FEES_RESERVE()
          const expectedReserveTokenVendorFee = 0.001; // mintAmount * markup

          // Mint
          await mocHelper.mintRiskProAmount(
            otherAddress,
            mintRiskProAmount,
            vendorAccount,
            await mocHelper.mocInrate.MINT_RISKPRO_FEES_RESERVE()
          );
          await mocHelper.mintStableTokenAmount(
            otherAddress,
            mintStableTokenAmount,
            vendorAccount,
            await mocHelper.mocInrate.MINT_STABLETOKEN_FEES_RESERVE()
          );

          // Calculate balances before minting
          const prevCommissionAccountBalance = toContractBN(
            await mocHelper.getReserveBalance(commissionsAccount)
          );
          const prevVendorAccountReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(vendorAccount)
          );
          const prevUserMoCBalance = await mocHelper.getMoCBalance(otherAddress);

          // Mint
          await mocHelper.mintRiskProxAmount(
            otherAddress,
            BUCKET_X2,
            mintAmount,
            vendorAccount,
            await mocHelper.mocInrate.MINT_RISKPROX_FEES_RESERVE()
          );

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

          mocHelper.assertBigReserveToken(diffMoCFees, expectedMoCFees, 'MoC fees are incorrect');
          mocHelper.assertBigReserveToken(
            diffReserveTokenCommission,
            expectedReserveTokenCommission,
            'commissions account balance is incorrect'
          );
          mocHelper.assertBigReserveToken(
            diffReserveTokenVendorFee,
            expectedReserveTokenVendorFee,
            'vendor account ReserveToken balance is incorrect'
          );
        });
      });
      describe('GIVEN since the user does not have MoC nor ReserveToken balance, but there is MoC allowance', function() {
        it('WHEN a user tries to mint RiskProx, THEN expect exception', async function() {
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
            const txType = await mocHelper.mocInrate.MINT_RISKPROX_FEES_MOC();
            const mint = await mocHelper.mintRiskProxAmount(
              failingAddress,
              BUCKET_X2,
              10,
              vendorAccount,
              txType
            );
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
        it('WHEN a user tries to mint RiskProx, THEN fees are paid in ReserveToken', async function() {
          const mocTokenAddress = this.mocToken.address;

          // Set MoCToken address to 0
          const zeroAddress = '0x0000000000000000000000000000000000000000';
          await this.mockMocStateChanger.setMoCToken(zeroAddress);
          await this.governor.executeChange(this.mockMocStateChanger.address);

          const expectedMoCFees = 0; // commission + vendor fee
          const mintRiskProAmount = 1;
          const mintStableTokenAmount = 1000;
          const mintAmount = 0.1;
          const expectedReserveTokenCommission = 0.0005; // mintAmount * MINT_RISKPROX_FEES_RESERVE()
          const expectedReserveTokenVendorFee = 0.001; // mintAmount * markup

          // Mint
          await mocHelper.mintRiskProAmount(
            otherAddress,
            mintRiskProAmount,
            vendorAccount,
            await mocHelper.mocInrate.MINT_RISKPRO_FEES_RESERVE()
          );
          await mocHelper.mintStableTokenAmount(
            otherAddress,
            mintStableTokenAmount,
            vendorAccount,
            await mocHelper.mocInrate.MINT_STABLETOKEN_FEES_RESERVE()
          );

          // Calculate balances before minting
          const prevCommissionAccountBalance = toContractBN(
            await mocHelper.getReserveBalance(commissionsAccount)
          );
          const prevVendorAccountReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(vendorAccount)
          );
          const prevUserMoCBalance = await mocHelper.getMoCBalance(otherAddress);

          // Mint
          await mocHelper.mintRiskProxAmount(
            otherAddress,
            BUCKET_X2,
            mintAmount,
            vendorAccount,
            await mocHelper.mocInrate.MINT_RISKPROX_FEES_RESERVE()
          );

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
          await this.governor.executeChange(this.mockMocStateChanger.address);

          mocHelper.assertBigReserveToken(diffMoCFees, expectedMoCFees, 'MoC fees are incorrect');
          mocHelper.assertBigReserveToken(
            diffReserveTokenCommission,
            expectedReserveTokenCommission,
            'commissions account balance is incorrect'
          );
          mocHelper.assertBigReserveToken(
            diffReserveTokenVendorFee,
            expectedReserveTokenVendorFee,
            'vendor account ReserveToken balance is incorrect'
          );
        });
      });
      describe('GIVEN since the MoC price drops to 5000', function() {
        let initialCommissionAccountBalance;
        let prevUserReserveTokenBalance;
        let prevUserMoCBalance;
        let prevCommissionsAccountMoCBalance;
        let prevVendorAccountReserveTokenBalance;
        let prevVendorAccountMoCBalance;

        const mocPrice = 5000;
        const mocAmount = 1000;
        const riskProAmount = 18;
        const stableTokenAmount = 80000;
        const nRiskProx = 5;
        const nReserveToken = 5;
        const commissionReserveToken = 0;
        const totalCostOnReserveToken = 5;
        const commissionAmountMoC = '0.11'; // reserveTokenPrice * (nRiskProx * MINT_RISKPROX_FEES_MOC) / mocPrice
        const vendorAmountReserveToken = 0;
        const vendorAmountMoC = '0.1'; // reserveTokenPrice * (nRiskProx * markup) / mocPrice

        beforeEach(async function() {
          // Set MoC price
          await mocHelper.setMoCPrice(mocPrice * mocHelper.MOC_PRECISION);

          await mocHelper.mintMoCToken(userAccount, mocAmount, owner);
          await mocHelper.approveMoCToken(mocHelper.moc.address, mocAmount, userAccount);

          // Mint
          const txTypeMintRiskPro = await mocHelper.mocInrate.MINT_RISKPRO_FEES_MOC();
          const txTypeMintStableToken = await mocHelper.mocInrate.MINT_STABLETOKEN_FEES_MOC();
          await mocHelper.mintRiskProAmount(
            userAccount,
            riskProAmount,
            vendorAccount,
            txTypeMintRiskPro
          );
          await mocHelper.mintStableTokenAmount(
            userAccount,
            stableTokenAmount,
            vendorAccount,
            txTypeMintStableToken
          );

          // Calculate balances before minting
          initialCommissionAccountBalance = toContractBN(
            await mocHelper.getReserveBalance(commissionsAccount)
          );
          prevUserReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(userAccount)
          );
          initialCommissionAccountBalance = toContractBN(
            await mocHelper.getReserveBalance(commissionsAccount)
          );
          prevVendorAccountReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(vendorAccount)
          );
          prevUserMoCBalance = await mocHelper.getMoCBalance(userAccount);
          prevCommissionsAccountMoCBalance = await mocHelper.getMoCBalance(commissionsAccount);
          prevVendorAccountMoCBalance = await mocHelper.getMoCBalance(vendorAccount);

          // Set transaction type
          const txType = await mocHelper.mocInrate.MINT_RISKPROX_FEES_MOC();

          const tx = await mocHelper.mintRiskProxAmount(
            userAccount,
            BUCKET_X2,
            nRiskProx,
            vendorAccount,
            txType
          );
        });
        it(`THEN he receives ${nRiskProx} RiskProx`, async function() {
          const balance = await mocHelper.getRiskProxBalance(BUCKET_X2, userAccount);
          mocHelper.assertBigReserveToken(balance, nRiskProx, 'RiskProx balance is incorrect');
        });
        it(`THEN the user ReserveToken balance has decrease by ${nReserveToken} ReserveTokens by Mint + ${commissionReserveToken} ReserveTokens by commissions + ${vendorAmountReserveToken} ReserveTokens by vendor markup`, async function() {
          const userReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(userAccount)
          );
          const diff = prevUserReserveTokenBalance.sub(userReserveTokenBalance);

          mocHelper.assertBigReserveToken(
            diff,
            totalCostOnReserveToken,
            'user ReserveToken balance is incorrect'
          );
        });
        it('THEN the commissions accounts balance increase', async function() {
          const balance = toContractBN(await mocHelper.getReserveBalance(commissionsAccount));
          const diff = balance.sub(initialCommissionAccountBalance);
          const expected = toContractBN(commissionReserveToken, 'RES');
          mocHelper.assertBig(diff, expected, 'the commissions accounts balance is not correct');
        });
        it(`THEN the vendor account ReserveToken balance has increase by ${vendorAmountReserveToken} ReserveTokens`, async function() {
          const vendorAccountReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(vendorAccount)
          );
          const diff = vendorAccountReserveTokenBalance.sub(prevVendorAccountReserveTokenBalance);

          mocHelper.assertBigReserveToken(
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
          mocHelper.assertBigReserveToken(
            diff,
            commissionAmountMoC,
            'commissions account MoC balance is incorrect'
          );
        });
        it(`THEN the vendor account MoC balance has increased by ${vendorAmountMoC} MoCs`, async function() {
          const vendorAccountMoCBalance = await mocHelper.getMoCBalance(vendorAccount);
          const diff = vendorAccountMoCBalance.sub(prevVendorAccountMoCBalance);
          mocHelper.assertBigReserveToken(
            diff,
            vendorAmountMoC,
            'vendor account MoC balance is incorrect'
          );
        });
      });
    });
  });
});
