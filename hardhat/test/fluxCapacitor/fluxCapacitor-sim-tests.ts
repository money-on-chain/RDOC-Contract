import { time } from "@nomicfoundation/hardhat-network-helpers";
import { MockContract, smock } from "@defi-wonderland/smock";
import chai from "chai";
import { MoCExchange, MoCExchange__factory } from "../../typechain";
import { assertPrec } from "../helpers/assertHelper";
import { deployContract, pEth } from "../helpers/utils";

chai.use(smock.matchers);

describe("Feature: Flux Capacitor Simulation", () => {
  let mockMocExchange: MockContract<MoCExchange>;

  //AA,DA,Blocks since last transaction,Max Mint,Max Redeem
  const testCases = [
    {
      setup: {
        bs: 720,
        amta: 200000,
        moda: 60000,
      },
      input: [
        [60000, 0, 0, "140000", "140000"],
        [60000, 60000, 0, "140000", "30000"],
        [60000, -60000, 0, "30000", "140000"],
        [100000, 60000, 0, "100000", "10000"],
        [100000, -60000, 0, "10000", "100000"],
        [100000, 40000, 0, "100000", "0"],
        [100000, 40001, 0, "100000", "0.5"],
        [100000, 40001, 500, "169444.4444444444444", "169444.4444444444444"],
        [180000, 120001, 0, "20000", "0.50"],
        [30556, 12223, 0, "169444", "169444"],
        [30000, 10000, 0, "170000", "170000"],
      ],
    },
    {
      setup: {
        bs: 720,
        amta: 100,
        moda: 10,
      },
      input: [
        [10, -3, 0, "1.5", "90"],
        [6, -2, 0, "94", "94"],
        [10, -3, 400, "95.55555555555555555", "95.55555555555555555"],
      ],
    },
  ];
  testCases.forEach(testCase => {
    const { bs, amta, moda } = testCase.setup;
    describe(`GIVEN a Moc protocol deployed with bs: ${bs}, amta: ${amta}, moda: ${moda}`, () => {
      beforeEach(async () => {
        const mocHelperAddress = await deployContract("MoCHelperLib", undefined, []);
        const mockMocExchangeFactory = await smock.mock<MoCExchange__factory>("MoCExchange", {
          libraries: { MoCHelperLib: mocHelperAddress },
        });

        mockMocExchange = await mockMocExchangeFactory.deploy();

        await mockMocExchange.setVariable("decayBlockSpan", bs);
        await mockMocExchange.setVariable("maxAbsoluteOperation", pEth(amta));
        await mockMocExchange.setVariable("maxOperationalDifference", pEth(moda));
      });
      testCase.input.forEach(input => {
        const [aa, da, bslt, mm, mr] = input;
        describe(`WHEN AA is ${aa}, DA is ${da} and BlockSinceLastTx is ${bslt}`, () => {
          beforeEach(async () => {
            const latestBlock = await time.latestBlock();
            await mockMocExchange.setVariable("absoluteAccumulator", pEth(aa));
            await mockMocExchange.setVariable("differentialAccumulator", pEth(da));
            await mockMocExchange.setVariable("lastOperationBlockNumber", latestBlock - Number(bslt));
          });
          it(`THEN lastMaxReserveAllowedToMint is ${mm}`, async () => {
            assertPrec(await mockMocExchange.lastMaxReserveAllowedToMint(), mm);
          });
          it(`THEN lastMaxReserveAllowedToRedeem is ${mr}`, async () => {
            assertPrec(await mockMocExchange.lastMaxReserveAllowedToRedeem(), mr);
          });
        });
      });
    });
  });
});
