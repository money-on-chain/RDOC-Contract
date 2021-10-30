const { expectRevert } = require('openzeppelin-test-helpers');
const testHelperBuilder = require('../mocHelper.js');

let mocHelper;
let toContractBN;
const { BN } = web3.utils;
let BUCKET_C0;
contract('MoC', function([owner, userAccount, vendorAccount]) {
  before(async function() {
    const accounts = [owner, userAccount, vendorAccount];
    mocHelper = await testHelperBuilder({ owner, accounts });
    ({ toContractBN } = mocHelper);
    ({ BUCKET_C0 } = mocHelper);
    this.moc = mocHelper.moc;
    this.mocState = mocHelper.mocState;
    this.mocConnector = mocHelper.mocConnector;
  });

  describe('StableToken minting', function() {
    beforeEach(async function() {
      await mocHelper.revertState();

      // Register vendor for test
      await mocHelper.registerVendor(vendorAccount, 0, owner);
    });
    describe('GIVEN the coverage is below Cobj', function() {
      beforeEach(async function() {
        await mocHelper.mintRiskProAmount(userAccount, 1, vendorAccount);
        await mocHelper.mintStableTokenAmount(userAccount, 50000, vendorAccount);
        await mocHelper.setReserveTokenPrice(8000 * mocHelper.MOC_PRECISION);
      });
      describe('WHEN he tries to buy 1 StableToken', function() {
        it('THEN reverts for having the Coverage below Cobj', async function() {
          const coverage = await this.mocState.globalCoverage();
          const cobj = toContractBN(3 * mocHelper.MOC_PRECISION);
          assert(coverage.lt(cobj), 'Coverage is not below Cobj');

          const promise = mocHelper.mintStableTokenAmount(userAccount, 1, vendorAccount);

          await expectRevert.unspecified(promise);
        });
      });
    });

    describe('GIVEN the max StableToken available is 5000', function() {
      beforeEach(async function() {
        await mocHelper.mintRiskPro(userAccount, 1, vendorAccount);
      });
      describe('WHEN a user tries to mint 10000 StableTokens', function() {
        let prevReserveTokenBalance;
        beforeEach(async function() {
          prevReserveTokenBalance = toContractBN(await mocHelper.getReserveBalance(userAccount));
          await mocHelper.mintStableTokenAmount(userAccount, 10000, vendorAccount);
        });
        it('THEN he only receives 5000 StableTokens', async function() {
          const stableTokenBalance = await mocHelper.getStableTokenBalance(userAccount);
          mocHelper.assertBigDollar(stableTokenBalance, 5000, 'StableToken Balance is not 5000');
        });
        it('AND only spent 0.5 ReserveTokens + fee', async function() {
          const reserveTokenBalance = toContractBN(await mocHelper.getReserveBalance(userAccount));
          const diff = prevReserveTokenBalance.sub(toContractBN(reserveTokenBalance));
          mocHelper.assertBig(
            diff,
            '500000000000000000',
            'Balance does not decrease by 0.5 ReserveTokens'
          );
        });
      });
    });

    describe('GIVEN ReserveTokens price is 10000', function() {
      let payAmount;
      const reservePrice = 10000;
      [0, 10000].forEach(nStableTokens => {
        describe(`AND There are ${nStableTokens} StableTokens and 6 ReserveTokens`, function() {
          [1300, 1200].forEach(stableTokenAmount => {
            describe(`WHEN he tries to mint ${stableTokenAmount} ReserveTokens`, function() {
              const prev = {};
              beforeEach(async function() {
                // Load ReserveToken on the contract to increase coverage
                await mocHelper.mintRiskProAmount(owner, 6, vendorAccount);

                if (nStableTokens) {
                  await mocHelper.mintStableTokenAmount(owner, nStableTokens, vendorAccount);
                }
                [
                  prev.userBalance,
                  prev.mocBalance,
                  prev.c0StableTokenBalance,
                  prev.c0ReserveTokenBalance
                ] = await Promise.all([
                  mocHelper.getReserveBalance(userAccount),
                  mocHelper.getReserveBalance(this.moc.address),
                  this.mocState.getBucketNStableToken(BUCKET_C0),
                  this.mocState.getBucketNReserve(BUCKET_C0)
                ]);

                await mocHelper.mintStableTokenAmount(
                  userAccount,
                  stableTokenAmount,
                  vendorAccount
                );
                payAmount = new BN(stableTokenAmount)
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

              it('AND C0 Bucket ReserveTokens balance increases by the correct amount of ReserveTokens', async function() {
                const c0ReserveTokenBalance = await this.mocState.getBucketNReserve(BUCKET_C0);
                const diff = c0ReserveTokenBalance.sub(prev.c0ReserveTokenBalance);

                mocHelper.assertBig(
                  diff,
                  payAmount,
                  `C0 ReserveTokens balance should rise  ${payAmount} ReserveTokens`
                );
              });

              it(`AND C0 Bucket StableToken balance increases by  ${stableTokenAmount} StableToken`, async function() {
                const c0StableTokenBalance = await this.mocState.getBucketNStableToken(BUCKET_C0);
                const diff = c0StableTokenBalance.sub(prev.c0StableTokenBalance);

                mocHelper.assertBigDollar(
                  diff,
                  stableTokenAmount,
                  `C0 StableToken balance should rise  ${stableTokenAmount} StableToken`
                );
              });

              it('AND User Balance decreases by the correct amount of  ReserveTokens (and fees)', async function() {
                const userBalance = await mocHelper.getReserveBalance(userAccount);
                const diff = new BN(prev.userBalance).sub(new BN(userBalance));

                mocHelper.assertBig(
                  diff,
                  payAmount,
                  `Should decrease by Tokens cost, ${payAmount} ReserveTokens`
                );
              });
            });
          });
        });
      });
    });
  });
});
