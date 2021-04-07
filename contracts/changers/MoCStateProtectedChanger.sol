pragma solidity 0.5.8;
import "../MoCState.sol";
import "moc-governance/contracts/Governance/ChangeContract.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @dev This contract is used to update the configuration of MoCState
 * with MoC --- governance.
 */
contract MoCStateProtectedChanger is ChangeContract, Ownable {
  MoCState public mocState;
  uint256 public protected;

  constructor(
    MoCState _mocState,
    uint256 _protected
  ) public {
    mocState = _mocState;
    protected = _protected;
  }

  function execute() external {
    mocState.setProtected(protected);
  }

  function setProtected(uint _protected) public onlyOwner() {
    protected = _protected;
  }

}
 30  contracts/changers/MoCStateVendorChanger.sol 
Viewed
@@ -0,0 +1,30 @@
pragma solidity 0.5.8;
import "../MoCState.sol";
import "moc-governance/contracts/Governance/ChangeContract.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @dev This contract is used to update the configuration of MoCState
 * with MoC --- governance.
 */
contract MoCStateVendorChanger is ChangeContract, Ownable {
  MoCState public mocState;
  address public mocVendors;

  constructor(
    MoCState _mocState,
    address _mocVendorsAddress
  ) public {
    mocState = _mocState;
    mocVendors = _mocVendorsAddress;
  }

  function execute() external {
    mocState.setMoCVendors(mocVendors);
  }

  function setMoCVendors(address _mocVendorsAddress) public onlyOwner() {
    mocVendors = _mocVendorsAddress;
  }

}