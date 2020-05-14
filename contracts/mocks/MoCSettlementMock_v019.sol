pragma solidity 0.5.8;

import '../MoCSettlement_v019.sol';


contract MoCSettlementMock_v019 is MoCSettlement_v019 {
    //Step count that complete the execution in all tests
    uint256 constant STEPS = 100;

    constructor() public MoCSettlementMock_v019() {}

    function() external {
        require(false, 'fallback function is not enabled');
    }

    function pubRunDeleveraging() public {
        initializeSettlement();
        executeTask(DELEVERAGING_TASK, STEPS);
    }

    function pubRunRedeemDoc() public returns (uint256) {
        initializeSettlement();
        executeTask(StableToken_REDEMPTION_TASK, STEPS);
        return settlementInfo.finalCommissionAmount;
    }

    /**
    @dev Sets the number of blocks settlement will be allowed to run
    @param _blockSpan number of blocks
  */
    function setBlockSpan(uint256 _blockSpan) public {
        blockSpan = _blockSpan;
    }
}
