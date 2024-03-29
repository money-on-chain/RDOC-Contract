pragma solidity ^0.5.8;
import "../MoCState.sol";
import "moc-governance/contracts/Governance/ChangeContract.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @dev This contract is used to update the configuration of MoCState
 * with MoC --- governance.
 */
contract MoCStateMoCTokenChanger is ChangeContract, Ownable {
  MoCState public mocState;
  address public mocToken;

  constructor(
    MoCState _mocState,
    address _mocTokenAddress
  ) public {
    mocState = _mocState;
    mocToken = _mocTokenAddress;
  }

  function execute() external {
    mocState.setMoCToken(mocToken);
  }

  function setMoCToken(address _mocTokenAddress) public onlyOwner() {
    mocToken = _mocTokenAddress;
  }


}