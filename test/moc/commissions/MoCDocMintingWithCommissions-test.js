const testHelperBuilder = require('../../mocHelper.js');

let mocHelper;
let toContractBN;
const { BN } = web3.utils;

contract('MoC', function([owner, userAccount, commissionsAccount]) {
  before(async function() {
    const accounts = [owner, userAccount, commissionsAccount];
    mocHelper = await testHelperBuilder({ owner, accounts });
    ({ toContractBN } = mocHelper);
    this.moc = mocHelper.moc;
    this.mockMocInrateChanger = mocHelper.mockMocInrateChanger;
    this.governor = mocHelper.governor;
  });

  describe('StableToken minting paying Commissions', function() {
    beforeEach(async function() {
      await mocHelper.revertState();

      // set commissions rate
      await mocHelper.mockMocInrateChanger.setCommissionRate(toContractBN(0.5, 'RAT'));
      // set commissions address
      await mocHelper.mockMocInrateChanger.setCommissionsAddress(commissionsAccount);
      // update params
      await mocHelper.governor.executeChange(mocHelper.mockMocInrateChanger.address);
    });

    describe('GIVEN the max StableToken available is 5000', function() {
      beforeEach(async function() {
        await mocHelper.mintRiskProAmount(userAccount, 1);
      });
      describe('WHEN a user tries to mint 10000 StableTokens', function() {
        let prevReserveTokenBalance;
        let prevCommissionsAccountReserveTokenBalance;
        beforeEach(async function() {
          prevReserveTokenBalance = toContractBN(await mocHelper.getReserveBalance(userAccount));
          prevCommissionsAccountReserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(commissionsAccount)
          );
          await mocHelper.mintStableTokenAmount(userAccount, 10000);
        });
        it('AND only spent 0.5 ReserveTokens + 0.25 ReserveTokens commission', async function() {
          const reserveTokenBalance = toContractBN(await mocHelper.getReserveBalance(userAccount));
          const diff = prevReserveTokenBalance.sub(toContractBN(reserveTokenBalance));
          mocHelper.assertBig(
            diff,
            '750000000000000000',
            'Balance does not decrease by 0.5 ReserveTokens + 0.25 ReserveTokens commission'
          );
        });
        it('AND User only spent on comissions for 0.25 ReserveTokens', async function() {
          const reserveTokenBalance = toContractBN(await mocHelper.getReserveBalance(userAccount));
          const diff = prevReserveTokenBalance
            .sub(toContractBN(reserveTokenBalance))
            .sub(toContractBN(500000000000000000));

          mocHelper.assertBig(
            diff,
            '250000000000000000',
            'Should decrease by comission cost, 250000000000000000 ReserveTokens'
          );
        });
        it('AND commissions account increase balance by 0.25 ReserveTokens', async function() {
          const reserveTokenBalance = toContractBN(
            await mocHelper.getReserveBalance(commissionsAccount)
          );
          const diff = reserveTokenBalance.sub(
            toContractBN(prevCommissionsAccountReserveTokenBalance)
          );
          mocHelper.assertBig(
            diff,
            '250000000000000000',
            'Balance does not increase by 0.25 ReserveTokens'
          );
        });
      });
    });

    describe('GIVEN ReserveTokens price is 10000', function() {
      let payAmount;
      let payComissionAmount;
      const reservePrice = 10000;
      [0, 10000].forEach(nStableTokens => {
        describe(`AND There are ${nStableTokens} StableTokens and 6 ReserveTokens`, function() {
          [
            { stableTokenAmount: 1300, commissionAmount: 650 },
            { stableTokenAmount: 1200, commissionAmount: 600 }
          ].forEach(({ stableTokenAmount, commissionAmount }) => {
            describe(`WHEN he tries to mint ${stableTokenAmount} ReserveTokens`, function() {
              const prev = {};
              beforeEach(async function() {
                // Load Reserves on the contract to increase coverage
                await mocHelper.mintRiskProAmount(owner, 6);

                if (nStableTokens) {
                  await mocHelper.mintStableTokenAmount(owner, nStableTokens);
                }
                [
                  prev.userBalance,
                  prev.commissionsAccountBalance,
                  prev.mocBalance
                ] = await Promise.all([
                  mocHelper.getReserveBalance(userAccount),
                  mocHelper.getReserveBalance(commissionsAccount),
                  mocHelper.getReserveBalance(this.moc.address)
                ]);

                await mocHelper.mintStableTokenAmount(userAccount, stableTokenAmount);
                payAmount = new BN(stableTokenAmount)
                  .mul(mocHelper.MOC_PRECISION)
                  .div(new BN(reservePrice));
                payComissionAmount = new BN(commissionAmount)
                  .mul(mocHelper.MOC_PRECISION)
                  .div(new BN(reservePrice));
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
                const mocReserveTokenBalance = await mocHelper.getReserveBalance(this.moc.address);
                const diff = new BN(mocReserveTokenBalance).sub(new BN(prev.mocBalance));

                mocHelper.assertBig(diff, payAmount, 'Should increase sale total amount');
              });

              it('AND User Balance decreases by the correct amount of  ReserveTokens and commission', async function() {
                const userBalance = await mocHelper.getReserveBalance(userAccount);
                const diff = new BN(prev.userBalance).sub(new BN(userBalance));
                const totalSpent = payAmount.add(payComissionAmount);
                mocHelper.assertBig(
                  diff,
                  totalSpent,
                  `Should decrease by Tokens cost, ${totalSpent} ReserveTokens`
                );
              });
              it('AND Commissions Account Balance increase by the correct amount of commissions', async function() {
                const commissionsAccountBalance = await mocHelper.getReserveBalance(
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
            });
          });
        });
      });
    });
  });
});
