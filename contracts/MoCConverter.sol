pragma solidity 0.5.8;

import "./interface/IMoCState.sol";
import "./MoCLibConnection.sol";
import "./base/MoCBase.sol";

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
