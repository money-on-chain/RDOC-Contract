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


// Root file: contracts/changers/productive/PriceFeederAdder.sol

pragma solidity 0.5.8;

// import "moc-governance/contracts/Governance/ChangeContract.sol";

// These dont have to be exhaustively complete  interfaces; they only allow solidity to call the actual contract
interface DSAuth {
  function setOwner(address newOwner) external;
}

interface PriceFactory {
  function create() external returns (DSAuth);
}

interface Medianizer {
  function set(address priceFeed) external;
}

/**
 * @dev This productive contract to add a new PriceFeeder with moc---gobernanza.
 */
contract PriceFeederAdder is ChangeContract {
  PriceFactory public priceFactory;
  Medianizer public medianizer;
  address public priceFeedOwner;

  /**
    @dev Constructor
  */
  constructor(PriceFactory _priceFactory, Medianizer _medianizer, address _priceFeedOwner) public {
    priceFactory = _priceFactory;
    medianizer = _medianizer;
    priceFeedOwner = _priceFeedOwner;
  }

  function execute() external {
    DSAuth priceFeeder = priceFactory.create();
    priceFeeder.setOwner(priceFeedOwner);
    medianizer.set(address(priceFeeder));
  }
}