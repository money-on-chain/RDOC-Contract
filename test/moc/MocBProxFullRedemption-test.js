const testHelperBuilder = require('../mocHelper.js');

let mocHelper;
let BUCKET_X2;
contract('MoC: RedeemRiskProx', function([owner, vendorAccount, ...accounts]) {
  before(async function() {
    mocHelper = await testHelperBuilder({
      owner,
      accounts: [owner, vendorAccount, ...accounts],
      useMock: true
    });
    this.moc = mocHelper.moc;
    this.governor = mocHelper.governor;
    this.mockMoCVendorsChanger = mocHelper.mockMoCVendorsChanger;
    ({ BUCKET_X2 } = mocHelper);
  });

  beforeEach(async function() {
    await mocHelper.revertState();

    // Register vendor for test
    await this.mockMoCVendorsChanger.setVendorsToRegister(
      await mocHelper.getVendorToRegisterAsArray(vendorAccount, 0)
    );
    await this.governor.executeChange(this.mockMoCVendorsChanger.address);
  });

  const scenarios = [
    {
      description: 'One Position and price goes down',
      users: [
        {
          reservePrice: 9500.23,
          nRiskPro: 10,
          nStableToken: 10000,
          riskProxMint: {
            nReserve: 1
          }
        }
      ]
    },
    {
      description: 'Three positions and price goes up',
      // Loads X2 with nReserve: 1 and nStableToken: 10000
      users: [
        {
          nRiskPro: 5,
          nStableToken: 5000,
          riskProxMint: {
            nReserve: 0.5
          }
        },
        {
          reservePrice: 9668.33,
          nRiskPro: 5,
          nStableToken: 5000,
          riskProxMint: {
            nReserve: 0.6
          }
        },
        {
          reservePrice: 10883.33,
          nRiskPro: 5,
          nStableToken: 5000,
          riskProxMint: {
            nReserve: 0.3
          }
        }
      ]
    },
    {
      description: 'Two positions and price going down',
      // Loads X2 with nReserve: 1 and nStableToken: 10000
      users: [
        {
          reservePrice: 9668.33,
          nRiskPro: 5,
          nStableToken: 5000,
          riskProxMint: {
            nReserve: 0.4
          }
        },
        {
          reservePrice: 8000.33,
          nRiskPro: 5,
          nStableToken: 5000,
          riskProxMint: {
            nReserve: 0.6
          }
        }
      ]
    },
    {
      description: 'Two positions and price going up',
      // Loads X2 with nReserve: 1 and nStableToken: 10000
      users: [
        {
          reservePrice: 10233.33,
          nRiskPro: 5,
          nStableToken: 5000,
          riskProxMint: {
            nReserve: 0.4
          }
        },
        {
          reservePrice: 11023.33,
          nRiskPro: 5,
          nStableToken: 5000,
          riskProxMint: {
            nReserve: 0.6
          }
        }
      ]
    }
  ];
  scenarios.forEach(s => {
    describe(`GIVEN there are ${s.description}`, function() {
      beforeEach(async function() {
        await new Promise(resolve => {
          s.users.forEach(async (user, index) => {
            const account = accounts[index + 1];

            await mocHelper.mintRiskProAmount(account, user.nRiskPro, vendorAccount);
            await mocHelper.mintStableTokenAmount(account, user.nStableToken, vendorAccount);
            await mocHelper.mintRiskProx(
              account,
              BUCKET_X2,
              user.riskProxMint.nReserve,
              vendorAccount
            );
            if (index === s.users.length - 1) resolve();
          });
        });
      });
      describe(`WHEN all users redeem their ${BUCKET_X2} positions`, function() {
        it(`THEN ${BUCKET_X2} bucket should be empty`, async function() {
          await new Promise(resolve => {
            s.users.forEach(async (user, index) => {
              const userRiskProxBalance = await mocHelper.getRiskProxBalance(
                BUCKET_X2,
                accounts[index + 1]
              );

              if (user.reservePrice) {
                await mocHelper.setReserveTokenPrice(user.reservePrice * mocHelper.MOC_PRECISION);
              }

              await mocHelper.redeemBProx(
                accounts[index + 1],
                BUCKET_X2,
                userRiskProxBalance,
                vendorAccount
              );

              if (index === s.users.length - 1) resolve();
            });
          });

          const { nReserve, nRiskPro, nStableToken } = await mocHelper.getBucketState(BUCKET_X2);
          mocHelper.assertBig(nReserve, 0, 'nReserve is not empty');
          mocHelper.assertBig(nRiskPro, 0, 'nRiskPro is not empty');
          mocHelper.assertBig(nStableToken, 0, 'nStableToken is not empty');
        });
      });
    });
  });
});
