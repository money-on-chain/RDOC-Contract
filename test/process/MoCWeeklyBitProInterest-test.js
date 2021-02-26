const testHelperBuilder = require('../mocHelper.js');

let mocHelper;
let toContractBN;
let BUCKET_C0;

contract('MoC: RiskPro holder interests payment', function([
  owner,
  account,
  targetAddr,
  vendorAccount
]) {
  before(async function() {
    const accounts = [owner, account, targetAddr, vendorAccount];
    mocHelper = await testHelperBuilder({ owner, accounts, useMock: true });
    ({ toContractBN } = mocHelper);
    this.moc = mocHelper.moc;
    this.mocState = mocHelper.mocState;
    this.mockMocInrateChanger = mocHelper.mockMocInrateChanger;
    this.governor = mocHelper.governor;
    this.mockMoCVendorsChanger = mocHelper.mockMoCVendorsChanger;
    ({ BUCKET_C0 } = mocHelper);
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
      description: 'There are no money in the inrate bag. C0 buckets keeps the same',
      riskProMintReserveToken: 0,
      riskProInterestTargetAddress: targetAddr,
      riskProHolderRate: 0.5 * 10 ** 18,
      blockSpan: 20 * 3,
      expect: {
        bucket0AfterInterest: 0,
        targetAddrBalance: 0,
        paymentValue: 0
      }
    },
    {
      description:
        'There are money in the bucket 0. Function should decrease C0 bucket ReserveTokens',
      riskProMintReserveToken: 2,
      riskProHolderRate: 0.5 * 10 ** 18,
      blockSpan: 20 * 7,
      riskProInterestTargetAddress: targetAddr,
      expect: {
        bucket0AfterInterest: 1,
        targetAddrBalance: 1,
        paymentValue: 1
      }
    }
  ];
  scenarios.forEach(s => {
    let beforeTargetAddressBalance = 0;
    describe('GIVEN there are 2 ReserveTokens in the C0 nReserveToken Bucket', function() {
      beforeEach(async function() {
        await mocHelper.mintRiskPro(
          account,
          toContractBN(s.riskProMintReserveToken, vendorAccount)
        );
        await this.mockMocInrateChanger.setRiskProRate(toContractBN(s.riskProHolderRate));
        await this.mockMocInrateChanger.setRiskProInterestAddress(s.riskProInterestTargetAddress);
        await this.mockMocInrateChanger.setRiskProInterestBlockSpan(s.blockSpan);
        await this.governor.executeChange(this.mockMocInrateChanger.address);
        beforeTargetAddressBalance = toContractBN(await mocHelper.getReserveBalance(targetAddr));
      });
      it(`THEN payment value is ${s.expect.paymentValue}`, async function() {
        const riskProInterest = await mocHelper.calculateRiskProHoldersInterest();
        const interestsValue = riskProInterest[0];
        mocHelper.assertBigReserve(
          interestsValue,
          s.expect.paymentValue,
          'Weekly RiskPro holders is deferent'
        );
      });
      it('THEN RiskPro blockSpan is correct', async function() {
        const riskProBlockSpan = await mocHelper.getRiskProInterestBlockSpan();
        assert(riskProBlockSpan, s.blockSpan, 'RiskPro holders blockSpan is deferent');
      });
      it('THEN RiskPro weekly rate is correct', async function() {
        const riskProRate = await mocHelper.getRiskProRate();
        assert(riskProRate, s.riskProHolderRate, 'RiskPro holders rate is deferent');
      });
      it('THEN destination address is correct', async function() {
        const address = await mocHelper.getRiskProInterestAddress();
        assert(address, targetAddr, 'Destination address is incorrect');
      });
      describe('WHEN payment is run', function() {
        let tx;
        beforeEach(async function() {
          tx = await mocHelper.payRiskProHoldersInterestPayment();
        });
        it('THEN the event is emitted', function() {
          const [event] = mocHelper.findEvents(tx, 'RiskProHoldersInterestPay');

          assert(event, 'Payment event was not emitted');
          mocHelper.assertBigReserve(
            event.amount,
            s.expect.paymentValue,
            'Amount in event is incorrect'
          );
        });
        it(`THEN bucket C0 ReserveTokens should decrease in ${s.expect.bucket0AfterInterest}`, async function() {
          const { nReserve } = await mocHelper.getBucketState(BUCKET_C0);
          mocHelper.assertBigReserve(
            nReserve,
            s.expect.bucket0AfterInterest,
            'Bucket 0 ReserveTokens did not decrease'
          );
        });
        it(`THEN destination address balance increase by ${s.expect.targetAddrBalance}`, async function() {
          const afterTargetAddressBalance = toContractBN(
            await mocHelper.getReserveBalance(targetAddr)
          );

          mocHelper.assertBigReserve(
            afterTargetAddressBalance.sub(beforeTargetAddressBalance),
            s.expect.targetAddrBalance,
            'Bucket 0 ReserveTokens did not decrease'
          );
        });
        it('THEN Weekly RiskPro holders interest should be disabled', async function() {
          const enabled = await mocHelper.isRiskProInterestEnabled();
          assert(!enabled, 'Weekly riskPro holder interest is still enabled');
        });
      });
    });
  });
});
