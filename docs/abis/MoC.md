---
id: version-0.1.10-MoC
title: MoC
original_id: MoC
---

# MoC.sol

View Source: [contracts/MoC.sol](../../contracts/MoC.sol)

**↗ Extends: [MoCEvents](MoCEvents.md), [MoCReserve](MoCReserve.md), [MoCLibConnection](MoCLibConnection.md), [MoCBase](MoCBase.md), [Stoppable](Stoppable.md), [IMoC](IMoC.md)**

**MoC** - version: 0.1.10

## Contract Members
**Constants & Variables**

```js
address internal stableToken;
```
---

```js
contract RiskProToken internal riskProToken;
```
---

```js
contract MoCRiskProxManager internal riskProxManager;
```
---

```js
contract IMoCState internal mocState;
```
---

```js
address internal DEPRECATED_mocConverter;
```
---

```js
contract IMoCSettlement internal settlement;
```
---

```js
contract IMoCExchange internal mocExchange;
```
---

```js
contract IMoCInrate internal mocInrate;
```
---

```js
bool internal liquidationExecuted;
```
---

```js
address public DEPRECATED_mocBurnout;
```
---

```js
uint256[50] private upgradeGap;
```
---

## BucketLiquidation

**Parameters**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 |  | 

## ContractLiquidated

**Parameters**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| mocAddress | address |  | 

## Modifiers

