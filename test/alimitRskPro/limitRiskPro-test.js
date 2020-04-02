const { expectRevert } = require('openzeppelin-test-helpers');
const testHelperBuilder = require('../mocHelper.js');
const { toContract } = require('../../utils/numberHelper');

let mocHelper;
let toContractBN;

contract('MoC: MoCExchange', function([owner, userAccount]) {
  before(async function() {
    mocHelper = await testHelperBuilder({ owner, accounts: [owner] });
    ({ toContractBN } = mocHelper);
    this.moc = mocHelper.moc;
    this.mocState = mocHelper.mocState;
  });

  beforeEach(function() {
    return mocHelper.revertState();
  });

  describe('RiskPro limit minting test... With 10.000.000 limit', function() {
    beforeEach(async function() {
      await mocHelper.setReserveTokenPrice(10000 * mocHelper.MOC_PRECISION);
    });

    describe('WHEN he tries to mint 1.000.000 RiskPro', function() {
      it('THEN transaction OK', async function() {
        // await this.mocState.setMaxMintRiskPro(toContract(10000000 * mocHelper.MOC_PRECISION));
        await mocHelper.mintRiskProAmount(owner, 1000000);
        const balances = await mocHelper.getUserBalances(owner);
        mocHelper.assertBigDollar(balances.riskPro, 1000000, 'RiskPro balance is incorrect');
      });
    });

    describe('WHEN he tries to mint 20.000.000 RiskPro', function() {
      it('THEN transaction OK but it only mint 10.000.000 because is the mint limit', async function() {
        await mocHelper.mintRiskProAmount(owner, 20000000);
        const balances = await mocHelper.getUserBalances(owner);
        mocHelper.assertBigDollar(balances.riskPro, 10000000, 'RiskPro balance is incorrect');
      });
    });
  });
});
