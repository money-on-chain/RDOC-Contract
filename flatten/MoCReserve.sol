// Dependency file: openzeppelin-solidity/contracts/math/SafeMath.sol

// pragma solidity ^0.5.0;

/**
 * @dev Wrappers over Solidity's arithmetic operations with added overflow
 * checks.
 *
 * Arithmetic operations in Solidity wrap on overflow. This can easily result
 * in bugs, because programmers usually assume that an overflow raises an
 * error, which is the standard behavior in high level programming languages.
 * `SafeMath` restores this intuition by reverting the transaction when an
 * operation overflows.
 *
 * Using this library instead of the unchecked operations eliminates an entire
 * class of bugs, so it's recommended to use it always.
 */
library SafeMath {
    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `+` operator.
     *
     * Requirements:
     * - Addition cannot overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "SafeMath: subtraction overflow");
        uint256 c = a - b;

        return c;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `*` operator.
     *
     * Requirements:
     * - Multiplication cannot overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        // Solidity only automatically asserts when dividing by 0
        require(b > 0, "SafeMath: division by zero");
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0, "SafeMath: modulo by zero");
        return a % b;
    }
}


// Dependency file: openzeppelin-solidity/contracts/math/Math.sol

// pragma solidity ^0.5.0;

/**
 * @dev Standard math utilities missing in the Solidity language.
 */
library Math {
    /**
     * @dev Returns the largest of two numbers.
     */
    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a >= b ? a : b;
    }

    /**
     * @dev Returns the smallest of two numbers.
     */
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    /**
     * @dev Returns the average of two numbers. The result is rounded towards
     * zero.
     */
    function average(uint256 a, uint256 b) internal pure returns (uint256) {
        // (a + b) / 2 can overflow, so we distribute
        return (a / 2) + (b / 2) + ((a % 2 + b % 2) / 2);
    }
}


// Dependency file: openzeppelin-solidity/contracts/token/ERC20/IERC20.sol

// pragma solidity ^0.5.0;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP. Does not include
 * the optional functions; to access them see `ERC20Detailed`.
 */
interface IERC20 {
    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a `Transfer` event.
     */
    function transfer(address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through `transferFrom`. This is
     * zero by default.
     *
     * This value changes when `approve` or `transferFrom` are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * > Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an `Approval` event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a `Transfer` event.
     */
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to `approve`. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);
}


// Root file: contracts/base/MoCReserve.sol

pragma solidity 0.5.8;

// import "openzeppelin-solidity/contracts/math/SafeMath.sol";
// import "openzeppelin-solidity/contracts/math/Math.sol";
// import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

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
