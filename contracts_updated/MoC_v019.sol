pragma solidity 0.5.8;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./MoCLibConnection.sol";
import "./token/StableToken.sol";
import "./token/RiskProToken.sol";
import "./MoCRiskProxManager.sol";
import "./MoCState.sol";
import "./MoCConverter.sol";
import "./MoCSettlement.sol";
import "./MoCExchange.sol";
import "./MoCBurnout.sol";
import "./base/MoCBase.sol";
import "./base/MoCReserve.sol";
import "moc-governance/contracts/Stopper/Stoppable.sol";
import "moc-governance/contracts/Governance/IGovernor.sol";


contract MoCEvents_v019 {
  event BucketLiquidation(bytes32 bucket);
}


contract MoC_v019 is MoCEvents_v019, MoCReserve, MoCLibConnection, MoCBase, Stoppable {
  using SafeMath for uint256;

  // Contracts
  StableToken internal stableToken;
  RiskProToken internal riskProToken;
  MoCRiskProxManager internal riskProxManager;
  MoCState internal mocState;
  MoCConverter internal mocConverter;
  MoCSettlement internal settlement;
  MoCExchange internal mocExchange;
  MoCInrate internal mocInrate;
  MoCBurnout public mocBurnout;

  // Indicates if ReserveTokens remainder was sent and
  // RiskProToken was paused
  bool internal liquidationExecuted;

  function initialize(address connectorAddress, address governorAddress, address stopperAddress, bool startStoppable) public initializer {
    initializePrecisions();
    initializeBase(connectorAddress);
    initializeContracts();
    initializeGovernanceContracts(stopperAddress, governorAddress, startStoppable);
  }

  /****************************INTERFACE*******************************************/

  function riskProxBalanceOf(bytes32 bucket, address account) public view returns (uint256) {
    return riskProxManager.riskProxBalanceOf(bucket, account);
  }

  /**
    @dev Gets the RedeemRequest at the queue index position
    @param index queue position to get
    @return redeemer's address and amount he submitted
  */
  function getRedeemRequestAt(uint256 index) public view returns (address, uint256) {
    return settlement.getRedeemRequestAt(index);
  }

  /**
    @dev returns current redeem queue size
   */
  function redeemQueueSize() public view returns (uint256) {
    return settlement.redeemQueueSize();
  }

  /**
    @dev returns the total amount of StableTokens in the redeem queue for redeemer
    @param redeemer address for which ^ is computed
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
    @dev Mints RiskPro and pays the comissions of the operation.
    @param resTokensToMint Amount Reserve Tokens to spend in minting
   */
  function mintRiskPro(uint256 resTokensToMint) public whenNotPaused() transitionState() {
    uint256 allowedBalance = getAllowance(msg.sender);
    (uint256 resTokensExchangeTokens, uint256 commissionSpent) = mocExchange.mintRiskPro(msg.sender, resTokensToMint);

    uint256 totalResTokensSpent = resTokensExchangeTokens.add(commissionSpent);
    require(totalResTokensSpent <= allowedBalance, "amount is not enough");

    safeDepositInReserve(msg.sender, totalResTokensSpent);

    //Transfer commissions to commissions address
    safeWithdrawFromReserve(mocInrate.commissionsAddress(), commissionSpent);
  }

  /**
   * @dev Redeems RiskPro Tokens and pays the comissions of the operation in ReserveTokens
     @param riskProAmount Amout in RiskPro
   */
  function redeemRiskPro(uint256 riskProAmount) public whenNotPaused() transitionState() atLeastState(MoCState.States.AboveCobj) {
    (uint256 resTokensAmount, uint256 commissionSpent) = mocExchange.redeemRiskPro(msg.sender, riskProAmount);

    safeWithdrawFromReserve(msg.sender, resTokensAmount);

    // Transfer commissions to commissions address
    safeWithdrawFromReserve(mocInrate.commissionsAddress(), commissionSpent);
  }

  /**
   * @dev Mint StableToken tokens and pays the commisions of the operation
   * @param resTokensToMint Amount in ReserveTokens to mint
   */
  function mintStableToken(uint256 resTokensToMint) public whenNotPaused() transitionState() atLeastState(MoCState.States.AboveCobj) {
    uint256 allowedBalance = getAllowance(msg.sender);
    (uint256 resTokensExchangeSpent, uint256 commissionSpent) = mocExchange.mintStableToken(msg.sender, resTokensToMint);

    uint256 totalResTokensSpent = resTokensExchangeSpent.add(commissionSpent);
    require(totalResTokensSpent <= allowedBalance, "amount is not enough");

    safeDepositInReserve(msg.sender, totalResTokensSpent);

    // Transfer commissions to commissions address
    safeWithdrawFromReserve(mocInrate.commissionsAddress(), commissionSpent);
  }

  /**
     @dev Redeems RiskProx Tokens and pays the comissions of the operation in ReserveTokens
     @param bucket Bucket to reedem, for example X2
     @param riskProxAmount Amount in RiskProx
   */
  function redeemRiskProx(bytes32 bucket, uint256 riskProxAmount)
    public
    whenNotPaused()
    whenSettlementReady()
    availableBucket(bucket)
    notBaseBucket(bucket)
    transitionState()
    bucketStateTransition(bucket)
  {
    (uint256 totalReserveTokenRedeemed, uint256 commissionSpent) = mocExchange.redeemRiskProx(msg.sender, bucket, riskProxAmount);

    safeWithdrawFromReserve(msg.sender, totalReserveTokenRedeemed);

    // Transfer commissions to commissions address
    safeWithdrawFromReserve(mocInrate.commissionsAddress(), commissionSpent);
  }

  /**
   * @dev BUCKET riskProx minting
   * @param bucket Name of the bucket used
   * @param resTokensToMint amount to mint on ReserveTokens
   **/
  function mintRiskProx(bytes32 bucket, uint256 resTokensToMint)
    public
    whenNotPaused()
    whenSettlementReady()
    availableBucket(bucket)
    notBaseBucket(bucket)
    transitionState()
    bucketStateTransition(bucket)
  {
    uint256 allowedBalance = getAllowance(msg.sender);
    (uint256 resTokensExchangeSpent, uint256 commissionSpent) = mocExchange.mintRiskProx(msg.sender, bucket, resTokensToMint);

    uint256 totalResTokensSpent = resTokensExchangeSpent.add(commissionSpent);
    require(totalResTokensSpent <= allowedBalance, "amount is not enough");

    // Need to update general State
    safeDepositInReserve(msg.sender, totalResTokensSpent);

    // Transfer commissions to commissions address
    safeWithdrawFromReserve(mocInrate.commissionsAddress(), commissionSpent);
  }

  /**
   * @dev Redeems the requested amount for the msg.sender, or the max amount of free stableTokens possible.
   * @param stableTokenAmount Amount of StableTokens to redeem.
   */
  function redeemFreeStableToken(uint256 stableTokenAmount) public whenNotPaused() transitionState() {
    (uint256 resTokensAmount, uint256 commissionSpent) = mocExchange.redeemFreeStableToken(msg.sender, stableTokenAmount);

    safeWithdrawFromReserve(msg.sender, resTokensAmount);

    // Transfer commissions to commissions address
    safeWithdrawFromReserve(mocInrate.commissionsAddress(), commissionSpent);
  }

  /**
   * @dev Allow redeem on liquidation state, user StableTokens get burned and he receives
   * the equivalent ReserveTokens if can be covered, or the maximum available
   **/
  function redeemAllStableToken() public atState(MoCState.States.Liquidated) {
    mocExchange.redeemAllStableToken(msg.sender, msg.sender);
  }

  /**
    @dev Moves the daily amount of interest rate to C0 bucket
  */
  function dailyInratePayment() public whenNotPaused() {
    mocInrate.dailyInratePayment();
  }

  /**
   * @dev Pays the RiskPro interest and transfers it to the address mocInrate.riskProInterestAddress
   * RiskPro interests = Nb (bucket 0) * riskProRate.
   */
  function payRiskProHoldersInterestPayment() public whenNotPaused() {
    uint256 toPay = mocInrate.payRiskProHoldersInterestPayment();
    if (withdrawFromReserve(mocInrate.getRiskProInterestAddress(), toPay)) {
      riskProxManager.substractValuesFromBucket(BUCKET_C0, toPay, 0, 0);
    }
  }

  /**
   * @dev Calculates RiskPro holders holder interest by taking the total amount of RBCs available on Bucket 0.
   * RiskPro interests = Nb (bucket 0) * riskProRate.
   */
  function calculateRiskProHoldersInterest() public view returns (uint256, uint256) {
    return mocInrate.calculateRiskProHoldersInterest();
  }

  function getRiskProInterestAddress() public view returns (address payable) {
    return mocInrate.getRiskProInterestAddress();
  }

  function getRiskProRate() public view returns (uint256) {
    return mocInrate.getRiskProRate();
  }

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
    @dev Returns true if blockSpan number of blocks has pass since last execution
  */
  function isSettlementEnabled() public view returns (bool) {
    return settlement.isSettlementEnabled();
  }

  /**
   * @dev Checks if bucket liquidation is reached.
   * @return true if bucket liquidation is reached, false otherwise
   */
  function isBucketLiquidationReached(bytes32 bucket) public view returns (bool) {
    if (mocState.coverage(bucket) <= mocState.liq()) {
      return true;
    }
    return false;
  }

  function evalBucketLiquidation(bytes32 bucket) public availableBucket(bucket) notBaseBucket(bucket) whenSettlementReady() {
    if (mocState.coverage(bucket) <= mocState.liq()) {
      riskProxManager.liquidateBucket(bucket, BUCKET_C0);

      emit BucketLiquidation(bucket);
    }
  }

  /**
   * @dev Set Burnout address.
   * @param burnoutAddress Address to which the funds will be sent on liquidation.
   */
  function setBurnoutAddress(address payable burnoutAddress) public whenNotPaused() atLeastState(MoCState.States.RiskProDiscount) {
    mocBurnout.pushBurnoutAddress(msg.sender, burnoutAddress);
  }

  /**
   * @dev Get Burnout address.
   */
  function getBurnoutAddress() public view returns (address) {
    return mocBurnout.getBurnoutAddress(msg.sender);
  }

  /**
   * @dev Evaluates if liquidation state has been reached and runs liq if that's the case
   */
  function evalLiquidation(uint256 steps) public {
    mocState.nextState();

    if (mocState.state() == MoCState.States.Liquidated) {
      liquidate();
      mocBurnout.executeBurnout(steps);
    }
  }

  /**
   * @dev Runs all settlement process
   */
  function runSettlement(uint256 steps) public whenNotPaused() transitionState() {
    uint256 accumCommissions = settlement.runSettlement(steps);

    // Transfer accums commissions to commissions address
    safeWithdrawFromReserve(mocInrate.commissionsAddress(), accumCommissions);
  }

  /**
  * @dev Public function to extract and send tokens from the reserve.
    Will return false if transfer reverts or fails.

    @param receiver Account to which the tokens will be send
    @param tokenAmount Amount of tokens to send
    @return False if RRC20 transfer fails or revert and true if succeeds
  **/
  function sendToAddress(address receiver, uint256 tokenAmount) public onlyWhitelisted(msg.sender) returns (bool) {
    if (tokenAmount == 0) {
      return true;
    }

    return withdrawFromReserve(receiver, tokenAmount);
  }

  function liquidate() internal {
    if (!liquidationExecuted) {
      pauseRiskProToken();
      sendReservesRemainder();
      liquidationExecuted = true;
    }
  }

  /**
    @dev Transfer the value that not corresponds to
    StableToken Collateral
  */
  function sendReservesRemainder() internal {
    uint256 riskProResTokenValue = mocState.getReservesRemainder();
    safeWithdrawFromReserve(mocInrate.commissionsAddress(), riskProResTokenValue);
  }

  function initializeContracts() internal {
    stableToken = StableToken(connector.stableToken());
    riskProToken = RiskProToken(connector.riskProToken());
    riskProxManager = MoCRiskProxManager(connector.riskProxManager());
    mocState = MoCState(connector.mocState());
    settlement = MoCSettlement(connector.mocSettlement());
    mocConverter = MoCConverter(connector.mocConverter());
    mocExchange = MoCExchange(connector.mocExchange());
    mocInrate = MoCInrate(connector.mocInrate());
    mocBurnout = MoCBurnout(connector.mocBurnout());
    setReserveToken(connector.reserveToken());
  }

  function initializeGovernanceContracts(address stopperAddress, address governorAddress, bool startStoppable) internal {
    Stoppable.initialize(stopperAddress, IGovernor(governorAddress), startStoppable);
  }

  function pauseRiskProToken() internal {
    if (!riskProToken.paused()) {
      riskProToken.pause();
    }
  }

  /**
    @dev Extracts tokens from the reserve and update mocState
    @param receiver Account to which the tokens will be send
    @param tokenAmount Amount to extract from reserve
    @return False if RRC20 transfer fails or revert and true if succeeds
   */
  function withdrawFromReserve(address receiver, uint256 tokenAmount) internal returns (bool) {
    bool result = withdraw(tokenAmount, receiver);

    if (result) {
      mocState.substractFromReserves(tokenAmount);
    }

    return result;
  }

  /**
    @dev Extracts tokens from the reserve and update mocState but reverts if token transfer fails
    @param receiver Account to which the tokens will be send
    @param tokenAmount Amount to extract from reserve
   */
  function safeWithdrawFromReserve(address receiver, uint256 tokenAmount) internal {
    require(withdraw(tokenAmount, receiver), "Token withdrawal failed on RRC20 Reserve token transfer");
    mocState.substractFromReserves(tokenAmount);
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

  modifier atState(MoCState.States _state) {
    require(mocState.state() == _state, "Function cannot be called at this state.");
    _;
  }

  modifier atLeastState(MoCState.States _state) {
    require(mocState.state() >= _state, "Function cannot be called at this state.");
    _;
  }

  modifier atMostState(MoCState.States _state) {
    require(mocState.state() <= _state, "Function cannot be called at this state.");
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

  modifier transitionState() {
    mocState.nextState();
    if (mocState.state() == MoCState.States.Liquidated) {
      liquidate();
    } else _;
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}