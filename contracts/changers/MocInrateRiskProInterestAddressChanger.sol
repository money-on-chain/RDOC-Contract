pragma solidity 0.5.8;
import "../MoCState.sol";
import "moc-governance/contracts/Governance/ChangeContract.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @dev This contract is used to update the configuration of MocInrate
 * with MoC --- governance.
 */

contract MocInrateRiskProInterestAddressChanger is ChangeContract, Ownable{
  MoCInrate private mocInrate;
  address payable public newRiskProInterestAddress;

  constructor(
    MoCInrate _mocInrate,
    address payable _newRiskProInterestAddress
  ) public {
    mocInrate = _mocInrate;
    newRiskProInterestAddress = _newRiskProInterestAddress;
  }

  function execute() external {
    mocInrate.setRiskProInterestAddress(newRiskProInterestAddress);
  }

  function setRiskProInterestAddress(address payable _newRiskProInterestAddress) public onlyOwner(){
    newRiskProInterestAddress = _newRiskProInterestAddress;
  }

}
