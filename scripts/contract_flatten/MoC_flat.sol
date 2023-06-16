/*
Copyright MOC Investments Corp. 2020. All rights reserved.

You acknowledge and agree that MOC Investments Corp. (“MOC”) (or MOC’s licensors) own all legal right, title and interest in and to the work, software, application, source code, documentation and any other documents in this repository (collectively, the “Program”), including any intellectual property rights which subsist in the Program (whether those rights happen to be registered or not, and wherever in the world those rights may exist), whether in source code or any other form.

Subject to the limited license below, you may not (and you may not permit anyone else to) distribute, publish, copy, modify, merge, combine with another program, create derivative works of, reverse engineer, decompile or otherwise attempt to extract the source code of, the Program or any part thereof, except that you may contribute to this repository.

You are granted a non-exclusive, non-transferable, non-sublicensable license to distribute, publish, copy, modify, merge, combine with another program or create derivative works of the Program (such resulting program, collectively, the “Resulting Program”) solely for Non-Commercial Use as long as you:
 1. give prominent notice (“Notice”) with each copy of the Resulting Program that the Program is used in the Resulting Program and that the Program is the copyright of MOC Investments Corp.; and
 2. subject the Resulting Program and any distribution, publication, copy, modification, merger therewith, combination with another program or derivative works thereof to the same Notice requirement and Non-Commercial Use restriction set forth herein.

“Non-Commercial Use” means each use as described in clauses (1)-(3) below, as reasonably determined by MOC Investments Corp. in its sole discretion:
 1. personal use for research, personal study, private entertainment, hobby projects or amateur pursuits, in each case without any anticipated commercial application;
 2. use by any charitable organization, educational institution, public research organization, public safety or health organization, environmental protection organization or government institution; or
 3. the number of monthly active users of the Resulting Program across all versions thereof and platforms globally do not exceed 100 at any time.

You will not use any trade mark, service mark, trade name, logo of MOC Investments Corp. or any other company or organization in a way that is likely or intended to cause confusion about the owner or authorized user of such marks, names or logos.

If you have any questions, comments or interest in pursuing any other use cases, please reach out to us at moc.license@moneyonchain.com.

*/

pragma solidity ^0.5.8;


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
  /** DEPRECATED **/
  // solium-disable-next-line mixedcase
  address public DEPRECATED_mocConverter;
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
    add(exchangeAddress);
    add(inrateAddress);
    add(burnoutBookAddress);
    add(reserveTokenAddress);
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}


/**
 * @dev Defines special constants to use along all the MoC System
 */
contract MoCConstants {
  bytes32 constant public BUCKET_X2 = "X2";
  bytes32 constant public BUCKET_C0 = "C0";
}

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

    function stableTokensToResToken(uint256 stableTokenAmount) external view returns (uint256);

    function resTokenToStableToken(uint256 resTokensAmount) external view returns (uint256);

    function riskProxToResToken(uint256 riskProxAmount, bytes32 bucket) external view returns (uint256);

    function resTokenToRiskProx(uint256 resTokensAmount, bytes32 bucket) external view returns (uint256);
}

interface IMoCSettlement {
    function getRedeemRequestAt(uint256 _index) external view returns (address payable, uint256);

    function redeemQueueSize() external view returns (uint256);

    function stableTokenAmountToRedeem(address _who) external view returns (uint256);

    function addRedeemRequest(uint256 amount, address payable redeemer) external;

    function alterRedeemRequestAmount(bool isAddition, uint256 delta, address redeemer) external;

    function isSettlementEnabled() external view returns (bool);

    function runSettlement(uint256 steps) external returns (uint256);

    function isSettlementReady() external view returns (bool);

    function nextSettlementBlock() external view returns (uint256);
}

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

    function forceRedeemRiskProx(bytes32 bucket, address payable account, uint256 riskProxAmount, uint256 riskProxPrice)
    external returns (bool);

    function redeemStableTokenWithPrice(address payable userAddress, uint256 amount, uint256 reservePrice) external
    returns (bool, uint256);
}


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




/**
  @title Stoppable
  @notice Allow a contract to be paused through the stopper subsystem. This contracts
  is able to disable the stoppability feature through governance.
  @dev This contract was heavily based on the _Pausable_ contract of openzeppelin-eth but
  it was modified in order to being able to turn on and off its stopability
 */
