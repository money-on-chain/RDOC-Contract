pragma solidity 0.5.8;

import "../MoCHelperLib.sol";

contract MoCHelperLibMock {
  uint256 constant UINT256_MAX = ~uint256(0);
  using MoCHelperLib for MoCHelperLib.MocLibConfig;
  MoCHelperLib.MocLibConfig internal mocLibConfig;
  event MethodCalled(bytes32 name);

  constructor() public {
    mocLibConfig = MoCHelperLib.MocLibConfig({
      reservePrecision: 10 ** 18,
      mocPrecision: 10 ** 18,
      dayPrecision: 1
    });
  }

  function spotInrate(uint256 tMin, uint256 tMax, uint256 stableToken0, uint256 stableTokent)
  public view returns(uint256) {
    return mocLibConfig.spotInrate(tMin, tMax, stableToken0, stableTokent);
  }

  function maxRiskProWithDiscount(
    uint256 nReserve, uint256 nStableToken, uint256 utpdu, uint256 peg,
    uint256 reservePrice, uint256 riskProUsdPrice, uint256 spotDiscount
  )

  public view returns(uint256) {
    return mocLibConfig.maxRiskProWithDiscount(
      nReserve, nStableToken, utpdu, peg, reservePrice, riskProUsdPrice, spotDiscount
    );
  }

  function inrateAvg(uint256 tMax, uint256 fact, uint256 tMin, uint256 abRat1, uint256 abRat2)
  public view returns(uint256) {
    return mocLibConfig.inrateAvg(tMax, fact, tMin, abRat1, abRat2);
  }

  function avgInt( uint256 tMax, uint256 fact, uint256 tMin, uint256 abRat1, uint256 abRat2)
  public view returns(uint256) {
    return mocLibConfig.avgInt(tMax, fact, tMin, abRat1, abRat2);
  }

  function potential(uint256 tMax, uint256 fact, uint256 tMin, uint256 abRat)
  public view returns(uint256) {
    return mocLibConfig.potential(tMax, fact, tMin, abRat);
  }

  function integral(uint256 tMax, uint256 fact, uint256 tMin, uint256 abRat)
  public view returns(uint256) {
    return mocLibConfig.integral(tMax, fact, tMin, abRat);
  }

  function riskProSpotDiscountRate(
    uint256 riskProLiqDiscountRate, uint256 liq, uint256 utpdu, uint256 cov
  ) public view returns(uint256) {
    return mocLibConfig.riskProSpotDiscountRate(riskProLiqDiscountRate, liq, utpdu, cov);
  }

  // For testing purposes, sends infinite leverage to contract
  function bucketTransferAmountInfiniteLeverage(uint256 nReserve, uint256 delta)
  public view returns (uint256) {
    return mocLibConfig.bucketTransferAmount(nReserve, UINT256_MAX - delta);
  }

  function bucketTransferAmount(uint256 nReserve,uint256 lev) public view returns (uint256) {
    return mocLibConfig.bucketTransferAmount(nReserve, lev);
  }

  function coverage(uint256 nReserve,uint256 lB) public view returns (uint256) {
    return mocLibConfig.coverage(nReserve, lB);
  }

  function leverageFromCoverage(uint256 cov) public view returns (uint256) {
    return mocLibConfig.leverageFromCoverage(cov);
  }

  function leverage(uint256 nReserve,uint256 lB) public view returns (uint256) {
    return mocLibConfig.leverage(nReserve, lB);
  }

  function maxRiskProxResTokenValue(uint256 nStableToken, uint256 peg, uint256 reservePrice, uint256 lev)
  public view returns (uint256) {
    return mocLibConfig.maxRiskProxResTokenValue(nStableToken, peg, reservePrice, lev);
  }

  // For testing purposes, sends infinite leverage to contract
  function maxRiskProxReserveValueInfiniteLeverage(
    uint256 nStableToken, uint256 peg, uint256 reservePrice, uint256 delta
  ) public view returns (uint256) {
    return mocLibConfig.maxRiskProxResTokenValue(nStableToken, peg, reservePrice, UINT256_MAX - delta);
  }
}