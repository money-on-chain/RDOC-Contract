pragma solidity 0.5.8;

import "./MoCLibConnection.sol";
import "./token/RiskProToken.sol";
import "./token/StableToken.sol";
import "./MoCInrate.sol";
import "./base/MoCBase.sol";
import "./MoC.sol";

contract MoCExchangeEvents {
  event RiskProMint(address indexed account, uint256 amount, uint256 reserveTotal, uint256 commission, uint256 reservePrice);
  event RiskProWithDiscountMint(uint256 riskProTecPrice, uint256 riskProDiscountPrice, uint256 amount);
  event RiskProRedeem(address indexed account, uint256 amount, uint256 reserveTotal, uint256 commission, uint256 reservePrice);
  event StableTokenMint(address indexed account, uint256 amount, uint256 reserveTotal, uint256 commission, uint256 reservePrice);
  event StableTokenRedeem(address indexed account, uint256 amount, uint256 reserveTotal, uint256 commission, uint256 reservePrice);
  event FreeStableTokenRedeem(
    address indexed account,
    uint256 amount,
    uint256 reserveTotal,
    uint256 commission,
    uint256 interests,
    uint256 reservePrice
  );

  event RiskProxMint(
    bytes32 bucket,
    address indexed account,
    uint256 amount,
    uint256 reserveTotal,
    uint256 interests,
    uint256 leverage,
    uint256 commission,
    uint256 reservePrice
  );

  event RiskProxRedeem(
    bytes32 bucket,
    address indexed account,
    uint256 commission,
    uint256 amount,
    uint256 reserveTotal,
    uint256 interests,
    uint256 leverage,
    uint256 reservePrice
  );
}

