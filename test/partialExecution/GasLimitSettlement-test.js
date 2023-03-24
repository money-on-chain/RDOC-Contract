const testHelperBuilder = require('../mocHelper.js');
const { executeBatched } = require('../testHelpers/networkHelper');

let mocHelper;
let toContractBN;
let BUCKET_X2;
const RISKPROX_OWNERS_QUANTITY = 0;

const initializeSettlement = async (owner, vendorAccount, riskProxOwners) => {
  mocHelper.revertState();
  await mocHelper.mintRiskProAmount(owner, 10000, vendorAccount);
  await mocHelper.mintStableTokenAmount(owner, 1000, vendorAccount);
  const redeemFunctions = [...Array(100)].map(() => () =>
    mocHelper.moc.redeemStableTokenRequest(toContractBN(1, 'USD'), {
      from: owner
    })
  );

  await executeBatched(redeemFunctions);
  await executeBatched(
    riskProxOwners.map(acc => () => mocHelper.mintRiskProx(acc, BUCKET_X2, 0.001, vendorAccount))
  );
  // Enabling Settlement
  await mocHelper.mocSettlement.setBlockSpan(1);
};

contract('MoC: Gas limit on settlement', function([owner, vendorAccount, ...riskProxOwners]) {
  const riskProxAccounts = riskProxOwners.slice(0, RISKPROX_OWNERS_QUANTITY);
  before(async function() {
    mocHelper = await testHelperBuilder({
      owner,
      accounts: [owner, vendorAccount, ...riskProxAccounts],
      useMock: true
    });
    ({ toContractBN } = mocHelper);
    ({ BUCKET_X2 } = mocHelper);

    // Register vendor for test
    await mocHelper.registerVendor(vendorAccount, 0, owner);
  });

  describe(`GIVEN there are 100 redeemRequests and ${RISKPROX_OWNERS_QUANTITY} riskProx owners`, function() {
    before(async function() {
      await initializeSettlement(owner, vendorAccount, riskProxAccounts);
    });
    describe('WHEN the settlement is executed with 150 steps', function() {
      describe('WHEN settlement is executed in transactions of 50 steps each', function() {
        let txs = [];
        before(async function() {
          txs = await Promise.all([
            mocHelper.moc.runSettlement(50, { gas: 7e6 }),
            mocHelper.moc.runSettlement(50, { gas: 7e6 }),
            mocHelper.moc.runSettlement(50, { gas: 7e6 })
          ]);
          // This makes next settlement far away in time
          await mocHelper.mocSettlement.setBlockSpan(1000);
        });
        it('THEN all transactions execute successfully', async function() {
          assert(txs[0].receipt.status, 'First transaction reverted');
          assert(txs[1].receipt.status, 'Second transaction reverted');
          assert(txs[2].receipt.status, 'Third transaction reverted');
        });
        it('AND Settlement is not in running state', async function() {
          const running = await mocHelper.mocSettlement.isSettlementRunning();

          assert(!running, 'Settlement is still in running state');
        });
        it('AND Settlement is not enabled', async function() {
          const enabled = await mocHelper.mocSettlement.isSettlementEnabled();

          assert(!enabled, 'Settlement is still enabled');
        });
      });
    });
  });
});
