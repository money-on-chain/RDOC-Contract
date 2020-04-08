pragma solidity 0.5.8;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "moc-governance/contracts/Governance/Governed.sol";
import "moc-governance/contracts/Governance/IGovernor.sol";


/** @title ReserveToken Price Provider. */
contract MoCEMACalculator is Governed {
  using SafeMath for uint256;

  event MovingAverageCalculation(uint256 price, uint256 movingAverage);

  uint256 internal exponentialMovingAverage;
  uint256 public smoothingFactor;
  uint256 public lastEmaCalculation;
  uint256 public emaCalculationBlockSpan;

  uint256 public constant PRICE_PRECISION = 10**18;
  uint256 public constant FACTOR_PRECISION = 10**18;

  function getExponentalMovingAverage() public view returns (uint256) {
    return exponentialMovingAverage;
  }

  function getSmoothingFactor() public view returns (uint256) {
    return smoothingFactor;
  }

  function setSmoothingFactor(uint256 factor) public onlyAuthorizedChanger() {
    _doSetSmoothingFactor(factor);
  }

  function getGovernorAddress() public view returns (address) {
    return address(governor);
  }

  function getEmaCalculationBlockSpan() public view returns (uint256) {
    return emaCalculationBlockSpan;
  }

  /**
   * @param blockSpan Defines how many blocks should pass between BMA calculations
   **/
  function setEmaCalculationBlockSpan(uint256 blockSpan) public onlyAuthorizedChanger() {
    emaCalculationBlockSpan = blockSpan;
  }

  function shouldCalculateEma() public view returns (bool) {
    return block.number >= lastEmaCalculation.add(emaCalculationBlockSpan);
  }

  function getLastEmaCalculation() public view returns (uint256) {
    return lastEmaCalculation;
  }

  /** @dev Provides ResToken's Price and Moving average.
   * More information of EMA calculation https://en.wikipedia.org/wiki/Exponential_smoothing
   * @param initialEma Initial ema value
   * @param smoothFactor Weight coefficient for EMA calculation.
   * @param emaBlockSpan Block count in a period for EMA calculation
   */
  function initializeMovingAverage(uint256 initialEma, uint256 smoothFactor, uint256 emaBlockSpan) internal {
    _doSetSmoothingFactor(smoothFactor);
    lastEmaCalculation = block.number;
    exponentialMovingAverage = initialEma;
    emaCalculationBlockSpan = emaBlockSpan;
  }

  /** @dev Calculates a EMA of the price.
   * More information of EMA calculation https://en.wikipedia.org/wiki/Exponential_smoothing
   * @param reservePrice Current price.
   */
  function setExponentalMovingAverage(uint256 reservePrice) internal {
    if (shouldCalculateEma()) {
      uint256 weightedPrice = reservePrice.mul(smoothingFactor);
      uint256 currentEma = exponentialMovingAverage.mul(coefficientComp()).add(weightedPrice).div(FACTOR_PRECISION);

      lastEmaCalculation = block.number;
      exponentialMovingAverage = currentEma;

      emit MovingAverageCalculation(reservePrice, currentEma);
    }
  }

  /** @dev Calculates the smoothing factor complement
   */
  function coefficientComp() internal view returns (uint256) {
    return FACTOR_PRECISION.sub(smoothingFactor);
  }

  function initializeGovernor(address _governor) internal {
    governor = IGovernor(_governor);
  }

  function _doSetSmoothingFactor(uint256 factor) private {
    require(factor <= FACTOR_PRECISION, "Invalid smoothing factor");
    smoothingFactor = factor;
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}
