pragma solidity ^0.5.8;

import "../MoCInrate.sol";
import "moc-governance/contracts/Governance/ChangeContract.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
/**
 * @dev This contract is used to update the configuration of MocInrate
 * with MoC --- governance.
 */
contract MocInrateStableChanger is ChangeContract, Ownable{
  MoCInrate private mocInrate;
  uint256 public stableTmin;
  uint256 public stableTmax;
  uint256 public stablePower;

  constructor(
    MoCInrate _mocInrate,
    uint256 _stableTmin,
    uint256 _stableTmax,
    uint256 _stablePower
  ) public {
    mocInrate = _mocInrate;
    stableTmin = _stableTmin;
    stableTmax = _stableTmax;
    stablePower = _stablePower;
  }

  function execute() external {
    mocInrate.setStableTmin(stableTmin);
    mocInrate.setStableTmax(stableTmax);
    mocInrate.setStablePower(stablePower);
  }

  function setStableTmin(uint256 _stableTmin) public onlyOwner(){
    stableTmin = _stableTmin;
  }

  function setStableTmax(uint256 _stableTmax) public onlyOwner(){
    stableTmax = _stableTmax;
  }

  function setStablePower(uint256 _stablePower) public onlyOwner(){
    stablePower = _stablePower;
  }

}
