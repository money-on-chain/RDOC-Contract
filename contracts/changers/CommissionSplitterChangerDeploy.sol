pragma solidity ^0.5.8;
pragma experimental ABIEncoderV2;

import "./CommissionSplitterChanger.sol";

/**
 * @dev This contract is used to update the configuration of MocInrate
 * with MoC --- governance.
 * Use for deploy only
 */
contract CommissionSplitterChangerDeploy is CommissionSplitterChanger {
  constructor(
      CommissionSplitter _commissionSplitter,
      address _mocToken,
      address _mocTokenCommissionsAddress
    )
    CommissionSplitterChanger(
      _commissionSplitter,
      address(0),
      0,
      _mocToken,
      _mocTokenCommissionsAddress
    )
  public { }

  function execute() external {
    /** UPDATE V0110: 24/09/2020 - Upgrade to support moc token commission **/
    commissionSplitter.setMocToken(mocToken);
    commissionSplitter.setMocTokenCommissionAddress(mocTokenCommissionsAddress);
  }
}