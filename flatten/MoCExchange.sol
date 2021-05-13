
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

// File: openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol

pragma solidity ^0.5.0;


/**
 * @dev Optional functions from the ERC20 standard.
 */
contract ERC20Detailed is IERC20 {
    string private _name;
    string private _symbol;
    uint8 private _decimals;

    /**
     * @dev Sets the values for `name`, `symbol`, and `decimals`. All three of
     * these values are immutable: they can only be set once during
     * construction.
     */
    constructor (string memory name, string memory symbol, uint8 decimals) public {
        _name = name;
        _symbol = symbol;
        _decimals = decimals;
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public view returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5,05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei.
     *
     * > Note that this information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * `IERC20.balanceOf` and `IERC20.transfer`.
     */
    function decimals() public view returns (uint8) {
        return _decimals;
    }
}

// File: openzeppelin-solidity/contracts/token/ERC20/ERC20.sol

pragma solidity ^0.5.0;



/**
 * @dev Implementation of the `IERC20` interface.
 *
 * This implementation is agnostic to the way tokens are created. This means
 * that a supply mechanism has to be added in a derived contract using `_mint`.
 * For a generic mechanism see `ERC20Mintable`.
 *
 * *For a detailed writeup see our guide [How to implement supply
 * mechanisms](https://forum.zeppelin.solutions/t/how-to-implement-erc20-supply-mechanisms/226).*
 *
 * We have followed general OpenZeppelin guidelines: functions revert instead
 * of returning `false` on failure. This behavior is nonetheless conventional
 * and does not conflict with the expectations of ERC20 applications.
 *
 * Additionally, an `Approval` event is emitted on calls to `transferFrom`.
 * This allows applications to reconstruct the allowance for all accounts just
 * by listening to said events. Other implementations of the EIP may not emit
 * these events, as it isn't required by the specification.
 *
 * Finally, the non-standard `decreaseAllowance` and `increaseAllowance`
 * functions have been added to mitigate the well-known issues around setting
 * allowances. See `IERC20.approve`.
 */
contract ERC20 is IERC20 {
    using SafeMath for uint256;

    mapping (address => uint256) private _balances;

    mapping (address => mapping (address => uint256)) private _allowances;

    uint256 private _totalSupply;

    /**
     * @dev See `IERC20.totalSupply`.
     */
    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev See `IERC20.balanceOf`.
     */
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    /**
     * @dev See `IERC20.transfer`.
     *
     * Requirements:
     *
     * - `recipient` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     */
    function transfer(address recipient, uint256 amount) public returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    /**
     * @dev See `IERC20.allowance`.
     */
    function allowance(address owner, address spender) public view returns (uint256) {
        return _allowances[owner][spender];
    }

    /**
     * @dev See `IERC20.approve`.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function approve(address spender, uint256 value) public returns (bool) {
        _approve(msg.sender, spender, value);
        return true;
    }

    /**
     * @dev See `IERC20.transferFrom`.
     *
     * Emits an `Approval` event indicating the updated allowance. This is not
     * required by the EIP. See the note at the beginning of `ERC20`;
     *
     * Requirements:
     * - `sender` and `recipient` cannot be the zero address.
     * - `sender` must have a balance of at least `value`.
     * - the caller must have allowance for `sender`'s tokens of at least
     * `amount`.
     */
    function transferFrom(address sender, address recipient, uint256 amount) public returns (bool) {
        _transfer(sender, recipient, amount);
        _approve(sender, msg.sender, _allowances[sender][msg.sender].sub(amount));
        return true;
    }

    /**
     * @dev Atomically increases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to `approve` that can be used as a mitigation for
     * problems described in `IERC20.approve`.
     *
     * Emits an `Approval` event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function increaseAllowance(address spender, uint256 addedValue) public returns (bool) {
        _approve(msg.sender, spender, _allowances[msg.sender][spender].add(addedValue));
        return true;
    }

    /**
     * @dev Atomically decreases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to `approve` that can be used as a mitigation for
     * problems described in `IERC20.approve`.
     *
     * Emits an `Approval` event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     * - `spender` must have allowance for the caller of at least
     * `subtractedValue`.
     */
    function decreaseAllowance(address spender, uint256 subtractedValue) public returns (bool) {
        _approve(msg.sender, spender, _allowances[msg.sender][spender].sub(subtractedValue));
        return true;
    }

    /**
     * @dev Moves tokens `amount` from `sender` to `recipient`.
     *
     * This is internal function is equivalent to `transfer`, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a `Transfer` event.
     *
     * Requirements:
     *
     * - `sender` cannot be the zero address.
     * - `recipient` cannot be the zero address.
     * - `sender` must have a balance of at least `amount`.
     */
    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");

        _balances[sender] = _balances[sender].sub(amount);
        _balances[recipient] = _balances[recipient].add(amount);
        emit Transfer(sender, recipient, amount);
    }

    /** @dev Creates `amount` tokens and assigns them to `account`, increasing
     * the total supply.
     *
     * Emits a `Transfer` event with `from` set to the zero address.
     *
     * Requirements
     *
     * - `to` cannot be the zero address.
     */
    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: mint to the zero address");

        _totalSupply = _totalSupply.add(amount);
        _balances[account] = _balances[account].add(amount);
        emit Transfer(address(0), account, amount);
    }

     /**
     * @dev Destoys `amount` tokens from `account`, reducing the
     * total supply.
     *
     * Emits a `Transfer` event with `to` set to the zero address.
     *
     * Requirements
     *
     * - `account` cannot be the zero address.
     * - `account` must have at least `amount` tokens.
     */
    function _burn(address account, uint256 value) internal {
        require(account != address(0), "ERC20: burn from the zero address");

        _totalSupply = _totalSupply.sub(value);
        _balances[account] = _balances[account].sub(value);
        emit Transfer(account, address(0), value);
    }

    /**
     * @dev Sets `amount` as the allowance of `spender` over the `owner`s tokens.
     *
     * This is internal function is equivalent to `approve`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an `Approval` event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     */
    function _approve(address owner, address spender, uint256 value) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = value;
        emit Approval(owner, spender, value);
    }

    /**
     * @dev Destoys `amount` tokens from `account`.`amount` is then deducted
     * from the caller's allowance.
     *
     * See `_burn` and `_approve`.
     */
    function _burnFrom(address account, uint256 amount) internal {
        _burn(account, amount);
        _approve(account, msg.sender, _allowances[account][msg.sender].sub(amount));
    }
}

// File: openzeppelin-solidity/contracts/access/Roles.sol

pragma solidity ^0.5.0;

/**
 * @title Roles
 * @dev Library for managing addresses assigned to a Role.
 */
library Roles {
    struct Role {
        mapping (address => bool) bearer;
    }

    /**
     * @dev Give an account access to this role.
     */
    function add(Role storage role, address account) internal {
        require(!has(role, account), "Roles: account already has role");
        role.bearer[account] = true;
    }

    /**
     * @dev Remove an account's access to this role.
     */
    function remove(Role storage role, address account) internal {
        require(has(role, account), "Roles: account does not have role");
        role.bearer[account] = false;
    }

    /**
     * @dev Check if an account has this role.
     * @return bool
     */
    function has(Role storage role, address account) internal view returns (bool) {
        require(account != address(0), "Roles: account is the zero address");
        return role.bearer[account];
    }
}

// File: openzeppelin-solidity/contracts/access/roles/PauserRole.sol

pragma solidity ^0.5.0;


contract PauserRole {
    using Roles for Roles.Role;

    event PauserAdded(address indexed account);
    event PauserRemoved(address indexed account);

    Roles.Role private _pausers;

    constructor () internal {
        _addPauser(msg.sender);
    }

    modifier onlyPauser() {
        require(isPauser(msg.sender), "PauserRole: caller does not have the Pauser role");
        _;
    }

    function isPauser(address account) public view returns (bool) {
        return _pausers.has(account);
    }

    function addPauser(address account) public onlyPauser {
        _addPauser(account);
    }

    function renouncePauser() public {
        _removePauser(msg.sender);
    }

    function _addPauser(address account) internal {
        _pausers.add(account);
        emit PauserAdded(account);
    }

    function _removePauser(address account) internal {
        _pausers.remove(account);
        emit PauserRemoved(account);
    }
}

// File: openzeppelin-solidity/contracts/lifecycle/Pausable.sol

pragma solidity ^0.5.0;


