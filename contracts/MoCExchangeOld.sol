pragma solidity ^0.5.8;
pragma experimental ABIEncoderV2;

import "./MoCLibConnection.sol";
import "./token/RiskProToken.sol";
import "./token/StableToken.sol";
import "./interface/IMoCInrate.sol";
import "./base/MoCBase.sol";
import "./token/MoCToken.sol";
import "./MoCRiskProxManager.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";
import "./interface/IMoC.sol";
import "./interface/IMoCExchange.sol";
import "./interface/IMoCState.sol";

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


contract MoCExchangeOld is MoCExchangeEvents, MoCBase, MoCLibConnection {
  using Math for uint256;
  using SafeMath for uint256;

  // Contracts
  IMoCState internal mocState;
  /** DEPRECATED **/
  // solium-disable-next-line mixedcase
  address internal DEPRECATED_mocConverter;
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
    ret.reserveTokenPrice = mocState.getReserveTokenPrice();
    ret.mocPrice = mocState.getMoCPrice();
    require(ret.reserveTokenPrice > 0, "Reserve Token price zero");
    require(ret.mocPrice > 0, "MoC price zero");
    // Calculate vendor markup
    uint256 reserveTokenMarkup = mocInrate.calculateVendorMarkup(params.vendorAccount, params.amount);

    // Get balance and allowance from sender
    (uint256 mocBalance, uint256 mocAllowance) = getMoCTokenBalance(params.account, address(moc));
    if (mocAllowance == 0 || mocBalance == 0) {
      // Check commission rate in Reserve Token according to transaction type
      ret.reserveTokenCommission = mocInrate.calcCommissionValue(params.amount, params.txTypeFeesReserveToken);
      ret.reserveTokenMarkup = reserveTokenMarkup;
      // Implicitly mocCommission = 0 and mocMarkup = 0.
      return ret;
    }

    // Check commission rate in MoC according to transaction type
    uint256 mocCommissionInReserveToken = mocInrate.calcCommissionValue(params.amount, params.txTypeFeesMOC);

    // Calculate amount in MoC
    ret.mocCommission = ret.reserveTokenPrice.mul(mocCommissionInReserveToken).div(ret.mocPrice);
    // Implicitly reserveTokenCommission = 0

    // Calculate vendor markup
    ret.mocMarkup = ret.reserveTokenPrice.mul(reserveTokenMarkup).div(ret.mocPrice);
    // Implicitly reserveTokenMarkup = 0

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

  /**
  * @dev Reserve token equivalent for the amount of riskPro given applying the spotDiscountRate
  * @param riskProAmount amount of RiskPro [using mocPrecision]
  * @param riskProTecPrice price of RiskPro without discounts [using mocPrecision]
  * @param riskProDiscountRate RiskPro discounts [using mocPrecision]
  * @return Reserve token amount
  */
  function riskProDiscToResToken(uint256 riskProAmount, uint256 riskProTecPrice, uint256 riskProDiscountRate) internal view returns(uint256) {
    uint256 totalResTokenValue = mocLibConfig.totalRiskProInResTokens(riskProAmount, riskProTecPrice);
    return mocLibConfig.applyDiscountRate(totalResTokenValue, riskProDiscountRate);
  }

  /** END UPDATE V0110: 24/09/2020 **/

  /**
   @dev Mint RiskPros and give it to the msg.sender
   @param account Address of minter
   @param reserveTokenAmount Amount in ReserveToken to mint
   @param vendorAccount Vendor address
  */
  function mintRiskPro(address account, uint256 reserveTokenAmount, address vendorAccount)
    external
    onlyWhitelisted(msg.sender)
    returns (uint256, uint256, uint256, uint256, uint256)
  {
    RiskProMintStruct memory details;

    details.riskProRegularPrice = mocState.riskProTecPrice();
    details.finalRiskProAmount = 0;
    details.reserveTokenValue = 0;

    if (mocState.state() == IMoCState.States.RiskProDiscount) {
      details.discountPrice = mocState.riskProDiscountPrice();
      details.riskProDiscountAmount = mocLibConfig.maxRiskProWithResTokens(reserveTokenAmount, details.discountPrice);

      details.finalRiskProAmount = Math.min(
        details.riskProDiscountAmount,
        mocState.maxRiskProWithDiscount()
      );
      details.reserveTokenValue = details.finalRiskProAmount == details.riskProDiscountAmount
        ? reserveTokenAmount
        : riskProDiscToResToken(
          details.finalRiskProAmount,
          details.riskProRegularPrice,
          mocState.riskProSpotDiscountRate()
        );

      emit RiskProWithDiscountMint(
        details.riskProRegularPrice,
        details.discountPrice,
        details.finalRiskProAmount
      );
    }

    if (reserveTokenAmount != details.reserveTokenValue) {
      details.regularRiskProAmount = mocLibConfig.maxRiskProWithResTokens(
        reserveTokenAmount.sub(details.reserveTokenValue),
        details.riskProRegularPrice
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
    uint256 totalReserveToken = mocLibConfig.totalRiskProInResTokens(details.riskProFinalAmount, mocState.riskProTecPrice());

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
      uint256 stableTokensReserveTokenValue = mocState.stableTokensToResToken(details.finalStableTokenAmount);

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
      uint256 resTokenPrice = mocState.getReserveTokenPrice();
      details.stableTokens = mocLibConfig.maxStableTokensWithResTokens(resTokensToMint, resTokenPrice); //reserve token to stable token
      details.stableTokenAmount = Math.min(details.stableTokens, mocState.absoluteMaxStableToken());
      details.totalCost = details.stableTokenAmount == details.stableTokens
        ? resTokensToMint
        : mocLibConfig.stableTokensResTokensValue(details.stableTokenAmount, mocState.peg(), resTokenPrice);

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

    details.totalReserveToken = mocLibConfig.stableTokensResTokensValue(amount, mocState.peg(), reservePrice); // stable token to reserve token

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
    uint256 totalResTokens = mocLibConfig.stableTokensResTokensValue(
      userStableTokenBalance,
      mocState.peg(),
      liqPrice
    ); //stable tokens to reserve tokens
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

      details.riskProxToMint = mocState.resTokenToRiskProx(details.finalReserveTokenToMint, bucket);

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
    details.riskProxPrice = mocState.bucketRiskProTecPrice(bucket);
    // Calculate leverage before the redeem
    details.bucketLev = mocState.leverage(bucket);
    // Get redeemable value
    details.riskProxToRedeem = Math.min(riskProxAmount, riskProxManager.riskProxBalanceOf(bucket, account));
    details.resTokenToRedeem = mocLibConfig.riskProResTokensValuet(details.riskProxToRedeem, details.riskProxPrice);
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
      details.riskProxPrice
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
    uint256 totalAmount = mocLibConfig.riskProResTokensValuet(
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
    riskProToken.mint(account, details.finalRiskProAmount);
    riskProxManager.addValuesToBucket(BUCKET_C0, reserveTokenAmount, 0, details.finalRiskProAmount);

    emit RiskProMint(
      account,
      details.finalRiskProAmount,
      reserveTokenAmount,
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
    uint256 stableTokensToMove = mocState.resTokenToStableToken(resTokensToMove);

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
    uint256 riskProxPrice;
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
