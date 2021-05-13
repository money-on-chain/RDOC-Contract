
// File: openzeppelin-solidity/contracts/math/Math.sol

pragma solidity ^0.5.0;

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

// File: openzeppelin-solidity/contracts/math/SafeMath.sol

pragma solidity ^0.5.0;

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

// File: moc-governance/contracts/Governance/ChangeContract.sol

pragma solidity 0.5.8;

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

// File: moc-governance/contracts/Governance/IGovernor.sol

pragma solidity 0.5.8;


/**
  @title Governor
  @notice Governor interface. This functions should be overwritten to
  enable the comunnication with the rest of the system
  */
interface IGovernor{

  /**
    @notice Function to be called to make the changes in changeContract
    @dev This function should be protected somehow to only execute changes that
    benefit the system. This decision process is independent of this architechture
    therefore is independent of this interface too
    @param changeContract Address of the contract that will execute the changes
   */
  function executeChange(ChangeContract changeContract) external;

  /**
    @notice Function to be called to make the changes in changeContract
    @param _changer Address of the contract that will execute the changes
   */
  function isAuthorizedChanger(address _changer) external view returns (bool);
}

// File: zos-lib/contracts/Initializable.sol

pragma solidity >=0.4.24 <0.6.0;


/**
 * @title Initializable
 *
 * @dev Helper contract to support initializer functions. To use it, replace
 * the constructor with a function that has the `initializer` modifier.
 * WARNING: Unlike constructors, initializer functions must be manually
 * invoked. This applies both to deploying an Initializable contract, as well
 * as extending an Initializable contract via inheritance.
 * WARNING: When used with inheritance, manual care must be taken to not invoke
 * a parent initializer twice, or ensure that all initializers are idempotent,
 * because this is not dealt with automatically as with constructors.
 */
contract Initializable {

  /**
   * @dev Indicates that the contract has been initialized.
   */
  bool private initialized;

  /**
   * @dev Indicates that the contract is in the process of being initialized.
   */
  bool private initializing;

  /**
   * @dev Modifier to use in the initializer function of a contract.
   */
  modifier initializer() {
    require(initializing || isConstructor() || !initialized, "Contract instance has already been initialized");

    bool isTopLevelCall = !initializing;
    if (isTopLevelCall) {
      initializing = true;
      initialized = true;
    }

    _;

    if (isTopLevelCall) {
      initializing = false;
    }
  }

  /// @dev Returns true if and only if the function is running in the constructor
  function isConstructor() private view returns (bool) {
    // extcodesize checks the size of the code stored in an address, and
    // address returns the current address. Since the code is still not
    // deployed when running a constructor, any checks on its code size will
    // yield zero, making it an effective way to detect if a contract is
    // under construction or not.
    uint256 cs;
    assembly { cs := extcodesize(address) }
    return cs == 0;
  }

  // Reserved storage space to allow for layout changes in the future.
  uint256[50] private ______gap;
}

// File: moc-governance/contracts/Governance/Governed.sol

pragma solidity 0.5.8;



/**
  @title Governed
  @notice Base contract to be inherited by governed contracts
  @dev This contract is not usable on its own since it does not have any _productive useful_ behaviour
  The only purpose of this contract is to define some useful modifiers and functions to be used on the
  governance aspect of the child contract
  */
