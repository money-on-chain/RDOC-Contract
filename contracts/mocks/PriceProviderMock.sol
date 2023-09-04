pragma solidity ^0.5.8;

import "../interfaces/PriceFeed.sol";
import "../interfaces/PriceProvider.sol";

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