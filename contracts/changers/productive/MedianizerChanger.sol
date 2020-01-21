pragma solidity 0.5.8;

import "moc-governance/contracts/Governance/ChangeContract.sol";
import "../../MoCState.sol";

contract MedianizerChanger is ChangeContract {
  MoCState public mocState;
  address public newMedianizer;

  constructor(MoCState _mocState, address _newMedianizer) public {
    mocState = _mocState;
    newMedianizer = _newMedianizer;
  }

  function execute() external {
    mocState.setPriceProvider(newMedianizer);
  }
}