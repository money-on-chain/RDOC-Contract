pragma solidity ^0.5.8;
import "../MoCInrate.sol";
import "moc-governance/contracts/Governance/ChangeContract.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
/**
 * @dev This contract is used to update the configuration of MocInrate
 * with MoC --- governance.
 */

contract MoCInrateRiskproxChanger is ChangeContract, Ownable, MoCInrateStructs{
  MoCInrate private mocInrate;

  constructor(
    MoCInrate _mocInrate,
    uint256 riskProxMin,
    uint256 riskProxMax,
    uint256 riskProxPower
  ) public {
    mocInrate = _mocInrate;
    riskProxParams.tMin = riskProxMin;
    riskProxParams.power = riskProxPower;
    riskProxParams.tMax = riskProxMax;
  }

  function execute() external {
    mocInrate.setRiskProxTmin(riskProxParams.tMin);
    mocInrate.setRiskProxTmax(riskProxParams.tMax);
    mocInrate.setRiskProxPower(riskProxParams.power);
  }

  function setRiskProxTmin(uint256 _btxcTmin) public onlyOwner() {
    riskProxParams.tMin = _btxcTmin;
  }

  function setRiskProxTmax(uint256 _btxcTax) public onlyOwner() {
    riskProxParams.tMax = _btxcTax;
  }

  function setRiskProxPower(uint256 _btxcPower) public onlyOwner() {
    riskProxParams.power = _btxcPower;
  }


}
