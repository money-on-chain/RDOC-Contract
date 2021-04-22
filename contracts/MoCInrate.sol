pragma solidity 0.5.8;

import "moc-governance/contracts/Governance/Governed.sol";
import "moc-governance/contracts/Governance/IGovernor.sol";
import "./MoCLibConnection.sol";
import "./interface/IMoCState.sol";
import "./MoCRiskProxManager.sol";
import "./MoCConverter.sol";
import "./base/MoCBase.sol";
import "./interface/IMoCVendors.sol";
import "./interface/IMoCInrate.sol";

contract MoCInrateEvents {
  event InrateDailyPay(uint256 amount, uint256 daysToSettlement, uint256 nReserveBucketC0);
  event RiskProHoldersInterestPay(uint256 amount, uint256 nReserveBucketC0BeforePay);
}

contract MoCInrateStructs {
  struct InrateParams {
    uint256 tMax;
    uint256 tMin;
    uint256 power;
  }

  InrateParams riskProxParams = InrateParams({
    tMax: 261157876067800,
    tMin: 0,
    power: 1
  });
}


contract MoCInrate is MoCInrateEvents, MoCInrateStructs, MoCBase, MoCLibConnection, Governed, IMoCInrate {
  using SafeMath for uint256;

  // Last block when a payment was executed
  uint256 public lastDailyPayBlock;
  // Absolute  RiskPro holders rate for the given riskProInterestBlockSpan time span. [using mocPrecision]
  uint256 public riskProRate;
  // Target address to transfer RiskPro holders interests
  address payable public riskProInterestAddress;
  // Last block when an RiskPro holders instereste was calculated
  uint256 public lastRiskProInterestBlock;
  // RiskPro interest Blockspan to configure blocks between payments
  uint256 public riskProInterestBlockSpan;

  // Target addres to transfer commissions of mint/redeem
  address payable public commissionsAddress;
  /** UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
  /** DEPRECATED **/
  // commissionRate [using mocPrecision]
  // solium-disable-next-line mixedcase
  uint256 public DEPRECATED_commissionRate;

  /************************************/
  /***** UPGRADE v017       ***********/
  /************************************/

  /** START UPDATE V017: 01/11/2019 **/

  // Upgrade to support redeem stable inrate parameter
  uint256 public stableTmin;
  uint256 public stablePower;
  uint256 public stableTmax;

  /**CONTRACTS**/
  IMoCState internal mocState;
  MoCConverter internal mocConverter;
  MoCRiskProxManager internal riskProxManager;

  function setStableTmin(uint256 _stableTmin) public onlyAuthorizedChanger() {
    stableTmin = _stableTmin;
  }

  function setStableTmax(uint256 _stableTmax) public onlyAuthorizedChanger() {
    stableTmax = _stableTmax;
  }

  function setStablePower(uint256 _stablePower) public onlyAuthorizedChanger() {
    stablePower = _stablePower;
  }

  function getStableTmin() public view returns (uint256) {
    return stableTmin;
  }

  function getStableTmax() public view returns (uint256) {
    return stableTmax;
  }

  function getStablePower() public view returns (uint256) {
    return stablePower;
  }

  /**
    @dev Calculates an average interest rate between after and before free stableToken Redemption
    @param stableTokenRedeem StableTokens to redeem [using mocPrecision]
    @return Interest rate value [using mocPrecision]
   */
  function stableTokenInrateAvg(uint256 stableTokenRedeem) public view returns (uint256) {
    uint256 preAbRatio = mocState.currentAbundanceRatio();
    uint256 posAbRatio = mocState.abundanceRatio(riskProxManager.getBucketNStableToken(BUCKET_C0).sub(stableTokenRedeem));

    return mocLibConfig.inrateAvg(stableTmax, stablePower, stableTmin, preAbRatio, posAbRatio);
  }

  /** END UPDATE V017: 01/11/2019 **/

  /**
    @dev Initializes the contract
    @param connectorAddress MoCConnector contract address
    @param _governor Governor contract address
    @param riskProxTmin  Minimum interest rate [using mocPrecision]
    @param riskProxPower Power is a parameter for interest rate calculation [using noPrecision]
    @param riskProxTmax Maximun interest rate [using mocPrecision]
    @param _riskProRate BitPro holder interest rate [using mocPrecision]
    @param blockSpanRiskPro BitPro blockspan to configure payments periods[using mocPrecision]
    @param riskProInterestTargetAddress Target address to transfer the weekly BitPro holders interest
    @param commissionsAddressTarget Target addres to transfer commissions of mint/redeem
    @param _stableTmin Upgrade to support red stable inrate parameter
    @param _stablePower Upgrade to support red stable inrate parameter
    @param _stableTmax Upgrade to support red stable inrate parameter
  */
  function initialize(
    address connectorAddress,
    address _governor,
    uint256 riskProxTmin,
    uint256 riskProxPower,
    uint256 riskProxTmax,
    uint256 _riskProRate,
    uint256 blockSpanRiskPro,
    address payable riskProInterestTargetAddress,
    address payable commissionsAddressTarget,
    //uint256 commissionRateParam,
    uint256 _stableTmin,
    uint256 _stablePower,
    uint256 _stableTmax
  ) public initializer {
    initializePrecisions();
    initializeBase(connectorAddress);
    initializeContracts();
    initializeValues(
      _governor,
      riskProxTmin,
      riskProxPower,
      riskProxTmax,
      _riskProRate,
      commissionsAddressTarget,
      //commissionRateParam,
      blockSpanRiskPro,
      riskProInterestTargetAddress,
      _stableTmin,
      _stablePower,
      _stableTmax
    );
  }

/**
   * @dev gets tMin param of RiskProx tokens
   * @return returns tMin of RiskProx
   */
  function getRiskProxTmin() public view returns (uint256) {
    return riskProxParams.tMin;
  }

  /**
   * @dev gets tMax param of RiskProx tokens
   * @return returns tMax of RiskProx
   */
  function getRiskProxTmax() public view returns (uint256) {
    return riskProxParams.tMax;
  }

  /**
   * @dev gets power param of RiskProx tokens
   * @return returns power of RiskProx
   */
  function getRiskProxPower() public view returns (uint256) {
    return riskProxParams.power;
  }

  /**
   * @dev Gets the blockspan of RiskPro that represents the frecuency of RiskPro holders intereset payment
   * @return returns power of riskProInterestBlockSpan
   */
  function getRiskProInterestBlockSpan() public view returns (uint256) {
    return riskProInterestBlockSpan;
  }

  /**
   * @dev sets tMin param of RiskProx tokens
   * @param _btxcTmin tMin of RiskProx
   */
  function setRiskProxTmin(uint256 _btxcTmin) public onlyAuthorizedChanger() {
    riskProxParams.tMin = _btxcTmin;
  }

  /**
   * @dev sets tMax param of RiskProx tokens
   * @param _btxcTax tMax of RiskProx
   */
  function setRiskProxTmax(uint256 _btxcTax) public onlyAuthorizedChanger() {
    riskProxParams.tMax = _btxcTax;
  }

  /**
   * @dev sets power param of RiskProx tokens
   * @param _btxcPower power of RiskProx
   */
  function setRiskProxPower(uint256 _btxcPower) public onlyAuthorizedChanger() {
    riskProxParams.power = _btxcPower;
  }

  /**
   @dev Gets the rate for RiskPro Holders
   @return RiskPro Rate
  */
  function getRiskProRate() public view returns (uint256) {
    return riskProRate;
  }

  // function getCommissionRate() public view returns(uint256) {
  //   return commissionRate;
  // }

   /**
    @dev Sets RiskPro Holders rate
    @param newRiskProRate New RiskPro rate
   */
  function setRiskProRate(uint256 newRiskProRate) public onlyAuthorizedChanger() {
    riskProRate = newRiskProRate;
  }

   /**
    @dev Sets the blockspan RiskPro Intereset rate payment is enable to be executed
    @param newRiskProBlockSpan New RiskPro Block span
   */
  function setRiskProInterestBlockSpan(uint256 newRiskProBlockSpan) public onlyAuthorizedChanger() {
    riskProInterestBlockSpan = newRiskProBlockSpan;
  }

  /**
   @dev Gets the target address to transfer RiskPro Holders rate
   @return Target address to transfer RiskPro Holders interest
  */
  function getRiskProInterestAddress() public view returns (address payable) {
    return riskProInterestAddress;
  }

  /**
   @dev Sets the target address to transfer RiskPro Holders rate
   @param newRiskProInterestAddress New RiskPro rate
  */
  function setRiskProInterestAddress(address payable newRiskProInterestAddress) public onlyAuthorizedChanger() {
    riskProInterestAddress = newRiskProInterestAddress;
  }

  /**
   @dev Sets the target address to transfer commissions of Mint/Redeem transactions
   @param newCommissionsAddress New commisions address
  */
  function setCommissionsAddress(address payable newCommissionsAddress) public onlyAuthorizedChanger() {
    commissionsAddress = newCommissionsAddress;
  }

  //  /**
  //   @dev Sets the commission rate for Mint/Redeem transactions
  //   @param newCommissionRate New commission rate
  //  */
  // function setCommissionRate(uint256 newCommissionRate) public onlyAuthorizedChanger() {
  //   commissionRate = newCommissionRate;
  // }

  /**
    @dev Calculates interest rate for RiskProx Minting, redeem and Free StableToken Redeem
    @return Interest rate value [using RatePrecsion]
   */
  function spotInrate() public view returns (uint256) {
    uint256 abRatio = mocState.currentAbundanceRatio();

    return mocLibConfig.spotInrate(riskProxParams.tMax, riskProxParams.power, riskProxParams.tMin, abRatio);
  }

  /**
    @dev Calculates an average interest rate between after and before mint/redeem
    @param bucket Name of the bucket involved in the operation
    @param resTokensAmount Value of the operation from which calculates the inrate [using reservePrecision]
    @param onMinting Value that represents if the calculation is based on mint or on redeem
    @return Interest rate value [using mocPrecision]
   */
  function riskProxInrateAvg(bytes32 bucket, uint256 resTokensAmount, bool onMinting) public view returns (uint256) {
    uint256 preAbRatio = mocState.currentAbundanceRatio();
    uint256 posAbRatio = mocState.abundanceRatio(simulateStableTokenMovement(bucket, resTokensAmount, onMinting));

    return mocLibConfig.inrateAvg(riskProxParams.tMax, riskProxParams.power, riskProxParams.tMin, preAbRatio, posAbRatio);
  }

  /**
    @dev returns the amount of ReserveTokens to pay in concept of interest to bucket C0
   */
  function dailyInrate() public view returns(uint256) {
    uint256 daysToSettl = mocState.daysToSettlement();
    uint256 totalInrateInBag = riskProxManager.getInrateBag(BUCKET_C0);

    if (daysToSettl < mocLibConfig.dayPrecision) {
      return totalInrateInBag;
    }

    // ([RES] * [DAY] / ([DAY] + [DAY])) = [RES]
    // inrateBag / (daysToSettlement + 1)
    uint256 toPay = totalInrateInBag
      .mul(mocLibConfig.dayPrecision)
      .div(daysToSettl.add(mocLibConfig.dayPrecision));

    return toPay;
  }

  /**
    @dev Extract the inrate from the passed ReserveTokens value for RiskProx minting operation
    @param bucket Bucket to use to calculate interés
    @param reserveTokenAmount Total value from which extract the interest rate [using reservePrecision]
    @return ReserveTokens to pay in concept of interests [using reservePrecision]
  */
  function calcMintInterestValues(bytes32 bucket, uint256 reserveTokenAmount) public view returns (uint256) {
    // Calculate Reserves to move in the operation
    uint256 reservesToMove = mocLibConfig.bucketTransferAmount(reserveTokenAmount, mocState.leverage(bucket));
    // Calculate interest rate
    uint256 inrateValue = riskProxInrateAvg(bucket, reserveTokenAmount, true); // Minting
    uint256 finalInrate = inrateToSettlement(inrateValue, true); // Minting

    // Final interest
    return mocLibConfig.getInterestCost(reservesToMove, finalInrate);
  }

  /**
    @dev Extract the inrate from the passed ReserveTokens value for the StableToken Redeem operation
    @param stableTokenAmount StableToken amount of the redemption [using mocPrecision]
    @param reserveTokenAmount Total value from which extract the interest rate [using reservePrecision]
    @return finalInterest
  */
  function calcStableTokenRedInterestValues(uint256 stableTokenAmount, uint256 reserveTokenAmount) public view returns (uint256) {
    uint256 rate = stableTokenInrateAvg(stableTokenAmount);
    uint256 finalInrate = inrateToSettlement(rate, true);
    uint256 interests = mocLibConfig.getInterestCost(reserveTokenAmount, finalInrate);

    return interests;
  }

  /**
    @dev This function calculates the interest to return to the user
    in a RiskProx redemption. It uses a mechanism to counteract the effect
    of free stableTokens redemption. It will be replaced with FreeStableToken redemption
    interests in the future
    @param bucket Bucket to use to calculate interest
    @param reserveTokenToRedeem Total value from which calculate interest [using reservePrecision]
    @return Reserves to recover in concept of interests [using reservePrecision]
  */
  function calcFinalRedeemInterestValue(bytes32 bucket, uint256 reserveTokenToRedeem) public view returns (uint256) {
    // Get interests to return for redemption
    uint256 redeemInterest = calcRedeemInterestValue(bucket, reserveTokenToRedeem); // Redeem
    uint256 proportionalInterest = calcProportionalInterestValue(bucket, redeemInterest);

    return Math.min(proportionalInterest, redeemInterest);
  }

  /************************************/
  /***** UPGRADE v0110      ***********/
  /************************************/

  /** START UPDATE V0110: 24/09/2020  **/
  /** Upgrade to support multiple commission rates **/
  /** Public functions **/

  /**
    @dev calculates the Commission rate from the passed ReserveTokens amount for mint/redeem operations
    @param reserveTokenAmount Total value from which apply the Commission rate [using reservePrecision]
    @param txType Transaction type according to constant values defined in this contract
    @return finalCommissionAmount [using reservePrecision]
  */
  function calcCommissionValue(uint256 reserveTokenAmount, uint8 txType)
  public view returns(uint256) {
    // Validate txType
    require (txType > 0, "Invalid transaction type 'txType'");

    uint256 finalCommissionAmount = reserveTokenAmount.mul(commissionRatesByTxType[txType]).div(mocLibConfig.mocPrecision);
    return finalCommissionAmount;
  }

  /**
    @dev calculates the vendor markup rate from the passed vendor account and amount
    @param vendorAccount Vendor address
    @param amount Total value from which apply the vendor markup rate [using reservePrecision]
    @return finalCommissionAmount [using reservePrecision]
  */
  function calculateVendorMarkup(address vendorAccount, uint256 amount) public view
    returns (uint256 markup) {
    // Calculate according to vendor markup
    if (vendorAccount != address(0)) {
      IMoCVendors mocVendors = IMoCVendors(mocState.getMoCVendors());

      markup = amount.mul(mocVendors.getMarkup(vendorAccount)).div(mocLibConfig.mocPrecision);
    }

    return markup;
  }

  /** END UPDATE V0110: 24/09/2020 **/

  /**
    @dev Calculates ReserveTokens value to return to the user in concept of interests
    @param bucket Bucket to use to calculate interest
    @param reserveTokenToRedeem Total value from which calculate interest [using reservePrecision]
    @return Reserves to recover in concept of interests [using reservePrecision]
  */
  function calcRedeemInterestValue(bytes32 bucket, uint256 reserveTokenToRedeem) public view returns (uint256) {
    // Calculate Reserves to move in the operation
    uint256 reservesToMove = mocLibConfig.bucketTransferAmount(reserveTokenToRedeem, mocState.leverage(bucket));
    // Get interests to return for redemption
    uint256 inrate = riskProxInrateAvg(bucket, reserveTokenToRedeem, false); // Redeem
    uint256 finalInrate = inrateToSettlement(inrate, false); // Redeem

    // Calculate interest for the redemption
    return mocLibConfig.getInterestCost(reservesToMove, finalInrate);
  }

  /**
    @dev Moves the daily amount of interest rate to C0 bucket
  */
  function dailyInratePayment() public
  onlyWhitelisted(msg.sender) onlyOnceADay() returns(uint256) {
    uint256 toPay = dailyInrate();
    lastDailyPayBlock = block.number;

    if (toPay != 0) {
      riskProxManager.deliverInrate(BUCKET_C0, toPay);
    }

    emit InrateDailyPay(toPay, mocState.daysToSettlement(), mocState.getBucketNReserve(BUCKET_C0));
  }

  function isDailyEnabled() public view returns (bool) {
    return lastDailyPayBlock == 0 || block.number > lastDailyPayBlock + mocState.dayBlockSpan();
  }

  function isRiskProInterestEnabled() public view returns (bool) {
    return lastRiskProInterestBlock == 0 || block.number > (lastRiskProInterestBlock + riskProInterestBlockSpan);
  }

  /**
   * @dev Calculates RiskPro Holders interest rates
   * @return toPay interest in ReserveTokens [using reservePrecsion]
   * @return bucketBtnc0 RTBC on bucket0 used to calculate de interest [using reservePrecsion]
   */
  function calculateRiskProHoldersInterest() public view returns (uint256, uint256) {
    uint256 bucketBtnc0 = riskProxManager.getBucketNReserve(BUCKET_C0);
    uint256 toPay = (bucketBtnc0.mul(riskProRate).div(mocLibConfig.mocPrecision));
    return (toPay, bucketBtnc0);
  }

  /**
   * @dev Pays the RiskPro Holders interest rates
   * @return interest payed in ReserveTokens [using reservePrecsion]
   */
  function payRiskProHoldersInterestPayment() public
  onlyWhitelisted(msg.sender)
  onlyWhenRiskProInterestsIsEnabled() returns(uint256) {
    (uint256 riskProInterest, uint256 bucketBtnc0) = calculateRiskProHoldersInterest();
    lastRiskProInterestBlock = block.number;
    emit RiskProHoldersInterestPay(riskProInterest, bucketBtnc0);
    return riskProInterest;
  }

  /************************************/
  /***** UPGRADE v0110      ***********/
  /************************************/

  /** START UPDATE V0110: 24/09/2020  **/
  /** Upgrade to support multiple commission rates **/
  /** Public functions **/
  /**
    @dev Sets the commission rate to a particular transaction type
    @param txType Transaction type according to constant values defined in this contract
    @param value Commission rate
  */
  function setCommissionRateByTxType(uint8 txType, uint256 value) public onlyAuthorizedChanger() {
    commissionRatesByTxType[txType] = value;
  }

  /** END UPDATE V0110: 24/09/2020 **/

  /**
    @dev Calculates the interest rate to pay until the settlement day
    @param inrate Spot interest rate
    @param countAllDays Value that represents if the calculation will use all days or one day less
    @return Interest rate value [using mocPrecision]
   */
  function inrateToSettlement(uint256 inrate, bool countAllDays) internal view returns (uint256) {
    uint256 dayCount = inrateDayCount(countAllDays);

    return inrate.mul(dayCount).div(mocLibConfig.dayPrecision);
  }

  /**
    @dev This function calculates the interest to return to a user redeeming
    RiskProx as a proportion of the amount in the interestBag.
    @param bucket Bucket to use to calculate interest
    @param redeemInterest Total value from which calculate interest [using reservePrecision]
    @return InterestsInBag * (RedeemInterests / FullRedeemInterest) [using reservePrecision]
  */
  function calcProportionalInterestValue(bytes32 bucket, uint256 redeemInterest) internal view returns (uint256) {
    uint256 fullRedeemInterest = calcFullRedeemInterestValue(bucket);
    uint256 interestsInBag = riskProxManager.getInrateBag(BUCKET_C0);

    if (fullRedeemInterest == 0) {
      return 0;
    }

    // Proportional interests amount
    return redeemInterest.mul(interestsInBag).div(fullRedeemInterest); // [RES] * [RES] / [RES]
  }

  /**
    @dev This function calculates the interest to return if a user redeem all RiskProx in existance
    @param bucket Bucket to use to calculate interest
    @return Interests [using reservePrecision]
  */
  function calcFullRedeemInterestValue(bytes32 bucket) internal view returns (uint256) {
    // Value in ReserveTokens of all RiskProxs in the bucket
    uint256 fullRiskProxReserveTokenValue = mocConverter.riskProxToResToken(riskProxManager.getBucketNRiskPro(bucket), bucket);
    // Interests to return if a redemption of all RiskProx is done
    return calcRedeemInterestValue(bucket, fullRiskProxReserveTokenValue); // Redeem
  }

  /**
    @dev Calculates the final amount of Bucket 0 StableTokens on RiskProx mint/redeem
    @param bucket Name of the bucket involved in the operation
    @param resTokensAmount Value of the operation from which calculates the inrate [using reservePrecision]
    @return Final bucket 0 StableToken amount
   */
  function simulateStableTokenMovement(bytes32 bucket, uint256 resTokensAmount, bool onMinting) internal view returns (uint256) {
    // Calculates stableTokens to move
    uint256 reserveTokenToMove = mocLibConfig.bucketTransferAmount(resTokensAmount, mocState.leverage(bucket));
    uint256 stableTokensToMove = mocConverter.resTokenToStableToken(reserveTokenToMove);

    if (onMinting) {
      /* Should not happen when minting riskPro because it's
      not possible to mint more than max riskProx but is
      useful when trying to calculate inrate before minting */
      return riskProxManager.getBucketNStableToken(BUCKET_C0) > stableTokensToMove
        ? riskProxManager.getBucketNStableToken(BUCKET_C0).sub(stableTokensToMove)
        : 0;
    } else {
      return riskProxManager.getBucketNStableToken(BUCKET_C0).add(Math.min(stableTokensToMove, riskProxManager.getBucketNStableToken(bucket)));
    }
  }

  /**
    @dev Returns the days to use for interests calculation
    @param countAllDays Value that represents if the calculation is based on mint or on redeem
    @return days [using dayPrecision]
   */
  function inrateDayCount(bool countAllDays) internal view returns(uint256) {
    uint256 daysToSettl = mocState.daysToSettlement();

    if (daysToSettl < mocLibConfig.dayPrecision) {
      return 0;
    }

    if (countAllDays) {
      return daysToSettl;
    }

    return daysToSettl.sub(mocLibConfig.dayPrecision);
  }

  modifier onlyOnceADay() {
    require(isDailyEnabled(), "Interest rate already payed today");
    _;
  }

  modifier onlyWhenRiskProInterestsIsEnabled() {
    require(isRiskProInterestEnabled(), "Interest rate of RiskPro holders already payed this week");
    _;
  }

  /**
   * @dev Initialize the contracts with which it interacts
   */
  function initializeContracts() internal {
    riskProxManager = MoCRiskProxManager(connector.riskProxManager());
    mocState = IMoCState(connector.mocState());
    mocConverter = MoCConverter(connector.mocConverter());
  }

  /**
   * @dev Initialize the parameters of the contract
   * @param _governor the address of the IGovernor contract
   * @param riskProxMin Minimum interest rate [using mocPrecision]
   * @param riskProxPower Power is a parameter for interest rate calculation [using noPrecision]
   * @param riskProxMax Maximun interest rate [using mocPrecision]
   * @param _riskProRate RiskPro holder interest rate [using mocPrecision]
   * @param blockSpanRiskPro RiskPro blockspan to configure payments periods[using mocPrecision]
   * @param riskProInterestsTarget Target address to transfer the weekly RiskPro holders interest
   * @param _stableTmin Upgrade to support red stable inrate parameter
   * @param _stablePower Upgrade to support red stable inrate parameter
   * @param _stableTmax Upgrade to support red stable inrate parameter
   */
  function initializeValues(
    address _governor,
    uint256 riskProxMin,
    uint256 riskProxPower,
    uint256 riskProxMax,
    uint256 _riskProRate,
    address payable commissionsAddressTarget,
    //uint256 commissionRateParam,
    uint256 blockSpanRiskPro,
    address payable riskProInterestsTarget,
    uint256 _stableTmin,
    uint256 _stablePower,
    uint256 _stableTmax
  ) internal {
    governor = IGovernor(_governor);
    riskProxParams.tMin = riskProxMin;
    riskProxParams.power = riskProxPower;
    riskProxParams.tMax = riskProxMax;
    riskProRate = _riskProRate;
    riskProInterestAddress = riskProInterestsTarget;
    riskProInterestBlockSpan = blockSpanRiskPro;
    //commissionRate = commissionRateParam;
    commissionsAddress = commissionsAddressTarget;
    stableTmin = _stableTmin;
    stablePower = _stablePower;
    stableTmax = _stableTmax;
  }

  /************************************/
  /***** UPGRADE v0110      ***********/
  /************************************/

  /** START UPDATE V0110: 24/09/2020  **/
  /** Upgrade to support multiple commission rates **/

  // Transaction types
  uint8 public constant MINT_RISKPRO_FEES_RESERVE = 1;
  uint8 public constant REDEEM_RISKPRO_FEES_RESERVE = 2;
  uint8 public constant MINT_STABLETOKEN_FEES_RESERVE = 3;
  uint8 public constant REDEEM_STABLETOKEN_FEES_RESERVE = 4;
  uint8 public constant MINT_RISKPROX_FEES_RESERVE = 5;
  uint8 public constant REDEEM_RISKPROX_FEES_RESERVE = 6;
  uint8 public constant MINT_RISKPRO_FEES_MOC = 7;
  uint8 public constant REDEEM_RISKPRO_FEES_MOC = 8;
  uint8 public constant MINT_STABLETOKEN_FEES_MOC = 9;
  uint8 public constant REDEEM_STABLETOKEN_FEES_MOC = 10;
  uint8 public constant MINT_RISKPROX_FEES_MOC = 11;
  uint8 public constant REDEEM_RISKPROX_FEES_MOC = 12;

  mapping(uint8 => uint256) public commissionRatesByTxType;

  /** END UPDATE V0110: 24/09/2020 **/

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}
