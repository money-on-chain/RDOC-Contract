pragma solidity 0.5.8;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";

/** Only for testing purposes. This contract have the following properties:
  - Anyone can claim any amount of tokens.
  - Anyone can blacklist an account, that account will not be able to be used on transfer or transferFrom
  operations.
  - Anyone can set the contrat into failState. When failState is set, transfer and transferFrom operations
  will not execute and return false
 */
contract ReserveToken is ERC20Detailed, ERC20 {
  string private _name = "False reserve";
  string private _symbol = "RES";
  uint8 private _decimals = 18;

  bool private failState = false;
  mapping(address => bool) public blacklist;

  modifier notBlacklisted(address account) {
    require(!blacklist[account]);
    _;
  }

  constructor() ERC20Detailed(_name, _symbol, _decimals) public {
  }

  /**
    @dev Only for testing purposes, any user can claim any amount
   */
  function claim(uint256 amount) public {
    _mint(msg.sender, amount);
  }

  /**
    @dev Set if contract should fail on every transfer or transferFrom operation
   */
  function setToFail(bool toFail) public {
    failState = toFail;
  }

  /**
    @dev Blacklist an address
   */
  function blacklistAccount(address account) public {
    blacklist[account] = true;
  }

  function transfer(address recipient, uint256 amount) public notBlacklisted(recipient) notBlacklisted(msg.sender) returns(bool) {
    if (failState) {
      return false;
    }

    return ERC20.transfer(recipient,amount);
  }

  function transferFrom(address sender, address recipient, uint256 amount) public
  notBlacklisted(sender) notBlacklisted(recipient) notBlacklisted(msg.sender) returns (bool) {
    if (failState) {
      return false;
    }

    return ERC20.transferFrom(sender, recipient, amount);
  }

}
