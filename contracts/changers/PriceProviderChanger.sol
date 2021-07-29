pragma solidity ^0.5.8;
import "../MoCState.sol";
import "moc-governance/contracts/Governance/ChangeContract.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @dev This contract is used to update the configuration of MoCState
 * with MoC --- governance.
 */
contract PriceProviderChanger is ChangeContract, Ownable {
  MoCState public mocState;
  address public priceProvider;

  constructor(
    MoCState _mocState,
    address _priceProvider
  ) public {
    mocState = _mocState;
    priceProvider = _priceProvider;
  }

  function execute() external {
    mocState.setPriceProvider(priceProvider);
  }

  function setPriceProvider(address _priceProvider) public onlyOwner() {
    priceProvider = _priceProvider;
  }
}
