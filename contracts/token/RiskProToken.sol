pragma solidity 0.5.8;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Pausable.sol";
import "./OwnerBurnableToken.sol";

contract RiskProToken is ERC20Detailed, ERC20Pausable, OwnerBurnableToken {

  string private _name = "RIFPRO";
  string private _symbol = "RIFPRO";
  uint8 private _decimals = 18;

  constructor() Ownable() ERC20Detailed(_name, _symbol, _decimals) public {
  }

  //Fallback
  function() external {
  }
}