contract Governed is Initializable {

  /**
    @notice The address of the contract which governs this one
   */
  IGovernor public governor;

  string constant private NOT_AUTHORIZED_CHANGER = "not_authorized_changer";

  /**
    @notice Modifier that protects the function
    @dev You should use this modifier in any function that should be called through
    the governance system
   */
  modifier onlyAuthorizedChanger() {
    require(governor.isAuthorizedChanger(msg.sender), NOT_AUTHORIZED_CHANGER);
    _;
  }

  /**
    @notice Initialize the contract with the basic settings
    @dev This initialize replaces the constructor but it is not called automatically.
    It is necessary because of the upgradeability of the contracts
    @param _governor Governor address
   */
  function initialize(IGovernor _governor) public initializer {
    governor = _governor;
  }

  /**
    @notice Change the contract's governor. Should be called through the old governance system
    @param newIGovernor New governor address
   */
  function changeIGovernor(IGovernor newIGovernor) public onlyAuthorizedChanger {
    governor = newIGovernor;
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}

// File: contracts/MoCHelperLib.sol

pragma solidity 0.5.8;


library MoCHelperLib {

  struct MocLibConfig {
    uint256 reservePrecision;
    uint256 dayPrecision;
    uint256 mocPrecision;
  }

  using SafeMath for uint256;

  uint256 constant UINT256_MAX = ~uint256(0);

  /**
    @dev Returns max uint256 value constant.
    @return max uint256 value constant
  */
  function getMaxInt(MocLibConfig storage /*config*/) public pure returns(uint256) {
    return UINT256_MAX;
  }

  /**
    @dev Calculates average interest using integral function: T =  Rate = a * (x ** b) + c
    @param tMax maxInterestRate [using mocPrecision]
    @param power factor [using noPrecision]
    @param tMin minInterestRate C0 stableToken amount [using mocPrecision]
    @param abRat1 initial abundance ratio [using mocPrecision]
    @param abRat2 final abundance ratio [using mocPrecision]
    @return average interest rate [using mocPrecision]
  */
  function inrateAvg(MocLibConfig storage config, uint256 tMax, uint256 power, uint256 tMin, uint256 abRat1, uint256 abRat2)
  public view returns(uint256) {
    require(tMax > tMin, "Max inrate should be bigger than Min inrate");
    uint256 abRat1Comp = config.mocPrecision.sub(abRat1);
    uint256 abRat2Comp = config.mocPrecision.sub(abRat2);

    if (abRat1 == abRat2) {
      return potential(config, tMax, power, tMin, abRat1Comp);
    }
    else if (abRat2 < abRat1) {
      return avgInt(config, tMax, power, tMin, abRat1Comp, abRat2Comp);
    }
    else {
      return avgInt(config, tMax, power, tMin, abRat2Comp, abRat1Comp);
    }
  }

  /**
    @dev Calculates spot interest rate that RiskProx owners should pay to RiskPro owners: Rate = tMax * (abRatio ** power) + tMin
    @param tMin min interest rate [using mocPrecision]
    @param power power to use in the formula [using NoPrecision]
    @param tMax max interest rate [using mocPrecision]
    @param abRatio bucket C0  abundance Ratio [using mocPrecision]

   */
  function spotInrate(
    MocLibConfig storage config, uint256 tMax, uint256 power, uint256 tMin, uint256 abRatio
  ) public view returns(uint256) {
    uint256 abRatioComp = config.mocPrecision.sub(abRatio);

    return potential(config, tMax, power, tMin, abRatioComp);
  }

  /**
    @dev Calculates potential interests function with given parameters: Rate = a * (x ** b) + c
    @param a maxInterestRate [using mocPrecision]
    @param b factor [using NoPrecision]
    @param c minInterestRate C0 stableToken amount [using mocPrecision]
    @param value global stableToken amount [using mocPrecision]
  */
  function potential(MocLibConfig storage config, uint256 a, uint256 b, uint256 c, uint256 value)
  public view returns(uint256) {
    // value ** b
    // [MOC] ** [] = [MOC]
    uint256 aux1 = pow(value, b, config.mocPrecision);
    // (a * aux1) + c
    // [MOC] [MOC] / [MOC] + [MOC] = [MOC]
    return a.mul(aux1).div(config.mocPrecision).add(c);
  }

    /**
    @dev Calculates average of the integral function:
     T = (
              (c * xf + ((a * (xf ** (b + 1))) / (b + 1))) -
              (c * xi + ((a * (xi ** (b + 1))) / (b + 1)))
             ) / (xf - xi)
    @param a maxInterestRate [using mocPrecision]
    @param b factor [using NoPrecision]
    @param c minInterestRate C0 stableToken amount [using mocPrecision]
    @param value1 value to put in the function [using mocPrecision]
    @param value2 value to put in the function [using mocPrecision]
    @return average interest rate [using mocPrecision]
   */
  function avgInt(MocLibConfig storage config, uint256 a, uint256 b, uint256 c, uint256 value1, uint256 value2)
  public view returns(uint256) {
    // value2 - value1
    // [MOC]
    uint256 diff = value2.sub(value1);
    // ((c * (1 - value1) + ((a * ((1 - value1) ** (b + 1))) / (b + 1)))
    uint256 intV1 = integral(config, a, b, c, value1);
    // ((c * (1 - value2) + ((a * ((1 - value2) ** (b + 1))) / (b + 1)))
    uint256 intV2 = integral(config,  a, b, c, value2);
    // (secOp - first) / diff
    // ([MOC][MOC] - [MOC][MOC]) / [MOC] = [MOC]
    return intV2.sub(intV1).div(diff);
  }

  /**
    @dev Calculates integral of the exponential function: T = c * (value) + (a * value ** (b + 1)) / (b + 1))
    @param a maxInterestRate [using mocPrecision]
    @param b factor [using NoPrecision]
    @param c minInterestRate C0 stableToken amount [using mocPrecision]
    @param value value to put in the function [using mocPrecision]
    @return integration result [using mocPrecision]
  */
  function integral(MocLibConfig storage config, uint256 a, uint256 b, uint256 c, uint256 value)
  public view returns(uint256) {
    // b + 1
    // [NONE]
    uint256 b2 = b.add(1);
    // c * value
    // [MOC][MOC]
    uint256 firstOp = c.mul(value);
    // [MOC]
    uint256 pow = pow(value, b2, config.mocPrecision);
    // (a * value ** b2) / b2)
    // [MOC][MOC]
    uint256 secOp = a.mul(pow).div(b2);
    // (firstOp + secOp)
    // [MOC][MOC] + [MOC][MOC] = [MOC][MOC]
    return firstOp.add(secOp);
  }

  /**
  * @dev Relation between stableTokens in bucket 0 and StableToken total supply
  * @param stableToken0 stableToken count in bucket 0 [using mocPrecision]
  * @param stableTokent total stableToken supply [using mocPrecision]
  * @return abundance ratio [using mocPrecision]
  */
  function abundanceRatio(MocLibConfig storage config, uint256 stableToken0, uint256 stableTokent)
  public view returns(uint256) {
    if (stableTokent == 0) {
      return config.mocPrecision;
    }
    // [DOC] [MOC] / [DOC] = [MOC]
    return stableToken0.mul(config.mocPrecision).div(stableTokent);
  }

  /**
    @dev Returns the Ratio to apply to RiskPro Price in discount situations: SpotDiscountRate = TPD * (utpdu - cob) / (uptdu -liq)
    @param riskProLiqDiscountRate Discount rate applied at Liquidation level coverage [using mocPrecision]
    @param liq Liquidation coverage threshold [using mocPrecision]
    @param utpdu Discount coverage threshold [using mocPrecision]
    @param cov Actual global Coverage threshold [using mocPrecision]
    @return Spot discount rate [using mocPrecision]
  */
  function riskProSpotDiscountRate(
    MocLibConfig storage libConfig, uint256 riskProLiqDiscountRate,
    uint256 liq, uint256 utpdu, uint256 cov
  ) public view returns(uint256) {
    require(riskProLiqDiscountRate < libConfig.mocPrecision, "Discount rate should be lower than 1");

    if (cov >= utpdu) {
      return 0;
    }

    // utpdu - liq
    // [MOC] - [MOC] = [MOC]
    uint256 utpduLiqDiff = utpdu.sub(liq);

    // utpdu - cov
    // [MOC] - [MOC] = [MOC]
    uint256 utpduCovDiff = utpdu.sub(cov);

    // TPD * utpduCovDiff / utpduLiqDiff
    // [MOC] * [MOC] / [MOC] = [MOC]
    return riskProLiqDiscountRate.mul(utpduCovDiff).div(utpduLiqDiff);
  }

  /**
    @dev Max amount of RiskPro to available with discount: MaxRiskProWithDiscount = (uTPDU * nStableToken * PEG - (nReserve * B)) / (TPusd * TPD)
    @param nReserve Total ReserveTokens amount [using reservePrecision]
    @param nStableToken StableToken amount [using mocPrecision]
    @param utpdu Discount coverage threshold [using mocPrecision]
    @param peg peg value
    @param reservePrice ReserveTokens price [using mocPrecision]
    @param riskProUsdPrice riskProUsdPrice [using mocPrecision]
    @param spotDiscount spot discount [using mocPrecision]
    @return Total RiskPro amount [using mocPrecision]
  */
  function maxRiskProWithDiscount(
    MocLibConfig storage libConfig, uint256 nReserve, uint256 nStableToken, uint256 utpdu,
    uint256 peg, uint256 reservePrice, uint256 riskProUsdPrice, uint256 spotDiscount
  ) public view returns(uint256)  {
    require(spotDiscount < libConfig.mocPrecision, "Discount Rate should be lower than 1");

    if (spotDiscount == 0) {
      return 0;
    }

    // nReserve * B
    // [RES] * [MOC] / [RES] = [MOC]
    uint256 nbUsdValue = nReserve.mul(reservePrice).div(libConfig.reservePrecision);

    // (TPusd * (1 - TPD))
    // [MOC] * [MOC] / [MOC] = [MOC]
    uint256 riskProDiscountPrice = riskProUsdPrice.mul(libConfig.mocPrecision.sub(spotDiscount))
      .div(libConfig.mocPrecision);

    return maxRiskProWithDiscountAux(libConfig, nbUsdValue, nStableToken, utpdu, peg, riskProDiscountPrice);
  }

  /**
    @dev Max amount of RiskPro to available with discount: MaxRiskProWithDiscount = (uTPDU * nStableToken * PEG - (nReserve * B)) / (TPusd * TPD)
    @param nbUsdValue Total amount of ReserveTokens in USD [using mocPrecision]
    @param nStableToken StableToken amount [using mocPrecision]
    @param utpdu Discount coverage threshold [using mocPrecision]
    @param riskProDiscountPrice riskProUsdPrice with discount applied [using mocPrecision]
    @param peg peg value
    @return Total RiskPro amount [using reservePrecision]
  */
  function maxRiskProWithDiscountAux(
    MocLibConfig storage libConfig, uint256 nbUsdValue, uint256 nStableToken,
    uint256 utpdu, uint256 peg, uint256 riskProDiscountPrice
  ) internal view returns(uint256) {

    // uTPDU * nStableToken * PEG
    // [MOC] * [MOC] / [MOC] = [MOC]
    uint256 coverageUSDAmount = utpdu.mul(nStableToken).mul(peg).div(libConfig.mocPrecision);

    // This case only occurs with Coverage below 1
    if (coverageUSDAmount <= nbUsdValue) {
      return 0;
    }

    // ([MOC] - [MOC]) * [RES] / [MOC] = [RES]
    return coverageUSDAmount.sub(nbUsdValue).mul(libConfig.reservePrecision).div(riskProDiscountPrice);
  }

  /**
    @dev Calculates Locked ReserveTokens
    @param reservePrice ReserveTokens price [using mocPrecision]
    @param nStableToken StableTokens amount [using mocPrecision]
    @param peg peg value
    @return Locked ReserveTokens [using reservePrecision]
  */
  function lockedReserveTokens(MocLibConfig storage libConfig, uint256 reservePrice, uint256 nStableToken, uint256 peg)
    public view returns (uint256)
  {
    return nStableToken.mul(peg).mul(libConfig.reservePrecision).div(reservePrice);
  }

  /**
    @dev Calculates price at liquidation event as a relation between the stableToken total supply
    and the amount of ReserveTokens available to distribute
    @param resTokenAmount ReserveTokens to distribute [using reservePrecision]
    @param nStableToken StableTokens amount [using mocPrecision]
    @return Price at liquidation event [using mocPrecision]
  */
  function liquidationPrice(MocLibConfig storage libConfig, uint256 resTokenAmount, uint256 nStableToken)
  public view returns(uint256) {
    // [MOC] * [RES] / [RES]
    return nStableToken.mul(libConfig.reservePrecision).div(resTokenAmount);
  }

  /**
    @dev Calculates RiskPro ReserveTokens: (nReserve-LB) / nTP
    @param nReserve Total ReserveTokens amount [using reservePrecision]
    @param lb Locked ReserveTokens amount [using reservePrecision]
    @param nTP RiskPro amount [using mocPrecision]
    @return RiskPro ReserveTokens price [using reservePrecision]
  */
  function riskProTecPrice(MocLibConfig storage libConfig, uint256 nReserve, uint256 lb, uint256 nTP)
  public view returns (uint256) {
    // Liquidation happens before this condition turns true
    if (nReserve < lb) {
      return 0;
    }

    if (nTP == 0) {
      return libConfig.mocPrecision;
    }
    // ([RES] - [RES]) * [MOC] / [MOC]
    return nReserve.sub(lb).mul(libConfig.mocPrecision).div(nTP);
  }

  /**
    @dev Calculates RiskPro ReserveToken price: RiskProxInRiskPro = riskProxTecPrice / riskProPrice
    @param riskProxTecPrice RiskProx ReserveTokens price [using reservePrecision]
    @param riskProPrice Trog ReserveTokens price [using reservePrecision]
    @return RiskProx price in RiskPro [using mocPrecision]
  */
  function riskProxRiskProPrice(
    MocLibConfig storage libConfig, uint256 riskProxTecPrice, uint256 riskProPrice
  ) public view returns (uint256) {
    // [RES] * [MOC] / [RES] = [MOC]
    return riskProxTecPrice.mul(libConfig.mocPrecision).div(riskProPrice);
  }

  /**
    @dev Returns a new value with the discountRate applied: (price)* (1 - discountRate)
    @param price Price [using SomePrecision]
    @param discountRate Discount rate to apply [using mocPrecision]
    @return Price with discount applied [using SomePrecision]
  */
  function applyDiscountRate(MocLibConfig storage libConfig, uint256 price, uint256 discountRate)
    public view returns(uint256) {

    uint256 discountCoeff = libConfig.mocPrecision.sub(discountRate);

    return price.mul(discountCoeff).div(libConfig.mocPrecision);
  }

  /**
    @dev Returns the amount of interest to pay: = price * interestRate
    @param value Cost to apply interest [using SomePrecision]
    @param interestRate Interest rate to apply [using mocPrecision]
    @return Interest cost based on the value and interestRate [using SomePrecision]
  */
  function getInterestCost(MocLibConfig storage libConfig, uint256 value, uint256 interestRate)
    public view returns(uint256) {
    // [ORIGIN] * [MOC] / [MOC] = [ORIGIN]
    return value.mul(interestRate).div(libConfig.mocPrecision);
  }

  /**
    @dev Calculates Coverage: nReserve / LB
    @param nReserve Total ReserveTokens amount [using reservePrecision]
    @param lB Locked ReserveTokens amount [using reservePrecision]
    @return Coverage [using mocPrecision]
  */
  function coverage(MocLibConfig storage libConfig, uint256 nReserve, uint256 lB) public view
    returns(uint256) {
    if (lB == 0) {
      return UINT256_MAX;
    }

    return nReserve.mul(libConfig.mocPrecision).div(lB);
  }

 /**
    @dev Calculates Leverage from Coverage: Leverage = C / (C - 1)
    @param cov Coverage [using mocPrecision]
    @return Leverage [using mocPrecision]
  */
  function leverageFromCoverage(MocLibConfig storage libConfig, uint256 cov)
  public view returns(uint256) {
    if (cov == UINT256_MAX) {
      return libConfig.mocPrecision;
    }

    if (cov <= libConfig.mocPrecision) {
      return UINT256_MAX;
    }

    return cov.mul(libConfig.mocPrecision).div(cov.sub(libConfig.mocPrecision));
  }

 /**
    @dev Calculates Leverage: Leverage = nReserve / (nReserve - lB)
    @param nReserve Total ReserveTokens amount [using reservePrecision]
    @param lB Locked ReserveTokens amount [using reservePrecision]
    @return Leverage [using mocPrecision]
  */
  function leverage(MocLibConfig storage libConfig, uint256 nReserve,uint256 lB)
  public view returns(uint256) {
    if (lB == 0) {
      return libConfig.mocPrecision;
    }

    if (nReserve <= lB) {
      return UINT256_MAX;
    }

    return nReserve.mul(libConfig.mocPrecision).div(nReserve.sub(lB));
  }

  /**
    @dev Price in ReserveTokens of the amount of StableTokens
    @param amount Total ReserveTokens amount [using reservePrecision]
    @param reservePrice ReserveTokens price [using mocPrecision]
    @return Total value [using reservePrecision]
  */
  function stableTokensResTokensValue(
    MocLibConfig storage libConfig, uint256 amount, uint256 peg, uint256 reservePrice
  ) public view returns (uint256) {
    require(reservePrice > 0, "Price should be more than zero");
    require(libConfig.reservePrecision > 0, "Precision should be more than zero");
    //Total = amount / satoshi price
    //Total = amount / (reservePrice / precision)
    // [RES] * [MOC] / [MOC]
    uint256 stableTokenResTokenTotal = amount.mul(libConfig.mocPrecision).mul(peg).div(reservePrice);

    return stableTokenResTokenTotal;
  }

  /**
    @dev Price in ReserveTokens of the amount of RiskPros
    @param riskProAmount amount of RiskPro [using mocPrecision]
    @param riskProResTokenPrice RiskPro price in ReserveTokens [using reservePrecision]
    @return Total value [using reservePrecision]
  */
  function riskProResTokensValuet(MocLibConfig storage libConfig, uint256 riskProAmount, uint256 riskProResTokenPrice)
    public view returns (uint256) {
    require(libConfig.reservePrecision > 0, "Precision should be more than zero");

    // [MOC] * [RES] / [MOC] =  [RES]
    uint256 riskProResTokenTotal = riskProAmount.mul(riskProResTokenPrice).div(libConfig.mocPrecision);

    return riskProResTokenTotal;
  }

  /**
    @dev Max amount of Docs to issue: MaxStableToken = ((nReserve*B)-(Cobj*B/Bcons*nStableToken*PEG))/(PEG*(Cobj*B/BCons-1))
    @param nReserve Total ReserveTokens amount [using reservePrecision]
    @param cobj Target Coverage [using mocPrecision]
    @param nStableToken StableToken amount [using mocPrecision]
    @param peg peg value
    @param reservePrice ReserveTokens price [using mocPrecision]
    @param bCons ReserveTokens conservative price [using mocPrecision]
    @return Total StableTokens amount [using mocPrecision]
  */
  function maxStableToken(
    MocLibConfig storage libConfig, uint256 nReserve,
    uint256 cobj, uint256 nStableToken, uint256 peg, uint256 reservePrice, uint256 bCons
  ) public view returns(uint256) {
    require(libConfig.reservePrecision > 0, "Invalid Precision");
    require(libConfig.mocPrecision > 0, "Invalid Precision");

    // If cobj is less than 1, just return zero
    if (cobj < libConfig.mocPrecision)
      return 0;

    // Cobj * B / BCons
    // [MOC] * [MOC] / [MOC] = [MOC]
    uint256 adjCobj = cobj.mul(reservePrice).div(bCons);

    return maxStableTokenAux(libConfig, nReserve, adjCobj, nStableToken, peg, reservePrice);
  }

  function maxStableTokenAux(
    MocLibConfig storage libConfig, uint256 nReserve, uint256 adjCobj, uint256 nStableToken, uint256 peg, uint256 reservePrice
  ) internal view returns(uint256) {
    // (nReserve*B)
    // [RES] [MOC] [MOC] / [RES] = [MOC] [MOC]
    uint256 firstOperand = nReserve.mul(reservePrice).mul(libConfig.mocPrecision).div(libConfig.reservePrecision);
    // (adjCobj*nStableToken*PEG)
    // [MOC] [MOC]
    uint256 secOperand = adjCobj.mul(nStableToken).mul(peg);
    // (PEG*(adjCobj-1)
    // [MOC]
    uint256 denom = adjCobj.sub(libConfig.mocPrecision).mul(peg);

    if (firstOperand <= secOperand)
      return 0;

    // ([MOC][MOC] - [MOC][MOC]) / [MOC] = [MOC]
    return (firstOperand.sub(secOperand)).div(denom);
  }

  /**
    @dev Max amount of RiskPro to redeem: MaxRiskPro = ((nReserve*B)-(Cobj*nStableToken*PEG))/TPusd
    @param nReserve Total ReserveTokens amount [using reservePrecision]
    @param cobj Target Coverage [using mocPrecision]
    @param nStableToken Target Coverage [using mocPrecision]
    @param peg peg value
    @param reservePrice ReserveTokens price [using mocPrecision]
    @param bCons ReserveTokens conservative price [using mocPrecision]
    @param riskProUsdPrice riskProUsdPrice [using mocPrecision]
    @return Total RiskPro amount [using mocPrecision]
  */
  function maxRiskPro(
    MocLibConfig storage libConfig, uint256 nReserve, uint256 cobj,
    uint256 nStableToken, uint256 peg, uint256 reservePrice, uint256 bCons, uint256 riskProUsdPrice
  ) public view returns(uint256) {
    require(libConfig.reservePrecision > 0, "Invalid Precision");
    require(libConfig.mocPrecision > 0, "Invalid Precision");

    // Cobj * reservePrice / BCons
    // [MOC] * [MOC] / [MOC] = [MOC]
    uint256 adjCobj = cobj.mul(reservePrice).div(bCons);
    // (nReserve * reservePrice)
    // [RES] * [MOC] * [MOC] / [RES] = [MOC] [MOC]
    uint256 firstOperand = nReserve.mul(reservePrice)
      .mul(libConfig.mocPrecision)
      .div(libConfig.reservePrecision);
    // (adjCobj * nStableToken * PEG)
    // [MOC] * [MOC]
    uint256 secOperand = adjCobj.mul(nStableToken).mul(peg);

    if (firstOperand <= secOperand)
      return 0;

    // ([MOC][MOC] - [MOC][MOC]) / [MOC] = [MOC]
    return (firstOperand.sub(secOperand)).div(riskProUsdPrice);
  }

  /**
    @dev Calculates the total ReserveTokens price of the amount of RiskPros
    @param amount Amount of RiskPro [using mocPrecision]
    @param riskProPrice RiskPro ReserveTokens Price [using reservePrecision]
    @return RiskPro total value in ReserveTokens [using reservePrecision]
  */
  function totalRiskProInResTokens(
    MocLibConfig storage libConfig, uint256 amount, uint256 riskProPrice
  ) public view returns(uint256) {
    // [RES] * [MOC] / [MOC] = [RES]
    return riskProPrice.mul(amount).div(libConfig.mocPrecision);
  }

  /**
    @dev Calculates the equivalent in StableTokens of the resTokensAmount
    @param resTokensAmount ReserveTokens  amount [using reservePrecision]
    @param reservePrice ReserveTokens price [using mocPrecision]
    @return Equivalent StableToken amount [using mocPrecision]
  */
  function maxStableTokensWithResTokens(
    MocLibConfig storage libConfig, uint256 resTokensAmount, uint256 reservePrice
  ) public view returns(uint256) {
    // [RES] * [MOC] / [RES] = [MOC]
    return resTokensAmount.mul(reservePrice).div(libConfig.reservePrecision);
  }

  /**
    @dev Calculates the equivalent in RiskPro of the resTokensAmount
    @param resTokensAmount ReserveTokens amount [using reservePrecision]
    @param riskProPrice RiskPro ReserveTokens price [using reservePrecision]
    @return Equivalent RiskPro amount [using mocPrecision]
  */
  function maxRiskProWithResTokens(
    MocLibConfig storage libConfig, uint256 resTokensAmount, uint256 riskProPrice
  ) public view returns(uint256) {
    if (riskProPrice == 0) {
      return 0;
    }

    // [RES] * [MOC] / [RES]
    return resTokensAmount.mul(libConfig.mocPrecision).div(riskProPrice);
  }

  /**
    @dev Calculates the ResToken amount to move from C0 bucket to
    an L bucket when a RiskProx minting occurs: toMove = resTokensAmount * (lev - 1)
    @param resTokensAmount Total ReserveTokens amount [using reservePrecision]
    @param lev L bucket leverage [using mocPrecision]
    @return resTokens to move [using reservePrecision]
  */
  function bucketTransferAmount(
    MocLibConfig storage libConfig, uint256 resTokensAmount, uint256 lev
  ) public view returns(uint256) {
    require(lev > libConfig.mocPrecision, "Leverage should be more than 1");

    if (lev == UINT256_MAX || resTokensAmount == 0) {
      return 0;
    }

    // (lev-1)
    uint256 levSubOne = lev.sub(libConfig.mocPrecision);

    // Intentionally avaoid SafeMath
    // [RES] * [MOC]
    uint256 transferAmount = resTokensAmount * levSubOne;
    if (transferAmount / resTokensAmount != levSubOne)
      return 0;

    // [RES] * [MOC] / [MOC] = [RES]
    return transferAmount.div(libConfig.mocPrecision);
  }

   /**
    @dev Max amount of ReserveTokens allowed to be used to mint riskProx: MaxriskProx = nStableToken/ (PEG*B*(lev-1))
    @param nStableToken number of StableToken [using mocPrecision]
    @param peg peg value
    @param reservePrice ReserveTokens price [using mocPrecision]
    @param lev leverage [using mocPrecision]
    @return Max riskProx ReserveTokens value [using reservePrecision]
  */
  function maxRiskProxResTokenValue(
    MocLibConfig storage libConfig, uint256 nStableToken, uint256 peg, uint256 reservePrice, uint256 lev
  ) public view returns(uint256)  {
    require(libConfig.reservePrecision > 0, "Invalid Precision");
    require(libConfig.mocPrecision > 0, "Invalid Precision");

    if (lev <= libConfig.mocPrecision) {
      return 0;
    }
    // (lev-1)
    // [MOC]
    uint256 levSubOne = lev.sub(libConfig.mocPrecision);

    // PEG * ResTokenPrice
    // [MOC]
    uint256 pegTimesPrice = peg.mul(reservePrice);

    // This intentionally avoid using safeMath to handle overflow case
    // PEG * ResTokenPrice * (lev - 1)
    // [MOC] * [MOC]
    uint256 dividend = pegTimesPrice * levSubOne;

    if (dividend / pegTimesPrice != levSubOne)
      return 0; // INFINIT dividend means 0

    // nStableToken adjusted with precisions
    // [MOC] [RES]
    uint256 divider = nStableToken.mul(libConfig.reservePrecision);

    // [MOC] [RES] [MOC] / [MOC] [MOC]
    return divider.mul(libConfig.mocPrecision).div(dividend);
  }

  /**
    @dev Calculates the equivalent in MoC of the reserve token
    @param resTokensAmount Total ReserveTokens amount
    @param reservePrice ReserveTokens price
    @param mocPrice MoC price
    @return Equivalent MoC amount
  */
  function maxMoCWithReserveToken(
    MocLibConfig storage /*libConfig*/, uint256 resTokensAmount, uint256 reservePrice, uint256 mocPrice
  ) public pure returns(uint256) {
    return reservePrice.mul(resTokensAmount).div(mocPrice);
  }

  /**
    @dev Calculates the equivalent in reserve token of the MoC amount
    @param amount MoC amount
    @param reservePrice ReserveTokens price
    @param mocPrice MoC price
    @return Equivalent ReserveToken amount
  */
  function mocReserveTokenValue(
    MocLibConfig storage /*libConfig*/, uint256 amount, uint256 reservePrice, uint256 mocPrice
  ) public pure returns(uint256) {
    require(reservePrice > 0,"ReserveToken price should be more than zero");
    require(mocPrice > 0,"MoC price should be more than zero");

    uint256 mocReserveTokenTotal = amount.mul(mocPrice).div(reservePrice);

    return mocReserveTokenTotal;
  }

  /**
    @dev Rounding product adapted from DSMath but with custom precision
    @param x Multiplicand
    @param y Multiplier
    @return Product
  */
  function mulr(uint x, uint y, uint256 precision) internal pure returns (uint z) {
    return x.mul(y).add(precision.div(2)).div(precision);
  }

  /**
    @dev Potentiation by squaring adapted from DSMath but with custom precision
    @param x Base
    @param n Exponent
    @return power
  */
  function pow(uint256 x, uint256 n, uint256 precision) internal pure returns (uint z) {
    uint256 x2 = x;
    z = n % 2 != 0 ? x : precision;

    for (n /= 2; n != 0; n /= 2) {
      x2 = mulr(x2, x2, precision);

      if (n % 2 != 0) {
        z = mulr(z, x2, precision);
      }
    }
  }
}

// File: contracts/MoCLibConnection.sol

pragma solidity 0.5.8;


/**
  @dev Interface with MocHelperLib
 */
contract MoCLibConnection {
  using MoCHelperLib for MoCHelperLib.MocLibConfig;
  MoCHelperLib.MocLibConfig internal mocLibConfig;

  /*
  * Precision getters
  */
  function getMocPrecision() public view returns(uint256) {
    return mocLibConfig.mocPrecision;
  }

  function getReservePrecision() public view returns(uint256) {
    return mocLibConfig.reservePrecision;
  }

  function getDayPrecision() public view returns(uint256) {
    return mocLibConfig.dayPrecision;
  }

  function initializePrecisions() internal {
    mocLibConfig = MoCHelperLib.MocLibConfig({
      reservePrecision: 10 ** 18,
      mocPrecision: 10 ** 18,
      dayPrecision: 1
    });
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}

// File: contracts/base/MoCWhitelist.sol

pragma solidity 0.5.8;

/**
  @dev Provides access control between all MoC Contracts
 */
contract MoCWhitelist {
  mapping(address => bool) whitelist;

  /**
   * @dev Check if an account is whitelisted
   * @return Bool
   */
  function isWhitelisted(address account)
    public
    view
    returns (bool)
  {
    require(account != address(0), "Account must not be 0x0");
    return whitelist[account];
  }

  /**
   * @dev Add account to whitelist
   */
  function add(address account) internal {
    require(account != address(0), "Account must not be 0x0");
    require(!isWhitelisted(account), "Account not allowed to add accounts into white list");
    whitelist[account] = true;
  }

  /**
   * @dev Remove account from whitelist
   */
  function remove(address account) internal {
    require(account != address(0), "Account must not be 0x0");
    require(isWhitelisted(account), "Account is not allowed to remove address from the white list");

    whitelist[account] = false;
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}

// File: contracts/base/MoCConnector.sol

pragma solidity 0.5.8;



/**
  @dev Provides access control between all MoC Contracts
 */
contract MoCConnector is MoCWhitelist, Initializable {
  // References
  address payable public moc;
  address public stableToken;
  address public riskProToken;
  address public riskProxManager;
  address public mocState;
  address public mocConverter;
  address public mocSettlement;
  address public mocExchange;
  address public mocInrate;
  /** DEPRECATED mocBurnout **/
  address public mocBurnout;
  address public reserveToken;

  bool internal initialized;

  /**
    @dev Initializes the contract
    @param mocAddress MoC contract address
    @param stableTokenAddress Stable token contract address
    @param riskProAddress RiskPro token contract address
    @param riskProxAddress RiskProxManager contract address
    @param stateAddress MoCState contract address
    @param settlementAddress MoCSettlement contract address
    @param converterAddress MoCConverter contract address
    @param exchangeAddress MoCExchange contract address
    @param inrateAddress MoCInrate contract address
    @param burnoutBookAddress (DEPRECATED) MoCBurnout contract address. DO NOT USE.
    @param reserveTokenAddress Reserve token contract address
  */
  function initialize(
    address payable mocAddress,
    address stableTokenAddress,
    address riskProAddress,
    address riskProxAddress,
    address stateAddress,
    address settlementAddress,
    address converterAddress,
    address exchangeAddress,
    address inrateAddress,
    address burnoutBookAddress,
    address reserveTokenAddress
  ) public initializer {
    moc = mocAddress;
    stableToken = stableTokenAddress;
    riskProToken = riskProAddress;
    riskProxManager = riskProxAddress;
    mocState = stateAddress;
    mocSettlement = settlementAddress;
    mocConverter = converterAddress;
    mocExchange = exchangeAddress;
    mocInrate = inrateAddress;
    mocBurnout = burnoutBookAddress;
    reserveToken = reserveTokenAddress;

    // Add to Whitelist
    add(mocAddress);
    add(stableTokenAddress);
    add(riskProAddress);
    add(riskProxAddress);
    add(stateAddress);
    add(settlementAddress);
    add(converterAddress);
    add(exchangeAddress);
    add(inrateAddress);
    add(burnoutBookAddress);
    add(reserveTokenAddress);
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}

// File: contracts/base/MoCConstants.sol

pragma solidity 0.5.8;

/**
 * @dev Defines special constants to use along all the MoC System
 */
contract MoCConstants {
  bytes32 constant public BUCKET_X2 = "X2";
  bytes32 constant public BUCKET_C0 = "C0";
}

// File: contracts/base/MoCBase.sol

pragma solidity 0.5.8;




/**
  @dev General usefull modifiers and functions
 */
contract MoCBase is MoCConstants, Initializable {
  // Contracts
  MoCConnector public connector;

  bool internal initialized;

  function initializeBase(address connectorAddress) internal initializer {
    connector = MoCConnector(connectorAddress);
  }

  modifier onlyWhitelisted(address account) {
    require(connector.isWhitelisted(account), "Address is not whitelisted");
    _;
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}

// File: contracts/interface/IMoC.sol

pragma solidity 0.5.8;

interface IMoC {

    function sendToAddress(address receiver, uint256 tokenAmount) external returns(bool);

    function addReserves(uint256 tokenAmount) external;
}

// File: openzeppelin-solidity/contracts/token/ERC20/IERC20.sol

pragma solidity ^0.5.0;

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

// File: contracts/interface/IMoCExchange.sol

pragma solidity 0.5.8;

interface IMoCExchange {
    function getMoCTokenBalance(address owner, address spender) external view
    returns (uint256 mocBalance, uint256 mocAllowance);

    function mintRiskPro(address account, uint256 reserveAmount, address vendorAccount) external
    returns (uint256, uint256, uint256, uint256, uint256);

    function redeemRiskPro(address account, uint256 riskProAmount, address vendorAccount) external
    returns (uint256, uint256, uint256, uint256, uint256);

    function mintStableToken(address account, uint256 reserveToMint, address vendorAccount) external
    returns (uint256, uint256, uint256, uint256, uint256);

    function redeemRiskProx(address payable account, bytes32 bucket, uint256 riskProxAmount, address vendorAccount)
    external returns (uint256, uint256, uint256, uint256, uint256);

    function mintRiskProx(address payable account, bytes32 bucket, uint256 reserveToMint, address vendorAccount) external
    returns (uint256, uint256, uint256, uint256, uint256);

    function redeemFreeStableToken(address account, uint256 stableTokenAmount, address vendorAccount) external
    returns (uint256, uint256, uint256, uint256, uint256);

    function redeemAllStableToken(address origin, address payable destination) external
    returns (uint256);

    function convertToMoCPrice(uint256 reserveAmount) external view returns (uint256, uint256, uint256);

    function forceRedeemRiskProx(bytes32 bucket, address payable account, uint256 riskProxAmount, uint256 riskProxPrice)
    external returns (bool);

    function redeemStableTokenWithPrice(address payable userAddress, uint256 amount, uint256 reservePrice) external
    returns (bool, uint256);
}

// File: contracts/interface/IMoCState.sol

pragma solidity 0.5.8;

interface IMoCState {

     /******STATE MACHINE*********/
    enum States {
        // State 0
        Liquidated,
        // State 1
        RiskProDiscount,
        // State 2
        BelowCobj,
        // State 3
        AboveCobj
    }


    function addToReserves(uint256 reserveAmount) external;

    function substractFromReserves(uint256 reserveAmount) external;

    function coverage(bytes32 bucket) external view returns(uint256);

    function getReservesRemainder() external view returns(uint256);

    function liq() external view returns(uint256);

    function state() external view returns(States);

    function peg() external view returns(uint256);

    function dayBlockSpan() external view returns(uint256);

    function getReserveTokenPrice() external view returns(uint256);

    function getMoCPrice() external view returns(uint256);

    function getProtected() external view returns(uint256);

    function globalCoverage() external view returns(uint256);

    function getMoCVendors() external view returns(address);

    function getMoCToken() external view returns(address);

    function nextState() external;

    function maxRiskProWithDiscount() external view returns(uint256);

    function absoluteMaxRiskPro() external view returns(uint256);

    function absoluteMaxStableToken() external view returns(uint256);

    function freeStableToken() external view returns(uint256);

    function riskProTecPrice() external view returns(uint256);

    function riskProSpotDiscountRate() external view returns(uint256);

    function riskProDiscountPrice() external view returns(uint256);

    function bucketRiskProTecPrice(bytes32 bucket) external view returns(uint256);

    function currentAbundanceRatio() external view returns(uint256);

    function abundanceRatio(uint256 stableToken0) external view returns(uint256);

    function daysToSettlement() external view returns(uint256);

    function leverage(bytes32 bucket) external view returns(uint256);

    function getBucketNReserve(bytes32 bucket) external view returns(uint256);

    function getLiquidationPrice() external view returns(uint256);

    function maxRiskProxResTokenValue(bytes32 bucket) external view returns(uint256);

    function bucketRiskProTecPriceHelper(bytes32 bucket) external view returns(uint256);
}

// File: contracts/interface/IMoCVendors.sol

pragma solidity 0.5.8;

interface IMoCVendors {
    function resetTotalPaidInMoC() external;

    function getIsActive(address account) external view
    returns (bool);

    function getTotalPaidInMoC(address account) external view
    returns (uint256);

    function getStaking(address account) external view
    returns (uint256);

    function getMarkup(address account) external view
    returns (uint256);

    function updatePaidMarkup(address account, uint256 mocAmount, uint256 reserveAmount, uint256 totalMoCAmount) external;
}

// File: contracts/MoCVendors.sol

pragma solidity 0.5.8;











contract MoCVendorsEvents {
  event VendorRegistered(
    address account,
    uint256 markup
  );
  event VendorUpdated(
    address account,
    uint256 markup
  );
  event VendorUnregistered(
    address account
  );
  event VendorStakeAdded(
    address account,
    uint256 staking
  );
  event VendorStakeRemoved(
    address account,
    uint256 staking
  );
  event TotalPaidInMoCReset(
    address account
  );
  event VendorGuardianAddressChanged (
    address vendorGuardianAddress
  );
}

contract MoCVendors is MoCVendorsEvents, MoCBase, MoCLibConnection, Governed, IMoCVendors {
  using Math for uint256;
  using SafeMath for uint256;

  // Structs
  struct VendorDetails {
    bool isActive;
    uint256 markup;
    uint256 totalPaidInMoC;
    uint256 staking; // temporarily retained
    uint256 paidMoC;
    uint256 paidReserveToken;
  }

  // Contracts
  IMoC internal moc;
  IMoCState internal mocState;
  IMoCExchange internal mocExchange;

  // Constants
  uint8 public constant VENDORS_LIST_ARRAY_MAX_LENGTH = 100;
  uint256 public constant VENDOR_MAX_MARKUP = 10000000000000000; // 0.01 = 1%

  // Variables
  address public vendorGuardianAddress;
  mapping(address => VendorDetails) public vendors;
  address[] public vendorsList;

  /**
    @dev Initializes the contract
    @param connectorAddress MoCConnector contract address
    @param _governor Governor contract address
    @param _vendorGuardianAddress Address which will be authorized to register and unregister vendors.
  */
  function initialize(
    address connectorAddress,
    address _governor,
    address _vendorGuardianAddress
  ) public initializer {
    initializePrecisions();
    initializeBase(connectorAddress);
    initializeContracts();
    initializeValues(_governor, _vendorGuardianAddress);
  }

  /**
    @dev Gets the count of active registered vendors
    @return Amount of active registered vendors
  */
  function getVendorsCount() public view returns(uint vendorsCount) {
    return vendorsList.length;
  }

  /**
    @dev Allows to register a vendor
    @param account Vendor address
    @param markup Markup which vendor will perceive from mint/redeem operations
    @return true if vendor was registered successfully; otherwise false
  */
  function registerVendor(address account, uint256 markup) public onlyVendorGuardian() returns (bool isActive) {
    require(account != address(0), "Vendor account must not be 0x0");
    require(markup <= VENDOR_MAX_MARKUP, "Vendor markup threshold exceeded");

    if (vendors[account].isActive == false) {
      // Change the error message according to the value of the VENDORS_LIST_ARRAY_MAX_LENGTH constant
      require(vendorsList.length < VENDORS_LIST_ARRAY_MAX_LENGTH, "vendorsList length out of range");

      // Map vendor details to vendor address
      vendors[account].isActive = true;
      vendors[account].markup = markup;

      vendorsList.push(account);

      emit VendorRegistered(account, markup);
    } else if (vendors[account].markup != markup) {
      vendors[account].markup = markup;

      emit VendorUpdated(account, markup);
    }

    return vendors[account].isActive;
  }

  /**
    @dev Allows to unregister a vendor
    @param account Vendor address
    @return false if vendor was unregistered successfully; otherwise false
  */
  function unregisterVendor(address account) public onlyVendorGuardian() returns (bool isActive) {
    uint8 i = 0;
    while (i < vendorsList.length && vendorsList[i] != account) {
      i++;
    }
    // If vendor is found, then unregister it
    if (i < vendorsList.length) {
      vendors[account].isActive = false;
      vendorsList[i] = vendorsList[vendorsList.length - 1];
      delete vendorsList[vendorsList.length - 1];
      vendorsList.length--;

      emit VendorUnregistered(account);
      return false;
    }

    return vendors[account].isActive;
  }

  /**
    @dev Allows an active vendor (msg.sender) to add staking
    @param staking Staking the vendor wants to add
  */
  function addStake(uint256 staking) public onlyActiveVendor() {
    IERC20 mocToken = IERC20(mocState.getMoCToken());
    (uint256 mocBalance, uint256 mocAllowance) = mocExchange.getMoCTokenBalance(msg.sender, address(this));

    require(staking > 0, "Staking should be greater than 0");
    require(staking <= mocBalance && staking <= mocAllowance, "MoC balance or MoC allowance are not enough to add staking");

    mocToken.transferFrom(msg.sender, address(this), staking);
    vendors[msg.sender].staking = vendors[msg.sender].staking.add(staking);

    emit VendorStakeAdded(msg.sender, staking);
  }

  /**
    @dev Allows an active vendor (msg.sender) to remove staking
    @param staking Staking the vendor wants to remove
  */
  function removeStake(uint256 staking) public onlyActiveVendor() {
    IERC20 mocToken = IERC20(mocState.getMoCToken());

    require(staking > 0, "Staking should be greater than 0");
    require(staking <= vendors[msg.sender].totalPaidInMoC, "Vendor total paid is not enough");

    mocToken.transfer(msg.sender, staking);
    vendors[msg.sender].staking = vendors[msg.sender].staking.sub(staking);

    emit VendorStakeRemoved(msg.sender, staking);
  }

  /**
    @dev Allows to update paid markup to vendor
    @param account Vendor address
    @param mocAmount paid markup in MoC
    @param resTokenAmount paid markup in ReserveToken
    @param totalMoCAmount total paid in MoC
  */
  function updatePaidMarkup(address account, uint256 mocAmount, uint256 resTokenAmount, uint256 totalMoCAmount)
  public
  onlyWhitelisted(msg.sender) {
    vendors[account].totalPaidInMoC = vendors[account].totalPaidInMoC.add(totalMoCAmount);
    vendors[account].paidMoC = vendors[account].paidMoC.add(mocAmount);
    vendors[account].paidReserveToken = vendors[account].paidReserveToken.add(resTokenAmount);
  }

  /**
    @dev Gets if a vendor is active
    @param account Vendor address
    @return true if vendor is active; false otherwise
  */
  function getIsActive(address account) public view
  returns (bool) {
    return vendors[account].isActive;
  }

  /**
    @dev Gets vendor markup
    @param account Vendor address
    @return Vendor markup
  */
  function getMarkup(address account) public view
  returns (uint256) {
    return vendors[account].markup;
  }

  /**
    @dev Gets vendor total paid in MoC
    @param account Vendor address
    @return Vendor total paid in MoC
  */
  function getTotalPaidInMoC(address account) public view
  returns (uint256) {
    return vendors[account].totalPaidInMoC;
  }

  /**
    @dev Gets vendor staking
    @param account Vendor address
    @return Vendor staking
  */
  function getStaking(address account) public view
  returns (uint256) {
    return vendors[account].staking;
  }

  /**
    @dev Gets vendor paid in MoC
    @param account Vendor address
    @return Vendor paid in MoC
  */
  function getPaidMoC(address account) public view
  returns (uint256) {
    return vendors[account].paidMoC;
  }

  /**
    @dev Gets vendor paid in ReserveToken
    @param account Vendor address
    @return Vendor total paid in ReserveToken
  */
  function getPaidReserveToken(address account) public view
  returns (uint256) {
    return vendors[account].paidReserveToken;
  }

  /**
    @dev Allows to reset all active vendor's total paid in MoC during settlement
  */
  function resetTotalPaidInMoC() public onlyWhitelisted(msg.sender) {
    // Triggered by settlement
    for (uint8 i = 0; i < vendorsList.length; i++) {
      address account = vendorsList[i];

      // Reset only if vendor is active
      if (vendors[account].isActive == true) {
        vendors[account].totalPaidInMoC = 0;

        emit TotalPaidInMoCReset(account);
      }
    }
  }

  /**
    @dev Returns the address is authorized to register and unregister vendors.
  */
  function getVendorGuardianAddress() public view returns(address) {
    return vendorGuardianAddress;
  }

  /**
    @dev Sets the address which will be authorized to register and unregister vendors.
    @param _vendorGuardianAddress Address which will be authorized to register and unregister vendors.
  */
  function setVendorGuardianAddress(address _vendorGuardianAddress) public onlyAuthorizedChanger() {
    setVendorGuardianAddressInternal(_vendorGuardianAddress);
  }

  function initializeContracts() internal {
    moc = IMoC(connector.moc());
    mocState = IMoCState(connector.mocState());
    mocExchange = IMoCExchange(connector.mocExchange());
  }

  function initializeValues(address _governor, address _vendorGuardianAddress) internal {
    governor = IGovernor(_governor);
    setVendorGuardianAddressInternal(_vendorGuardianAddress);
  }

  /**
    @dev Sets the address which will be authorized to register and unregister vendors.
    @param _vendorGuardianAddress Address which will be authorized to register and unregister vendors.
  */
  function setVendorGuardianAddressInternal(address _vendorGuardianAddress) internal {
    require(_vendorGuardianAddress != address(0), "vendorGuardianAddress must not be 0x0");

    vendorGuardianAddress = _vendorGuardianAddress;

    emit VendorGuardianAddressChanged(vendorGuardianAddress);
  }

  /**
    @dev Checks if vendor (msg.sender) is active
  */
  modifier onlyActiveVendor() {
    require(vendors[msg.sender].isActive == true, "Vendor is inexistent or inactive");
    _;
  }

  /**
    @dev Checks if address is allowed to call function
  */
  modifier onlyVendorGuardian() {
    require(msg.sender == vendorGuardianAddress, "Caller is not vendor guardian address");
    _;
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}