contract Stoppable is Governed {

  event Paused(address account);
  event Unpaused(address account);

  bool public stoppable;
  bool private _paused;
  address public stopper;
  string private constant UNSTOPPABLE = "unstoppable";
  string private constant CONTRACT_IS_ACTIVE = "contract_is_active";
  string private constant CONTRACT_IS_PAUSED = "contract_is_paused";
  string private constant NOT_STOPPER = "not_stopper";


  /**
    @notice Modifier to make a function callable only when the contract is enable
    to be paused
  */
  modifier whenStoppable() {
    require(stoppable, UNSTOPPABLE);
    _;
  }

  /**
    @notice Modifier to make a function callable only when the contract is not paused
  */
  modifier whenNotPaused() {
    require(!_paused, CONTRACT_IS_PAUSED);
    _;
  }

  /**
    @notice Modifier to make a function callable only when the contract is paused
    */
  modifier whenPaused() {
    require(_paused, CONTRACT_IS_ACTIVE);
    _;
  }

  /**
    @notice  Modifier to make a function callable only by the pauser
   */
  modifier onlyPauser() {
    require(stopper == msg.sender, NOT_STOPPER);
    _;
  }

  /**
    @notice Initialize the contract with the basic settings
    @dev This initialize replaces the constructor but it is not called automatically.
    It is necessary because of the upgradeability of the contracts. Either this function or the next can be used
    @param _stopper The address that is authorized to stop this contract
    @param _governor The address that will define when a change contract is authorized to do this unstoppable/stoppable again
   */
  function initialize(address _stopper, IGovernor _governor) public initializer {
    initialize(_stopper, _governor, true);
  }

  /**
    @notice Initialize the contract with the basic settings
    @dev This initialize replaces the constructor but it is not called automatically.
    It is necessary because of the upgradeability of the contracts. Either this function or the previous can be used
    @param _stopper The address that is authorized to stop this contract
    @param _governor The address that will define when a change contract is authorized to do this unstoppable/stoppable again
    @param _stoppable Define if the contract starts being unstoppable or not
   */
  function initialize(address _stopper, IGovernor _governor, bool _stoppable) public initializer {
    stoppable = _stoppable;
    stopper = _stopper;
    Governed.initialize(_governor);
  }

  /**
    @notice Returns true if paused
   */
  function paused() public view returns (bool) {
    return _paused;
  }
  /**
    @notice Called by the owner to pause, triggers stopped state
    @dev Should only be called by the pauser and when it is stoppable
   */
  function pause() public whenStoppable onlyPauser whenNotPaused {
    _paused = true;
    emit Paused(msg.sender);
  }

  /**
    @notice Called by the owner to unpause, returns to normal state
   */
  function unpause() public onlyPauser whenPaused {
    _paused = false;
    emit Unpaused(msg.sender);
  }


  /**
    @notice Switches OFF the stoppability of the contract; if the contract was paused
    it will no longer be so
    @dev Should be called through governance
   */
  function makeUnstoppable() public onlyAuthorizedChanger {
    stoppable = false;
  }


  /**
    @notice Switches ON the stoppability of the contract; if the contract was paused
    before making it unstoppable it will be paused again after calling this function
    @dev Should be called through governance
   */
  function makeStoppable() public onlyAuthorizedChanger {
    stoppable = true;
  }

  /**
    @notice Changes the address which is enable to stop this contract
    @param newStopper Address of the newStopper
    @dev Should be called through governance
   */
  function setStopper(address newStopper) public onlyAuthorizedChanger {
    stopper = newStopper;
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}


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

    function updatePaidMarkup(address account, uint256 mocAmount, uint256 resTokenAmount) external
    returns (bool);
}

interface IMoCInrate {
    // Transaction types
    // solium-disable mixedcase
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
    // solium-enable mixedcase

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

    function calcStableTokenRedInterestValues(uint256 stableTokenAmount, uint256 reserveAmount) external view returns(uint256);

    function calcMintInterestValues(bytes32 bucket, uint256 reserveAmount) external view returns(uint256);

    function calcFinalRedeemInterestValue(bytes32 bucket, uint256 reserveToRedeem) external view returns(uint256);

    function setRiskProInterestBlockSpan(uint256 newBitProBlockSpan) external;
}

interface IMoC {

