// Dependency file: contracts/interface/PriceFeed.sol

// pragma solidity 0.5.8;

interface PriceFeed {
    function poke(uint128 val_, uint32 zzz_) external;
    function post(uint128 val_, uint32 zzz_, address med_) external;
}

// Dependency file: contracts/interface/PriceProvider.sol

// pragma solidity 0.5.8;

interface PriceProvider {
  function peek() external view returns (bytes32, bool);
}

// Root file: contracts/mocks/PriceProviderMock.sol

pragma solidity 0.5.8;

// import "contracts/interface/PriceFeed.sol";
// import "contracts/interface/PriceProvider.sol";

contract PriceProviderMock is PriceFeed, PriceProvider {
  bytes32 price;
  bool has;

  constructor(uint256 _price) public {
    price = bytes32(_price);
    has = true;
  }

  function peek() external view returns (bytes32, bool) {
    return (price, has);
  }

  function poke(uint128 val_, uint32) external {
    price = bytes32(uint256(val_));
  }

  function post(uint128 val_, uint32, address) external {
    price = bytes32(uint256(val_));
  }
}