pragma solidity 0.5.8;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "../base/MoCBase.sol";

contract MoCReserve {
  event CallRevert();
  event DepositFailed(address indexed origin, uint256 amount);
  event WithdrawFailed(address indexed destination, uint256 amount);

  using SafeMath for uint256;
  using Math for uint256;
  // Contracts
  IERC20 public reserveToken;

  modifier enoughAllowance(uint256 amount, address account) {
    require(amount <= getAllowance(account), "Not enough allowance to make the operation");
    _;
  }

  /**
    @dev Returns the amount of token reserve an account
    is allowed to use for deposit.

    @param account User account to check allowance.
    @return The minimum value between MoC allowance for that account and the account's balance.
   */
  function getAllowance(address account) public view returns(uint256) {
    uint256 balance = reserveToken.balanceOf(account);
    uint256 mocAllowed = reserveToken.allowance(account, address(this));

    return Math.min(balance, mocAllowed);
  }

  /**
    @dev Deposit reserve tokens into MoC address takeing it from origin address.
    Allowance of the amount should be made it before this.
    @param amount Amount of reserve tokens to transfer.
    @param origin Account from which to take the funds.
   */
  function deposit(uint256 amount, address origin) internal
  enoughAllowance(amount, origin) returns(bool) {
    bool result = safeTransferFrom(origin, amount);

    if (!result) {
      emit DepositFailed(origin, amount);
    }

    return result;
  }

  /**
    @dev Deposit reserve tokens into MoC address takeing it from origin address.
    Allowance of the amount should be made it before this.
    @param amount Amount of reserve tokens to extract.
    @param destination Account to which the funds will be sent.
    @return true if transfer is successfull and false if not.
   */
  function withdraw(uint256 amount, address destination) internal returns(bool) {
    bool result = safeTransfer(destination, amount);

    if (!result) {
      emit WithdrawFailed(destination, amount);
    }

    return result;
  }

  function setReserveToken(address token) internal {
    reserveToken = IERC20(token);
  }

  /**
    @dev Calls RRC20 transfer function and returns a boolean result even
    if transaction reverts.

    @param to Destination account of the funds.
    @param amount Funds to move.
   */
  function safeTransfer(address to, uint256 amount) internal returns(bool) {
    return safeCall(
      abi.encodePacked( // This encodes the function to call and the parameters to pass to that function
        reserveToken.transfer.selector, // This is the function identifier of the function we want to call
        abi.encode(to, amount) // This encodes the parameter we want to pass to the function
      )
    );
  }

  /**
    @dev Calls RRC20 transferFrom function and returns a boolean result even
    if transaction reverts

    @param origin Destination account of the funds.
    @param amount Funds to move.
   */
  function safeTransferFrom(address origin, uint256 amount) internal returns(bool) {
    return safeCall(
      abi.encodePacked( // This encodes the function to call and the parameters to pass to that function
        reserveToken.transferFrom.selector, // This is the function identifier of the function we want to call
        abi.encode(origin, address(this), amount) // This encodes the parameter we want to pass to the function
      )
    );
  }

  /**
    @dev Wraps an RRC20 transfer with a low level call to handle revert secenario
    * Emits CallRevert if call fails for revert

    @param callData Packed encoded data to use as call parameter.
   */
  function safeCall(bytes memory callData) internal returns(bool) {
  // This creates a low level call to the token
    // solium-disable-next-line security/no-low-level-calls
    (bool success, bytes memory returnData) = address(reserveToken).call(
     callData
    );
    if (success) {
      // return result of call function
      return abi.decode(returnData, (bool));
    } else {
      emit CallRevert();
      return false;
    }
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}