- [whenSettlementReady](#whensettlementready)
- [atState](#atstate)
- [atLeastState](#atleaststate)
- [atMostState](#atmoststate)
- [notInProtectionMode](#notinprotectionmode)
- [bucketStateTransition](#bucketstatetransition)
- [availableBucket](#availablebucket)
- [notBaseBucket](#notbasebucket)
- [transitionState](#transitionstate)

### whenSettlementReady

```js
modifier whenSettlementReady() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### atState

```js
modifier atState(enum IMoCState.States _state) internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _state | enum IMoCState.States |  | 

### atLeastState

```js
modifier atLeastState(enum IMoCState.States _state) internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _state | enum IMoCState.States |  | 

### atMostState

```js
modifier atMostState(enum IMoCState.States _state) internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _state | enum IMoCState.States |  | 

### notInProtectionMode

```js
modifier notInProtectionMode() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### bucketStateTransition

```js
modifier bucketStateTransition(bytes32 bucket) internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 |  | 

### availableBucket

```js
modifier availableBucket(bytes32 bucket) internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 |  | 

### notBaseBucket

```js
modifier notBaseBucket(bytes32 bucket) internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 |  | 

### transitionState

```js
modifier transitionState() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

## Functions

- [initialize(address connectorAddress, address governorAddress, address stopperAddress, bool startStoppable)](#initialize)
- [riskProxBalanceOf(bytes32 bucket, address account)](#riskproxbalanceof)
- [getRedeemRequestAt(uint256 index)](#getredeemrequestat)
- [redeemQueueSize()](#redeemqueuesize)
- [stableTokenAmountToRedeem(address redeemer)](#stabletokenamounttoredeem)
- [redeemStableTokenRequest(uint256 stableTokenAmount)](#redeemstabletokenrequest)
- [alterRedeemRequestAmount(bool isAddition, uint256 delta)](#alterredeemrequestamount)
- [addReserves(uint256 tokenAmount)](#addreserves)
- [mintRiskPro(uint256 resTokensToMint)](#mintriskpro)
- [mintRiskProVendors(uint256 resTokensToMint, address vendorAccount)](#mintriskprovendors)
- [redeemRiskPro(uint256 riskProAmount)](#redeemriskpro)
- [redeemRiskProVendors(uint256 riskProAmount, address vendorAccount)](#redeemriskprovendors)
- [mintStableToken(uint256 resTokensToMint)](#mintstabletoken)
- [mintStableTokenVendors(uint256 resTokensToMint, address vendorAccount)](#mintstabletokenvendors)
- [redeemRiskProx(bytes32 bucket, uint256 riskProxAmount)](#redeemriskprox)
- [redeemRiskProxVendors(bytes32 bucket, uint256 riskProxAmount, address vendorAccount)](#redeemriskproxvendors)
- [mintRiskProx(bytes32 bucket, uint256 resTokensToMint)](#mintriskprox)
- [mintRiskProxVendors(bytes32 bucket, uint256 resTokensToMint, address vendorAccount)](#mintriskproxvendors)
- [redeemFreeStableToken(uint256 stableTokenAmount)](#redeemfreestabletoken)
- [redeemFreeStableTokenVendors(uint256 stableTokenAmount, address vendorAccount)](#redeemfreestabletokenvendors)
- [redeemAllStableToken()](#redeemallstabletoken)
- [dailyInratePayment()](#dailyinratepayment)
- [payRiskProHoldersInterestPayment()](#payriskproholdersinterestpayment)
- [calculateRiskProHoldersInterest()](#calculateriskproholdersinterest)
- [getRiskProInterestAddress()](#getriskprointerestaddress)
- [getRiskProRate()](#getriskprorate)
- [getRiskProInterestBlockSpan()](#getriskprointerestblockspan)
- [isDailyEnabled()](#isdailyenabled)
- [isRiskProInterestEnabled()](#isriskprointerestenabled)
- [isSettlementEnabled()](#issettlementenabled)
- [isBucketLiquidationReached(bytes32 bucket)](#isbucketliquidationreached)
- [evalBucketLiquidation(bytes32 bucket)](#evalbucketliquidation)
- [evalLiquidation()](#evalliquidation)
- [runSettlement(uint256 steps)](#runsettlement)
- [sendToAddress(address receiver, uint256 tokenAmount)](#sendtoaddress)
- [liquidate()](#liquidate)
- [transferCommissions(address sender, uint256 totalResTokensSpent, uint256 reserveTokenCommission, uint256 mocCommission, address vendorAccount, uint256 reserveTokenMarkup, uint256 mocMarkup)](#transfercommissions)
- [transferMocCommission(address sender, uint256 mocCommission, address vendorAccount, uint256 mocMarkup)](#transfermoccommission)
- [redeemWithCommission(address sender, uint256 reserveTokenCommission, uint256 mocCommission, address vendorAccount, uint256 reserveTokenMarkup, uint256 mocMarkup, uint256 reserveTokenAmount)](#redeemwithcommission)
- [transferReserveTokenCommission(address vendorAccount, uint256 reserveTokenCommission, uint256 reserveTokenMarkup)](#transferreservetokencommission)
- [safeWithdrawFromReserve(address receiver, uint256 tokenAmount)](#safewithdrawfromreserve)
- [safeWithdraw(address receiver, uint256 tokenAmount)](#safewithdraw)
- [safeDepositInReserve(address receiver, uint256 tokenAmount)](#safedepositinreserve)

### initialize

Initializes the contract

```js
function initialize(address connectorAddress, address governorAddress, address stopperAddress, bool startStoppable) public nonpayable initializer 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| connectorAddress | address | MoCConnector contract address | 
| governorAddress | address | Governor contract address | 
| stopperAddress | address | Stopper contract address | 
| startStoppable | bool | Indicates if the contract starts being unstoppable or not | 

### riskProxBalanceOf

Gets the RiskProx balance of an address

```js
function riskProxBalanceOf(bytes32 bucket, address account) public view
returns(uint256)
```

**Returns**

RiskProx balance of the address

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | Name of the bucket | 
| account | address | Address | 

### getRedeemRequestAt

Gets the RedeemRequest at the queue index position

```js
function getRedeemRequestAt(uint256 index) public view
returns(address, uint256)
```

**Returns**

redeemer's address and amount he submitted

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| index | uint256 | queue position to get | 

### redeemQueueSize

Returns current redeem queue size

```js
function redeemQueueSize() public view
returns(uint256)
```

**Returns**

redeem queue size

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### stableTokenAmountToRedeem

Returns the total amount of StableTokens in the redeem queue for redeemer

```js
function stableTokenAmountToRedeem(address redeemer) public view
returns(uint256)
```

**Returns**

total amount of Docs in the redeem queue for redeemer

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| redeemer | address | address for which ^ is computed | 

### redeemStableTokenRequest

Creates or updates the amount of a StableToken redeem Request from the msg.sender

```js
function redeemStableTokenRequest(uint256 stableTokenAmount) public nonpayable whenNotPaused whenSettlementReady 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| stableTokenAmount | uint256 | Amount of StableTokens to redeem on settlement [using mocPrecision] | 

### alterRedeemRequestAmount

Alters the redeem amount position for the redeemer

```js
function alterRedeemRequestAmount(bool isAddition, uint256 delta) public nonpayable whenNotPaused whenSettlementReady 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| isAddition | bool | true if adding amount to redeem, false to substract. | 
| delta | uint256 | the amount to add/substract to current position | 

### addReserves

⤾ overrides IMoC.addReserves

Adding tokens to the token reserve and C0 Bucket without minting any token.
Could revert.

```js
function addReserves(uint256 tokenAmount) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| tokenAmount | uint256 | Amount to deposit. | 

### mintRiskPro

Mints RiskPro and pays the comissions of the operation (retrocompatible function).

```js
function mintRiskPro(uint256 resTokensToMint) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| resTokensToMint | uint256 | Amount in ReserveToken to mint | 

### mintRiskProVendors

Mints RiskPro and pays the comissions of the operation.

```js
function mintRiskProVendors(uint256 resTokensToMint, address vendorAccount) public nonpayable whenNotPaused transitionState notInProtectionMode 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| resTokensToMint | uint256 | Amount Reserve Tokens to spend in minting | 
| vendorAccount | address | Vendor address | 

### redeemRiskPro

Redeems RiskPro Tokens and pays the comissions of the operation (retrocompatible function).

```js
function redeemRiskPro(uint256 riskProAmount) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| riskProAmount | uint256 | Amout in RiskPro | 

### redeemRiskProVendors

Redeems RiskPro Tokens and pays the comissions of the operation in ReserveTokens

```js
function redeemRiskProVendors(uint256 riskProAmount, address vendorAccount) public nonpayable whenNotPaused transitionState atLeastState 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| riskProAmount | uint256 | Amout in RiskPro | 
| vendorAccount | address | Vendor address | 

### mintStableToken

StableToken Doc tokens and pays the commisions of the operation (retrocompatible function).

```js
function mintStableToken(uint256 resTokensToMint) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| resTokensToMint | uint256 | Amount in ReserveToken to mint | 

### mintStableTokenVendors

Mint StableToken tokens and pays the commisions of the operation

```js
function mintStableTokenVendors(uint256 resTokensToMint, address vendorAccount) public nonpayable whenNotPaused transitionState atLeastState 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| resTokensToMint | uint256 | Amount in ReserveTokens to mint | 
| vendorAccount | address | Vendor address | 

### redeemRiskProx

Redeems RiskProx Tokens and pays the comissions of the operation in ReserveToken (retrocompatible function).

```js
function redeemRiskProx(bytes32 bucket, uint256 riskProxAmount) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | Bucket to reedem, for example X2 | 
| riskProxAmount | uint256 | Amount in RiskProx | 

### redeemRiskProxVendors

Redeems RiskProx Tokens and pays the comissions of the operation in ReserveTokens

```js
function redeemRiskProxVendors(bytes32 bucket, uint256 riskProxAmount, address vendorAccount) public nonpayable whenNotPaused whenSettlementReady availableBucket notBaseBucket transitionState bucketStateTransition 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | Bucket to reedem, for example X2 | 
| riskProxAmount | uint256 | Amount in RiskProx | 
| vendorAccount | address | Vendor address | 

### mintRiskProx

BUCKET riskProx riskProx (retrocompatible function).

```js
function mintRiskProx(bytes32 bucket, uint256 resTokensToMint) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | Name of the bucket used | 
| resTokensToMint | uint256 | amount to mint on ReserveToken | 

### mintRiskProxVendors

BUCKET riskProx minting

```js
function mintRiskProxVendors(bytes32 bucket, uint256 resTokensToMint, address vendorAccount) public nonpayable whenNotPaused whenSettlementReady availableBucket notBaseBucket transitionState bucketStateTransition 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | Name of the bucket used | 
| resTokensToMint | uint256 | amount to mint on ReserveToken | 
| vendorAccount | address | Vendor address | 

### redeemFreeStableToken

Redeems the requested amount for the msg.sender, or the max amount of free stableTokens possible (retrocompatible function).

```js
function redeemFreeStableToken(uint256 stableTokenAmount) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| stableTokenAmount | uint256 | Amount of StableTokens to redeem. | 

### redeemFreeStableTokenVendors

Redeems the requested amount for the msg.sender, or the max amount of free stableTokens possible.

```js
function redeemFreeStableTokenVendors(uint256 stableTokenAmount, address vendorAccount) public nonpayable whenNotPaused transitionState notInProtectionMode 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| stableTokenAmount | uint256 | Amount of StableTokens to redeem. | 
| vendorAccount | address | Vendor address | 

### redeemAllStableToken

Allow redeem on liquidation state, user StableTokens get burned and he receives
the equivalent ReserveTokens if can be covered, or the maximum available*

```js
function redeemAllStableToken() public nonpayable atState 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### dailyInratePayment

Moves the daily amount of interest rate to C0 bucket

```js
function dailyInratePayment() public nonpayable whenNotPaused 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### payRiskProHoldersInterestPayment

Pays the RiskPro interest and transfers it to the address mocInrate.riskProInterestAddress
RiskPro interests = Nb (bucket 0) * riskProRate.

```js
function payRiskProHoldersInterestPayment() public nonpayable whenNotPaused 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### calculateRiskProHoldersInterest

Calculates RiskPro holders holder interest by taking the total amount of RBCs available on Bucket 0.
RiskPro interests = Nb (bucket 0) * riskProRate.

```js
function calculateRiskProHoldersInterest() public view
returns(uint256, uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getRiskProInterestAddress

Gets the target address to transfer RiskPro Holders rate

```js
function getRiskProInterestAddress() public view
returns(address)
```

**Returns**

Target address to transfer RiskPro Holders interest

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getRiskProRate

Gets the rate for RiskPro Holders

```js
function getRiskProRate() public view
returns(uint256)
```

**Returns**

RiskPro Rate

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getRiskProInterestBlockSpan

Gets the blockspan of RiskPro that represents the frecuency of RiskPro holders interest payment

```js
function getRiskProInterestBlockSpan() public view
returns(uint256)
```

**Returns**

returns power of bitProInterestBlockSpan

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### isDailyEnabled

```js
function isDailyEnabled() public view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### isRiskProInterestEnabled

```js
function isRiskProInterestEnabled() public view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### isSettlementEnabled

Indicates if settlement is enabled

```js
function isSettlementEnabled() public view
returns(bool)
```

**Returns**

Returns true if blockSpan number of blocks has passed since last execution; otherwise false

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### isBucketLiquidationReached

Checks if bucket liquidation is reached.

```js
function isBucketLiquidationReached(bytes32 bucket) public view
returns(bool)
```

**Returns**

true if bucket liquidation is reached, false otherwise

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | Name of bucket. | 

### evalBucketLiquidation

```js
function evalBucketLiquidation(bytes32 bucket) public nonpayable availableBucket notBaseBucket whenSettlementReady 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 |  | 

### evalLiquidation

Evaluates if liquidation state has been reached and runs liq if that's the case

```js
function evalLiquidation() public nonpayable transitionState 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### runSettlement

Runs all settlement process

```js
function runSettlement(uint256 steps) public nonpayable whenNotPaused transitionState 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| steps | uint256 | Number of steps | 

### sendToAddress

⤾ overrides IMoC.sendToAddress

Public function to extract and send tokens from the reserve. Will return false if transfer reverts or fails.

```js
function sendToAddress(address receiver, uint256 tokenAmount) public nonpayable onlyWhitelisted 
returns(bool)
```

**Returns**

False if RRC20 transfer fails or revert and true if succeeds*

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| receiver | address | Account to which the tokens will be send | 
| tokenAmount | uint256 | Amount of tokens to send | 

### liquidate

```js
function liquidate() internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### transferCommissions

Transfer mint operation fees (commissions + vendor markup)

```js
function transferCommissions(address sender, uint256 totalResTokensSpent, uint256 reserveTokenCommission, uint256 mocCommission, address vendorAccount, uint256 reserveTokenMarkup, uint256 mocMarkup) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| sender | address | address of msg.sender | 
| totalResTokensSpent | uint256 | amount in ReserveToken spent | 
| reserveTokenCommission | uint256 | commission amount in ReserveToken | 
| mocCommission | uint256 | commission amount in MoC | 
| vendorAccount | address | address of vendor | 
| reserveTokenMarkup | uint256 | vendor markup in ReserveToken | 
| mocMarkup | uint256 | vendor markup in MoC | 

### transferMocCommission

Transfer operation fees in MoC (commissions + vendor markup)

```js
function transferMocCommission(address sender, uint256 mocCommission, address vendorAccount, uint256 mocMarkup) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| sender | address | address of msg.sender | 
| mocCommission | uint256 | commission amount in MoC | 
| vendorAccount | address | address of vendor | 
| mocMarkup | uint256 | vendor markup in MoC | 

### redeemWithCommission

Transfer redeem operation fees (commissions + vendor markup)

```js
function redeemWithCommission(address sender, uint256 reserveTokenCommission, uint256 mocCommission, address vendorAccount, uint256 reserveTokenMarkup, uint256 mocMarkup, uint256 reserveTokenAmount) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| sender | address | address of msg.sender | 
| reserveTokenCommission | uint256 | commission amount in ReserveToken | 
| mocCommission | uint256 | commission amount in MoC | 
| vendorAccount | address | address of vendor | 
| reserveTokenMarkup | uint256 | vendor markup in ReserveToken | 
| mocMarkup | uint256 | vendor markup in MoC | 
| reserveTokenAmount | uint256 |  | 

### transferReserveTokenCommission

Transfer operation fees in ReserveToken (commissions + vendor markup)

```js
function transferReserveTokenCommission(address vendorAccount, uint256 reserveTokenCommission, uint256 reserveTokenMarkup) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| vendorAccount | address | address of vendor | 
| reserveTokenCommission | uint256 | commission amount in ReserveToken | 
| reserveTokenMarkup | uint256 | vendor markup in ReserveToken | 

### safeWithdrawFromReserve

Extracts tokens from the reserve and update mocState but reverts if token transfer fails

```js
function safeWithdrawFromReserve(address receiver, uint256 tokenAmount) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| receiver | address | Account to which the tokens will be send | 
| tokenAmount | uint256 | Amount to extract from reserve | 

### safeWithdraw

Extracts tokens from the reserve

```js
function safeWithdraw(address receiver, uint256 tokenAmount) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| receiver | address | Account from which the tokens will be taken | 
| tokenAmount | uint256 | Amount to deposit | 

### safeDepositInReserve

Extracts tokens from the reserve and update mocState

```js
function safeDepositInReserve(address receiver, uint256 tokenAmount) private nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| receiver | address | Account from which the tokens will be taken | 
| tokenAmount | uint256 | Amount to deposit | 

