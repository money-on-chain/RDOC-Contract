pragma solidity 0.5.8;
import "../MoCState.sol";
import "moc-governance/contracts/Governance/ChangeContract.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @dev This contract is used to update the configuration of MoCState MaxMintRiskPro
 * with MoC --- governance.
 */
contract MoCStateMaxMintRiskProChanger is ChangeContract, Ownable{
  MoCState public mocState;
  uint256 public maxMintRiskPro;

  constructor(
    MoCState _mocState,
    uint256 _maxMintRiskPro
  ) public {
    mocState = _mocState;
    maxMintRiskPro = _maxMintRiskPro;
  }

  function execute() external {
    mocState.setMaxMintRiskPro(maxMintRiskPro);
  }

  function setMaxMintRiskPro(uint256 _maxMintRiskPro) public onlyOwner() {
    maxMintRiskPro = _maxMintRiskPro;
  }

}
