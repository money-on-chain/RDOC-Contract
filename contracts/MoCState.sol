pragma solidity 0.5.8;

import "openzeppelin-solidity/contracts/math/Math.sol";
import "./interface/PriceProvider.sol";
import "./MoCEMACalculator.sol";
import "./base/MoCBase.sol";
import "./MoCLibConnection.sol";
import "./MoCRiskProxManager.sol";
import "./token/StableToken.sol";
import "./token/RiskProToken.sol";
import "./MoCSettlement.sol";
import "moc-governance/contracts/Governance/Governed.sol";
import "moc-governance/contracts/Governance/IGovernor.sol";


contract MoCState is MoCLibConnection, MoCBase, MoCEMACalculator {
  using Math for uint256;
  using SafeMath for uint256;

  // This is the current state.
  States public state;

  event StateTransition(States newState);
  event PriceProviderUpdated(address oldAddress, address newAddress);
  // Contracts
  PriceProvider internal priceProvider;
  MoCSettlement internal mocSettlement;
  MoCConverter internal mocConverter;
  StableToken internal stableToken;
  RiskProToken internal riskProToken;
  MoCRiskProxManager internal riskProxManager;

  // One Day based on 15 seconds blocks
  uint256 public dayBlockSpan;
  // Relation between StableToken and dollar
  uint256 public peg;
  // RiskPro max discount rate
  // Reflects the discount spot rate at Liquidation level
  uint256 public riskProMaxDiscountRate;
  // Liquidation limit
  // [using mocPrecision]
  uint256 public liq;
  // RiskPro with discount limit
  // [using mocPrecision]
  uint256 public utpdu;
  // Complete amount reserves in the system
  uint256 public reserves;
  // Price to use at stableToken redemption at
  // liquidation event
  uint256 public liquidationPrice;
  // Max value posible to mint of RiskPro
  uint256 public maxMintRiskPro;

  function initialize(
    address connectorAddress,
    address _governor,
    address _priceProvider,
    uint256 _liq,
    uint256 _utpdu,
    uint256 _maxDiscRate,
    uint256 _dayBlockSpan,
    uint256 _ema,
    uint256 _smoothFactor,
    uint256 _emaBlockSpan,
    uint256 _maxMintRiskPro
  ) public initializer {
    initializePrecisions();
    initializeBase(connectorAddress);
    initializeContracts();
    initializeValues(_governor, _priceProvider, _liq, _utpdu, _maxDiscRate, _dayBlockSpan, _maxMintRiskPro);
    initializeMovingAverage(_ema, _smoothFactor, _emaBlockSpan);
  }

  /**
   * @param rate Discount rate at liquidation level [using mocPrecision]
   **/
  function setMaxDiscountRate(uint256 rate) public onlyAuthorizedChanger() {
    require(rate < mocLibConfig.mocPrecision, "rate is lower than mocPrecision");

    riskProMaxDiscountRate = rate;
  }

  /**
   * @dev return the value of the RiskPro max discount rate configuration param
   * @return riskProMaxDiscountRate RiskPro max discount rate
   */
  function getMaxDiscountRate() public view returns (uint256) {
    return riskProMaxDiscountRate;
  }

  /**
   * @dev Defines how many blocks there are in a day
   * @param blockSpan blocks there are in a day
   **/
  function setDayBlockSpan(uint256 blockSpan) public onlyAuthorizedChanger() {
    dayBlockSpan = blockSpan;
  }

  /**
   * @dev Sets a new PriceProvider contract
   * @param priceProviderAddress blocks there are in a day
   **/
  function setPriceProvider(address priceProviderAddress) public onlyAuthorizedChanger() {
    address oldPriceProviderAddress = address(priceProvider);
    priceProvider = PriceProvider(priceProviderAddress);
    emit PriceProviderUpdated(oldPriceProviderAddress, address(priceProvider));
  }

  /**
   * @dev Gets the PriceProviderAddress
   * @return priceProvider blocks there are in a day
   **/
  function getPriceProvider() public view returns (address) {
    return address(priceProvider);
  }

  /**
   * @dev Gets how many blocks there are in a day
   * @return blocks there are in a day
   */
  function getDayBlockSpan() public view returns (uint256) {
    return dayBlockSpan;
  }

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

  /**
   * @dev Subtract the reserve amount passed by parameter to the reserves total
   * @param amount Amount that will be subtract to reserves
   */
  function substractFromReserves(uint256 amount) public onlyWhitelisted(msg.sender) {
    reserves = reserves.sub(amount);
  }

  /**
   * @dev Add the reserve amount passed by parameter to the reserves total
   * @param amount Amount that will be added to reserves
   */
  function addToReserves(uint256 amount) public onlyWhitelisted(msg.sender) {
    reserves = reserves.add(amount);
  }

  /**
    @dev All RiskPros in circulation
   */
  function riskProTotalSupply() public view returns (uint256) {
    return riskProToken.totalSupply();
  }

  /**
    @dev All stableTokens in circulation
   */
  function stableTokenTotalSupply() public view returns (uint256) {
    return stableToken.totalSupply();
  }

  /**
    @dev Target coverage for complete system
   */
  function cobj() public view returns (uint256) {
    return riskProxManager.getBucketCobj(BUCKET_C0);
  }

  /**
   * @dev Amount of ReserveTokens in the system excluding
   * RiskProx values and interests holdings
   */
  function collateralReserves() public view returns (uint256) {
    uint256 resTokensInRiskProx = mocConverter.riskProxToResToken(riskProxManager.getBucketNRiskPro(BUCKET_X2), BUCKET_X2);
    uint256 resTokensInBag = riskProxManager.getInrateBag(BUCKET_C0);

    return reserves.sub(resTokensInRiskProx).sub(resTokensInBag);
  }

  /** @dev GLOBAL Coverage
   * @return coverage [using mocPrecision].
   */
  function globalCoverage() public view returns (uint256) {
    uint256 lB = globalLockedReserveTokens();

    return mocLibConfig.coverage(collateralReserves(), lB);
  }

  /**
   * @dev BUCKET lockedReserveTokens
   * @param bucket Name of the bucket used
   * @return lockedReserveTokens amount [using reservePrecision].
   */
  function lockedReserveTokens(bytes32 bucket) public view returns (uint256) {
    uint256 nStableToken = riskProxManager.getBucketNStableToken(bucket);

    return mocLibConfig.lockedReserveTokens(getReserveTokenPrice(), nStableToken, peg);
  }

  /**
   * @dev Gets ReserveTokens in RiskPro within specified bucket
   * @param bucket Name of the bucket used
   * @return ReserveToken amount of RiskPro in Bucket [using reservePrecision].
   */
  function getResTokensInRiskPro(bytes32 bucket) public view returns (uint256) {
    uint256 nReserve = riskProxManager.getBucketNReserve(bucket);
    uint256 lB = lockedReserveTokens(bucket);

    if (lB >= nReserve) {
      return 0;
    }

    return nReserve.sub(lB);
  }

  /**
  * @dev Gets the ReserveTokens in the contract that not corresponds
    to StableToken collateral
  * @return ReserveTokens remainder [using reservePrecision].
  */
  function getReservesRemainder() public view returns (uint256) {
    uint256 lB = globalLockedReserveTokens();

    if (lB >= reserves) {
      return 0;
    }

    return reserves.sub(lB);
  }

  /**
   * @dev BUCKET Coverage
   * @param bucket Name of the bucket used
   * @return coverage [using mocPrecision]
   */
  function coverage(bytes32 bucket) public view returns (uint256) {
    if (!riskProxManager.isBucketBase(bucket) && riskProxManager.isBucketEmpty(bucket)) {
      return riskProxManager.getBucketCobj(bucket);
    }

    uint256 nReserve = riskProxManager.getBucketNReserve(bucket);
    uint256 lB = lockedReserveTokens(bucket);

    return mocLibConfig.coverage(nReserve, lB);
  }

  /**
   * @dev Abundance ratio, receives tha amount of stableToken to use the value of stableToken0 and StableToken total supply
   * @return abundance ratio [using mocPrecision]
   */
  function abundanceRatio(uint256 stableToken0) public view returns (uint256) {
    return mocLibConfig.abundanceRatio(stableToken0, stableTokenTotalSupply());
  }

  /**
   * @dev Relation between stableTokens in bucket 0 and StableToken total supply
   * @return abundance ratio [using mocPrecision]
   */
  function currentAbundanceRatio() public view returns (uint256) {
    return abundanceRatio(getBucketNStableToken(BUCKET_C0));
  }

  /**
   * @dev BUCKET Leverage
   * @param bucket Name of the bucket used
   * @return leverage [using mocPrecision]
   */
  function leverage(bytes32 bucket) public view returns (uint256) {
    uint256 cov = coverage(bucket);

    return mocLibConfig.leverageFromCoverage(cov);
  }

  /**
   * @dev GLOBAL maxStableToken
   * @return maxStableToken to issue [using mocPrecision]
   */
  function globalMaxStableToken() public view returns (uint256) {
    return mocLibConfig.maxStableToken(collateralReserves(), cobj(), stableTokenTotalSupply(), peg, getReserveTokenPrice(), getBcons());
  }

  /**
   * @return amount of stableTokens in bucket 0, that can be redeemed outside of settlement [using mocPrecision]
   */
  function freeStableToken() public view returns (uint256) {
    return riskProxManager.getBucketNStableToken(BUCKET_C0);
  }

  /**
   * @dev BUCKET maxStableToken
   * @return maxStableToken to issue [using mocPrecision]
   */
  function maxStableToken(bytes32 bucket) public view returns (uint256) {
    uint256 nReserve = riskProxManager.getBucketNReserve(bucket);
    uint256 nStableToken = riskProxManager.getBucketNStableToken(bucket);
    uint256 bktCobj = riskProxManager.getBucketCobj(bucket);

    return mocLibConfig.maxStableToken(nReserve, bktCobj, nStableToken, peg, getReserveTokenPrice(), getBcons());
  }

  /**
   * @dev GLOBAL maxRiskPro
   * @return maxRiskPro for redeem [using mocPrecision].
   */
  function globalMaxRiskPro() public view returns (uint256) {
    uint256 riskProPrice = riskProUsdPrice();

    return
      mocLibConfig.maxRiskPro(collateralReserves(), cobj(), stableTokenTotalSupply(), peg, getReserveTokenPrice(), getBcons(), riskProPrice);
  }

  /**
   * @dev ABSOLUTE maxStableToken
   * @return maxStableToken to issue [using mocPrecision]
   */
  function absoluteMaxStableToken() public view returns (uint256) {
    return Math.min(globalMaxStableToken(), maxStableToken(BUCKET_C0));
  }

  /** @dev BUCKET maxRiskPro to redeem / mint
      @param bucket Name of the bucket used
    * @return maxRiskPro for redeem [using mocPrecision].
    */
  function maxRiskPro(bytes32 bucket) public view returns (uint256) {
    uint256 nReserve = riskProxManager.getBucketNReserve(bucket);
    uint256 nStableToken = riskProxManager.getBucketNStableToken(bucket);
    uint256 riskProPrice = riskProUsdPrice();
    uint256 bktCobj = riskProxManager.getBucketCobj(bucket);

    return mocLibConfig.maxRiskPro(nReserve, bktCobj, nStableToken, peg, getReserveTokenPrice(), getBcons(), riskProPrice);
  }

  /**
   * @dev GLOBAL max riskProx to mint
   * @param bucket Name of the bucket used
   * @return maxRiskProx [using mocPrecision]
   */
  function maxRiskProx(bytes32 bucket) public view returns (uint256) {
    uint256 maxResTokens = maxRiskProxResTokenValue(bucket);

    return mocLibConfig.maxRiskProWithResTokens(maxResTokens, bucketRiskProTecPrice(bucket));
  }

  /**
   * @dev GLOBAL max riskProx to mint
   * @param bucket Name of the bucket used
   * @return maxRiskProx ReserveTokens value to mint [using reservePrecision]
   */
  function maxRiskProxResTokenValue(bytes32 bucket) public view returns (uint256) {
    uint256 nStableToken0 = riskProxManager.getBucketNStableToken(BUCKET_C0);
    uint256 bucketLev = leverage(bucket);

    return mocLibConfig.maxRiskProxResTokenValue(nStableToken0, peg, getReserveTokenPrice(), bucketLev);
  }

  /** @dev ABSOLUTE maxRiskPro
   * @return maxStableToken to issue [using mocPrecision].
   */
  function absoluteMaxRiskPro() public view returns (uint256) {
    return Math.min(globalMaxRiskPro(), maxRiskPro(BUCKET_C0));
  }

  /**
   * @dev DISCOUNT maxRiskPro
   * @return maxRiskPro for mint with discount [using mocPrecision]
   */
  function maxRiskProWithDiscount() public view returns (uint256) {
    uint256 nStableToken = stableTokenTotalSupply();
    uint256 riskProSpotDiscount = riskProSpotDiscountRate();
    uint256 riskProPrice = riskProUsdPrice();
    uint256 reservePrice = getReserveTokenPrice();

    return mocLibConfig.maxRiskProWithDiscount(collateralReserves(), nStableToken, utpdu, peg, reservePrice, riskProPrice, riskProSpotDiscount);
  }

  /**
   * @dev GLOBAL lockedReserveTokens
   * @return lockedReserveTokens amount [using reservePrecision].
   */
  function globalLockedReserveTokens() public view returns (uint256) {
    return mocLibConfig.lockedReserveTokens(getReserveTokenPrice(), stableTokenTotalSupply(), peg);
  }

  /**
   * @dev ReserveTokens price of RiskPro
   * @return the RiskPro Tec Price [using reservePrecision].
   */
  function riskProTecPrice() public view returns (uint256) {
    return bucketRiskProTecPrice(BUCKET_C0);
  }

  /**
   * @dev BUCKET ReserveTokens price of RiskPro
   * @param bucket Name of the bucket used
   * @return the RiskPro Tec Price [using reservePrecision].
   */
  function bucketRiskProTecPrice(bytes32 bucket) public view returns (uint256) {
    uint256 nRiskPro = riskProxManager.getBucketNRiskPro(bucket);
    uint256 lb = lockedReserveTokens(bucket);
    uint256 nReserve = riskProxManager.getBucketNReserve(bucket);

    return mocLibConfig.riskProTecPrice(nReserve, lb, nRiskPro);
  }

  /**
   * @dev ReserveTokens price of RiskPro with spot discount applied
   * @return the RiskPro Tec Price [using reservePrecision].
   */
  function riskProDiscountPrice() public view returns (uint256) {
    uint256 riskProTecprice = riskProTecPrice();
    uint256 discountRate = riskProSpotDiscountRate();

    return mocLibConfig.applyDiscountRate(riskProTecprice, discountRate);
  }

  /**
   * @dev RiskPro USD PRICE
   * @return the RiskPro USD Price [using mocPrecision]
   */
  function riskProUsdPrice() public view returns (uint256) {
    uint256 riskProResTokenPrice = riskProTecPrice();
    uint256 reservePrice = getReserveTokenPrice();

    return reservePrice.mul(riskProResTokenPrice).div(mocLibConfig.reservePrecision);
  }

  /**
   * @dev GLOBAL max riskProx to mint
   * @param bucket Name of the bucket used
   * @return max RiskPro allowed to be spent to mint RiskProx [using reservePrecision]
   **/
  function maxRiskProxRiskProValue(bytes32 bucket) public view returns (uint256) {
    uint256 resTokensValue = maxRiskProxResTokenValue(bucket);

    return mocLibConfig.maxRiskProWithResTokens(resTokensValue, riskProTecPrice());
  }

  /**
   * @dev BUCKET RiskProx price in RiskPro
   * @param bucket Name of the bucket used
   * @return RiskPro RiskPro Price [[using mocPrecision]Precision].
   */
  function riskProxRiskProPrice(bytes32 bucket) public view returns (uint256) {
    // Otherwise, it reverts.
    if (state == States.Liquidated) {
      return 0;
    }

    uint256 riskProxResTokenPrice = bucketRiskProTecPrice(bucket);
    uint256 riskProResTokenPrice = riskProTecPrice();

    return mocLibConfig.riskProxRiskProPrice(riskProxResTokenPrice, riskProResTokenPrice);
  }

  /**
   * @dev GLOBAL ReserveTokens Discount rate to apply to RiskProPrice.
   * @return RiskPro discount rate [using DISCOUNT_PRECISION].
   */
  function riskProSpotDiscountRate() public view returns (uint256) {
    uint256 cov = globalCoverage();

    return mocLibConfig.riskProSpotDiscountRate(riskProMaxDiscountRate, liq, utpdu, cov);
  }

  /**
    @dev Calculates the number of days to next settlement based dayBlockSpan
   */
  function daysToSettlement() public view returns (uint256) {
    return blocksToSettlement().mul(mocLibConfig.dayPrecision).div(dayBlockSpan);
  }

  /**
    @dev Number of blocks to settlement
   */
  function blocksToSettlement() public view returns (uint256) {
    if (mocSettlement.nextSettlementBlock() <= block.number) {
      return 0;
    }

    return mocSettlement.nextSettlementBlock().sub(block.number);
  }

  /**
   * @dev Verifies if forced liquidation is reached checking if globalCoverage <= liquidation (currently 1.04)
   * @return true if liquidation state is reached, false otherwise
   */
  function isLiquidationReached() public view returns (bool) {
    uint256 cov = globalCoverage();
    if (state != States.Liquidated && cov <= liq) return true;
    return false;
  }

  /**
    @dev Returns the price to use for stableToken redeem in a liquidation event
   */
  function getLiquidationPrice() public view returns (uint256) {
    return liquidationPrice;
  }

  function getBucketNReserve(bytes32 bucket) public view returns (uint256) {
    return riskProxManager.getBucketNReserve(bucket);
  }

  function getBucketNRiskPro(bytes32 bucket) public view returns (uint256) {
    return riskProxManager.getBucketNRiskPro(bucket);
  }

  function getBucketNStableToken(bytes32 bucket) public view returns (uint256) {
    return riskProxManager.getBucketNStableToken(bucket);
  }

  function getBucketCobj(bytes32 bucket) public view returns (uint256) {
    return riskProxManager.getBucketCobj(bucket);
  }

  function getInrateBag(bytes32 bucket) public view returns (uint256) {
    return riskProxManager.getInrateBag(bucket);
  }

  /**********************
    ReserveTokens PRICE PROVIDER
   *********************/

  function getBcons() public view returns (uint256) {
    return Math.min(getReserveTokenPrice(), getExponentalMovingAverage());
  }

  function getReserveTokenPrice() public view returns (uint256) {
    (bytes32 price, bool has) = priceProvider.peek();
    require(has, "Oracle have no Price");

    return uint256(price);
  }

  function calculateReserveTokenMovingAverage() public {
    setExponentalMovingAverage(getReserveTokenPrice());
  }

  /**
   * @dev return the value of the liq threshold configuration param
   * @return liq threshold, currently 1.04
   */
  function getLiq() public view returns (uint256) {
    return liq;
  }

  /**
   * @dev sets the value of the liq threshold configuration param
   * @param _liq liquidation threshold
   */
  function setLiq(uint256 _liq) public onlyAuthorizedChanger() {
    liq = _liq;
  }

  /**
   * @dev return the value of the utpdu threshold configuration param
   * @return utpdu Universal TPro discount sales coverage threshold
   */
  function getUtpdu() public view returns (uint256) {
    return utpdu;
  }

  /**
   * @dev sets the value of the utpdu threshold configuration param
   * @param _utpdu Universal TPro discount sales coverage threshold
   */
  function setUtpdu(uint256 _utpdu) public onlyAuthorizedChanger() {
    utpdu = _utpdu;
  }

  /**
   * @dev returns the relation between StableToken and dollar. By default it is 1.
   * @return peg relation between StableToken and dollar
   */
  function getPeg() public view returns (uint256) {
    return peg;
  }

  /**
   * @dev sets the relation between StableToken and dollar. By default it is 1.
   * @param _peg relation between StableToken and dollar
   */
  function setPeg(uint256 _peg) public onlyAuthorizedChanger() {
    peg = _peg;
  }

  function nextState() public {
    // There is no coming back from Liquidation
    if (state == States.Liquidated) return;

    States prevState = state;
    calculateReserveTokenMovingAverage();
    uint256 cov = globalCoverage();
    if (cov <= liq) {
      setLiquidationPrice();
      state = States.Liquidated;
    } else if (cov > liq && cov <= utpdu) {
      state = States.RiskProDiscount;
    } else if (cov > utpdu && cov <= cobj()) {
      state = States.BelowCobj;
    } else {
      state = States.AboveCobj;
    }

    if (prevState != state) emit StateTransition(state);
  }

  /**
    @dev Calculates price at liquidation event as the relation between
    the stableToken total supply and the amount of ReserveTokens available to distribute
   */
  function setLiquidationPrice() internal {
    // When coverage is below 1, the amount to
    // distribute is all the ReserveTokens in the contract
    uint256 resTokenscAvailable = Math.min(globalLockedReserveTokens(), reserves);

    liquidationPrice = mocLibConfig.liquidationPrice(resTokenscAvailable, stableTokenTotalSupply());
  }

  function initializeValues(
    address _governor,
    address _priceProvider,
    uint256 _liq,
    uint256 _utpdu,
    uint256 _maxDiscRate,
    uint256 _dayBlockSpan,
    uint256 _maxMintRiskPro
  ) internal {
    liq = _liq;
    utpdu = _utpdu;
    riskProMaxDiscountRate = _maxDiscRate;
    dayBlockSpan = _dayBlockSpan;
    governor = IGovernor(_governor);
    priceProvider = PriceProvider(_priceProvider);
    // Default values
    state = States.AboveCobj;
    peg = 1;
    maxMintRiskPro = _maxMintRiskPro;
  }

  function initializeContracts() internal {
    mocSettlement = MoCSettlement(connector.mocSettlement());
    stableToken = StableToken(connector.stableToken());
    riskProToken = RiskProToken(connector.riskProToken());
    riskProxManager = MoCRiskProxManager(connector.riskProxManager());
    mocConverter = MoCConverter(connector.mocConverter());
  }

  /**
   * @param _maxMintRiskPro [using mocPrecision]
   **/
  function setMaxMintRiskPro(uint256 _maxMintRiskPro) public onlyAuthorizedChanger() {
    maxMintRiskPro = _maxMintRiskPro;
  }

  /**
   * @dev return Max value posible to mint of RiskPro
   * @return maxMintRiskPro
   */
  function getMaxMintRiskPro() public view returns (uint256) {
    return maxMintRiskPro;
  }

  /**
   * @dev return the RiskPro available to mint
   * @return maxMintRiskProAvalaible  [using mocPrecision]
   */
  function maxMintRiskProAvalaible() public view returns (uint256) {
    uint256 totalRiskPro = riskProTotalSupply();
    uint256 maxiMintRiskPro = getMaxMintRiskPro();

    if (totalRiskPro >= maxiMintRiskPro) {
      return 0;
    }

    uint256 availableMintRiskPro = maxiMintRiskPro.sub(totalRiskPro);

    return availableMintRiskPro;
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}
