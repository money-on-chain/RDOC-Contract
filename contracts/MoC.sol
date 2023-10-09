pragma solidity ^0.5.8;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./MoCLibConnection.sol";
import "./token/RiskProToken.sol";
import "./MoCRiskProxManager.sol";
import "./interfaces/IMoCState.sol";
import "./interfaces/IMoCSettlement.sol";
import "./interfaces/IMoCExchange.sol";
import "./base/MoCBase.sol";
import "./base/MoCReserve.sol";
import "moc-governance/contracts/Stopper/Stoppable.sol";
import "moc-governance/contracts/Governance/IGovernor.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IMoCVendors.sol";
import "./interfaces/IMoCInrate.sol";
import "./interfaces/IMoC.sol";


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
  function initialize(address connectorAddress, address governorAddress, address stopperAddress, bool startStoppable, uint256 maxGasPrice_)
    public
    initializer
  {
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
  function getRedeemRequestAt(uint256 index) public view returns (address, uint256) {
    return settlement.getRedeemRequestAt(index);
  }

  /**
    @dev Returns current redeem queue size
    @return redeem queue size
   */
  function redeemQueueSize() public view returns (uint256) {
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
  function mintRiskPro(uint256 resTokensToMint) public {
    mintRiskProVendors(resTokensToMint, address(0));
  }

  /**
    @dev Mints RiskPro and pays the comissions of the operation.
    @param resTokensToMint Amount Reserve Tokens to spend in minting
    @param vendorAccount Vendor address
   */
  function mintRiskProVendors(uint256 resTokensToMint, address vendorAccount)
    public
    whenNotPaused()
    transitionState()
    notInProtectionMode()
    isValidGasPrice()
  {
    /** UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
    (
      uint256 totalResTokensSpent,
      uint256 reserveTokenCommission,
      uint256 mocCommission,
      uint256 reserveTokenMarkup,
      uint256 mocMarkup
    ) = mocExchange.mintRiskPro(msg.sender, resTokensToMint, vendorAccount);

    transferCommissions(msg.sender, totalResTokensSpent, reserveTokenCommission, mocCommission, vendorAccount, reserveTokenMarkup, mocMarkup);
    /** END UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
  }

  /**
    @dev Redeems RiskPro Tokens and pays the comissions of the operation (retrocompatible function).
    @param riskProAmount Amout in RiskPro
  */
  function redeemRiskPro(uint256 riskProAmount) public {
    redeemRiskProVendors(riskProAmount, address(0));
  }

  /**
    @dev Redeems RiskPro Tokens and pays the comissions of the operation in ReserveTokens
    @param riskProAmount Amout in RiskPro
    @param vendorAccount Vendor address
  */
  function redeemRiskProVendors(uint256 riskProAmount, address vendorAccount)
    public
    whenNotPaused()
    transitionState()
    atLeastState(IMoCState.States.AboveCobj)
    isValidGasPrice()
  {
    /** UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
    (uint256 resTokensAmount, uint256 reserveTokenCommission, uint256 mocCommission, uint256 reserveTokenMarkup, uint256 mocMarkup) = mocExchange
      .redeemRiskPro(msg.sender, riskProAmount, vendorAccount);

    redeemWithCommission(msg.sender, reserveTokenCommission, mocCommission, vendorAccount, reserveTokenMarkup, mocMarkup, resTokensAmount);
    /** END UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
  }

  /**
    @dev StableToken Doc tokens and pays the commisions of the operation (retrocompatible function).
    @dev Retrocompatible function.
    @param resTokensToMint Amount in ReserveToken to mint
  */
  function mintStableToken(uint256 resTokensToMint) public {
    mintStableTokenVendors(resTokensToMint, address(0));
  }

  /**
    @dev Mint StableToken tokens and pays the commisions of the operation
    @param resTokensToMint Amount in ReserveTokens to mint
    @param vendorAccount Vendor address
  */
  function mintStableTokenVendors(uint256 resTokensToMint, address vendorAccount)
    public
    whenNotPaused()
    transitionState()
    atLeastState(IMoCState.States.AboveCobj)
    isValidGasPrice()
  {
    /** UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
    (
      uint256 totalResTokensSpent,
      uint256 reserveTokenCommission,
      uint256 mocCommission,
      uint256 reserveTokenMarkup,
      uint256 mocMarkup
    ) = mocExchange.mintStableToken(msg.sender, resTokensToMint, vendorAccount);

    transferCommissions(msg.sender, totalResTokensSpent, reserveTokenCommission, mocCommission, vendorAccount, reserveTokenMarkup, mocMarkup);
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
  function redeemRiskProxVendors(bytes32 bucket, uint256 riskProxAmount, address vendorAccount)
    public
  /* Remove modifiers to save some contract size */
  // whenNotPaused() whenSettlementReady() availableBucket(bucket) notBaseBucket(bucket)
  // transitionState() bucketStateTransition(bucket)
  {
    /** UPDATE V0114: 07/02/2023 - Removal of leveraged positions. Please take a look at http://bit.ly/3XPiKUA **/
    revert("Redeem Leveraged position is disabled. See: http://bit.ly/3XPiKUA");
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
  function mintRiskProxVendors(bytes32 bucket, uint256 resTokensToMint, address vendorAccount)
    public
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
  function redeemFreeStableToken(uint256 stableTokenAmount) public {
    redeemFreeStableTokenVendors(stableTokenAmount, address(0));
  }

  /**
    @dev Redeems the requested amount for the msg.sender, or the max amount of free stableTokens possible.
    @param stableTokenAmount Amount of StableTokens to redeem.
    @param vendorAccount Vendor address
  */
  function redeemFreeStableTokenVendors(uint256 stableTokenAmount, address vendorAccount)
    public
    whenNotPaused()
    transitionState()
    notInProtectionMode()
    isValidGasPrice()
  {
    /** UPDATE V0110: 24/09/2020 - Upgrade to support multiple commission rates **/
    (uint256 resTokensAmount, uint256 reserveTokenCommission, uint256 mocCommission, uint256 reserveTokenMarkup, uint256 mocMarkup) = mocExchange
      .redeemFreeStableToken(msg.sender, stableTokenAmount, vendorAccount);

    redeemWithCommission(msg.sender, reserveTokenCommission, mocCommission, vendorAccount, reserveTokenMarkup, mocMarkup, resTokensAmount);
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
  function isSettlementEnabled() public view returns (bool) {
    return settlement.isSettlementEnabled();
  }

  /**
    @dev Checks if bucket liquidation is reached.
    @param bucket Name of bucket.
    @return true if bucket liquidation is reached, false otherwise
  */
  function isBucketLiquidationReached(bytes32 bucket) public view returns (bool) {
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
  ) internal {
    // Need to update general State
    mocState.addToReserves(totalResTokensSpent);
    require(
      deposit(totalResTokensSpent.add(reserveTokenCommission).add(reserveTokenMarkup), sender),
      "Token deposit failed on RRC20 Reserve token transfer"
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
  function transferMocCommission(address sender, uint256 mocCommission, address vendorAccount, uint256 mocMarkup) internal {
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
  ) internal {
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

  modifier transitionState() {
    mocState.nextState();
    if (mocState.state() == IMoCState.States.Liquidated) {
      liquidate();
    } else _;
  }

  /**
   * @notice validate that the given gas price is less or equal to the gas price limit
   */
  modifier isValidGasPrice() {
    require(tx.gasprice <= maxGasPrice, "gas price is above the max allowed");
    _;
  }

  /**
   * @notice only executed by the pauser or an authorized changer
   *  The pauser is a multisig that could be used in some cases to speed up a
   *  change if it is necessary
   */
  modifier onlyAuthorizedChangerOrPauser() {
    require(stopper == msg.sender || governor.isAuthorizedChanger(msg.sender), "not authorized changer or stopper");
    _;
  }

  /**
   * @notice update the gas price limit
   * @param maxGasPrice_ new gas price limit
   */
  function setMaxGasPrice(uint256 maxGasPrice_) external onlyAuthorizedChangerOrPauser() {
    maxGasPrice = maxGasPrice_;
  }

  uint256 public maxGasPrice;

  ////////////////////
  // Flux Capacitor //
  ////////////////////

  /**
   * @notice update the max absolute operation allowed
   * @param maxAbsoluteOperation_ new max absolute operation allowed
   */
  function setMaxAbsoluteOperation(uint256 maxAbsoluteOperation_) external onlyAuthorizedChangerOrPauser() {
    mocExchange.setMaxAbsoluteOperation(maxAbsoluteOperation_);
  }

  /**
   * @notice update the max operational difference allowed
   * @param maxOperationalDifference_ new max operational difference allowed
   */
  function setMaxOperationalDifference(uint256 maxOperationalDifference_) external onlyAuthorizedChangerOrPauser() {
    mocExchange.setMaxOperationalDifference(maxOperationalDifference_);
  }

  /**
   * @notice update the decay block span
   * @param decayBlockSpan_ new decay block span
   */
  function setDecayBlockSpan(uint256 decayBlockSpan_) external onlyAuthorizedChangerOrPauser() {
    mocExchange.setDecayBlockSpan(decayBlockSpan_);
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[49] private __gap;
}