contract MoCExchange is MoCExchangeEvents, MoCBase, MoCLibConnection  {
  using Math for uint256;
  using SafeMath for uint256;

  // Contracts
  MoCState internal mocState;
  MoCConverter internal mocConverter;
  MoCRiskProxManager internal riskProxManager;
  RiskProToken internal riskProToken;
  StableToken internal stableToken;
  MoCInrate internal mocInrate;
  MoC internal moc;

  function initialize(
    address connectorAddress
  ) public initializer {
    initializePrecisions();
    initializeBase(connectorAddress);
    initializeContracts();
  }

  /**
  * @dev Mint RiskPros and give it to the msg.sender
  */
  // solium-disable-next-line security/no-assign-params
  function mintRiskPro(address account, uint256 reserveTokenAmount) public onlyWhitelisted(msg.sender) returns(uint256, uint256) {
    uint256 riskProRegularPrice = mocState.riskProTecPrice();
    uint256 finalRiskProAmount = 0;
    uint256 reserveTokenValue = 0;

    if (mocState.state() == MoCState.States.RiskProDiscount)
    {
      uint256 discountPrice = mocState.riskProDiscountPrice();
      uint256 riskProDiscountAmount = mocConverter.resTokenToRiskProDisc(reserveTokenAmount);

      finalRiskProAmount = Math.min(riskProDiscountAmount, mocState.maxRiskProWithDiscount());
      reserveTokenValue = finalRiskProAmount == riskProDiscountAmount ? reserveTokenAmount : mocConverter.riskProDiscToResToken(finalRiskProAmount);

      emit RiskProWithDiscountMint(riskProRegularPrice, discountPrice, finalRiskProAmount);
    }

    if (reserveTokenAmount != reserveTokenValue)
    {
      uint256 regularRiskProAmount = mocConverter.resTokenToRiskPro(reserveTokenAmount.sub(reserveTokenValue));
      finalRiskProAmount = finalRiskProAmount.add(regularRiskProAmount);
    }

    // START RiskPro Limit
    // Only enter with no discount state
    if (mocState.state() != MoCState.States.RiskProDiscount)
    {
      uint256 availableRiskPro = Math.min(finalRiskProAmount, mocState.maxMintRiskProAvalaible());
      if (availableRiskPro != finalRiskProAmount) {
        reserveTokenAmount = mocConverter.riskProToResToken(availableRiskPro);
        finalRiskProAmount = availableRiskPro;

        if (reserveTokenAmount <= 0) {
          return (0, 0);
        }
      }
    }
    // END RiskPro Limit

    uint256 commissionPaid = mocInrate.calcCommissionValue(reserveTokenAmount);

    mintRiskPro(account, commissionPaid, finalRiskProAmount, reserveTokenAmount);

    return (reserveTokenAmount, commissionPaid);
  }

  /**
  * @dev Sender burns his RiskProS and redeems the equivalent ReserveTokens
  * @param riskProAmount Amount of RiskPros to be redeemed
  * @return resTokens to transfer to the redeemer and commission spent, using [using reservePrecision]
  **/
  function redeemRiskPro(address account, uint256 riskProAmount) public onlyWhitelisted(msg.sender) returns(uint256, uint256) {
    uint256 userBalance = riskProToken.balanceOf(account);
    uint256 userAmount = Math.min(riskProAmount, userBalance);

    uint256 riskProFinalAmount = Math.min(userAmount, mocState.absoluteMaxRiskPro());
    uint256 totalReserveToken = mocConverter.riskProToResToken(riskProFinalAmount);

    uint256 commission = mocInrate.calcCommissionValue(totalReserveToken);

    // Mint token
    riskProToken.burn(account, riskProFinalAmount);

    // Update Buckets
    riskProxManager.substractValuesFromBucket(BUCKET_C0, totalReserveToken, 0, riskProFinalAmount);

    uint256 totalWithoutCommission = totalReserveToken.sub(commission);

    emit RiskProRedeem(account, riskProFinalAmount, totalWithoutCommission, commission, mocState.getReserveTokenPrice());

    return (totalWithoutCommission, commission);
  }

  /**
  * @dev Redeems the requested amount for the account, or the max amount of free stableTokens possible.
  * @param account Address of the redeeemer
  * @param stableTokenAmount Amount of StableTokens to redeem [using mocPrecision]
  * @return resTokens to transfer to the redeemer and commission spent, using [using reservePrecision]
  */
  function redeemFreeStableToken(address account, uint256 stableTokenAmount) public onlyWhitelisted(msg.sender) returns(uint256, uint256) {
    if (stableTokenAmount <= 0) {
      return (0, 0);
    } else {
      uint256 finalStableTokenAmount = Math.min(stableTokenAmount, Math.min(mocState.freeStableToken(), stableToken.balanceOf(account)));
      uint256 stableTokensReserveTokenValue = mocConverter.stableTokensToResToken(finalStableTokenAmount);

      uint256 interestAmount = mocInrate.calcStableTokenRedInterestValues(finalStableTokenAmount, stableTokensReserveTokenValue);
      uint256 finalReserveTokenAmount = stableTokensReserveTokenValue.sub(interestAmount);
      uint256 commission = mocInrate.calcCommissionValue(finalReserveTokenAmount);

      doStableTokenRedeem(account, finalStableTokenAmount, stableTokensReserveTokenValue);
      riskProxManager.payInrate(BUCKET_C0, interestAmount);

      emit FreeStableTokenRedeem(account, finalStableTokenAmount, finalReserveTokenAmount, commission, interestAmount, mocState.getReserveTokenPrice());

      return (finalReserveTokenAmount.sub(commission), commission);
    }
  }

    /**
  * @dev Mint Max amount of StableTokens and give it to the msg.sender
  * @param account minter user address
  * @param resTokensToMint resTokens amount the user intents to convert to StableToken [using rbtPresicion]
  * @return the actual amount of resTokens used and the resTokens commission for them [using rbtPresicion]
  */
  function mintStableToken(address account, uint256 resTokensToMint) public onlyWhitelisted(msg.sender) returns(uint256, uint256) {
    // StableTokens to issue with tx value amount
    if (resTokensToMint > 0) {
      uint256 stableTokens = mocConverter.resTokenToStableToken(resTokensToMint);
      uint256 stableTokenAmount = Math.min(stableTokens, mocState.absoluteMaxStableToken());
      uint256 totalCost = stableTokenAmount == stableTokens ? resTokensToMint : mocConverter.stableTokensToResToken(stableTokenAmount);

      // Mint Token
      stableToken.mint(account, stableTokenAmount);

      // Update Buckets
      riskProxManager.addValuesToBucket(BUCKET_C0, totalCost, stableTokenAmount, 0);

      uint256 commission = mocInrate.calcCommissionValue(totalCost);

      emit StableTokenMint(account, stableTokenAmount, totalCost, commission, mocState.getReserveTokenPrice());

      return (totalCost, commission);
    }

    return (0, 0);
  }

  /**
  * @dev User StableTokens get burned and he receives the equivalent ReserveTokens in return
  * @param userAddress Address of the user asking to redeem
  * @param amount Verified amount of StableTokens to be redeemed [using mocPrecision]
  * @param reservePrice resToken price [using mocPrecision]
  * @return true and commission spent if resTokens send was completed, false if fails.
  **/
  function redeemStableTokenWithPrice(address payable userAddress, uint256 amount, uint256 reservePrice)
  public onlyWhitelisted(msg.sender) returns(bool, uint256){
    uint256 totalReserveToken = mocConverter.stableTokensToResTokenWithPrice(amount, reservePrice);

    uint256 commissionSpent = mocInrate.calcCommissionValue(totalReserveToken);
    uint256 reserveTokenToRedeem = totalReserveToken.sub(commissionSpent);

    bool result = moc.sendToAddress(userAddress, reserveTokenToRedeem);

    // If sends fail, then no redemption is executed
    if (result) {
      doStableTokenRedeem(userAddress, amount, totalReserveToken);
      emit StableTokenRedeem(userAddress, amount, totalReserveToken.sub(commissionSpent), commissionSpent, reservePrice);
    }

    return (result, commissionSpent);
  }

  /**
  * @dev Allow redeem on liquidation state, user StableTokens get burned and he receives
  * the equivalent ReserveTokens according to liquidationPrice
  * @param origin address owner of the StableTokens
  * @param destination address to send the ReserveTokens
  * @return The amount of ReserveTokens in sent for the redemption or 0 if send does not succed
  **/
  function redeemAllStableToken(address origin, address payable destination) public onlyWhitelisted(msg.sender) returns(uint256) {
    uint256 userStableTokenBalance = stableToken.balanceOf(origin);
    if (userStableTokenBalance == 0)
      return 0;

    uint256 liqPrice = mocState.getLiquidationPrice();
    // [USD * ReserveTokens / USD]
    uint256 totalResTokens = mocConverter.stableTokensToResTokenWithPrice(userStableTokenBalance, liqPrice);

    // If send fails we don't burn the tokens
    if (moc.sendToAddress(destination, totalResTokens)) {
      stableToken.burn(origin, userStableTokenBalance);
      emit StableTokenRedeem(origin, userStableTokenBalance, totalResTokens, 0, liqPrice);

      return totalResTokens;
    }
    else
    {
      return 0;
    }
  }


  /**
    @dev  Mint the amount of RiskPros
    @param account Address that will owned the RiskPros
    @param riskProAmount Amount of RiskPros to mint [using mocPrecision]
    @param resTokenValue ReserveTokens cost of the [using reservePrecision]
  */
  function mintRiskPro(address account, uint256 commission, uint256 riskProAmount, uint256 resTokenValue) public onlyWhitelisted(msg.sender) {
    riskProToken.mint(account, riskProAmount);
    riskProxManager.addValuesToBucket(BUCKET_C0, resTokenValue, 0, riskProAmount);

    emit RiskProMint(account, riskProAmount, resTokenValue, commission, mocState.getReserveTokenPrice());
  }

  /**
  * @dev BUCKET RiskProx minting. Mints RiskProx for the specified bucket
  * @param account owner of the new minted RiskProx
  * @param bucket bucket name
  * @param resTokensToMint resToken amount to mint [using reservePrecision]
  * @return total ReserveTokens Spent (resTokensToMint more interest) and commission spent [using reservePrecision]
  **/
  function mintRiskProx(address payable account, bytes32 bucket, uint256 resTokensToMint
  ) public onlyWhitelisted(msg.sender) returns(uint256, uint256) {
    if (resTokensToMint > 0){
      uint256 lev = mocState.leverage(bucket);

      uint256 finalReserveTokenToMint = Math.min(resTokensToMint, mocState.maxRiskProxResTokenValue(bucket));

      // Get interest and the adjusted RiskProAmount
      uint256 interestAmount = mocInrate.calcMintInterestValues(bucket, finalReserveTokenToMint);

      // pay interest
      riskProxManager.payInrate(BUCKET_C0, interestAmount);

      uint256 riskProxToMint = mocConverter.resTokenToRiskProx(finalReserveTokenToMint, bucket);

      riskProxManager.assignRiskProx(bucket, account, riskProxToMint, finalReserveTokenToMint);
      moveExtraFundsToBucket(BUCKET_C0, bucket, finalReserveTokenToMint, lev);

      // Calculate leverage after mint
      lev = mocState.leverage(bucket);

      uint256 commission = mocInrate.calcCommissionValue(finalReserveTokenToMint);

      emit RiskProxMint(
        bucket, account, riskProxToMint, finalReserveTokenToMint,
        interestAmount, lev, commission, mocState.getReserveTokenPrice()
      );

      return (finalReserveTokenToMint.add(interestAmount), commission);
    }

    return (0, 0);
  }

  /**
  * @dev Sender burns his RiskProx, redeems the equivalent amount of RiskPros, return
  * the "borrowed" StableTokens and recover pending interests
  * @param account user address to redeem riskProx from
  * @param bucket Bucket where the RiskProxs are hold
  * @param riskProxAmount Amount of RiskProxs to be redeemed [using reservePrecision]
  * @return the actual amount of resTokens to redeem and the resTokens commission for them [using reservePresicion]
  **/
  function redeemRiskProx(address payable account, bytes32 bucket, uint256 riskProxAmount
  ) public onlyWhitelisted(msg.sender) returns (uint256, uint256) {
    // Revert could cause not evaluating state changing
    if (riskProxManager.riskProxBalanceOf(bucket, account) == 0) {
      return (0, 0);
    }

    // Calculate leverage before the redeem
    uint256 bucketLev = mocState.leverage(bucket);
    // Get redeemable value
    uint256 userBalance = riskProxManager.riskProxBalanceOf(bucket, account);
    uint256 riskProxToRedeem = Math.min(riskProxAmount, userBalance);
    uint256 resTokenToRedeem = mocConverter.riskProxToResToken(riskProxToRedeem, bucket);
    // //Pay interests
    uint256 resTokenInterests = recoverInterests(bucket, resTokenToRedeem);

    // Burn RiskProx
    burnRiskProxFor(
      bucket,
      account,
      riskProxToRedeem,
      mocState.bucketRiskProTecPrice(bucket)
    );

    if (riskProxManager.getBucketNRiskPro(bucket) == 0) {
      // If there is no RiskProx left, empty bucket for rounding remnant
      riskProxManager.emptyBucket(bucket, BUCKET_C0);
    } else {
      // Move extra value from L bucket to C0
      moveExtraFundsToBucket(bucket, BUCKET_C0, resTokenToRedeem, bucketLev);
    }

    uint256 commission = mocInrate.calcCommissionValue(resTokenToRedeem);

    uint256 totalWithoutCommission = resTokenToRedeem.sub(commission);

    emit RiskProxRedeem(
      bucket,
      account,
      commission,
      riskProxAmount,
      totalWithoutCommission,
      resTokenInterests,
      bucketLev,
      mocState.getReserveTokenPrice()
    );

    return (totalWithoutCommission.add(resTokenInterests), commission);
  }

  /**
    @dev Burns user RiskProx and sends the equivalent amount of ReserveTokens
    to the account without caring if transaction succeeds
    @param bucket Bucket where the RiskProxs are hold
    @param account user address to redeem riskProx from
    @param riskProxAmount Amount of RiskProx to redeem [using mocPrecision]
    @param riskProxPrice Price of one RiskProx in ReserveTokens [using reservePrecision]
    @return result of the ReserveTokens sending transaction
  **/
  function forceRedeemRiskProx(bytes32 bucket, address payable account, uint256 riskProxAmount, uint256 riskProxPrice
  ) public onlyWhitelisted(msg.sender) returns(bool) {
    // Do burning part of the redemption
    uint256 totalAmount = burnRiskProxFor(bucket, account, riskProxAmount, riskProxPrice);

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
  function burnRiskProxFor(bytes32 bucket, address payable account, uint256 riskProxAmount, uint256 riskProxPrice
  ) public onlyWhitelisted(msg.sender) returns(uint256) {
    // Calculate total ReserveTokens
    uint256 totalAmount = mocConverter.riskProToResTokenWithPrice(riskProxAmount, riskProxPrice);
    riskProxManager.removeRiskProx(bucket, account, riskProxAmount, totalAmount);

    return totalAmount;
  }

  /**
    @dev Calculates the amount of ReserveTokens that one bucket should move to another in
    RiskProx minting/redemption. This extra makes RiskProx more leveraging than RiskPro.
    @param bucketFrom Origin bucket from which the ReserveTokens are moving
    @param bucketTo Destination bucket to which the ReserveTokens are moving
    @param totalReserveToken Amount of ReserveTokens moving between buckets [using reservePrecision]
    @param lev lev of the L bucket [using mocPrecision]
  **/
  function moveExtraFundsToBucket(bytes32 bucketFrom, bytes32 bucketTo, uint256 totalReserveToken, uint256 lev
  ) internal {
    uint256 resTokensToMove = mocLibConfig.bucketTransferAmount(totalReserveToken, lev);
    uint256 stableTokensToMove = mocConverter.resTokenToStableToken(resTokensToMove);

    uint256 resTokensToMoveFinal = Math.min(resTokensToMove, riskProxManager.getBucketNReserve(bucketFrom));
    uint256 stableTokensToMoveFinal = Math.min(stableTokensToMove, riskProxManager.getBucketNStableToken(bucketFrom));

    riskProxManager.moveResTokensAndStableTokens(bucketFrom, bucketTo, resTokensToMoveFinal, stableTokensToMoveFinal);
  }

  /**
  * @dev Returns ReserveTokens for user in concept of interests refund
  * @param bucket Bucket where the RiskProxs are hold
  * @param resTokenToRedeem Total ReserveTokens value of the redemption [using mocPrecision]
  * @return Interests [using reservePrecision]
  **/
  function recoverInterests(bytes32 bucket, uint256 resTokenToRedeem) internal returns(uint256) {
    uint256 resTokenInterests = mocInrate.calcFinalRedeemInterestValue(bucket, resTokenToRedeem);

    return riskProxManager.recoverInrate(BUCKET_C0, resTokenInterests);
  }

  function doStableTokenRedeem(address userAddress, uint256 stableTokenAmount, uint256 totalReserveToken) internal {
    stableToken.burn(userAddress, stableTokenAmount);
    riskProxManager.substractValuesFromBucket(BUCKET_C0, totalReserveToken, stableTokenAmount, 0);
  }

  function initializeContracts() internal {
    moc = MoC(connector.moc());
    stableToken = StableToken(connector.stableToken());
    riskProToken = RiskProToken(connector.riskProToken());
    riskProxManager = MoCRiskProxManager(connector.riskProxManager());
    mocState = MoCState(connector.mocState());
    mocConverter = MoCConverter(connector.mocConverter());
    mocInrate = MoCInrate(connector.mocInrate());
  }

  // Leave a gap betweeen inherited contracts variables in order to be
  // able to add more variables in them later
  uint256[50] private upgradeGap;
}
