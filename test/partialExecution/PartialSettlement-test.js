const { expectRevert } = require('openzeppelin-test-helpers');
const testHelperBuilder = require('../mocHelper.js');

let mocHelper;
let toContractBN;
let initialBalances;
let BUCKET_X2;
const ACCOUNTS_QUANTITY = 9;

const { BN } = web3.utils;

contract('MoC: Partial Settlement execution', function([owner, ...allAccounts]) {
  const accounts = allAccounts.slice(0, ACCOUNTS_QUANTITY);
  before(async function() {
    mocHelper = await testHelperBuilder({ owner, accounts: [owner, ...accounts], useMock: true });
    ({ toContractBN, BUCKET_X2 } = mocHelper);
  });

  const scenarios = [
    {
      description: 'WHEN settlement es executed in 1 round of 10 steps',
      rounds: [{ reservePrice: 10000, step: 10 }]
    },
    {
      description:
        'WHEN settlement es executed in 2 rounds of 2 and 5 steps AND price change in the middle',
      rounds: [{ reservePrice: 10000, step: 2 }, { reservePrice: 8000, step: 6 }]
    },
    {
      description:
        'WHEN settlement es executed in 2 rounds of 5 and 2 steps AND price change in the middle',
      rounds: [{ reservePrice: 10000, step: 5 }, { reservePrice: 7000, step: 3 }]
    }
  ];

  describe('Step execution consistency', function() {
    describe('GIVEN there are 5 redeemRequests of 10 stableTokens and 3 RiskProx positions of 1 RiskProx', function() {
      scenarios.forEach(async scenario => {
        let txs = [];
        describe(scenario.description, function() {
          before(async function() {
            await initializeSettlement(accounts);
            txs = await runScenario(scenario);
          });

          it('THEN settlementStarted Event is emitted with correct values', async function() {
            const [settlementStartedEvent] = mocHelper.findEventsInTxs(txs, 'SettlementStarted');
            await assertStartSettlementEvent(settlementStartedEvent, 10000, 5, 3);
          });
          it('THEN settlementCompleted Event is emitted', async function() {
            const [settlementCompleteEvent] = mocHelper.findEventsInTxs(txs, 'SettlementCompleted');
            assert(settlementCompleteEvent, 'Not all redeem requests were processed');
          });
          it('AND 5 StableToken redemption events are emitted', function() {
            const stableTokenRedeemEvents = mocHelper.findEventsInTxs(
              txs,
              'RedeemRequestProcessed'
            );
            assert(stableTokenRedeemEvents.length === 5, 'Not all redeem requests were processed');
          });
          it('AND Settlement is no longer in running state', async function() {
            const running = await mocHelper.mocSettlement.isSettlementRunning();

            assert(!running, 'Settlement is still in running state');
          });
          it('AND all riskProx owners got redeemed', async function() {
            const finalBalances = await Promise.all(
              accounts.slice(5, 8).map(address => mocHelper.getUserBalances(address))
            );

            finalBalances.forEach((balances, i) => {
              const initial = initialBalances[i + 5];
              const diff = new BN(balances.reserve).sub(new BN(initial.reserve));

              mocHelper.assertBig(balances.riskPro2x, 0, 'User riskProx balance is not zero');
              mocHelper.assertBigReserve(diff, 1, 'User reserve balance is not correct');
            });
          });
          it('AND all stableToken owners got redeemed', async function() {
            const finalBalances = await Promise.all(
              accounts.slice(0, 5).map(address => mocHelper.getUserBalances(address))
            );

            finalBalances.forEach((balances, i) => {
              const initial = initialBalances[i];
              const reserveDiff = new BN(balances.reserve).sub(new BN(initial.reserve));
              const stableTokenDiff = new BN(initial.stable).sub(new BN(balances.stable));

              mocHelper.assertBigDollar(
                stableTokenDiff,
                10,
                'User stableToken balance is not correct'
              );
              mocHelper.assertBigReserve(reserveDiff, 0.001, 'User reserve balance is not correct');
            });
          });

          after(function() {
            mocHelper.revertState();
          });
        });
      });
    });
  });

  describe('Consecutive Settlements', function() {
    describe('GIVEN first settlement is executed', function() {
      before(async function() {
        await initializeSettlement(accounts);
        await mocHelper.moc.runSettlement(4);
        await mocHelper.setReserveTokenPrice(toContractBN(8000, 'USD'));
        await mocHelper.moc.runSettlement(4);
        // This makes settlement not always enabled
        await mocHelper.mocSettlement.setBlockSpan(100);
      });
      it('THEN Settlement is not enabled', async function() {
        const enabled = await mocHelper.mocSettlement.isSettlementEnabled();
        assert(!enabled, 'Settlement is still enabled');
      });
      describe('WHEN settlement is executed before block span passed', function() {
        it('THEN transaction reverts because the settlement is not enabled', async function() {
          const tx = mocHelper.moc.runSettlement(1);

          await expectRevert(tx, 'Settlement not yet enabled');
        });
      });

      describe('WHEN 100 blocks passes second settlement is executed', function() {
        let secondSettlementEvent;
        let beforeBalances;
        before(async function() {
          beforeBalances = await Promise.all(
            accounts.map(account => mocHelper.getUserBalances(account))
          );
          await mocHelper.waitNBlocks(100);
          const tx = await mocHelper.moc.runSettlement(0);
          [secondSettlementEvent] = mocHelper.findEvents(tx, 'SettlementStarted');
        });
        it('THEN Settlement is not enabled anymore', async function() {
          const enabled = await mocHelper.mocSettlement.isSettlementEnabled();
          assert(!enabled, 'Settlement is still enabled');
        });
        it('AND Settlement event have clean new values', async function() {
          await assertStartSettlementEvent(secondSettlementEvent, 8000, 0, 0);
        });
        it('AND no account change their balances', async function() {
          const finalBalances = await Promise.all(
            accounts.map(account => mocHelper.getUserBalances(account))
          );

          beforeBalances.forEach((initial, i) => {
            const final = finalBalances[i];

            mocHelper.assertBig(
              initial.stable,
              final.stable,
              'User stableToken balance is not correct'
            );
            mocHelper.assertBig(
              initial.riskPro2x,
              final.riskPro2x,
              'User reserveToken2x balance is not correct'
            );
            mocHelper.assertBig(
              initial.reserve,
              final.reserve,
              'User reserve balance is not correct'
            );
          });
        });
      });
    });
  });
});