    function sendToAddress(address receiver, uint256 tokenAmount) external returns(bool);

    function addReserves(uint256 tokenAmount) external;
}

contract MoCEvents {
  event BucketLiquidation(bytes32 bucket);
  event ContractLiquidated(address mocAddress);
}

contract MoC is MoCEvents, MoCReserve, MoCLibConnection, MoCBase, Stoppable, IMoC {
  using SafeMath for uint256;

  /// @dev Contracts.
  address internal stableToken;
  RiskProToken internal riskProToken;
  MoCRiskProxManager internal riskProxManager;
  IMoCState internal mocState;
  /** DEPRECATED **/
  // solium-disable-next-line mixedcase
  address internal DEPRECATED_mocConverter;
  IMoCSettlement internal settlement;
  IMoCExchange internal mocExchange;
  IMoCInrate internal mocInrate;
  /// @dev 'MoCBurnout' is deprecated. DO NOT use this variable.
  /** DEPRECATED **/
  // solium-disable-next-line mixedcase
  address public DEPRECATED_mocBurnout;

  /// @dev Indicates if ReserveTokens remainder was sent and RiskProToken was paused
  bool internal liquidationExecuted;

  /**
    @dev Initializes the contract
    @param connectorAddress MoCConnector contract address
    @param governorAddress Governor contract address
    @param stopperAddress Stopper contract address
    @param startStoppable Indicates if the contract starts being unstoppable or not
    @param maxGasPrice_ gas price limit to mint and redeem operations
  */
  function initialize(
    address connectorAddress,
    address governorAddress,
    address stopperAddress,
    bool startStoppable,
    uint256 maxGasPrice_
  ) public initializer {
    initializePrecisions();
    initializeBase(connectorAddress);
    //initializeContracts
    stableToken = connector.stableToken();
    riskProToken = RiskProToken(connector.riskProToken());
    riskProxManager = MoCRiskProxManager(connector.riskProxManager());
    mocState = IMoCState(connector.mocState());
    settlement = IMoCSettlement(connector.mocSettlement());
    mocExchange = IMoCExchange(connector.mocExchange());
    mocInrate = IMoCInrate(connector.mocInrate());
    setReserveToken(connector.reserveToken());
    //initializeGovernanceContracts
    Stoppable.initialize(stopperAddress, IGovernor(governorAddress), startStoppable);
    maxGasPrice = maxGasPrice_;
  }

  /****************************INTERFACE*******************************************/

  /**
    @dev Gets the RiskProx balance of an address
    @param bucket Name of the bucket
    @param account Address
    @return RiskProx balance of the address
  */
  function riskProxBalanceOf(bytes32 bucket, address account) public view returns (uint256) {
    return riskProxManager.riskProxBalanceOf(bucket, account);
  }

  /**
    @dev Gets the RedeemRequest at the queue index position
    @param index queue position to get
    @return redeemer's address and amount he submitted
  */
  function getRedeemRequestAt(uint256 index) public view returns(address, uint256) {
    return settlement.getRedeemRequestAt(index);
  }

  /**
    @dev Returns current redeem queue size
    @return redeem queue size
   */
  function redeemQueueSize() public view returns(uint256) {
    return settlement.redeemQueueSize();
  }

  /**
    @dev Returns the total amount of StableTokens in the redeem queue for redeemer
    @param redeemer address for which ^ is computed
    @return total amount of Docs in the redeem queue for redeemer
   */
  function stableTokenAmountToRedeem(address redeemer) public view returns (uint256) {
    return settlement.stableTokenAmountToRedeem(redeemer);
  }


  /**
  * @dev Creates or updates the amount of a StableToken redeem Request from the msg.sender
  * @param stableTokenAmount Amount of StableTokens to redeem on settlement [using mocPrecision]
  */
  function redeemStableTokenRequest(uint256 stableTokenAmount) public whenNotPaused() whenSettlementReady() {
    settlement.addRedeemRequest(stableTokenAmount, msg.sender);
  }

  /**
    @dev Alters the redeem amount position for the redeemer
    @param isAddition true if adding amount to redeem, false to substract.
    @param delta the amount to add/substract to current position
  */
  function alterRedeemRequestAmount(bool isAddition, uint256 delta) public whenNotPaused() whenSettlementReady() {
    settlement.alterRedeemRequestAmount(isAddition, delta, msg.sender);
  }

  /**
    @dev Adding tokens to the token reserve and C0 Bucket without minting any token.
    Could revert.
    @param tokenAmount Amount to deposit.
   */
  function addReserves(uint256 tokenAmount) public {
    safeDepositInReserve(msg.sender, tokenAmount);
    riskProxManager.addValuesToBucket(BUCKET_C0, tokenAmount, 0, 0);
  }

  /**
    @dev Mints RiskPro and pays the comissions of the operation (retrocompatible function).
    @dev Retrocompatible function.
    @param resTokensToMint Amount in ReserveToken to mint
   */
  function mintRiskPro(uint256 resTokensToMint)
  public {
    mintRiskProVendors(resTokensToMint, address(0));
  }

  /**
    @dev Mints RiskPro and pays the comissions of the operation.
    @param resTokensToMint Amount Reserve Tokens to spend in minting
    @param vendorAccount Vendor address
   */
  function mintRiskProVendors(uint256 resTokensToMint, address vendorAccount)
  public
  whenNotPaused() transitionState() notInProtectionMode() isValidGasPrice() {
    /** UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
    (uint256 totalResTokensSpent,
    uint256 reserveTokenCommission,
    uint256 mocCommission,
    uint256 reserveTokenMarkup,
    uint256 mocMarkup) = mocExchange.mintRiskPro(msg.sender, resTokensToMint, vendorAccount);

    transferCommissions(
      msg.sender,
      totalResTokensSpent,
      reserveTokenCommission,
      mocCommission,
      vendorAccount,
      reserveTokenMarkup,
      mocMarkup
    );
    /** END UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
  }

  /**
    @dev Redeems RiskPro Tokens and pays the comissions of the operation (retrocompatible function).
    @param riskProAmount Amout in RiskPro
  */
  function redeemRiskPro(uint256 riskProAmount)
  public {
    redeemRiskProVendors(riskProAmount, address(0));
  }

  /**
    @dev Redeems RiskPro Tokens and pays the comissions of the operation in ReserveTokens
    @param riskProAmount Amout in RiskPro
    @param vendorAccount Vendor address
  */
  function redeemRiskProVendors(uint256 riskProAmount, address vendorAccount)
  public
  whenNotPaused() transitionState() atLeastState(IMoCState.States.AboveCobj) isValidGasPrice() {
    /** UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
    (uint256 resTokensAmount,
    uint256 reserveTokenCommission,
    uint256 mocCommission,
    uint256 reserveTokenMarkup,
    uint256 mocMarkup) = mocExchange.redeemRiskPro(msg.sender, riskProAmount, vendorAccount);

    redeemWithCommission(
      msg.sender,
      reserveTokenCommission,
      mocCommission,
      vendorAccount,
      reserveTokenMarkup,
      mocMarkup,
      resTokensAmount
    );
    /** END UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
  }

  /**
    @dev StableToken Doc tokens and pays the commisions of the operation (retrocompatible function).
    @dev Retrocompatible function.
    @param resTokensToMint Amount in ReserveToken to mint
  */
  function mintStableToken(uint256 resTokensToMint)
  public {
    mintStableTokenVendors(resTokensToMint, address(0));
  }

  /**
    @dev Mint StableToken tokens and pays the commisions of the operation
    @param resTokensToMint Amount in ReserveTokens to mint
    @param vendorAccount Vendor address
  */
  function mintStableTokenVendors(uint256 resTokensToMint, address vendorAccount)
  public
  whenNotPaused() transitionState() atLeastState(IMoCState.States.AboveCobj) isValidGasPrice() {
    /** UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
    (uint256 totalResTokensSpent,
    uint256 reserveTokenCommission,
    uint256 mocCommission,
    uint256 reserveTokenMarkup,
    uint256 mocMarkup) = mocExchange.mintStableToken(msg.sender, resTokensToMint, vendorAccount);

    transferCommissions(
      msg.sender,
      totalResTokensSpent,
      reserveTokenCommission,
      mocCommission,
      vendorAccount,
      reserveTokenMarkup,
      mocMarkup
    );
    /** END UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
  }

  /**
    @dev Redeems RiskProx Tokens and pays the comissions of the operation in ReserveToken (retrocompatible function).
    @dev Retrocompatible function.
    @param bucket Bucket to reedem, for example X2
    @param riskProxAmount Amount in RiskProx
  */
  function redeemRiskProx(bytes32 bucket, uint256 riskProxAmount) public {
    redeemRiskProxVendors(bucket, riskProxAmount, address(0));
  }

  /**
    @dev Redeems RiskProx Tokens and pays the comissions of the operation in ReserveTokens
    @param bucket Bucket to reedem, for example X2
    @param riskProxAmount Amount in RiskProx
    @param vendorAccount Vendor address
  */
  function redeemRiskProxVendors(bytes32 bucket, uint256 riskProxAmount, address vendorAccount) public
  whenNotPaused() whenSettlementReady() availableBucket(bucket) notBaseBucket(bucket)
  transitionState() bucketStateTransition(bucket) {
    /** UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
    (uint256 totalResTokensRedeemed,
    uint256 reserveTokenCommission,
    uint256 mocCommission,
    uint256 reserveTokenMarkup,
    uint256 mocMarkup) = mocExchange.redeemRiskProx(msg.sender, bucket, riskProxAmount, vendorAccount);

    redeemWithCommission(
      msg.sender,
      reserveTokenCommission,
      mocCommission,
      vendorAccount,
      reserveTokenMarkup,
      mocMarkup,
      totalResTokensRedeemed
    );
    /** END UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
  }

  /**
    @dev BUCKET riskProx riskProx (retrocompatible function).
    @dev Retrocompatible function.
    @param bucket Name of the bucket used
    @param resTokensToMint amount to mint on ReserveToken
  */
  function mintRiskProx(bytes32 bucket, uint256 resTokensToMint) public {
    mintRiskProxVendors(bucket, resTokensToMint, address(0));
  }

  /**
    @dev BUCKET riskProx minting
    @param bucket Name of the bucket used
    @param resTokensToMint amount to mint on ReserveToken
    @param vendorAccount Vendor address
  */
  function mintRiskProxVendors(bytes32 bucket, uint256 resTokensToMint, address vendorAccount) public
  /* Remove modifiers to save some contract size */
  // whenNotPaused() whenSettlementReady() availableBucket(bucket) notBaseBucket(bucket)
  // transitionState() bucketStateTransition(bucket) 
  {
    /** UPDATE V0114: 07/02/2023 - Removal of leveraged positions. Please take a look at http://bit.ly/3XPiKUA **/
    revert("Mint Leveraged position is disabled. See: http://bit.ly/3XPiKUA");
  }

  /**
    @dev Redeems the requested amount for the msg.sender, or the max amount of free stableTokens possible (retrocompatible function).
    @dev Retrocompatible function.
    @param stableTokenAmount Amount of StableTokens to redeem.
  */
  function redeemFreeStableToken(uint256 stableTokenAmount)
  public {
    redeemFreeStableTokenVendors(stableTokenAmount, address(0));
  }

  /**
    @dev Redeems the requested amount for the msg.sender, or the max amount of free stableTokens possible.
    @param stableTokenAmount Amount of StableTokens to redeem.
    @param vendorAccount Vendor address
  */
  function redeemFreeStableTokenVendors(uint256 stableTokenAmount, address vendorAccount)
  public
  whenNotPaused() transitionState() notInProtectionMode() isValidGasPrice(){
    /** UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
    (uint256 resTokensAmount,
    uint256 reserveTokenCommission,
    uint256 mocCommission,
    uint256 reserveTokenMarkup,
    uint256 mocMarkup) = mocExchange.redeemFreeStableToken(msg.sender, stableTokenAmount, vendorAccount);

    redeemWithCommission(
      msg.sender,
      reserveTokenCommission,
      mocCommission,
      vendorAccount,
      reserveTokenMarkup,
      mocMarkup,
      resTokensAmount
    );
    /** END UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
  }

  /**
   * @dev Allow redeem on liquidation state, user StableTokens get burned and he receives
   * the equivalent ReserveTokens if can be covered, or the maximum available
   **/
  function redeemAllStableToken() public atState(IMoCState.States.Liquidated) {
    mocExchange.redeemAllStableToken(msg.sender, msg.sender);
  }

  /**
    @dev Moves the daily amount of interest rate to C0 bucket
  */
  function dailyInratePayment() public whenNotPaused() {
    mocInrate.dailyInratePayment();
  }

  /**
    @dev Pays the RiskPro interest and transfers it to the address mocInrate.riskProInterestAddress
    RiskPro interests = Nb (bucket 0) * riskProRate.
  */
  function payRiskProHoldersInterestPayment() public whenNotPaused() {
    uint256 toPay = mocInrate.payRiskProHoldersInterestPayment();
    if (withdraw(toPay, mocInrate.getRiskProInterestAddress())) {
      mocState.substractFromReserves(toPay);
      riskProxManager.substractValuesFromBucket(BUCKET_C0, toPay, 0, 0);
    }
  }

  /**
    @dev Calculates RiskPro holders holder interest by taking the total amount of RBCs available on Bucket 0.
    RiskPro interests = Nb (bucket 0) * riskProRate.
  */
  function calculateRiskProHoldersInterest() public view returns (uint256, uint256) {
    return mocInrate.calculateRiskProHoldersInterest();
  }

  /**
    @dev Gets the target address to transfer RiskPro Holders rate
    @return Target address to transfer RiskPro Holders interest
  */
  function getRiskProInterestAddress() public view returns (address) {
    return mocInrate.getRiskProInterestAddress();
  }

  /**
    @dev Gets the rate for RiskPro Holders
    @return RiskPro Rate
  */
  function getRiskProRate() public view returns (uint256) {
    return mocInrate.getRiskProRate();
  }

  /**
    @dev Gets the blockspan of RiskPro that represents the frecuency of RiskPro holders interest payment
    @return returns power of bitProInterestBlockSpan
  */
  function getRiskProInterestBlockSpan() public view returns (uint256) {
    return mocInrate.getRiskProInterestBlockSpan();
  }

  function isDailyEnabled() public view returns (bool) {
    return mocInrate.isDailyEnabled();
  }

  function isRiskProInterestEnabled() public view returns (bool) {
    return mocInrate.isRiskProInterestEnabled();
  }

  /**
    @dev Indicates if settlement is enabled
    @return Returns true if blockSpan number of blocks has passed since last execution; otherwise false
  */
  function isSettlementEnabled() public view returns(bool) {
    return settlement.isSettlementEnabled();
  }

  /**
    @dev Checks if bucket liquidation is reached.
    @param bucket Name of bucket.
    @return true if bucket liquidation is reached, false otherwise
  */
  function isBucketLiquidationReached(bytes32 bucket) public view returns(bool) {
    if (mocState.coverage(bucket) <= mocState.liq()) {
      return true;
    }
    return false;
  }

  function evalBucketLiquidation(bytes32 bucket) public availableBucket(bucket) notBaseBucket(bucket) whenSettlementReady() {
    if (isBucketLiquidationReached(bucket)) {
      riskProxManager.liquidateBucket(bucket, BUCKET_C0);

      emit BucketLiquidation(bucket);
    }
  }

  /**
    @dev Evaluates if liquidation state has been reached and runs liq if that's the case
  */
  function evalLiquidation() public transitionState() {
    // DO NOTHING. Everything is handled in transitionState() modifier.
  }

  /**
    @dev Runs all settlement process
    @param steps Number of steps
  */
  function runSettlement(uint256 steps) public whenNotPaused() transitionState() {
    // Transfer accums commissions to commissions address
    safeWithdrawFromReserve(mocInrate.commissionsAddress(), settlement.runSettlement(steps));
  }

  /**
    @dev Public function to extract and send tokens from the reserve. Will return false if transfer reverts or fails.
    @param receiver Account to which the tokens will be send
    @param tokenAmount Amount of tokens to send
    @return False if RRC20 transfer fails or revert and true if succeeds
  **/
  function sendToAddress(address receiver, uint256 tokenAmount) public onlyWhitelisted(msg.sender) returns (bool) {
    if (tokenAmount == 0) {
      return true;
    }
    if (withdraw(tokenAmount, receiver)) {
      mocState.substractFromReserves(tokenAmount);
      return true;
    }
    return false;
  }

  function liquidate() internal {
    if (!liquidationExecuted) {
      //pauseRiskProToken
      if (!riskProToken.paused()) {
        riskProToken.pause();
      }
      //sendReservesRemainder
      safeWithdrawFromReserve(mocInrate.commissionsAddress(), mocState.getReservesRemainder());
      liquidationExecuted = true;

      emit ContractLiquidated(connector.moc());
    }
  }

  /************************************/
  /***** UPGRADE v0110      ***********/
  /************************************/

  /** START UPDATE V0110: 24/09/2020  **/
  /** Upgrade to support multiple commission rates **/
  /** Internal functions **/

  /**
    @dev Transfer mint operation fees (commissions + vendor markup)
    @param sender address of msg.sender
    @param totalResTokensSpent amount in ReserveToken spent
    @param reserveTokenCommission commission amount in ReserveToken
    @param mocCommission commission amount in MoC
    @param vendorAccount address of vendor
    @param reserveTokenMarkup vendor markup in ReserveToken
    @param mocMarkup vendor markup in MoC
  */
  // solium-disable-next-line security/no-assign-params
  function transferCommissions(
    address sender,
    uint256 totalResTokensSpent,
    uint256 reserveTokenCommission,
    uint256 mocCommission,
    address vendorAccount,
    uint256 reserveTokenMarkup,
    uint256 mocMarkup
  )
  internal {
    // Need to update general State
    mocState.addToReserves(totalResTokensSpent);
    require(
      deposit(
        totalResTokensSpent.add(reserveTokenCommission).add(reserveTokenMarkup),
        sender
      ), "Token deposit failed on RRC20 Reserve token transfer"
    );

    transferMocCommission(sender, mocCommission, vendorAccount, mocMarkup);

    transferReserveTokenCommission(vendorAccount, reserveTokenCommission, reserveTokenMarkup);

  }

  /**
    @dev Transfer operation fees in MoC (commissions + vendor markup)
    @param sender address of msg.sender
    @param mocCommission commission amount in MoC
    @param vendorAccount address of vendor
    @param mocMarkup vendor markup in MoC
  */
  // solium-disable-next-line security/no-assign-params
  function transferMocCommission(
    address sender,
    uint256 mocCommission,
    address vendorAccount,
    uint256 mocMarkup
  ) internal {
    uint256 totalMoCFee = mocCommission.add(mocMarkup);
    // If commission and markup are paid in MoC
    if (totalMoCFee > 0) {
      IMoCVendors mocVendors = IMoCVendors(mocState.getMoCVendors());
      // Transfer MoC from sender to this contract
      IERC20 mocToken = IERC20(mocState.getMoCToken());

      // Transfer vendor markup in MoC
      if (mocVendors.updatePaidMarkup(vendorAccount, mocMarkup, 0)) {
        // Transfer MoC to vendor address
        mocToken.transferFrom(sender, vendorAccount, mocMarkup);
        // Transfer MoC to commissions address
        mocToken.transferFrom(sender, mocInrate.commissionsAddress(), mocCommission);
      } else {
        // Transfer MoC to commissions address
        mocToken.transferFrom(sender, mocInrate.commissionsAddress(), totalMoCFee);
      }
    }
  }

  /**
    @dev Transfer redeem operation fees (commissions + vendor markup)
    @param sender address of msg.sender
    @param reserveTokenCommission commission amount in ReserveToken
    @param mocCommission commission amount in MoC
    @param vendorAccount address of vendor
    @param reserveTokenMarkup vendor markup in ReserveToken
    @param mocMarkup vendor markup in MoC
  */
  function redeemWithCommission(
    address sender,
    uint256 reserveTokenCommission,
    uint256 mocCommission,
    address vendorAccount,
    uint256 reserveTokenMarkup,
    uint256 mocMarkup,
    uint256 reserveTokenAmount
  )
   internal {
    safeWithdraw(sender, reserveTokenAmount);
    mocState.substractFromReserves(reserveTokenAmount.add(reserveTokenCommission).add(reserveTokenMarkup));

    transferMocCommission(sender, mocCommission, vendorAccount, mocMarkup);

    transferReserveTokenCommission(vendorAccount, reserveTokenCommission, reserveTokenMarkup);

  }

  /**
    @dev Transfer operation fees in ReserveToken (commissions + vendor markup)
    @param vendorAccount address of vendor
    @param reserveTokenCommission commission amount in ReserveToken
    @param reserveTokenMarkup vendor markup in ReserveToken
  */
  function transferReserveTokenCommission(address vendorAccount, uint256 reserveTokenCommission, uint256 reserveTokenMarkup) internal {

    uint256 totalResTokenFee = reserveTokenCommission.add(reserveTokenMarkup);
    //(uint256 reserveTokenMarkupInMoC, , ) = mocExchange.convertToMoCPrice(reserveTokenMarkup);

    if (totalResTokenFee > 0) {
      IMoCVendors mocVendors = IMoCVendors(mocState.getMoCVendors());
      // Transfer vendor markup in MoC
      if (mocVendors.updatePaidMarkup(vendorAccount, 0, reserveTokenMarkup)) {
        // Transfer ReserveToken to vendor address
        safeWithdraw(vendorAccount, reserveTokenMarkup);
        // Transfer ReserveToken to commissions address
        safeWithdraw(mocInrate.commissionsAddress(), reserveTokenCommission);
      } else {
        // Transfer ReserveToken to commissions address
        safeWithdraw(mocInrate.commissionsAddress(), totalResTokenFee);
      }
    }
  }

  /** END UPDATE V0110: 24/09/2020 **/

  /**
    @dev Extracts tokens from the reserve and update mocState but reverts if token transfer fails
    @param receiver Account to which the tokens will be send
    @param tokenAmount Amount to extract from reserve
   */
  function safeWithdrawFromReserve(address receiver, uint256 tokenAmount) internal {
    safeWithdraw(receiver, tokenAmount);
    mocState.substractFromReserves(tokenAmount);
  }
  /**
    @dev Extracts tokens from the reserve
    @param receiver Account from which the tokens will be taken
    @param tokenAmount Amount to deposit
   */
  function safeWithdraw(address receiver, uint256 tokenAmount) internal {
    require(withdraw(tokenAmount, receiver), "Token withdrawal failed on RRC20 Reserve token transfer");
  }

  /**
    @dev Extracts tokens from the reserve and update mocState
    @param receiver Account from which the tokens will be taken
    @param tokenAmount Amount to deposit
   */
  function safeDepositInReserve(address receiver, uint256 tokenAmount) private {
    require(deposit(tokenAmount, receiver), "Token deposit failed on RRC20 Reserve token transfer");
    mocState.addToReserves(tokenAmount);
  }



  /***** STATE MODIFIERS *****/
  modifier whenSettlementReady() {
    require(settlement.isSettlementReady(), "Function can only be called when settlement is ready");
    _;
  }

  modifier atState(IMoCState.States _state) {
    require(mocState.state() == _state, "Function cannot be called at this state.");
    _;
  }

  modifier atLeastState(IMoCState.States _state) {
    require(mocState.state() >= _state, "Function cannot be called at this state.");
    _;
  }

  modifier atMostState(IMoCState.States _state) {
    require(mocState.state() <= _state, "Function cannot be called at this state.");
    _;
  }

  modifier notInProtectionMode() {
    require(mocState.globalCoverage() > mocState.getProtected(), "Function cannot be called at protection mode.");
    _;
  }

  modifier bucketStateTransition(bytes32 bucket) {
    evalBucketLiquidation(bucket);
    _;
  }

  modifier availableBucket(bytes32 bucket) {
    require(riskProxManager.isAvailableBucket(bucket), "Bucket is not available");
    _;
  }

  modifier notBaseBucket(bytes32 bucket) {
    require(!riskProxManager.isBucketBase(bucket), "Bucket should not be a base type bucket");
    _;
  }

  modifier transitionState()
  {
    mocState.nextState();
    if (mocState.state() == IMoCState.States.Liquidated) {
      liquidate();
    }
    else
      _;
  }

  /**
    * @notice validate that the given gas price is less or equal to the gas price limit
    */
  modifier isValidGasPrice() {
    require(tx.gasprice <= maxGasPrice, "gas price is above the max allowed");
    _;
  }

  /**
   * @notice allows the pauser or an authorized changer to update the gas price limit
   *  The pauser is a multisig that could be used in this case to speed up the max gas price
   *  change if it is necessary
   * @param maxGasPrice_ new gas price limit
   */
  function setMaxGasPrice(uint256 maxGasPrice_) external {
    require(stopper == msg.sender || governor.isAuthorizedChanger(msg.sender), "not authorized changer or stopper");
    maxGasPrice = maxGasPrice_;
  }

  uint256 public maxGasPrice;

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[49] private upgradeGap;
}

