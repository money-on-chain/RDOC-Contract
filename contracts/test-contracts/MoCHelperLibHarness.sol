pragma solidity 0.5.8;

import "zos-lib/contracts/Initializable.sol";

import "../../contracts/MoCLibConnection.sol";

contract MoCHelperLibHarness is MoCLibConnection, Initializable {
  function initialize() public initializer {
    initializePrecisions();
  }

  /**
    @dev Returns max uint256 value constant.
    @return max uint256 value constant
  */
  function getMaxInt() public view returns(uint256) {
    return mocLibConfig.getMaxInt();
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
  function inrateAvg(uint256 tMax, uint256 power, uint256 tMin, uint256 abRat1, uint256 abRat2)
  public view returns(uint256) {
    return mocLibConfig.inrateAvg(tMax, power, tMin, abRat1, abRat2);
  }

  /**
    @dev Calculates spot interest rate that RiskProx owners should pay to RiskPro owners: Rate = tMax * (abRatio ** power) + tMin
    @param tMin min interest rate [using mocPrecision]
    @param power power to use in the formula [using NoPrecision]
    @param tMax max interest rate [using mocPrecision]
    @param abRatio bucket C0  abundance Ratio [using mocPrecision]
   */
  function spotInrate(uint256 tMax, uint256 power, uint256 tMin, uint256 abRatio) public view returns(uint256) {
    return mocLibConfig.spotInrate(tMax, power, tMin, abRatio);
  }

  /**
    @dev Calculates potential interests function with given parameters: Rate = a * (x ** b) + c
    @param a maxInterestRate [using mocPrecision]
    @param b factor [using NoPrecision]
    @param c minInterestRate C0 stableToken amount [using mocPrecision]
    @param value global stableToken amount [using mocPrecision]
  */
  function potential(uint256 a, uint256 b, uint256 c, uint256 value)
  public view returns(uint256) {
    return mocLibConfig.potential(a, b, c, value);
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
  function avgInt(uint256 a, uint256 b, uint256 c, uint256 value1, uint256 value2)
  public view returns(uint256) {
    return mocLibConfig.avgInt(a, b, c, value1, value2);
  }

  /**
    @dev Calculates integral of the exponential function: T = c * (value) + (a * value ** (b + 1)) / (b + 1))
    @param a maxInterestRate [using mocPrecision]
    @param b factor [using NoPrecision]
    @param c minInterestRate C0 stableToken amount [using mocPrecision]
    @param value value to put in the function [using mocPrecision]
    @return integration result [using mocPrecision]
  */
  function integral(uint256 a, uint256 b, uint256 c, uint256 value)
  public view returns(uint256) {
    return mocLibConfig.integral(a, b, c, value);
  }

  /**
  * @dev Relation between stableTokens in bucket 0 and StableToken total supply
  * @param stableToken0 stableToken count in bucket 0 [using mocPrecision]
  * @param stableTokent total stableToken supply [using mocPrecision]
  * @return abundance ratio [using mocPrecision]
  */
  function abundanceRatio(uint256 stableToken0, uint256 stableTokent)
  public view returns(uint256) {
    return mocLibConfig.abundanceRatio(stableToken0, stableTokent);
  }

  /**
    @dev Returns the Ratio to apply to RiskPro Price in discount situations: SpotDiscountRate = TPD * (utpdu - cob) / (uptdu -liq)
    @param riskProLiqDiscountRate Discount rate applied at Liquidation level coverage [using mocPrecision]
    @param liq Liquidation coverage threshold [using mocPrecision]
    @param utpdu Discount coverage threshold [using mocPrecision]
    @param cov Actual global Coverage threshold [using mocPrecision]
    @return Spot discount rate [using mocPrecision]
  */
  function riskProSpotDiscountRate(uint256 riskProLiqDiscountRate, uint256 liq, uint256 utpdu, uint256 cov) public view returns(uint256) {
    return mocLibConfig.riskProSpotDiscountRate(riskProLiqDiscountRate, liq, utpdu, cov);
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
    uint256 nReserve, uint256 nStableToken, uint256 utpdu,
    uint256 peg, uint256 reservePrice, uint256 riskProUsdPrice, uint256 spotDiscount
  )
  public view returns(uint256)  {
    return mocLibConfig.maxRiskProWithDiscount(
      nReserve, nStableToken, utpdu, peg, reservePrice, riskProUsdPrice, spotDiscount
    );
  }

  /**
    @dev Calculates Locked ReserveTokens
    @param reservePrice ReserveTokens price [using mocPrecision]
    @param nStableToken StableTokens amount [using mocPrecision]
    @param peg peg value
    @return Locked ReserveTokens [using reservePrecision]
  */
  function lockedReserveTokens(uint256 reservePrice, uint256 nStableToken, uint256 peg)
  public view returns(uint256) {
    return mocLibConfig.lockedReserveTokens(reservePrice, nStableToken, peg);
  }

  /**
    @dev Calculates price at liquidation event as a relation between the stableToken total supply
    and the amount of ReserveTokens available to distribute
    @param resTokenAmount ReserveTokens to distribute [using reservePrecision]
    @param nStableToken StableTokens amount [using mocPrecision]
    @return Price at liquidation event [using mocPrecision]
  */
  function liquidationPrice(uint256 resTokenAmount, uint256 nStableToken)
  public view returns(uint256) {
    return mocLibConfig.liquidationPrice(resTokenAmount, nStableToken);
  }

  /**
    @dev Calculates RiskPro ReserveTokens: (nReserve-LB) / nTP
    @param nReserve Total ReserveTokens amount [using reservePrecision]
    @param lb Locked ReserveTokens amount [using reservePrecision]
    @param nTP RiskPro amount [using mocPrecision]
    @return RiskPro ReserveTokens price [using reservePrecision]
  */
  function riskProTecPrice(uint256 nReserve, uint256 lb, uint256 nTP)
  public view returns(uint256) {
    return mocLibConfig.riskProTecPrice(nReserve, lb, nTP);
  }

  /**
    @dev Calculates RiskPro ReserveToken price: RiskProxInRiskPro = riskProxTecPrice / riskProPrice
    @param riskProxTecPrice RiskProx ReserveTokens price [using reservePrecision]
    @param riskProPrice Trog ReserveTokens price [using reservePrecision]
    @return RiskProx price in RiskPro [using mocPrecision]
  */
  function riskProxRiskProPrice(uint256 riskProxTecPrice, uint256 riskProPrice)
  public view returns(uint256) {
    return mocLibConfig.riskProxRiskProPrice(riskProxTecPrice, riskProPrice);
  }

  /**
    @dev Returns a new value with the discountRate applied: (price)* (1 - discountRate)
    @param price Price [using SomePrecision]
    @param discountRate Discount rate to apply [using mocPrecision]
    @return Price with discount applied [using SomePrecision]
  */
  function applyDiscountRate(uint256 price, uint256 discountRate)
  public view returns(uint256) {
    return mocLibConfig.applyDiscountRate(price, discountRate);
  }

  /**
    @dev Returns the amount of interest to pay: = price * interestRate
    @param value Cost to apply interest [using SomePrecision]
    @param interestRate Interest rate to apply [using mocPrecision]
    @return Interest cost based on the value and interestRate [using SomePrecision]
  */
  function getInterestCost(uint256 value, uint256 interestRate)
  public view returns(uint256) {
    return mocLibConfig.getInterestCost(value, interestRate);
  }

  /**
    @dev Calculates Coverage: nReserve / LB
    @param nReserve Total ReserveTokens amount [using reservePrecision]
    @param lB Locked ReserveTokens amount [using reservePrecision]
    @return Coverage [using mocPrecision]
  */
  function coverage(uint256 nReserve, uint256 lB)
  public view returns(uint256) {
    return mocLibConfig.coverage(nReserve, lB);
  }

 /**
    @dev Calculates Leverage from Coverage: Leverage = C / (C - 1)
    @param cov Coverage [using mocPrecision]
    @return Leverage [using mocPrecision]
  */
  function leverageFromCoverage(uint256 cov)
  public view returns(uint256) {
    return mocLibConfig.leverageFromCoverage(cov);
  }

 /**
    @dev Calculates Leverage: Leverage = nReserve / (nReserve - lB)
    @param nReserve Total ReserveTokens amount [using reservePrecision]
    @param lB Locked ReserveTokens amount [using reservePrecision]
    @return Leverage [using mocPrecision]
  */
  function leverage(uint256 nReserve,uint256 lB)
  public view returns(uint256) {
    return mocLibConfig.leverage(nReserve, lB);
  }

  /**
    @dev Price in ReserveTokens of the amount of StableTokens
    @param amount Total ReserveTokens amount [using reservePrecision]
    @param reservePrice ReserveTokens price [using mocPrecision]
    @return Total value [using reservePrecision]
  */
  function stableTokensResTokensValue(uint256 amount, uint256 peg, uint256 reservePrice)
  public view returns(uint256) {
    return mocLibConfig.stableTokensResTokensValue(amount, peg, reservePrice);
  }

 /**
    @dev Price in ReserveTokens of the amount of RiskPros
    @param riskProAmount amount of RiskPro [using mocPrecision]
    @param riskProResTokenPrice RiskPro price in ReserveTokens [using reservePrecision]
    @return Total value [using reservePrecision]
  */
  function riskProResTokensValuet(uint256 riskProAmount, uint256 riskProResTokenPrice)
  public view returns(uint256) {
    return mocLibConfig.riskProResTokensValuet(riskProAmount, riskProResTokenPrice);
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
  function maxStableToken(uint256 nReserve, uint256 cobj, uint256 nStableToken, uint256 peg, uint256 reservePrice, uint256 bCons)
  public view returns(uint256) {
    return mocLibConfig.maxStableToken(nReserve, cobj, nStableToken, peg, reservePrice, bCons);
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
    uint256 nReserve, uint256 cobj, uint256 nStableToken, uint256 peg,
    uint256 reservePrice, uint256 bCons, uint256 riskProUsdPrice
  )
  public view returns(uint256) {
    return mocLibConfig.maxRiskPro(
      nReserve, cobj, nStableToken, peg, reservePrice, bCons, riskProUsdPrice
    );
  }

  /**
    @dev Calculates the total ReserveTokens price of the amount of RiskPros
    @param amount Amount of RiskPro [using mocPrecision]
    @param riskProPrice RiskPro ReserveTokens Price [using reservePrecision]
    @return RiskPro total value in ReserveTokens [using reservePrecision]
  */
  function totalRiskProInResTokens(uint256 amount, uint256 riskProPrice)
  public view returns(uint256) {
    return mocLibConfig.totalRiskProInResTokens(amount, riskProPrice);
  }

  /**
    @dev Calculates the equivalent in StableTokens of the resTokensAmount
    @param resTokensAmount ReserveTokens  amount [using reservePrecision]
    @param reservePrice ReserveTokens price [using mocPrecision]
    @return Equivalent StableToken amount [using mocPrecision]
  */
  function maxStableTokensWithResTokens(uint256 resTokensAmount, uint256 reservePrice)
  public view returns(uint256) {
    return mocLibConfig.maxStableTokensWithResTokens(resTokensAmount, reservePrice);
  }

  /**
    @dev Calculates the equivalent in RiskPro of the resTokensAmount
    @param resTokensAmount ReserveTokens amount [using reservePrecision]
    @param riskProPrice RiskPro ReserveTokens price [using reservePrecision]
    @return Equivalent RiskPro amount [using mocPrecision]
  */
  function maxRiskProWithResTokens(uint256 resTokensAmount, uint256 riskProPrice)
  public view returns(uint256) {
    return mocLibConfig.maxRiskProWithResTokens(resTokensAmount, riskProPrice);
  }

  /**
    @dev Calculates the ResToken amount to move from C0 bucket to
    an L bucket when a RiskProx minting occurs: toMove = resTokensAmount * (lev - 1)
    @param resTokensAmount Total ReserveTokens amount [using reservePrecision]
    @param lev L bucket leverage [using mocPrecision]
    @return resTokens to move [using reservePrecision]
  */
  function bucketTransferAmount(uint256 resTokensAmount, uint256 lev)
  public view returns(uint256) {
    return mocLibConfig.bucketTransferAmount(resTokensAmount, lev);
  }

   /**
    @dev Max amount of ReserveTokens allowed to be used to mint riskProx: MaxriskProx = nStableToken/ (PEG*B*(lev-1))
    @param nStableToken number of StableToken [using mocPrecision]
    @param peg peg value
    @param reservePrice ReserveTokens price [using mocPrecision]
    @param lev leverage [using mocPrecision]
    @return Max riskProx ReserveTokens value [using reservePrecision]
  */
  function maxRiskProxResTokenValue(uint256 nStableToken, uint256 peg, uint256 reservePrice, uint256 lev)
  public view returns(uint256)  {
    return mocLibConfig.maxRiskProxResTokenValue(nStableToken, peg, reservePrice, lev);
  }

  /**
    @dev Calculates the equivalent in MoC of the reserve token
    @param resTokensAmount Total ReserveTokens amount
    @param reservePrice ReserveTokens price
    @param mocPrice MoC price
    @return Equivalent MoC amount
  */
  function maxMoCWithReserveToken(uint256 resTokensAmount, uint256 reservePrice, uint256 mocPrice)
  public view returns(uint256) {
    return mocLibConfig.maxMoCWithReserveToken(resTokensAmount, reservePrice, mocPrice);
  }

  /**
    @dev Calculates the equivalent in reserve token of the MoC amount
    @param amount MoC amount
    @param reservePrice ReserveTokens price
    @param mocPrice MoC price
    @return Equivalent ReserveToken amount
  */
  function mocReserveTokenValue(uint256 amount, uint256 reservePrice, uint256 mocPrice)
  public view returns(uint256) {
    return mocLibConfig.mocReserveTokenValue(amount, reservePrice, mocPrice);
  }
}
