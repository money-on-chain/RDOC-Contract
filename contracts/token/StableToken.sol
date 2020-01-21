pragma solidity 0.5.8;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "./OwnerBurnableToken.sol";

contract StableToken is ERC20Detailed, OwnerBurnableToken {

  string private _name = "Stable Token";
  string private _symbol = "STABLE";
  uint8 private _decimals = 18;

  constructor() Ownable() ERC20Detailed(_name, _symbol, _decimals) public {

  }

  //Fallback
  function() external {
  }
}