// Asserts
const assertStartSettlementEvent = async (
  settlementCompleteEvent,
  reservePrice,
  stableTokenCount,
  deleverCount
) => {
  mocHelper.assertBigDollar(
    settlementCompleteEvent.reservePrice,
    reservePrice,
    'ReserveTokens Price is not correct'
  );
  mocHelper.assertBig(
    settlementCompleteEvent.stableTokenRedeemCount,
    stableTokenCount,
    'Redeem requests processed value is incorrect'
  );
  mocHelper.assertBig(
    settlementCompleteEvent.deleveragingCount,
    deleverCount,
    'RiskProx accounts liquidated value is incorrect'
  );
};

// Returns a promise that execute
// Run settlement for all rounds in the scenario in order
const runScenario = scenario => {
  const txs = [];
  const reduced = scenario.rounds.reduce(
    (prevPromise, round) =>
      prevPromise.then(tx => {
        if (tx) txs.push(tx);
        return executeSettlementRound(round);
      }),
    Promise.resolve()
  );
  return reduced.then(lastTx => txs.concat(lastTx));
};

// Returns a promise that execute
// Price set and settlement
const executeSettlementRound = async round => {
  await mocHelper.setReserveTokenPrice(toContractBN(round.reservePrice, 'USD'));
  return mocHelper.moc.runSettlement(round.step);
};

const initializeSettlement = async accounts => {
  mocHelper.revertState();
  // Avoid interests
  await mocHelper.mocState.setDaysToSettlement(0);
  const stableTokenAccounts = accounts.slice(0, 5);
  const riskProxAccounts = accounts.slice(5, 8);
  await Promise.all(
    stableTokenAccounts.map(account => mocHelper.mintRiskProAmount(account, 10000))
  );
  await Promise.all(
    stableTokenAccounts.map(account => mocHelper.mintStableTokenAmount(account, 10000))
  );
  await Promise.all(
    stableTokenAccounts.map(account =>
      mocHelper.moc.redeemStableTokenRequest(toContractBN(10, 'USD'), {
        from: account
      })
    )
  );

  await Promise.all(
    riskProxAccounts.map(account => mocHelper.mintRiskProxAmount(account, BUCKET_X2, 1))
  );
  initialBalances = await Promise.all(accounts.map(address => mocHelper.getUserBalances(address)));
  await mocHelper.mocSettlement.setBlockSpan(1);
};
