pragma solidity ^0.5.8;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "./OwnerBurnableToken.sol";

/** 
 * UPDATE V0116_2: 09/2023: StableToken replace by ../hardhat/contracts/StableTokenV2.sol
 * @notice DEPRECATED: Stable token is no longer RDOC but USDRIF
 */
contract StableToken is ERC20Detailed, OwnerBurnableToken {

  // DEPRECATED
  string private _name = "RIF Dollar on Chain";
  // DEPRECATED
  string private _symbol = "RDOC";
  uint8 private _decimals = 18;

  /**
    @dev Constructor
  */
  constructor() Ownable() ERC20Detailed(_name, _symbol, _decimals) public {

  }

  /**
    @dev Fallback function
  */
  function() external {
  }
}
