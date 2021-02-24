const { assert } = require('chai');
const { expectRevert } = require('openzeppelin-test-helpers');
const testHelperBuilder = require('../../mocHelper.js');

let mocHelper;
let toContractBN;

const { BN } = web3.utils;

// eslint-disable-next-line quotes
const NOT_ENOUGH_FUNDS_ERROR = "sender doesn't have enough funds to send tx";

contract('MoC: MoCExchange', function([
  owner,
  userAccount,
  commissionsAccount,
  vendorAccount,
  otherAddress
]) {
  before(async function() {
    const accounts = [owner, userAccount, commissionsAccount, vendorAccount];
    mocHelper = await testHelperBuilder({ owner, accounts });
    ({ toContractBN } = mocHelper);
    this.moc = mocHelper.moc;
    this.mockMocInrateChanger = mocHelper.mockMocInrateChanger;
    this.governor = mocHelper.governor;
    this.mocToken = mocHelper.mocToken;
    this.mockMocStateChanger = mocHelper.mockMocStateChanger;
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

    // Commission rates for test are set in functionHelper.js
    await mocHelper.mockMocInrateChanger.setCommissionRates(
      await mocHelper.getCommissionsArrayNonZero()
    );

    // set commissions address
    await mocHelper.mockMocInrateChanger.setCommissionsAddress(commissionsAccount);
    // update params
    await mocHelper.governor.executeChange(mocHelper.mockMocInrateChanger.address);
  });

  describe('RiskPro minting with commissions', function() {
    const scenarios = [
      // Reserve fees
      {
        params: {
          riskProToMint: 1000,
          mocAmount: 0,
          vendorStaking: 100
        },
        expect: {
          riskProToMint: 1000,
          riskProToMintOnReserveToken: 1000,
          commissionAmountReserve: 1, // (riskProToMint * MINT_RISKPRO_FEES_RESERVE = 0.001)
          totalCostOnReserveToken: 1011,
          commissionAmountMoC: 0,
          vendorAmountReserve: 10, // (riskProToMint * markup = 0.01)
          vendorAmountMoC: 0
        }
      },
      // MoC fees
      {
        params: {
          riskProToMint: 1000,
          mocAmount: 1000,
          vendorStaking: 100
        },
        expect: {
          riskProToMint: 1000,
          riskProToMintOnReserveToken: 1000,
          commissionAmountReserve: 0,
          totalCostOnReserveToken: 1000,
          commissionAmountMoC: 7, // (riskProToMint * MINT_RISKPRO_FEES_MOC = 0.007)
          vendorAmountReserve: 0,
          vendorAmountMoC: 10 // (riskProToMint * markup = 0.01)
        }
      }
    ];
    scenarios.forEach(async scenario => {
      describe(`GIVEN ${scenario.params.riskProToMint} RiskPro are minted`, function() {
        let prevUsereserveTokenBalance;
        let prevUserRiskProBalance;
        let prevCommissionsAccountReserveTokenBalance;
        let prevMocReserveTokenBalance;
        let prevUserMoCBalance; // If user has MoC balance, then commission fees will be in MoC
        let prevCommissionsAccountMoCBalance;
        let prevVendorAccountReserveTokenBalance;
        let prevVendorAccountMoCBalance;

        beforeEach(async function() {
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
          // Set transaction type according to scenario
          const txType =
            scenario.params.mocAmount === 0
              ? await mocHelper.mocInrate.MINT_RISKPRO_FEES_RESERVE()
              : await mocHelper.mocInrate.MINT_RISKPRO_FEES_MOC();
          // Calculate balances before minting
          prevUserRiskProBalance = await mocHelper.getRiskProBalance(userAccount);
          prevUserReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(userAccount)
          );
          prevCommissionsAccountReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(commissionsAccount)
          );
          prevMocReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(this.moc.address)
          );
          prevUserMoCBalance = await mocHelper.getMoCBalance(userAccount);
          prevCommissionsAccountMoCBalance = await mocHelper.getMoCBalance(commissionsAccount);
          prevVendorAccountReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(vendorAccount)
          );
          prevVendorAccountMoCBalance = await mocHelper.getMoCBalance(vendorAccount);

          const mintTx = await mocHelper.mintRiskProAmount(
            userAccount,
            scenario.params.riskProToMint,
            vendorAccount,
            txType
          );
          toContractBN(await mocHelper.getTxCost(mintTx));
        });
        it(`THEN the user has ${scenario.expect.riskProToMint} more RiskPros`, async function() {
          const UserRiskProBalance = await mocHelper.getRiskProBalance(userAccount);
          const diff = UserRiskProBalance.sub(prevUserRiskProBalance);
          mocHelper.assertBigReserve(
            diff,
            scenario.expect.riskProToMint,
            'user riskPro balance is incorrect'
          );
        });
        it(`THEN the user ReserveTokens balance has decrease by ${scenario.expect.riskProToMintOnReserveToken} ReserveTokens by Mint + ${scenario.expect.commissionAmountReserveToken} ReserveTokens by commissions`, async function() {
          const usereserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(userAccount)
          );
          const diff = prevUsereserveTokenBalance.sub(usereserveTokenBalance);
          mocHelper.assertBigReserve(
            diff,
            scenario.expect.totalCostOnReserveToken,
            'user ReserveTokens balance is incorrect'
          );
        });
        it('THEN global balance increases by the correct amount of ReserveTokens', async function() {
          const mocReserveTokenBalance = await mocHelper.getReserveBalance(this.moc.address);
          const diff = new BN(mocReserveTokenBalance).sub(new BN(prevMocReserveTokenBalance));

          mocHelper.assertBigReserve(
            diff,
            scenario.expect.riskProToMintOnReserveToken,
            'Should increase sale total amount'
          );
        });
        it(`THEN the commissions account reserveToken balance has increase by ${scenario.expect.commissionAmountReserveToken} ReserveTokens`, async function() {
          const commissionsAccountReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(commissionsAccount)
          );
          const diff = commissionsAccountReserveTokenBalance.sub(
            prevCommissionsAccountReserveTokenBalance
          );
          mocHelper.assertBigReserve(
            diff,
            scenario.expect.commissionAmountReserveToken,
            'commissions account balance is incorrect'
          );
        });
        it(`THEN the vendor account Reserve balance has increase by ${scenario.expect.vendorAmountReserve} Reserves`, async function() {
          const vendorAccountReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(vendorAccount)
          );
          const diff = vendorAccountReserveTokenBalance.sub(prevVendorAccountReserveTokenBalance);

          mocHelper.assertBigReserve(
            diff,
            scenario.expect.vendorAmountReserve,
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
      describe('GIVEN since the user sends not enough amount to pay fees in Reserve', function() {
        it('WHEN a user tries to mint RiskPros with 10 Reserves and does not send to pay fees, THEN expect revert', async function() {
          const mintRiskPro = mocHelper.mintRiskPro(userAccount, 10, vendorAccount);
          await expectRevert(mintRiskPro, 'amount is not enough');
        });
      });
      describe('GIVEN since there is no allowance to pay fees in MoC', function() {
        it('WHEN a user tries to mint RiskPros with no MoC allowance, THEN expect revert', async function() {
          await mocHelper.mintMoCToken(userAccount, 1000, owner);
          // DO NOT approve MoC token on purpose
          const mintRiskPro = mocHelper.mintRiskPro(userAccount, 10, vendorAccount);
          await expectRevert(mintRiskPro, 'amount is not enough');
        });
      });
      describe('GIVEN since the user does not have MoC, but there is MoC allowance AND Reserve balance', function() {
        it('WHEN a user tries to mint RiskPros with MoC allowance, THEN fees are paid in Reserve', async function() {
          // DO NOT mint MoC token for user on purpose
          await mocHelper.approveMoCToken(mocHelper.moc.address, 1000, otherAddress);
          const expectedMoCFees = 0; // commission + vendor fee
          const mintAmount = 100;
          const expectedReserveCommission = 0.1; // mintAmount * MINT_RISKPRO_FEES_RESERVE()
          const expectedReserveVendorFee = 1; // mintAmount * markup

          // Calculate balances before minting
          const prevCommissionAccountBalance = toContractBN(
            await mocHelper.getReserveBalance(commissionsAccount)
          );
          const prevVendorAccountReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(vendorAccount)
          );
          const prevUserMoCBalance = await mocHelper.getMoCBalance(otherAddress);

          // Mint
          await mocHelper.mintRiskProAmount(
            otherAddress,
            mintAmount,
            vendorAccount,
            await mocHelper.mocInrate.MINT_RISKPRO_FEES_RESERVE()
          );

          const userMoCBalance = await mocHelper.getMoCBalance(otherAddress);
          const diffMoCFees = prevUserMoCBalance.sub(userMoCBalance);

          const commissionsBalance = toContractBN(
            await mocHelper.getReserveBalance(commissionsAccount)
          );
          const diffReserveCommission = commissionsBalance.sub(prevCommissionAccountBalance);

          const vendorAccountReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(vendorAccount)
          );
          const diffReserveVendorFee = vendorAccountReserveTokenBalance.sub(
            prevVendorAccountReserveTokenBalance
          );

          mocHelper.assertBigReserve(diffMoCFees, expectedMoCFees, 'MoC fees are incorrect');
          mocHelper.assertBigReserve(
            diffReserveCommission,
            expectedReserveCommission,
            'commissions account balance is incorrect'
          );
          mocHelper.assertBigReserve(
            diffReserveVendorFee,
            expectedReserveVendorFee,
            'vendor account Reserve balance is incorrect'
          );
        });
      });
      describe('GIVEN since the user does not have MoC nor Reserve balance, but there is MoC allowance', function() {
        it('WHEN a user tries to mint RiskPros, THEN expect exception', async function() {
          const password = '!@superpassword';
          const failingAddress = await web3.eth.personal.newAccount(password);
          await web3.eth.personal.unlockAccount(failingAddress, password, 600);

          await web3.eth.sendTransaction({
            from: owner,
            to: failingAddress,
            value: '10000000000000'
          });
          try {
            await mocHelper.mintRiskPro(failingAddress, 10, vendorAccount);
            assert.fail('Minting RiskPro should have failed');
          } catch (err) {
            assert(
              err.message.search(NOT_ENOUGH_FUNDS_ERROR) >= 0,
              'Sender does have enough funds'
            );
          }
        });
      });
      describe('GIVEN since the address of the MoCToken is 0x0', function() {
        it('WHEN a user tries to mint RiskPros, THEN fees are paid in Reserve', async function() {
          const mocTokenAddress = this.mocToken.address;

          // Set MoCToken address to 0
          const zeroAddress = '0x0000000000000000000000000000000000000000';
          await this.mockMocStateChanger.setMoCToken(zeroAddress);
          await mocHelper.governor.executeChange(mocHelper.mockMocStateChanger.address);

          const expectedMoCFees = 0; // commission + vendor fee
          const mintAmount = 100;
          const expectedReserveCommission = 0.1; // mintAmount * MINT_RISKPRO_FEES_RESERVE()
          const expectedReserveVendorFee = 1;

          // Calculate balances before minting
          const prevCommissionAccountBalance = toContractBN(
            await mocHelper.getReserveBalance(commissionsAccount)
          );
          const prevVendorAccountReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(vendorAccount)
          );
          const prevUserMoCBalance = await mocHelper.getMoCBalance(otherAddress);

          // Mint
          await mocHelper.mintRiskProAmount(
            otherAddress,
            mintAmount,
            vendorAccount,
            await mocHelper.mocInrate.MINT_RISKPRO_FEES_RESERVE()
          );

          const userMoCBalance = await mocHelper.getMoCBalance(otherAddress);
          const diffMoCFees = prevUserMoCBalance.sub(userMoCBalance);

          const commissionsBalance = toContractBN(
            await mocHelper.getReserveBalance(commissionsAccount)
          );
          const diffReserveCommission = commissionsBalance.sub(prevCommissionAccountBalance);

          const vendorAccountReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(vendorAccount)
          );
          const diffReserveVendorFee = vendorAccountReserveTokenBalance.sub(
            prevVendorAccountReserveTokenBalance
          );

          // Set MoCToken address back to its original address
          await this.mockMocStateChanger.setMoCToken(mocTokenAddress);
          await mocHelper.governor.executeChange(mocHelper.mockMocStateChanger.address);

          mocHelper.assertBigReserve(diffMoCFees, expectedMoCFees, 'MoC fees are incorrect');
          mocHelper.assertBigReserve(
            diffReserveCommission,
            expectedReserveCommission,
            'commissions account balance is incorrect'
          );
          mocHelper.assertBigReserve(
            diffReserveVendorFee,
            expectedReserveVendorFee,
            'vendor account Reserve balance is incorrect'
          );
        });
      });
      describe('GIVEN since the MoC price drops to 5000', function() {
        let prevUseReserveBalance;
        let prevUserRiskProBalance;
        let prevCommissionsAccountReserveTokenBalance;
        let prevVendorAccountReserveTokenBalance;
        let usedGas;
        let prevUserMoCBalance;
        let prevCommissionsAccountMoCBalance;
        let prevVendorAccountMoCBalance;

        const mocPrice = 5000;
        const riskProToMint = 1000;
        const RiskProToMintOnReserve = 1000;
        const commissionAmountReserve = 0;
        const vendorAmountReserve = 0;
        const totalCostOnReserveToken = 1000;
        const commissionAmountMoC = 14; // ReserveTokenPrice * (RiskProToMint * MINT_RiskPro_FEES_MOC) / mocPrice
        const vendorAmountMoC = 20; // ReserveTokenPrice * (RiskProToMint * markup) / mocPrice
        const mocAmount = 1000;

        beforeEach(async function() {
          // Set MoC price
          await mocHelper.setMoCPrice(mocPrice * mocHelper.MOC_PRECISION);

          await mocHelper.mintMoCToken(userAccount, mocAmount, owner);
          await mocHelper.approveMoCToken(mocHelper.moc.address, mocAmount, userAccount);
          // Set transaction type
          const txType = await mocHelper.mocInrate.MINT_RiskPro_FEES_MOC();
          // Calculate balances before minting
          prevUseReserveBalance = toContractBN(await mocHelper.getReserveBalance(userAccount));
          prevUserRiskProBalance = await mocHelper.getRiskProBalance(userAccount);
          prevCommissionsAccountReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(commissionsAccount)
          );
          prevVendorAccountReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(vendorAccount)
          );
          prevUserMoCBalance = await mocHelper.getMoCBalance(userAccount);
          prevCommissionsAccountMoCBalance = await mocHelper.getMoCBalance(commissionsAccount);
          prevVendorAccountMoCBalance = await mocHelper.getMoCBalance(vendorAccount);

          const mintTx = await mocHelper.mintRiskProAmount(
            userAccount,
            riskProToMint,
            vendorAccount,
            txType
          );
          usedGas = toContractBN(await mocHelper.getTxCost(mintTx));
        });
        describe('WHEN user tries to mint RiskPros and fees are paid in MoC', function() {
          it(`THEN the user has ${riskProToMint} more BitPros`, async function() {
            const UserRiskProBalance = await mocHelper.getRiskProBalance(userAccount);
            const diff = UserRiskProBalance.sub(prevUserRiskProBalance);
            mocHelper.assertBigReserve(diff, riskProToMint, 'user bitPro balance is incorrect');
          });
          it(`THEN the user Reserve balance has decrease by ${RiskProToMintOnReserve} Reserves by Mint + ${commissionAmountReserve} Reserves by commissions + ${vendorAmountReserve} Reserves by vendor markup`, async function() {
            const useReserveBalance = toContractBN(await mocHelper.getReserveBalance(userAccount));
            const diff = prevUseReserveBalance.sub(useReserveBalance).sub(usedGas);
            mocHelper.assertBigReserve(
              diff,
              totalCostOnReserveToken,
              'user Reserve balance is incorrect'
            );
          });
          it(`THEN the commissions account Reserve balance has increase by ${commissionAmountReserve} Reserves`, async function() {
            const commissionsAccountReserveTokenBalance = toContractBN(
              await mocHelper.getReserveBalance(commissionsAccount)
            );
            const diff = commissionsAccountReserveTokenBalance.sub(
              prevCommissionsAccountReserveTokenBalance
            );
            mocHelper.assertBigReserve(
              diff,
              commissionAmountReserve,
              'commissions account balance is incorrect'
            );
          });
          it(`THEN the vendor account Reserve balance has increase by ${vendorAmountReserve} Reserves`, async function() {
            const vendorAccountReserveTokenBalance = toContractBN(
              await mocHelper.getReserveBalance(vendorAccount)
            );
            const diff = vendorAccountReserveTokenBalance.sub(prevVendorAccountReserveTokenBalance);

            mocHelper.assertBigReserve(
              diff,
              vendorAmountReserve,
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
