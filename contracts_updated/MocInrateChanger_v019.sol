pragma solidity ^0.5.8;
import "../MoCState.sol";
import "moc-governance/contracts/Governance/ChangeContract.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
/**
 * @dev This contract is used to update the configuration of MocInrate
 * with MoC --- governance.
 */
contract MocInrateChanger_v019 is ChangeContract, Ownable{
  MoCInrate private mocInrate;
  uint256 public riskProInterestBlockSpan;
  uint256 public btxcTmin;
  uint256 public btxcTmax;
  uint256 public btxcPower;
  uint256 public newRiskProRate;
  uint256 public newCommissionRate;
  address payable public newRiskProInterestAddress;
  address payable public newCommissionsAddress;
  uint256 public stableTmin;
  uint256 public stableTmax;
  uint256 public stablePower;

  constructor(
    MoCInrate _mocInrate,
    uint256 _riskProIntBlockSpan,
    uint256 _btxcTmin,
    uint256 _btxcTmax,
    uint256 _btxcPower,
    uint256 _newRiskProRate,
    uint256 _newComRate,
    uint256 _stableTmin,
    uint256 _stableTmax,
    uint256 _stablePower
  ) public {
    mocInrate = _mocInrate;
    riskProInterestBlockSpan = _riskProIntBlockSpan;
    btxcTmin = _btxcTmin;
    btxcTmax = _btxcTmax;
    btxcPower = _btxcPower;
    newRiskProRate = _newRiskProRate;
    newCommissionRate = _newComRate;
    stableTmin = _stableTmin;
    stableTmax = _stableTmax;
    stablePower = _stablePower;
  }

  function execute() external {
    mocInrate.setRiskProInterestBlockSpan(riskProInterestBlockSpan);
    mocInrate.setRiskProxTmin(btxcTmin);
    mocInrate.setRiskProxTmax(btxcTmax);
    mocInrate.setRiskProxPower(btxcPower);

    mocInrate.setRiskProRate(newRiskProRate);
    if (address(0) != newCommissionsAddress){
      mocInrate.setCommissionsAddress(newCommissionsAddress);
    }
    if (address(0) != newRiskProInterestAddress){
      mocInrate.setRiskProInterestAddress(newRiskProInterestAddress);
    }

    mocInrate.setCommissionRate(newCommissionRate);

    mocInrate.setStableTmin(stableTmin);
    mocInrate.setStableTmax(stableTmax);
    mocInrate.setStablePower(stablePower);

  }

  function setRiskProInterestBlockSpan(uint256 _riskProInterestBlockSpan) public onlyOwner(){
    riskProInterestBlockSpan = _riskProInterestBlockSpan;
  }

  function setRiskProxTmin(uint256 _btxcTmin) public onlyOwner(){
    btxcTmin = _btxcTmin;
  }

  function setRiskProxTmax(uint256 _btxcTmax) public onlyOwner(){
    btxcTmax = _btxcTmax;
  }

  function setRiskProxPower(uint256 _btxcPower) public onlyOwner(){
    btxcPower = _btxcPower;
  }

  function setRiskProInterestAddress(address payable _newRiskProInterestAddress) public onlyOwner(){
    newRiskProInterestAddress = _newRiskProInterestAddress;
  }

  function setRiskProRate(uint256 _newRiskProRate) public onlyOwner(){
    newRiskProRate = _newRiskProRate;
  }

  function setCommissionsAddress(address payable _newCommissionsAddress) public onlyOwner(){
    newCommissionsAddress = _newCommissionsAddress;
  }

  function setCommissionRate(uint256 _newCommissionRate) public onlyOwner(){
    newCommissionRate = _newCommissionRate;
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