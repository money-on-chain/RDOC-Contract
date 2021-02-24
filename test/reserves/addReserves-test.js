const testHelperBuilder = require('../mocHelper.js');

let mocHelper;
let toContractBN;
let BUCKET_C0;
let BUCKET_X2;

contract('MoC: Reserves control', function([owner, userAccount, vendorAccount]) {
  before(async function() {
    const accounts = [owner, userAccount, vendorAccount];
    mocHelper = await testHelperBuilder({ owner, accounts });
    ({ toContractBN, BUCKET_C0, BUCKET_X2 } = mocHelper);
    this.governor = mocHelper.governor;
    this.mockMoCVendorsChanger = mocHelper.mockMoCVendorsChanger;
  });

  beforeEach(async function() {
    await mocHelper.revertState();

    // Register vendor for test
    await this.mockMoCVendorsChanger.setVendorsToRegister(
      await mocHelper.getVendorToRegisterAsArray(vendorAccount, 0)
    );
    await this.governor.executeChange(this.mockMoCVendorsChanger.address)
  });

  describe('GIVEN there are RiskPros and StableTokens minted', function() {
    beforeEach(async function() {
      await mocHelper.mintRiskPro(owner, 1, vendorAccount);
      await mocHelper.mintStableToken(owner, 10000, vendorAccount);
    });

    it('THEN there are no Docs or BitPro available', async function() {
      const maxStableToken = await mocHelper.maxStableToken();
      const maxRiskPro = await mocHelper.maxRiskPro();

      mocHelper.assertBigReserve(maxStableToken, 0, 'Max doc to mint is not zero.');
      mocHelper.assertBigReserve(maxRiskPro, 0, 'Max Bpro to redeem is not zero.');
    });

    describe('WHEN a user adds 100 tokens to the reserve', function() {
      beforeEach(async function() {
        await mocHelper.addReserves(userAccount, toContractBN(1000, 'RES'));
      });

      it('THEN there are StableTokens available to mint', async function() {
        const maxStableToken = await mocHelper.maxStableToken();

        assert(maxStableToken > 0, 'There are no Docs available to mint');
      });
      it('THEN there are BPros available to redeem', async function() {
        const maxRiskPro = await mocHelper.maxRiskPro();

        assert(maxRiskPro > 0, 'There are no BPros available to mint');
      });
    });
  });

  describe('GIVEN there are no money in the system', function() {
    describe('WHEN a user adds 100 tokens to the reserve', function() {
      beforeEach(async function() {
        await mocHelper.addReserves(userAccount, toContractBN(1000, 'RES'));
      });

      it('THEN MoCs Reserve token balance is 1000', async function() {
        const balance = await mocHelper.getReserveBalance(mocHelper.moc.address);

        mocHelper.assertBigReserve(balance, 1000, 'Reserves count is incorrect');
      });
      it('AND the amount of reserves in MoC is 1000', async function() {
        const state = await mocHelper.getGlobalState();

        mocHelper.assertBigReserve(state.nReserve, 1000, 'Reserves count is incorrect');
      });
      it('AND the amount of reserves in C0 bucket is 1000', async function() {
        const c0State = await mocHelper.getBucketState(BUCKET_C0);

        mocHelper.assertBigReserve(c0State.nReserve, 1000, 'Bucket C0 reserves is incorrect');
      });
      it('AND the amount of reserves in X2 bucket is 0', async function() {
        const x2State = await mocHelper.getBucketState(BUCKET_X2);

        mocHelper.assertBigReserve(x2State.nReserve, 0, 'Bucket C0 reserves is incorrect');
      });
      it('AND there are Docs available to mint', async function() {
        const maxStableToken = await mocHelper.maxStableToken();

        assert(maxStableToken > 0, 'There are no Docs available to mint');
      });
    });
  });
});