/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotPaused` and `whenPaused`, which can be applied to
 * the functions of your contract. Note that they will not be pausable by
 * simply including this module, only once the modifiers are put in place.
 */
contract Pausable is PauserRole {
    /**
     * @dev Emitted when the pause is triggered by a pauser (`account`).
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by a pauser (`account`).
     */
    event Unpaused(address account);

    bool private _paused;

    /**
     * @dev Initializes the contract in unpaused state. Assigns the Pauser role
     * to the deployer.
     */
    constructor () internal {
        _paused = false;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view returns (bool) {
        return _paused;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     */
    modifier whenNotPaused() {
        require(!_paused, "Pausable: paused");
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     */
    modifier whenPaused() {
        require(_paused, "Pausable: not paused");
        _;
    }

    /**
     * @dev Called by a pauser to pause, triggers stopped state.
     */
    function pause() public onlyPauser whenNotPaused {
        _paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @dev Called by a pauser to unpause, returns to normal state.
     */
    function unpause() public onlyPauser whenPaused {
        _paused = false;
        emit Unpaused(msg.sender);
    }
}

// File: openzeppelin-solidity/contracts/token/ERC20/ERC20Pausable.sol

pragma solidity ^0.5.0;



/**
 * @title Pausable token
 * @dev ERC20 modified with pausable transfers.
 */
contract ERC20Pausable is ERC20, Pausable {
    function transfer(address to, uint256 value) public whenNotPaused returns (bool) {
        return super.transfer(to, value);
    }

    function transferFrom(address from, address to, uint256 value) public whenNotPaused returns (bool) {
        return super.transferFrom(from, to, value);
    }

    function approve(address spender, uint256 value) public whenNotPaused returns (bool) {
        return super.approve(spender, value);
    }

    function increaseAllowance(address spender, uint addedValue) public whenNotPaused returns (bool) {
        return super.increaseAllowance(spender, addedValue);
    }

    function decreaseAllowance(address spender, uint subtractedValue) public whenNotPaused returns (bool) {
        return super.decreaseAllowance(spender, subtractedValue);
    }
}

// File: openzeppelin-solidity/contracts/access/roles/MinterRole.sol

pragma solidity ^0.5.0;


contract MinterRole {
    using Roles for Roles.Role;

    event MinterAdded(address indexed account);
    event MinterRemoved(address indexed account);

    Roles.Role private _minters;

    constructor () internal {
        _addMinter(msg.sender);
    }

    modifier onlyMinter() {
        require(isMinter(msg.sender), "MinterRole: caller does not have the Minter role");
        _;
    }

    function isMinter(address account) public view returns (bool) {
        return _minters.has(account);
    }

    function addMinter(address account) public onlyMinter {
        _addMinter(account);
    }

    function renounceMinter() public {
        _removeMinter(msg.sender);
    }

    function _addMinter(address account) internal {
        _minters.add(account);
        emit MinterAdded(account);
    }

    function _removeMinter(address account) internal {
        _minters.remove(account);
        emit MinterRemoved(account);
    }
}

// File: openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol

pragma solidity ^0.5.0;



/**
 * @dev Extension of `ERC20` that adds a set of accounts with the `MinterRole`,
 * which have permission to mint (create) new tokens as they see fit.
 *
 * At construction, the deployer of the contract is the only minter.
 */
contract ERC20Mintable is ERC20, MinterRole {
    /**
     * @dev See `ERC20._mint`.
     *
     * Requirements:
     *
     * - the caller must have the `MinterRole`.
     */
    function mint(address account, uint256 amount) public onlyMinter returns (bool) {
        _mint(account, amount);
        return true;
    }
}

// File: openzeppelin-solidity/contracts/ownership/Ownable.sol

pragma solidity ^0.5.0;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be aplied to your functions to restrict their use to
 * the owner.
 */
contract Ownable {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor () internal {
        _owner = msg.sender;
        emit OwnershipTransferred(address(0), _owner);
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(isOwner(), "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev Returns true if the caller is the current owner.
     */
    function isOwner() public view returns (bool) {
        return msg.sender == _owner;
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * > Note: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public onlyOwner {
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     */
    function _transferOwnership(address newOwner) internal {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

// File: contracts/token/OwnerBurnableToken.sol

pragma solidity 0.5.8;



/**
 * @title Owner Burnable Token
 * @dev Token that allows the owner to irreversibly burned (destroyed) any token.
 */
contract OwnerBurnableToken is Ownable, ERC20Mintable {
  /**
   * @dev Burns a specific amount of tokens for the address.
   * @param who who's tokens are gona be burned
   * @param value The amount of token to be burned.
   */
  function burn(address who, uint256 value) public onlyOwner {
    _burn(who, value);
  }
}

// File: contracts/token/RiskProToken.sol

pragma solidity 0.5.8;




contract RiskProToken is ERC20Detailed, ERC20Pausable, OwnerBurnableToken {

  string private _name = "RIFPro";
  string private _symbol = "RIFP";
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

// File: contracts/token/StableToken.sol

pragma solidity 0.5.8;



contract StableToken is ERC20Detailed, OwnerBurnableToken {

  string private _name = "RIF Dollar on Chain";
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

// File: contracts/interface/IMoCInrate.sol

pragma solidity 0.5.8;

interface IMoCInrate {
    // Transaction types
    function MINT_RISKPRO_FEES_RESERVE() external view returns(uint8);
    function REDEEM_RISKPRO_FEES_RESERVE() external view returns(uint8);
    function MINT_STABLETOKEN_FEES_RESERVE() external view returns(uint8);
    function REDEEM_STABLETOKEN_FEES_RESERVE() external view returns(uint8);
    function MINT_RISKPROX_FEES_RESERVE() external view returns(uint8);
    function REDEEM_RISKPROX_FEES_RESERVE() external view returns(uint8);
    function MINT_RISKPRO_FEES_MOC() external view returns(uint8);
    function REDEEM_RISKPRO_FEES_MOC() external view returns(uint8);
    function MINT_STABLETOKEN_FEES_MOC() external view returns(uint8);
    function REDEEM_STABLETOKEN_FEES_MOC() external view returns(uint8);
    function MINT_RISKPROX_FEES_MOC() external view returns(uint8);
    function REDEEM_RISKPROX_FEES_MOC() external view returns(uint8);

    function dailyInratePayment() external returns(uint256);

    function payRiskProHoldersInterestPayment() external returns(uint256);

    function calculateRiskProHoldersInterest() external view returns(uint256, uint256);

    function getRiskProInterestAddress() external view returns(address payable);

    function getRiskProRate() external view returns(uint256);

    function getRiskProInterestBlockSpan() external view returns(uint256);

    function isDailyEnabled() external view returns(bool);

    function isRiskProInterestEnabled() external view returns(bool);

    function commissionsAddress() external view returns(address payable);

    function calcCommissionValue(uint256 reserveAmount, uint8 txType) external view returns(uint256);

    function calculateVendorMarkup(address vendorAccount, uint256 amount) external view returns (uint256 markup);

    function calcStableTokenRedInterestValues(uint256 STABLETOKENAmount, uint256 reserveAmount) external view returns(uint256);

    function calcMintInterestValues(bytes32 bucket, uint256 reserveAmount) external view returns(uint256);

    function calcFinalRedeemInterestValue(bytes32 bucket, uint256 reserveToRedeem) external view returns(uint256);

    function setRiskProInterestBlockSpan(uint256 newBitProBlockSpan) external;
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

// File: contracts/token/MoCToken.sol

pragma solidity 0.5.8;



contract MoCToken is ERC20Detailed, OwnerBurnableToken {

  string private _name = "MoC";
  string private _symbol = "MOC";
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

// File: contracts/MoCConverter.sol

pragma solidity 0.5.8;




contract MoCConverter is MoCBase, MoCLibConnection {
  IMoCState internal mocState;

  function initialize(address connectorAddress) public initializer {
    initializePrecisions();
    initializeBase(connectorAddress);
    mocState = IMoCState(connector.mocState());
  }

  /**
  * @dev ReserveTokens equivalent for the amount of riskPros given
  * @param amount Amount of RiskPro to calculate the total price
  * @return total ReserveTokens Price of the amount RiskPros [using reservePrecision].
  */
  function riskProToResToken(uint256 amount) public view returns (uint256) {
    uint256 tecPrice = mocState.riskProTecPrice();

    return mocLibConfig.totalRiskProInResTokens(amount, tecPrice);
  }

  /**
  * @dev Converts Reserve to RiskPro
  * @param resTokensAmount Reserve amount
  * @return RiskPro amount
  */
  function resTokenToRiskPro(uint256 resTokensAmount) public view returns (uint256) {
    return mocLibConfig.maxRiskProWithResTokens(resTokensAmount, mocState.riskProTecPrice());
  }

  /**
  * @dev ReserveTokens equivalent for the amount of riskPro given applying the spotDiscountRate
  * @param amount amount of RiskPro [using reservePrecision]
  * @return Reserve amount
  */
  function riskProDiscToResToken(uint256 amount) public view returns(uint256) {
    uint256 discountRate = mocState.riskProSpotDiscountRate();
    uint256 totalResTokensValuet = riskProToResToken(amount);

    return mocLibConfig.applyDiscountRate(totalResTokensValuet, discountRate);
  }

  function resTokenToRiskProDisc(uint256 resTokensAmount) public view returns (uint256) {
    return mocLibConfig.maxRiskProWithResTokens(resTokensAmount, mocState.riskProDiscountPrice());
  }

  function stableTokensToResToken(uint256 stableTokenAmount) public view returns (uint256) {
    return mocLibConfig.stableTokensResTokensValue(stableTokenAmount, mocState.peg(), mocState.getReserveTokenPrice());
  }

  function stableTokensToResTokenWithPrice(uint256 stableTokenAmount, uint256 reservePrice) public view returns (uint256) {
    return mocLibConfig.stableTokensResTokensValue(stableTokenAmount, mocState.peg(), reservePrice);
  }

  function resTokenToStableToken(uint256 resTokensAmount) public view returns (uint256) {
    return mocLibConfig.maxStableTokensWithResTokens(resTokensAmount, mocState.getReserveTokenPrice());
  }

  function riskProxToResToken(uint256 riskProxAmount, bytes32 bucket) public view returns (uint256) {
    return mocLibConfig.riskProResTokensValuet(riskProxAmount, mocState.bucketRiskProTecPrice(bucket));
  }

  function riskProxToResTokenHelper(uint256 riskProxAmount, bytes32 bucket) public view returns(uint256) {
    return mocLibConfig.riskProResTokensValuet(riskProxAmount, mocState.bucketRiskProTecPriceHelper(bucket));
  }

  function resTokenToRiskProx(uint256 resTokensAmount, bytes32 bucket) public view returns (uint256) {
    return mocLibConfig.maxRiskProWithResTokens(resTokensAmount, mocState.bucketRiskProTecPrice(bucket));
  }

  function resTokenToRiskProWithPrice(uint256 resTokensAmount, uint256 price) public view returns (uint256) {
    return mocLibConfig.maxRiskProWithResTokens(resTokensAmount, price);
  }

  function riskProToResTokenWithPrice(uint256 riskProAmount, uint256 riskProPrice) public view returns (uint256) {
    return mocLibConfig.riskProResTokensValuet(riskProAmount, riskProPrice);
  }

  function mocToResToken(uint256 mocAmount) public view returns(uint256) {
    return mocLibConfig.mocReserveTokenValue(mocAmount, mocState.getReserveTokenPrice(), mocState.getMoCPrice());
  }

  function resTokenToMoC(uint256 resTokensAmount) public view returns(uint256) {
    return mocLibConfig.maxMoCWithReserveToken(resTokensAmount, mocState.getReserveTokenPrice(), mocState.getMoCPrice());
  }

  function mocToResTokenWithPrice(uint256 mocAmount, uint256 reservePrice, uint256 mocPrice) public view returns(uint256) {
    return mocLibConfig.mocReserveTokenValue(mocAmount, reservePrice, mocPrice);
  }

  function resTokenToMoCWithPrice(uint256 resTokensAmount, uint256 reservePrice, uint256 mocPrice) public view returns(uint256) {
    return mocLibConfig.maxMoCWithReserveToken(resTokensAmount, reservePrice, mocPrice);
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}

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

// File: contracts/MoCBucketContainer.sol

pragma solidity 0.5.8;






contract MoCBucketContainer is MoCBase, Governed {
  using SafeMath for uint256;
  using Math for uint256;

  struct RiskProxBalance {
    uint256 value;
    uint256 index; // Index start in 1, zero is reserved for NULL
  }

  struct MoCBucket {
    bytes32 name;
    bool isBase;
    uint256 nStable;
    uint256 nRiskPro;
    uint256 nReserve;
    uint256 cobj;
    // Should only be used in X buckets
    mapping(address => RiskProxBalance) riskProxBalances;
    address payable[] activeBalances;
    uint256 activeBalancesLength;
    // Should only be used in Base buckets (C0)
    uint256 inrateBag;
    bool available;
  }

  event BucketMovement(
    bytes32 from,
    bytes32 to,
    uint256 reserves,
    uint256 stableTokens
  );

  event BucketCreation(
    bytes32 name,
    uint256 cobj
  );

  event BucketStateUpdate(
    bytes32 name,
    uint256 nReserve,
    uint256 nStable,
    uint256 nRiskProx,
    uint256 inrateBag
  );

  mapping(bytes32 => MoCBucket) internal mocBuckets;

  /**
   GETTERS
   */
  function getBucketNReserve(bytes32 bucket) public view returns (uint256) {
    return mocBuckets[bucket].nReserve;
  }

  function getBucketNRiskPro(bytes32 bucket) public view returns (uint256) {
    return mocBuckets[bucket].nRiskPro;
  }

  function getBucketNStableToken(bytes32 bucket) public view returns (uint256) {
    return mocBuckets[bucket].nStable;
  }

  function getBucketCobj(bytes32 bucket) public view returns (uint256) {
    return mocBuckets[bucket].cobj;
  }

  function getInrateBag(bytes32 bucket) public view returns (uint256) {
    return mocBuckets[bucket].inrateBag;
  }

  /**
   * @dev Sets the objective coverage (cobj) on an specficied bucket.
   * @param  _bucket - name of the bucket
   * @param  _cobj - new value of cobj
   */
  function setBucketCobj(bytes32 _bucket, uint256 _cobj) public onlyAuthorizedChanger() {
    //TODO: It is necessary to analyze the impact in the model it has when changing X2. This
    mocBuckets[_bucket].cobj = _cobj;
  }

  /**
    @dev returns true if the bucket is a base bucket
    @param bucket Name of the bucket
  **/
  function isBucketBase(bytes32 bucket) public view returns (bool) {
    return mocBuckets[bucket].isBase;
  }

  /**
    @dev returns true if the bucket have stableTokens in it
    @param bucket Name of the bucket
  **/
  function isBucketEmpty(bytes32 bucket) public view returns (bool) {
    return mocBuckets[bucket].nStable == 0;
  }

  /**
    @dev Returns all the address that currently have riskProx position for this bucket
    @param bucket bucket of the active address
  */
  function getActiveAddresses(bytes32 bucket) public view returns (address payable[] memory) {
    return mocBuckets[bucket].activeBalances;
  }

  /**
    @dev Returns all the address that currently have riskProx position for this bucket
    @param bucket bucket of the active address
  */
  function getActiveAddressesCount(bytes32 bucket) public view returns (uint256 count) {
    return mocBuckets[bucket].activeBalancesLength;
  }

  /**
    @dev Add values to all variables of the bucket
    @param bucketName Name of the bucket
    @param reserveTokens ReserveToken amount [using reservePrecision]
    @param stableToken StableToken amount [using mocPrecision]
    @param riskProx RiskProx amount [using mocPrecision]
  */
  function addValuesToBucket(bytes32 bucketName, uint256 reserveTokens, uint256 stableToken, uint256 riskProx)
  public onlyWhitelisted(msg.sender) {
    MoCBucket storage bucket = mocBuckets[bucketName];

    bucket.nReserve = bucket.nReserve.add(reserveTokens);
    bucket.nStable = bucket.nStable.add(stableToken);
    bucket.nRiskPro = bucket.nRiskPro.add(riskProx);
  }

  /**
    @dev Substract values to all variables of the bucket
    @param bucketName Name of the bucket
    @param reserve ReserveToken amount [using reservePrecision]
    @param stableToken StableToken amount [using mocPrecision]
    @param riskProx RiskProx amount [using mocPrecision]
  */
  function substractValuesFromBucket(bytes32 bucketName, uint256 reserve, uint256 stableToken, uint256 riskProx)
  public onlyWhitelisted(msg.sender) {
    MoCBucket storage bucket = mocBuckets[bucketName];

    bucket.nReserve = bucket.nReserve.sub(reserve);
    bucket.nStable = bucket.nStable.sub(stableToken);
    bucket.nRiskPro = bucket.nRiskPro.sub(riskProx);
  }

  /**
    @dev Moves ReserveTokens from inrateBag to main ReserveTokens bucket bag
    @param bucketName Name of the bucket to operate
    @param amount value to move from inrateBag to main bag [using reservePrecision]
   */
  function deliverInrate(bytes32 bucketName, uint256 amount) public
   onlyWhitelisted(msg.sender) onlyBaseBucket(bucketName) bucketStateUpdate(bucketName) {
    MoCBucket storage bucket = mocBuckets[bucketName];

    uint256 toMove = Math.min(bucket.inrateBag, amount);

    bucket.inrateBag = bucket.inrateBag.sub(toMove);
    bucket.nReserve = bucket.nReserve.add(toMove);
  }

  /**
    @dev Removes Interests rate from Inrate bag
    @param bucketName Name of the bucket to operate
    @param amount value to move from inrateBag to main bag [using reservePrecision]
    @return Retrieved value
   */
  function recoverInrate(bytes32 bucketName, uint256 amount) public
  onlyWhitelisted(msg.sender) onlyBaseBucket(bucketName) bucketStateUpdate(bucketName) returns(uint256) {
    MoCBucket storage bucket = mocBuckets[bucketName];

    uint256 toRetrieve = Math.min(bucket.inrateBag, amount);

    bucket.inrateBag = bucket.inrateBag.sub(toRetrieve);

    return toRetrieve;
  }

  /**
    @dev Moves ReserveTokens from origin bucket to destination bucket inrateBag
    @param bucketName name of the bucket to from which takes
    @param reserveAmount value to add to main bag [using reservePrecision]
  */
  function payInrate(bytes32 bucketName, uint256 reserveAmount) public
  onlyWhitelisted(msg.sender) onlyBaseBucket(bucketName) {
    MoCBucket storage bucket = mocBuckets[bucketName];
    bucket.inrateBag = bucket.inrateBag.add(reserveAmount);
  }

  /**
    @dev Move ReserveTokens and StableTokens from one bucket to another
    @param from Name of bucket from where the ReserveTokens will be removed
    @param to Name of bucket from where the ReserveTokens will be added
    @param reserve ReserveTokens amount [using reservePrecision]
    @param stableTokens StableTokens amount [using mocPrecision]
  **/
  function moveResTokensAndStableTokens(bytes32 from, bytes32 to, uint256 reserve, uint256 stableTokens) public
  onlyWhitelisted(msg.sender) bucketStateUpdate(from) bucketStateUpdate(to) {
    MoCBucket storage bucketFrom = mocBuckets[from];
    MoCBucket storage bucketTo = mocBuckets[to];

    bucketFrom.nReserve = bucketFrom.nReserve.sub(reserve);
    bucketTo.nReserve = bucketTo.nReserve.add(reserve);

    bucketFrom.nStable = bucketFrom.nStable.sub(stableTokens);
    bucketTo.nStable = bucketTo.nStable.add(stableTokens);

    emit BucketMovement(from, to, reserve, stableTokens);
  }

  /**
    @dev Clears completely the origin bucket, removing all StableTokens, ReserveTokens and riskProxs
    @param toLiquidate Bucket to be cleared out
    @param destination Bucket that will receive the StableTokens and ReserveTokens
   */
  function liquidateBucket(bytes32 toLiquidate, bytes32 destination) public onlyWhitelisted(msg.sender) {
    require(!isBucketBase(toLiquidate), "Cannot liquidate a base bucket");

    clearBucketBalances(toLiquidate);
    emptyBucket(toLiquidate, destination);
  }

  /**
    @dev Clears StableTokens and ReserveTokens from bucket origin and sends them to destination bucket
    @param origin Bucket to clear out
    @param destination Destination bucket
  **/
  function emptyBucket(bytes32 origin, bytes32 destination) public onlyWhitelisted(msg.sender) {
    moveResTokensAndStableTokens(origin, destination, mocBuckets[origin].nReserve, mocBuckets[origin].nStable);
  }

  /**
   * @dev checks if a bucket exists
   * @param bucket name of the bucket
   */
  function isAvailableBucket(bytes32 bucket) public view returns (bool) {
    return mocBuckets[bucket].available;
  }

  /**
    @dev Put all bucket RiskProx balances in zero
    @param bucketName Bucket to clear out
   */
  function clearBucketBalances(bytes32 bucketName) public onlyWhitelisted(msg.sender) {
    MoCBucket storage bucket = mocBuckets[bucketName];
    bucket.nRiskPro = 0;
    bucket.activeBalancesLength = 0;
  }

  /**
    @dev Creates bucket
    @param name Name of the bucket
    @param cobj Target Coverage of the bucket
    @param isBase Indicates if it is a base bucket (true) or not (false)
  */
  function createBucket(bytes32 name, uint256 cobj, bool isBase) internal {
    mocBuckets[name].name = name;
    mocBuckets[name].nStable = 0;
    mocBuckets[name].nRiskPro = 0;
    mocBuckets[name].nReserve = 0;
    mocBuckets[name].cobj = cobj;
    mocBuckets[name].isBase = isBase;
    mocBuckets[name].available = true;
    emit BucketCreation(name, cobj);
  }

  modifier onlyBaseBucket(bytes32 bucket) {
    require(isBucketBase(bucket), "Bucket should be a base type bucket");
    _;
  }

  modifier bucketStateUpdate(bytes32 bucket) {
    _;
    emit BucketStateUpdate(
      bucket,
      mocBuckets[bucket].nReserve,
      mocBuckets[bucket].nStable,
      mocBuckets[bucket].nRiskPro,
      mocBuckets[bucket].inrateBag
    );
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}

// File: contracts/MoCRiskProxManager.sol

pragma solidity 0.5.8;





contract MoCRiskProxManager is MoCBucketContainer {
  using SafeMath for uint256;
  uint256 constant MIN_ALLOWED_BALANCE = 0;

  function initialize(address connectorAddress, address _governor, uint256 _c0Cobj, uint256 _x2Cobj) public initializer {
    initializeBase(connectorAddress);
    initializeValues(_governor);
    createBucket(BUCKET_C0, _c0Cobj, true);
    createBucket(BUCKET_X2, _x2Cobj, false);
  }

  /**
    @dev returns user balance
    @param bucket RiskProx corresponding bucket to get balance from
    @param userAddress user address to get balance from
    @return total balance for the userAddress
  */
  function riskProxBalanceOf(bytes32 bucket, address userAddress) public view returns (uint256) {
    RiskProxBalance memory userBalance = mocBuckets[bucket].riskProxBalances[userAddress];
    if (!hasValidBalance(bucket, userAddress, userBalance.index)) return 0;
    return userBalance.value;
  }

  /**
    @dev verifies that this user has assigned balance for the given bucket
    @param bucket corresponding Leveraged bucket to get balance from
    @param userAddress user address to verify balance for
    @param index index, starting from 1, where the address of the user is being kept
    @return true if the user has assigned balance
  */
  function hasValidBalance(bytes32 bucket, address userAddress, uint256 index) public view returns (bool) {
    return (index != 0) && (index <= getActiveAddressesCount(bucket)) && (mocBuckets[bucket].activeBalances[index - 1] == userAddress);
  }

  /**
    @dev  Assigns the amount of RiskProx
    @param bucket bucket from which the RiskProx will be removed
    @param account user address to redeem for
    @param riskProxAmount riskProx amount to redeem [using mocPresicion]
    @param totalCost ReserveToken value of riskProxAmount [using reservePrecision]
  */
  function assignRiskProx(bytes32 bucket, address payable account, uint256 riskProxAmount, uint256 totalCost)
    public
    onlyWhitelisted(msg.sender)
  {
    uint256 currentBalance = riskProxBalanceOf(bucket, account);

    setRiskProxBalanceOf(bucket, account, currentBalance.add(riskProxAmount));
    addValuesToBucket(bucket, totalCost, 0, riskProxAmount);
  }

  /**
    @dev  Removes the amount of RiskProx and substract ReserveTokens from bucket
    @param bucket bucket from which the RiskProx will be removed
    @param userAddress user address to redeem for
    @param riskProxAmount riskProx amount to redeem [using mocPresicion]
    @param totalCost reserveToken value of riskProxAmount [using reservePrecision]
  */
  function removeRiskProx(bytes32 bucket, address payable userAddress, uint256 riskProxAmount, uint256 totalCost)
    public
    onlyWhitelisted(msg.sender)
  {
    uint256 currentBalance = riskProxBalanceOf(bucket, userAddress);

    setRiskProxBalanceOf(bucket, userAddress, currentBalance.sub(riskProxAmount));
    substractValuesFromBucket(bucket, totalCost, 0, riskProxAmount);
  }

  /**
    @dev Sets the amount of RiskProx
    @param bucket bucket from which the RiskProx will be setted
    @param userAddress user address to redeem for
    @param value riskProx amount to redeem [using mocPresicion]
  */
  function setRiskProxBalanceOf(bytes32 bucket, address payable userAddress, uint256 value) public onlyWhitelisted(msg.sender) {
    mocBuckets[bucket].riskProxBalances[userAddress].value = value;

    uint256 index = mocBuckets[bucket].riskProxBalances[userAddress].index;
    if (!hasValidBalance(bucket, userAddress, index)) index = 0;

    bool hasBalance = value > MIN_ALLOWED_BALANCE;
    // The address is not in the array
    if (index == 0) {
      if (hasBalance) {
        if (mocBuckets[bucket].activeBalances.length == mocBuckets[bucket].activeBalancesLength) {
          mocBuckets[bucket].activeBalances.length += 1;
        }
        uint256 currentIndex = mocBuckets[bucket].activeBalancesLength++;
        mocBuckets[bucket].activeBalances[currentIndex] = userAddress;
        mocBuckets[bucket].riskProxBalances[userAddress].index = mocBuckets[bucket].activeBalancesLength;
      }
    } else {
      if (!hasBalance) {
        // We need to delete this address from the tracker
        uint256 lastActiveIndex = mocBuckets[bucket].activeBalancesLength;
        address payable keyToMove = mocBuckets[bucket].activeBalances[lastActiveIndex - 1];
        mocBuckets[bucket].activeBalances[index - 1] = keyToMove;
        // Alternative index and array decreases lenght to prevent gas limit
        mocBuckets[bucket].activeBalancesLength--;
        // Update moved key index
        mocBuckets[bucket].riskProxBalances[keyToMove].index = index;
        // Disable empty account index (0 == NULL)
        mocBuckets[bucket].riskProxBalances[userAddress].index = 0;
      }
    }
  }

  /**
   * @dev intializes values of the contract
   */
  function initializeValues(address _governor) internal {
    governor = IGovernor(_governor);
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

// File: contracts/MoCExchange.sol

pragma solidity 0.5.8;
pragma experimental ABIEncoderV2;













contract MoCExchangeEvents {
  event RiskProMint(
    address indexed account,
    uint256 amount,
    uint256 reserveTotal,
    uint256 commission,
    uint256 reservePrice,
    uint256 mocCommissionValue,
    uint256 mocPrice,
    uint256 reserveTokenMarkup,
    uint256 mocMarkup,
    address vendorAccount
  );
  event RiskProWithDiscountMint(
    uint256 riskProTecPrice,
    uint256 riskProDiscountPrice,
    uint256 amount
  );
  event RiskProRedeem(
    address indexed account,
    uint256 amount,
    uint256 reserveTotal,
    uint256 commission,
    uint256 reservePrice,
    uint256 mocCommissionValue,
    uint256 mocPrice,
    uint256 reserveTokenMarkup,
    uint256 mocMarkup,
    address vendorAccount
  );
  event StableTokenMint(
    address indexed account,
    uint256 amount,
    uint256 reserveTotal,
    uint256 commission,
    uint256 reservePrice,
    uint256 mocCommissionValue,
    uint256 mocPrice,
    uint256 reserveTokenMarkup,
    uint256 mocMarkup,
    address vendorAccount
  );
  event StableTokenRedeem(
    address indexed account,
    uint256 amount,
    uint256 reserveTotal,
    uint256 commission,
    uint256 reservePrice,
    uint256 mocCommissionValue,
    uint256 mocPrice,
    uint256 reserveTokenMarkup,
    uint256 mocMarkup,
    address vendorAccount
  );
  event FreeStableTokenRedeem(
    address indexed account,
    uint256 amount,
    uint256 reserveTotal,
    uint256 commission,
    uint256 interests,
    uint256 reservePrice,
    uint256 mocCommissionValue,
    uint256 mocPrice,
    uint256 reserveTokenMarkup,
    uint256 mocMarkup,
    address vendorAccount
  );

  event RiskProxMint(
    bytes32 bucket,
    address indexed account,
    uint256 amount,
    uint256 reserveTotal,
    uint256 interests,
    uint256 leverage,
    uint256 commission,
    uint256 reservePrice,
    uint256 mocCommissionValue,
    uint256 mocPrice,
    uint256 reserveTokenMarkup,
    uint256 mocMarkup,
    address vendorAccount
  );

  event RiskProxRedeem(
    bytes32 bucket,
    address indexed account,
    uint256 commission,
    uint256 amount,
    uint256 reserveTotal,
    uint256 interests,
    uint256 leverage,
    uint256 reservePrice,
    uint256 mocCommissionValue,
    uint256 mocPrice,
    uint256 reserveTokenMarkup,
    uint256 mocMarkup,
    address vendorAccount
  );
}


contract MoCExchange is MoCExchangeEvents, MoCBase, MoCLibConnection {
  using Math for uint256;
  using SafeMath for uint256;

  // Contracts
  IMoCState internal mocState;
  MoCConverter internal mocConverter;
  MoCRiskProxManager internal riskProxManager;
  RiskProToken internal riskProToken;
  StableToken internal stableToken;
  IMoCInrate internal mocInrate;
  IMoC internal moc;

  /**
    @dev Initializes the contract
    @param connectorAddress MoCConnector contract address
  */
  function initialize(address connectorAddress) public initializer {
    initializePrecisions();
    initializeBase(connectorAddress);
    initializeContracts();
  }

  /************************************/
  /***** UPGRADE v0110      ***********/
  /************************************/

  /** START UPDATE V0110: 24/09/2020  **/
  /** Upgrade to support multiple commission rates **/
  /** Public functions **/

  /**
   @dev Converts MoC commission from ReserveToken to MoC price
   @param reserveTokenAmount Amount to be converted to MoC price
   @return Amount converted to MoC Price, ReserveToken price and MoC price
  */
  function convertToMoCPrice(uint256 reserveTokenAmount) public view returns (uint256, uint256, uint256) {
    uint256 reserveTokenPrice = mocState.getReserveTokenPrice();
    uint256 mocPrice = mocState.getMoCPrice();

    // Calculate amount in MoC
    uint256 amountInMoC = mocConverter.resTokenToMoCWithPrice(reserveTokenAmount, reserveTokenPrice, mocPrice);

    return (amountInMoC, reserveTokenPrice, mocPrice);
  }

  /**
   @dev Converts MoC commission from ReserveToken to MoC price
   @param owner address of token owner
   @param spender address of token spender
   @return MoC balance of owner and MoC allowance of spender
  */
  function getMoCTokenBalance(address owner, address spender) public view
  returns (uint256 mocBalance, uint256 mocAllowance) {
    mocBalance = 0;
    mocAllowance = 0;

    MoCToken mocToken = MoCToken(mocState.getMoCToken());

    if (address(mocToken) != address(0)) {
      // Get balance and allowance from sender
      mocBalance = mocToken.balanceOf(owner);
      mocAllowance = mocToken.allowance(owner, spender);
    }

    return (mocBalance, mocAllowance);
  }

  /**
   @dev Calculates commissions in MoC and ReserveToken
   @param params Params defined in CommissionParamsStruct
   @return Commissions calculated in MoC price and ReserveToken price; and ReserveToken and MoC prices
  */
  function calculateCommissionsWithPrices(CommissionParamsStruct memory params)
  public view
  returns (CommissionReturnStruct memory ret) {
    // Get balance and allowance from sender
    (uint256 mocBalance, uint256 mocAllowance) = getMoCTokenBalance(params.account, address(moc));

    // Check commission rate in MoC according to transaction type
    uint256 mocCommissionInReserveToken = mocInrate.calcCommissionValue(params.amount, params.txTypeFeesMOC);

    // Calculate amount in MoC
    (ret.mocCommission, ret.reserveTokenPrice, ret.mocPrice) = convertToMoCPrice(mocCommissionInReserveToken);
    ret.reserveTokenCommission = 0;

    // Calculate vendor markup
    uint256 reserveTokenMarkup = mocInrate.calculateVendorMarkup(params.vendorAccount, params.amount);
    (ret.mocMarkup, , ) = convertToMoCPrice(reserveTokenMarkup);
    ret.reserveTokenMarkup = 0;
    uint256 totalMoCFee = ret.mocCommission.add(ret.mocMarkup);

    // Check if there is enough balance of MoC
    if ((!(mocBalance >= totalMoCFee && mocAllowance >= totalMoCFee)) || (mocCommissionInReserveToken == 0)) {
      // Insufficient funds
      ret.mocCommission = 0;
      ret.mocMarkup = 0;

      // Check commission rate in ReserveToken according to transaction type
      ret.reserveTokenCommission = mocInrate.calcCommissionValue(params.amount, params.txTypeFeesReserveToken);
      ret.reserveTokenMarkup = reserveTokenMarkup;
    }

    return ret;
  }

  /** END UPDATE V0110: 24/09/2020 **/

  /**
   @dev Mint RiskPros and give it to the msg.sender
   @param account Address of minter
   @param reserveTokenAmount Amount in ReserveToken to mint
   @param vendorAccount Vendor address
  */
// solium-disable-next-line security/no-assign-params
  function mintRiskPro(address account, uint256 reserveTokenAmount, address vendorAccount)
    public
    onlyWhitelisted(msg.sender)
    returns (uint256, uint256, uint256, uint256, uint256)
  {
    RiskProMintStruct memory details;

    details.riskProRegularPrice = mocState.riskProTecPrice();
    details.finalRiskProAmount = 0;
    details.reserveTokenValue = 0;

    if (mocState.state() == IMoCState.States.RiskProDiscount) {
      details.discountPrice = mocState.riskProDiscountPrice();
      details.riskProDiscountAmount = mocConverter.resTokenToRiskProDisc(reserveTokenAmount);

      details.finalRiskProAmount = Math.min(
        details.riskProDiscountAmount,
        mocState.maxRiskProWithDiscount()
      );
      details.reserveTokenValue = details.finalRiskProAmount == details.riskProDiscountAmount
        ? reserveTokenAmount
        : mocConverter.riskProDiscToResToken(details.finalRiskProAmount);

      emit RiskProWithDiscountMint(
        details.riskProRegularPrice,
        details.discountPrice,
        details.finalRiskProAmount
      );
    }

    if (reserveTokenAmount != details.reserveTokenValue) {
      details.regularRiskProAmount = mocConverter.resTokenToRiskPro(
        reserveTokenAmount.sub(details.reserveTokenValue)
      );
      details.finalRiskProAmount = details.finalRiskProAmount.add(details.regularRiskProAmount);
    }

    /** UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
    CommissionParamsStruct memory params;
    params.account = account;
    params.amount = reserveTokenAmount;
    params.txTypeFeesMOC = mocInrate.MINT_RISKPRO_FEES_MOC();
    params.txTypeFeesReserveToken = mocInrate.MINT_RISKPRO_FEES_RESERVE();
    params.vendorAccount = vendorAccount;

    (details.commission) = calculateCommissionsWithPrices(params);

    mintRiskProInternal(account, reserveTokenAmount, details, vendorAccount);

    return (
      reserveTokenAmount,
      details.commission.reserveTokenCommission,
      details.commission.mocCommission,
      details.commission.reserveTokenMarkup,
      details.commission.mocMarkup
    );
    /** END UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
  }

  /**
   @dev Sender burns his RiskProS and redeems the equivalent ReserveTokens
   @param account Address of the redeeemer
   @param riskProAmount Amount of RiskPros to be redeemed
   @param vendorAccount Vendor address
   @return resTokens to transfer to the redeemer and commission spent, using [using reservePrecision]
  */
  function redeemRiskPro(address account, uint256 riskProAmount, address vendorAccount)
    public
    onlyWhitelisted(msg.sender)
    returns (uint256, uint256, uint256, uint256, uint256)
  {
    RiskProRedeemStruct memory details;

    uint256 userBalance = riskProToken.balanceOf(account);
    uint256 userAmount = Math.min(riskProAmount, userBalance);

    details.riskProFinalAmount = Math.min(userAmount, mocState.absoluteMaxRiskPro());
    uint256 totalReserveToken = mocConverter.riskProToResToken(details.riskProFinalAmount);

    /** UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
    CommissionParamsStruct memory params;
    params.account = account;
    params.amount = totalReserveToken;
    params.txTypeFeesMOC = mocInrate.REDEEM_RISKPRO_FEES_MOC();
    params.txTypeFeesReserveToken = mocInrate.REDEEM_RISKPRO_FEES_RESERVE();
    params.vendorAccount = vendorAccount;

    (details.commission) = calculateCommissionsWithPrices(params);
    /** END UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/

    // Mint token
    riskProToken.burn(account, details.riskProFinalAmount);

    // Update Buckets
    riskProxManager.substractValuesFromBucket(
      BUCKET_C0,
      totalReserveToken,
      0,
      details.riskProFinalAmount
    );

    details.reserveTokenTotalWithoutCommission = totalReserveToken.sub(
      details.commission.reserveTokenCommission).sub(details.commission.reserveTokenMarkup);

    redeemRiskProInternal(account, details, vendorAccount);

    return (
      details.reserveTokenTotalWithoutCommission,
      details.commission.reserveTokenCommission,
      details.commission.mocCommission,
      details.commission.reserveTokenMarkup,
      details.commission.mocMarkup
    );
  }

  /**
   @dev Redeems the requested amount for the account, or the max amount of free stableTokens possible.
   @param account Address of the redeeemer
   @param stableTokenAmount Amount of StableTokens to redeem [using mocPrecision]
   @param vendorAccount Vendor address
   @return resTokens to transfer to the redeemer and commission spent, using [using reservePrecision]
  */
  function redeemFreeStableToken(address account, uint256 stableTokenAmount, address vendorAccount)
    public
    onlyWhitelisted(msg.sender)
    returns (uint256, uint256, uint256, uint256, uint256)
  {
    if (stableTokenAmount <= 0) {
      return (0, 0, 0, 0, 0);
    } else {
      FreeStableTokenRedeemStruct memory details;
      details.finalStableTokenAmount = Math.min(
        stableTokenAmount,
        Math.min(mocState.freeStableToken(), stableToken.balanceOf(account))
      );
      uint256 stableTokensReserveTokenValue = mocConverter.stableTokensToResToken(details.finalStableTokenAmount);

      details.reserveTokenInterestAmount = mocInrate.calcStableTokenRedInterestValues(
        details.finalStableTokenAmount,
        stableTokensReserveTokenValue
      );
      details.finalReserveTokenAmount = stableTokensReserveTokenValue.sub(details.reserveTokenInterestAmount);

      /** UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
      CommissionParamsStruct memory params;
      params.account = account;
      params.amount = details.finalReserveTokenAmount;
      params.txTypeFeesMOC = mocInrate.REDEEM_STABLETOKEN_FEES_MOC();
      params.txTypeFeesReserveToken = mocInrate.REDEEM_STABLETOKEN_FEES_RESERVE();
      params.vendorAccount = vendorAccount;

      (details.commission) = calculateCommissionsWithPrices(params);

      /** END UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/

      doStableTokenRedeem(account, details.finalStableTokenAmount, stableTokensReserveTokenValue);
      riskProxManager.payInrate(BUCKET_C0, details.reserveTokenInterestAmount);

      redeemFreeStableTokenInternal(account, details, vendorAccount);

      return (details.finalReserveTokenAmount.sub(details.commission.reserveTokenCommission).sub(details.commission.reserveTokenMarkup), details.commission.reserveTokenCommission, details.commission.mocCommission, details.commission.reserveTokenMarkup, details.commission.mocMarkup);
    }
  }

  /**
   @dev Mint Max amount of StableTokens and give it to the msg.sender
   @param account minter user address
   @param resTokensToMint resTokens amount the user intents to convert to StableToken [using rbtPresicion]
   @param vendorAccount Vendor address
   @return the actual amount of resTokens used and the resTokens commission for them [using rbtPresicion]
  */
  function mintStableToken(address account, uint256 resTokensToMint, address vendorAccount)
    public
    onlyWhitelisted(msg.sender)
    returns (uint256, uint256, uint256, uint256, uint256)
  {
    StableTokenMintStruct memory details;

    // StableTokens to issue with tx value amount
    if (resTokensToMint > 0) {
      details.stableTokens = mocConverter.resTokenToStableToken(resTokensToMint);
      details.stableTokenAmount = Math.min(details.stableTokens, mocState.absoluteMaxStableToken());
      details.totalCost = details.stableTokenAmount == details.stableTokens
        ? resTokensToMint
        : mocConverter.stableTokensToResToken(details.stableTokenAmount);

      // Mint Token
      stableToken.mint(account, details.stableTokenAmount);

      // Update Buckets
      riskProxManager.addValuesToBucket(BUCKET_C0, details.totalCost, details.stableTokenAmount, 0);

      /** UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
      CommissionParamsStruct memory params;
      params.account = account;
      params.amount = details.totalCost;
      params.txTypeFeesMOC = mocInrate.MINT_STABLETOKEN_FEES_MOC();
      params.txTypeFeesReserveToken = mocInrate.MINT_STABLETOKEN_FEES_RESERVE();
      params.vendorAccount = vendorAccount;

      (details.commission) = calculateCommissionsWithPrices(params);

      mintStableTokenInternal(account, details, vendorAccount);

      /** END UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/

      return (details.totalCost, details.commission.reserveTokenCommission, details.commission.mocCommission, details.commission.reserveTokenMarkup, details.commission.mocMarkup);
    }

    return (0, 0, 0, 0, 0);
  }

  /**
   @dev User StableTokens get burned and he receives the equivalent ReserveTokens in return
   @param userAddress Address of the user asking to redeem
   @param amount Verified amount of StableTokens to be redeemed [using mocPrecision]
   @param reservePrice resToken price [using mocPrecision]
   @return true and commission spent if resTokens send was completed, false if fails.
  */
  function redeemStableTokenWithPrice(
    address userAddress,
    uint256 amount,
    uint256 reservePrice
  ) public onlyWhitelisted(msg.sender) returns (bool, uint256) {
    StableTokenRedeemStruct memory details;

    details.totalReserveToken = mocConverter.stableTokensToResTokenWithPrice(amount, reservePrice);

    /** UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
    // Check commission rate in Reserve according to transaction type
    details.commission.reserveTokenCommission = mocInrate.calcCommissionValue(
      details.totalReserveToken, mocInrate.REDEEM_STABLETOKEN_FEES_RESERVE());
    details.commission.reserveTokenMarkup = 0;
    /** END UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/

    details.reserveTokenToRedeem = details.totalReserveToken.sub(
      details.commission.reserveTokenCommission).sub(details.commission.reserveTokenMarkup);

    bool result = moc.sendToAddress(userAddress, details.reserveTokenToRedeem);

    details.reserveTotal = details.totalReserveToken.sub(details.commission.reserveTokenCommission).sub(details.commission.reserveTokenMarkup);
    details.commission.reserveTokenPrice = mocState.getReserveTokenPrice();
    details.commission.mocCommission = 0;
    details.commission.mocPrice = 0;
    details.commission.mocMarkup = 0;

    // If sends fail, then no redemption is executed
    if (result) {
      doStableTokenRedeem(userAddress, amount, details.totalReserveToken);
      redeemStableTokenWithPriceInternal(userAddress, amount, details, address(0));
    }

    return (result, details.commission.reserveTokenCommission);
  }

  /**
   @dev Allow redeem on liquidation state, user StableTokens get burned and he receives
   the equivalent ReserveTokens according to liquidationPrice
   @param origin address owner of the StableTokens
   @param destination address to send the ReserveTokens
   @return The amount of ReserveTokens in sent for the redemption or 0 if send does not succed
  */
  function redeemAllStableToken(address origin, address destination)
    public
    onlyWhitelisted(msg.sender)
    returns (uint256)
  {
    uint256 userStableTokenBalance = stableToken.balanceOf(origin);
    if (userStableTokenBalance == 0) return 0;

    uint256 liqPrice = mocState.getLiquidationPrice();
    // [USD * ReserveTokens / USD]
    uint256 totalResTokens = mocConverter.stableTokensToResTokenWithPrice(
      userStableTokenBalance,
      liqPrice
    );

    // If send fails we don't burn the tokens
    if (moc.sendToAddress(destination, totalResTokens)) {
      stableToken.burn(origin, userStableTokenBalance);
      emit StableTokenRedeem(
        origin,
        userStableTokenBalance,
        totalResTokens,
        0,
        liqPrice,
        0,
        0,
        0,
        0,
        address(0)
      );

      return totalResTokens;
    } else {
      return 0;
    }
  }

  /**
    @dev  Mint the amount of RiskPros
    @param account Address that will owned the RiskPros
    @param riskProAmount Amount of RiskPros to mint [using mocPrecision]
    @param resTokenValue ReserveTokens cost of the [using reservePrecision]
  */
  function mintRiskPro(
    address account,
    uint256 reserveTokenCommission,
    uint256 riskProAmount,
    uint256 resTokenValue,
    uint256 mocCommission,
    uint256 reserveTokenPrice,
    uint256 mocPrice,
    uint256 reserveTokenMarkup,
    uint256 mocMarkup,
    address vendorAccount
  ) public onlyWhitelisted(msg.sender) {
    riskProToken.mint(account, riskProAmount);
    riskProxManager.addValuesToBucket(BUCKET_C0, resTokenValue, 0, riskProAmount);

    emit RiskProMint(
      account,
      riskProAmount,
      resTokenValue,
      reserveTokenCommission,
      reserveTokenPrice,
      mocCommission,
      mocPrice,
      reserveTokenMarkup,
      mocMarkup,
      vendorAccount
    );
  }

  /**
   @dev BUCKET RiskProx minting. Mints RiskProx for the specified bucket
   @param account owner of the new minted RiskProx
   @param bucket bucket name
   @param resTokensToMint resToken amount to mint [using reservePrecision]
   @param vendorAccount Vendor address
   @return total ReserveTokens Spent (resTokensToMint more interest) and commission spent [using reservePrecision]
  */
  function mintRiskProx(address payable account, bytes32 bucket, uint256 resTokensToMint, address vendorAccount)
    public
    onlyWhitelisted(msg.sender)
    returns (uint256, uint256, uint256, uint256, uint256)
  {
    if (resTokensToMint > 0) {
      RiskProxMintStruct memory details;

      details.lev = mocState.leverage(bucket);

      details.finalReserveTokenToMint = Math.min(
        resTokensToMint,
        mocState.maxRiskProxResTokenValue(bucket)
      );

      // Get interest and the adjusted RiskProAmount
      details.reserveTokenInterestAmount = mocInrate.calcMintInterestValues(
        bucket,
        details.finalReserveTokenToMint
      );

      // pay interest
      riskProxManager.payInrate(BUCKET_C0, details.reserveTokenInterestAmount);

      details.riskProxToMint = mocConverter.resTokenToRiskProx(details.finalReserveTokenToMint, bucket);

      riskProxManager.assignRiskProx(bucket, account, details.riskProxToMint, details.finalReserveTokenToMint);
      moveExtraFundsToBucket(BUCKET_C0, bucket, details.finalReserveTokenToMint, details.lev);

      // Calculate leverage after mint
      details.lev = mocState.leverage(bucket);

      /** UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
      CommissionParamsStruct memory params;
      params.account = account;
      params.amount = details.finalReserveTokenToMint;
      params.txTypeFeesMOC = mocInrate.MINT_RISKPROX_FEES_MOC();
      params.txTypeFeesReserveToken = mocInrate.MINT_RISKPROX_FEES_RESERVE();
      params.vendorAccount = vendorAccount;

      (details.commission) = calculateCommissionsWithPrices(params);

      mintRiskProxInternal(account, bucket, details, vendorAccount);
      /** END UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/

      return (details.finalReserveTokenToMint.add(details.reserveTokenInterestAmount), details.commission.reserveTokenCommission, details.commission.mocCommission, details.commission.reserveTokenMarkup, details.commission.mocMarkup);
    }

    return (0, 0, 0, 0, 0);
  }

  /**
   @dev Sender burns his RiskProx, redeems the equivalent amount of RiskPros, return
   the "borrowed" StableTokens and recover pending interests
   @param account user address to redeem riskProx from
   @param bucket Bucket where the RiskProxs are hold
   @param riskProxAmount Amount of RiskProxs to be redeemed [using reservePrecision]
   @param vendorAccount Vendor address
   @return the actual amount of resTokens to redeem and the resTokens commission for them [using reservePresicion]
  */
  function redeemRiskProx(
    address payable account,
    bytes32 bucket,
    uint256 riskProxAmount,
    address vendorAccount
  ) public onlyWhitelisted(msg.sender) returns (uint256, uint256, uint256, uint256, uint256) {
    // Revert could cause not evaluating state changing
    if (riskProxManager.riskProxBalanceOf(bucket, account) == 0) {
      return (0, 0, 0, 0, 0);
    }

    RiskProxRedeemStruct memory details;
    // Calculate leverage before the redeem
    details.bucketLev = mocState.leverage(bucket);
    // Get redeemable value
    details.riskProxToRedeem = Math.min(riskProxAmount, riskProxManager.riskProxBalanceOf(bucket, account));
    details.resTokenToRedeem = mocConverter.riskProxToResToken(details.riskProxToRedeem, bucket);
    // Pay interests
    // Update 2020-03-31
    // No recover interest in BTCX Redemption
    // details.resTokenInterests = recoverInterests(bucket, details.resTokenToRedeem);
    details.resTokenInterests = 0;

    // Burn RiskProx
    burnRiskProxFor(
      bucket,
      account,
      details.riskProxToRedeem,
      mocState.bucketRiskProTecPrice(bucket)
    );

    if (riskProxManager.getBucketNRiskPro(bucket) == 0) {
      // If there is no RiskProx left, empty bucket for rounding remnant
      riskProxManager.emptyBucket(bucket, BUCKET_C0);
    } else {
      // Move extra value from L bucket to C0
      moveExtraFundsToBucket(bucket, BUCKET_C0, details.resTokenToRedeem, details.bucketLev);
    }

    /** UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
    CommissionParamsStruct memory params;
    params.account = account;
    params.amount = details.resTokenToRedeem;
    params.txTypeFeesMOC = mocInrate.REDEEM_RISKPROX_FEES_MOC();
    params.txTypeFeesReserveToken = mocInrate.REDEEM_RISKPROX_FEES_RESERVE();
    params.vendorAccount = vendorAccount;

    (details.commission) = calculateCommissionsWithPrices(params);

    /** END UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/

    details.reserveTokenTotalWithoutCommission = details.resTokenToRedeem.sub(
      details.commission.reserveTokenCommission).sub(details.commission.reserveTokenMarkup);
    details.totalReserveTokenRedeemed = details.reserveTokenTotalWithoutCommission.add(details.resTokenInterests);

    redeemRiskProxInternal(account, bucket, riskProxAmount, details, vendorAccount);

    return (
      details.totalReserveTokenRedeemed,
      details.commission.reserveTokenCommission,
      details.commission.mocCommission,
      details.commission.reserveTokenMarkup,
      details.commission.mocMarkup
    );
  }

  /**
    @dev Burns user RiskProx and sends the equivalent amount of ReserveTokens
    to the account without caring if transaction succeeds
    @param bucket Bucket where the RiskProxs are hold
    @param account user address to redeem riskProx from
    @param riskProxAmount Amount of RiskProx to redeem [using mocPrecision]
    @param riskProxPrice Price of one RiskProx in ReserveTokens [using reservePrecision]
    @return result of the ReserveTokens sending transaction
  */
  function forceRedeemRiskProx(
    bytes32 bucket,
    address payable account,
    uint256 riskProxAmount,
    uint256 riskProxPrice
  ) public onlyWhitelisted(msg.sender) returns (bool) {
    // Do burning part of the redemption
    uint256 totalAmount = burnRiskProxFor(
      bucket,
      account,
      riskProxAmount,
      riskProxPrice
    );

    // Send transaction can only fail for external code
    // if transaction fails, user will lost his ReserveTokens and RiskProx
    return moc.sendToAddress(account, totalAmount);
  }

  /**
    @dev Burns user RiskProx
    @param bucket Bucket where the RiskProxs are hold
    @param account user address to redeem riskProx from
    @param riskProxAmount Amount of RiskProx to redeem [using reservePrecision]
    @param riskProxPrice Price of one RiskProx in ReserveTokens [using reservePrecision]
    @return ResToken total value of the redemption [using reservePrecision]
  **/
  function burnRiskProxFor(
    bytes32 bucket,
    address payable account,
    uint256 riskProxAmount,
    uint256 riskProxPrice
  ) public onlyWhitelisted(msg.sender) returns (uint256) {
    // Calculate total ReserveTokens
    uint256 totalAmount = mocConverter.riskProToResTokenWithPrice(
      riskProxAmount,
      riskProxPrice
    );
    riskProxManager.removeRiskProx(bucket, account, riskProxAmount, totalAmount);

    return totalAmount;
  }

  /************************************/
  /***** UPGRADE v0110      ***********/
  /************************************/

  /** START UPDATE V0110: 24/09/2020  **/
  /** Upgrade to support multiple commission rates **/
  /** Internal functions **/

  /**
   @dev Internal function to avoid stack too deep errors
  */
  function redeemRiskProxInternal(
    address account,
    bytes32 bucket,
    uint256 riskProxAmount,
    RiskProxRedeemStruct memory details,
    address vendorAccount
  ) internal {
    emit RiskProxRedeem(
      bucket,
      account,
      details.commission.reserveTokenCommission,
      riskProxAmount,
      details.reserveTokenTotalWithoutCommission,
      details.resTokenInterests,
      details.bucketLev,
      details.commission.reserveTokenPrice,
      details.commission.mocCommission,
      details.commission.mocPrice,
      details.commission.reserveTokenMarkup,
      details.commission.mocMarkup,
      vendorAccount
    );
  }

  /**
   @dev Internal function to avoid stack too deep errors
  */
  function mintRiskProInternal(address account, uint256 reserveTokenAmount, RiskProMintStruct memory details, address vendorAccount) internal {
    mintRiskPro(
      account,
      details.commission.reserveTokenCommission,
      details.finalRiskProAmount,
      reserveTokenAmount,
      details.commission.mocCommission,
      details.commission.reserveTokenPrice,
      details.commission.mocPrice,
      details.commission.reserveTokenMarkup,
      details.commission.mocMarkup,
      vendorAccount
    );
  }

  /**
   @dev Internal function to avoid stack too deep errors
  */
  function mintRiskProxInternal(address account, bytes32 bucket, RiskProxMintStruct memory details, address vendorAccount) internal {
    emit RiskProxMint(
      bucket,
      account,
      details.riskProxToMint,
      details.finalReserveTokenToMint,
      details.reserveTokenInterestAmount,
      details.lev,
      details.commission.reserveTokenCommission,
      details.commission.reserveTokenPrice,
      details.commission.mocCommission,
      details.commission.mocPrice,
      details.commission.reserveTokenMarkup,
      details.commission.mocMarkup,
      vendorAccount
    );
  }

  /**
   @dev Internal function to avoid stack too deep errors
  */
  function mintStableTokenInternal(address account, StableTokenMintStruct memory details, address vendorAccount) internal {
    emit StableTokenMint(
      account,
      details.stableTokenAmount,
      details.totalCost,
      details.commission.reserveTokenCommission,
      details.commission.reserveTokenPrice,
      details.commission.mocCommission,
      details.commission.mocPrice,
      details.commission.reserveTokenMarkup,
      details.commission.mocMarkup,
      vendorAccount
    );
  }

  /**
   @dev Internal function to avoid stack too deep errors
  */
  function redeemFreeStableTokenInternal(address account, FreeStableTokenRedeemStruct memory details, address vendorAccount) internal {
    emit FreeStableTokenRedeem(
      account,
      details.finalStableTokenAmount,
      details.finalReserveTokenAmount,
      details.commission.reserveTokenCommission,
      details.reserveTokenInterestAmount,
      details.commission.reserveTokenPrice,
      details.commission.mocCommission,
      details.commission.mocPrice,
      details.commission.reserveTokenMarkup,
      details.commission.mocMarkup,
      vendorAccount
    );
  }

  /**
   @dev Internal function to avoid stack too deep errors
  */
  function redeemRiskProInternal(address account, RiskProRedeemStruct memory details, address vendorAccount) internal {
    emit RiskProRedeem(
      account,
      details.riskProFinalAmount,
      details.reserveTokenTotalWithoutCommission,
      details.commission.reserveTokenCommission,
      details.commission.reserveTokenPrice,
      details.commission.mocCommission,
      details.commission.mocPrice,
      details.commission.reserveTokenMarkup,
      details.commission.mocMarkup,
      vendorAccount
    );
  }

  /**
   @dev Internal function to avoid stack too deep errors
  */
  function redeemStableTokenWithPriceInternal(address account, uint256 amount, StableTokenRedeemStruct memory details, address vendorAccount)
  internal {
    emit StableTokenRedeem(
      account, //userAddress,
      amount,
      details.reserveTotal,
      details.commission.reserveTokenCommission,
      details.commission.reserveTokenPrice,
      details.commission.mocCommission,
      details.commission.mocPrice,
      details.commission.reserveTokenMarkup,
      details.commission.mocMarkup,
      vendorAccount
    );
  }

  /** END UPDATE V0110: 24/09/2020 **/

  /**
    @dev Calculates the amount of ReserveTokens that one bucket should move to another in
    RiskProx minting/redemption. This extra makes RiskProx more leveraging than RiskPro.
    @param bucketFrom Origin bucket from which the ReserveTokens are moving
    @param bucketTo Destination bucket to which the ReserveTokens are moving
    @param totalReserveToken Amount of ReserveTokens moving between buckets [using reservePrecision]
    @param lev lev of the L bucket [using mocPrecision]
  */
  function moveExtraFundsToBucket(
    bytes32 bucketFrom,
    bytes32 bucketTo,
    uint256 totalReserveToken,
    uint256 lev
  ) internal {
    uint256 resTokensToMove = mocLibConfig.bucketTransferAmount(totalReserveToken, lev);
    uint256 stableTokensToMove = mocConverter.resTokenToStableToken(resTokensToMove);

    uint256 resTokensToMoveFinal = Math.min(
      resTokensToMove,
      riskProxManager.getBucketNReserve(bucketFrom)
    );
    uint256 stableTokensToMoveFinal = Math.min(
      stableTokensToMove,
      riskProxManager.getBucketNStableToken(bucketFrom)
    );

    riskProxManager.moveResTokensAndStableTokens(
      bucketFrom,
      bucketTo,
      resTokensToMoveFinal,
      stableTokensToMoveFinal
    );
  }

  /**
   @dev Returns ReserveTokens for user in concept of interests refund
   @param bucket Bucket where the RiskProxs are hold
   @param resTokenToRedeem Total ReserveTokens value of the redemption [using mocPrecision]
   @return Interests [using reservePrecision]
  */
  function recoverInterests(bytes32 bucket, uint256 resTokenToRedeem)
    internal
    returns (uint256)
  {
    uint256 resTokenInterests = mocInrate.calcFinalRedeemInterestValue(
      bucket,
      resTokenToRedeem
    );

    return riskProxManager.recoverInrate(BUCKET_C0, resTokenInterests);
  }

  function doStableTokenRedeem(address userAddress, uint256 stableTokenAmount, uint256 totalReserveToken)
    internal
  {
    stableToken.burn(userAddress, stableTokenAmount);
    riskProxManager.substractValuesFromBucket(BUCKET_C0, totalReserveToken, stableTokenAmount, 0);
  }

  function initializeContracts() internal {
    moc = IMoC(connector.moc());
    stableToken = StableToken(connector.stableToken());
    riskProToken = RiskProToken(connector.riskProToken());
    riskProxManager = MoCRiskProxManager(connector.riskProxManager());
    mocState = IMoCState(connector.mocState());
    mocConverter = MoCConverter(connector.mocConverter());
    mocInrate = IMoCInrate(connector.mocInrate());
  }


  /************************************/
  /***** UPGRADE v0110      ***********/
  /************************************/

  /** START UPDATE V0110: 24/09/2020  **/
  /** Upgrade to support multiple commission rates **/
  /** Structs **/

  struct RiskProxRedeemStruct{
    uint256 totalReserveTokenRedeemed;
    uint256 reserveTokenTotalWithoutCommission;
    uint256 resTokenInterests;
    uint256 bucketLev;
    uint256 riskProxToRedeem;
    uint256 resTokenToRedeem;
    CommissionReturnStruct commission;
  }

  struct RiskProxMintStruct{
    uint256 riskProxToMint;
    uint256 finalReserveTokenToMint;
    uint256 reserveTokenInterestAmount;
    uint256 lev;
    CommissionReturnStruct commission;
  }

  struct RiskProRedeemStruct{
    uint256 riskProFinalAmount;
    uint256 reserveTokenTotalWithoutCommission;
    CommissionReturnStruct commission;
  }

  struct FreeStableTokenRedeemStruct{
    uint256 finalStableTokenAmount;
    uint256 finalReserveTokenAmount;
    uint256 reserveTokenInterestAmount;
    CommissionReturnStruct commission;
  }

  struct RiskProMintStruct{
    uint256 riskProRegularPrice;
    uint256 reserveTokenValue;
    uint256 discountPrice;
    uint256 riskProDiscountAmount;
    uint256 regularRiskProAmount;
    uint256 availableRiskPro;
    uint256 finalRiskProAmount;
    CommissionReturnStruct commission;
  }

  struct StableTokenMintStruct{
    uint256 stableTokens;
    uint256 stableTokenAmount;
    uint256 totalCost;
    CommissionReturnStruct commission;
  }

  struct CommissionParamsStruct{
    address account; // Address of the user doing the transaction
    uint256 amount; // Amount from which commissions are calculated
    uint8 txTypeFeesMOC; // Transaction type if fees are paid in MoC
    uint8 txTypeFeesReserveToken; // Transaction type if fees are paid in ReserveToken
    address vendorAccount; // Vendor address
  }

  struct CommissionReturnStruct{
    uint256 reserveTokenCommission;
    uint256 mocCommission;
    uint256 reserveTokenPrice;
    uint256 mocPrice;
    uint256 reserveTokenMarkup;
    uint256 mocMarkup;
  }

  struct StableTokenRedeemStruct{
    uint256 reserveTotal;
    uint256 reserveTokenToRedeem;
    uint256 totalReserveToken;
    CommissionReturnStruct commission;
  }

  /** END UPDATE V0110: 24/09/2020 **/

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}
