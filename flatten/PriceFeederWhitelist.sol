// Dependency file: moc-governance/contracts/Governance/ChangeContract.sol

// pragma solidity 0.5.8;

/**
  @title ChangeContract
  @notice This interface is the one used by the governance system.
  @dev If you plan to do some changes to a system governed by this project you should write a contract
  that does those changes, like a recipe. This contract MUST not have ANY kind of public or external function
  that modifies the state of this ChangeContract, otherwise you could run into front-running issues when the governance
  system is fully in place.
 */
interface ChangeContract {

  /**
    @notice Override this function with a recipe of the changes to be done when this ChangeContract
    is executed
   */
  function execute() external;
}


// Root file: contracts/changers/productive/PriceFeederWhitelist.sol

pragma solidity 0.5.8;

// import "moc-governance/contracts/Governance/ChangeContract.sol";

// These doesnt have to be exhaustively complete interface; they only allow solidity to call the actual contract

interface Medianizer {
  function set(address priceFeed) external;
}

/**
 * @dev This contract add current pricefeeder to whitelist.
 */
contract PriceFeederWhitelist is ChangeContract {
  Medianizer public medianizer;
  address public priceFeed;

  /**
    @dev Constructor
  */
  constructor(Medianizer _medianizer, address _priceFeed) public {
    medianizer = _medianizer;
    priceFeed = _priceFeed;
  }

  function execute() external {
    medianizer.set(address(priceFeed));
  }
}