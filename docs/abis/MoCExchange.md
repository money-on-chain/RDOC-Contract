---
id: version-0.1.10-MoCExchange
title: MoCExchange
original_id: MoCExchange
---

# MoCExchange.sol

View Source: [contracts/MoCExchange.sol](../../contracts/MoCExchange.sol)

**↗ Extends: [MoCExchangeEvents](MoCExchangeEvents.md), [MoCBase](MoCBase.md), [MoCLibConnection](MoCLibConnection.md)**

**MoCExchange** - version: 0.1.10

## Structs
### RiskProxRedeemStruct

```js
struct RiskProxRedeemStruct {
 uint256 totalReserveTokenRedeemed,
 uint256 reserveTokenTotalWithoutCommission,
 uint256 resTokenInterests,
 uint256 bucketLev,
 uint256 riskProxToRedeem,
 uint256 resTokenToRedeem,
 uint256 riskProxPrice,
 struct MoCExchange.CommissionReturnStruct commission
}
```

### RiskProxMintStruct

```js
struct RiskProxMintStruct {
 uint256 riskProxToMint,
 uint256 finalReserveTokenToMint,
 uint256 reserveTokenInterestAmount,
 uint256 lev,
 struct MoCExchange.CommissionReturnStruct commission
}
```

### RiskProRedeemStruct

```js
struct RiskProRedeemStruct {
 uint256 riskProFinalAmount,
 uint256 reserveTokenTotalWithoutCommission,
 struct MoCExchange.CommissionReturnStruct commission
}
```

### FreeStableTokenRedeemStruct

```js
struct FreeStableTokenRedeemStruct {
 uint256 finalStableTokenAmount,
 uint256 finalReserveTokenAmount,
 uint256 reserveTokenInterestAmount,
 struct MoCExchange.CommissionReturnStruct commission
}
```

### RiskProMintStruct

```js
struct RiskProMintStruct {
 uint256 riskProRegularPrice,
 uint256 reserveTokenValue,
 uint256 discountPrice,
 uint256 riskProDiscountAmount,
 uint256 regularRiskProAmount,
 uint256 availableRiskPro,
 uint256 finalRiskProAmount,
 struct MoCExchange.CommissionReturnStruct commission
}
```

### StableTokenMintStruct

```js
struct StableTokenMintStruct {
 uint256 stableTokens,
 uint256 stableTokenAmount,
 uint256 totalCost,
 struct MoCExchange.CommissionReturnStruct commission
}
```

### CommissionParamsStruct

```js
struct CommissionParamsStruct {
 address account,
 uint256 amount,
 uint8 txTypeFeesMOC,
 uint8 txTypeFeesReserveToken,
 address vendorAccount
}
```

### CommissionReturnStruct

```js
struct CommissionReturnStruct {
 uint256 reserveTokenCommission,
 uint256 mocCommission,
 uint256 reserveTokenPrice,
 uint256 mocPrice,
 uint256 reserveTokenMarkup,
 uint256 mocMarkup
}
```

### StableTokenRedeemStruct

```js
struct StableTokenRedeemStruct {
 uint256 reserveTotal,
 uint256 reserveTokenToRedeem,
 uint256 totalReserveToken,
 struct MoCExchange.CommissionReturnStruct commission
}
```

## Contract Members
**Constants & Variables**

```js
//internal members
contract IMoCState internal mocState;
address internal DEPRECATED_mocConverter;
contract MoCRiskProxManager internal riskProxManager;
contract RiskProToken internal riskProToken;
contract StableToken internal stableToken;
contract IMoCInrate internal mocInrate;
contract IMoC internal moc;

//private members
uint256[50] private upgradeGap;

```

**Events**

```js
event RiskProMint(address indexed account, uint256  amount, uint256  reserveTotal, uint256  commission, uint256  reservePrice, uint256  mocCommissionValue, uint256  mocPrice, uint256  reserveTokenMarkup, uint256  mocMarkup, address  vendorAccount);
event RiskProWithDiscountMint(uint256  riskProTecPrice, uint256  riskProDiscountPrice, uint256  amount);
event RiskProRedeem(address indexed account, uint256  amount, uint256  reserveTotal, uint256  commission, uint256  reservePrice, uint256  mocCommissionValue, uint256  mocPrice, uint256  reserveTokenMarkup, uint256  mocMarkup, address  vendorAccount);
event StableTokenMint(address indexed account, uint256  amount, uint256  reserveTotal, uint256  commission, uint256  reservePrice, uint256  mocCommissionValue, uint256  mocPrice, uint256  reserveTokenMarkup, uint256  mocMarkup, address  vendorAccount);
event StableTokenRedeem(address indexed account, uint256  amount, uint256  reserveTotal, uint256  commission, uint256  reservePrice, uint256  mocCommissionValue, uint256  mocPrice, uint256  reserveTokenMarkup, uint256  mocMarkup, address  vendorAccount);
event FreeStableTokenRedeem(address indexed account, uint256  amount, uint256  reserveTotal, uint256  commission, uint256  interests, uint256  reservePrice, uint256  mocCommissionValue, uint256  mocPrice, uint256  reserveTokenMarkup, uint256  mocMarkup, address  vendorAccount);
event RiskProxMint(bytes32  bucket, address indexed account, uint256  amount, uint256  reserveTotal, uint256  interests, uint256  leverage, uint256  commission, uint256  reservePrice, uint256  mocCommissionValue, uint256  mocPrice, uint256  reserveTokenMarkup, uint256  mocMarkup, address  vendorAccount);
event RiskProxRedeem(bytes32  bucket, address indexed account, uint256  commission, uint256  amount, uint256  reserveTotal, uint256  interests, uint256  leverage, uint256  reservePrice, uint256  mocCommissionValue, uint256  mocPrice, uint256  reserveTokenMarkup, uint256  mocMarkup, address  vendorAccount);
```

## Functions

- [initialize(address connectorAddress)](#initialize)
- [getMoCTokenBalance(address owner, address spender)](#getmoctokenbalance)
- [calculateCommissionsWithPrices(struct MoCExchange.CommissionParamsStruct params)](#calculatecommissionswithprices)
- [riskProDiscToResToken(uint256 riskProAmount, uint256 riskProTecPrice, uint256 riskProDiscountRate)](#riskprodisctorestoken)
- [mintRiskPro(address account, uint256 reserveTokenAmount, address vendorAccount)](#mintriskpro)
- [redeemRiskPro(address account, uint256 riskProAmount, address vendorAccount)](#redeemriskpro)
- [redeemFreeStableToken(address account, uint256 stableTokenAmount, address vendorAccount)](#redeemfreestabletoken)
- [mintStableToken(address account, uint256 resTokensToMint, address vendorAccount)](#mintstabletoken)
- [redeemStableTokenWithPrice(address userAddress, uint256 amount, uint256 reservePrice)](#redeemstabletokenwithprice)
- [redeemAllStableToken(address origin, address destination)](#redeemallstabletoken)
- [mintRiskProx(address payable account, bytes32 bucket, uint256 resTokensToMint, address vendorAccount)](#mintriskprox)
- [redeemRiskProx(address payable account, bytes32 bucket, uint256 riskProxAmount, address vendorAccount)](#redeemriskprox)
- [forceRedeemRiskProx(bytes32 bucket, address payable account, uint256 riskProxAmount, uint256 riskProxPrice)](#forceredeemriskprox)
- [burnRiskProxFor(bytes32 bucket, address payable account, uint256 riskProxAmount, uint256 riskProxPrice)](#burnriskproxfor)
- [redeemRiskProxInternal(address account, bytes32 bucket, uint256 riskProxAmount, struct MoCExchange.RiskProxRedeemStruct details, address vendorAccount)](#redeemriskproxinternal)
- [mintRiskProInternal(address account, uint256 reserveTokenAmount, struct MoCExchange.RiskProMintStruct details, address vendorAccount)](#mintriskprointernal)
- [mintRiskProxInternal(address account, bytes32 bucket, struct MoCExchange.RiskProxMintStruct details, address vendorAccount)](#mintriskproxinternal)
- [mintStableTokenInternal(address account, struct MoCExchange.StableTokenMintStruct details, address vendorAccount)](#mintstabletokeninternal)
- [redeemFreeStableTokenInternal(address account, struct MoCExchange.FreeStableTokenRedeemStruct details, address vendorAccount)](#redeemfreestabletokeninternal)
- [redeemRiskProInternal(address account, struct MoCExchange.RiskProRedeemStruct details, address vendorAccount)](#redeemriskprointernal)
- [redeemStableTokenWithPriceInternal(address account, uint256 amount, struct MoCExchange.StableTokenRedeemStruct details, address vendorAccount)](#redeemstabletokenwithpriceinternal)
- [moveExtraFundsToBucket(bytes32 bucketFrom, bytes32 bucketTo, uint256 totalReserveToken, uint256 lev)](#moveextrafundstobucket)
- [recoverInterests(bytes32 bucket, uint256 resTokenToRedeem)](#recoverinterests)
- [doStableTokenRedeem(address userAddress, uint256 stableTokenAmount, uint256 totalReserveToken)](#dostabletokenredeem)
- [initializeContracts()](#initializecontracts)

### initialize

Initializes the contract

```js
function initialize(address connectorAddress) public nonpayable initializer 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| connectorAddress | address | MoCConnector contract address | 

### getMoCTokenBalance

Converts MoC commission from ReserveToken to MoC price

```js
function getMoCTokenBalance(address owner, address spender) public view
returns(mocBalance uint256, mocAllowance uint256)
```

**Returns**

MoC balance of owner and MoC allowance of spender

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| owner | address | address of token owner | 
| spender | address | address of token spender | 

### calculateCommissionsWithPrices

Calculates commissions in MoC and ReserveToken

```js
function calculateCommissionsWithPrices(struct MoCExchange.CommissionParamsStruct params) public view
returns(ret struct MoCExchange.CommissionReturnStruct)
```

**Returns**

Commissions calculated in MoC price and ReserveToken price; and ReserveToken and MoC prices

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| params | struct MoCExchange.CommissionParamsStruct | Params defined in CommissionParamsStruct | 

### riskProDiscToResToken

Reserve token equivalent for the amount of riskPro given applying the spotDiscountRate

```js
function riskProDiscToResToken(uint256 riskProAmount, uint256 riskProTecPrice, uint256 riskProDiscountRate) internal view
returns(uint256)
```

**Returns**

Reserve token amount

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| riskProAmount | uint256 | amount of RiskPro [using mocPrecision] | 
| riskProTecPrice | uint256 | price of RiskPro without discounts [using mocPrecision] | 
| riskProDiscountRate | uint256 | RiskPro discounts [using mocPrecision] | 

### mintRiskPro

Mint RiskPros and give it to the msg.sender

```js
function mintRiskPro(address account, uint256 reserveTokenAmount, address vendorAccount) external nonpayable onlyWhitelisted 
returns(uint256, uint256, uint256, uint256, uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| account | address | Address of minter | 
| reserveTokenAmount | uint256 | Amount in ReserveToken to mint | 
| vendorAccount | address | Vendor address | 

### redeemRiskPro

Sender burns his RiskProS and redeems the equivalent ReserveTokens

```js
function redeemRiskPro(address account, uint256 riskProAmount, address vendorAccount) public nonpayable onlyWhitelisted 
returns(uint256, uint256, uint256, uint256, uint256)
```

**Returns**

resTokens to transfer to the redeemer and commission spent, using [using reservePrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| account | address | Address of the redeeemer | 
| riskProAmount | uint256 | Amount of RiskPros to be redeemed | 
| vendorAccount | address | Vendor address | 

### redeemFreeStableToken

Redeems the requested amount for the account, or the max amount of free stableTokens possible.

```js
function redeemFreeStableToken(address account, uint256 stableTokenAmount, address vendorAccount) public nonpayable onlyWhitelisted 
returns(uint256, uint256, uint256, uint256, uint256)
```

**Returns**

resTokens to transfer to the redeemer and commission spent, using [using reservePrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| account | address | Address of the redeeemer | 
| stableTokenAmount | uint256 | Amount of StableTokens to redeem [using mocPrecision] | 
| vendorAccount | address | Vendor address | 

### mintStableToken

Mint Max amount of StableTokens and give it to the msg.sender

```js
function mintStableToken(address account, uint256 resTokensToMint, address vendorAccount) public nonpayable onlyWhitelisted 
returns(uint256, uint256, uint256, uint256, uint256)
```

**Returns**

the actual amount of resTokens used and the resTokens commission for them [using rbtPresicion]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| account | address | minter user address | 
| resTokensToMint | uint256 | resTokens amount the user intents to convert to StableToken [using rbtPresicion] | 
| vendorAccount | address | Vendor address | 

### redeemStableTokenWithPrice

User StableTokens get burned and he receives the equivalent ReserveTokens in return

```js
function redeemStableTokenWithPrice(address userAddress, uint256 amount, uint256 reservePrice) public nonpayable onlyWhitelisted 
returns(bool, uint256)
```

**Returns**

true and commission spent if resTokens send was completed, false if fails.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| userAddress | address | Address of the user asking to redeem | 
| amount | uint256 | Verified amount of StableTokens to be redeemed [using mocPrecision] | 
| reservePrice | uint256 | resToken price [using mocPrecision] | 

### redeemAllStableToken

Allow redeem on liquidation state, user StableTokens get burned and he receives
the equivalent ReserveTokens according to liquidationPrice

```js
function redeemAllStableToken(address origin, address destination) public nonpayable onlyWhitelisted 
returns(uint256)
```

**Returns**

The amount of ReserveTokens in sent for the redemption or 0 if send does not succed

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| origin | address | address owner of the StableTokens | 
| destination | address | address to send the ReserveTokens | 

### mintRiskProx

BUCKET RiskProx minting. Mints RiskProx for the specified bucket

```js
function mintRiskProx(address payable account, bytes32 bucket, uint256 resTokensToMint, address vendorAccount) public nonpayable onlyWhitelisted 
returns(uint256, uint256, uint256, uint256, uint256)
```

**Returns**

total ReserveTokens Spent (resTokensToMint more interest) and commission spent [using reservePrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| account | address payable | owner of the new minted RiskProx | 
| bucket | bytes32 | bucket name | 
| resTokensToMint | uint256 | resToken amount to mint [using reservePrecision] | 
| vendorAccount | address | Vendor address | 

### redeemRiskProx

Sender burns his RiskProx, redeems the equivalent amount of RiskPros, return
the "borrowed" StableTokens and recover pending interests

```js
function redeemRiskProx(address payable account, bytes32 bucket, uint256 riskProxAmount, address vendorAccount) public nonpayable onlyWhitelisted 
returns(uint256, uint256, uint256, uint256, uint256)
```

**Returns**

the actual amount of resTokens to redeem and the resTokens commission for them [using reservePresicion]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| account | address payable | user address to redeem riskProx from | 
| bucket | bytes32 | Bucket where the RiskProxs are hold | 
| riskProxAmount | uint256 | Amount of RiskProxs to be redeemed [using reservePrecision] | 
| vendorAccount | address | Vendor address | 

### forceRedeemRiskProx

Burns user RiskProx and sends the equivalent amount of ReserveTokens
to the account without caring if transaction succeeds

```js
function forceRedeemRiskProx(bytes32 bucket, address payable account, uint256 riskProxAmount, uint256 riskProxPrice) public nonpayable onlyWhitelisted 
returns(bool)
```

**Returns**

result of the ReserveTokens sending transaction

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | Bucket where the RiskProxs are hold | 
| account | address payable | user address to redeem riskProx from | 
| riskProxAmount | uint256 | Amount of RiskProx to redeem [using mocPrecision] | 
| riskProxPrice | uint256 | Price of one RiskProx in ReserveTokens [using reservePrecision] | 

### burnRiskProxFor

Burns user RiskProx

```js
function burnRiskProxFor(bytes32 bucket, address payable account, uint256 riskProxAmount, uint256 riskProxPrice) public nonpayable onlyWhitelisted 
returns(uint256)
```

**Returns**

ResToken total value of the redemption [using reservePrecision]*

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | Bucket where the RiskProxs are hold | 
| account | address payable | user address to redeem riskProx from | 
| riskProxAmount | uint256 | Amount of RiskProx to redeem [using reservePrecision] | 
| riskProxPrice | uint256 | Price of one RiskProx in ReserveTokens [using reservePrecision] | 

### redeemRiskProxInternal

Internal function to avoid stack too deep errors

```js
function redeemRiskProxInternal(address account, bytes32 bucket, uint256 riskProxAmount, struct MoCExchange.RiskProxRedeemStruct details, address vendorAccount) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| account | address |  | 
| bucket | bytes32 |  | 
| riskProxAmount | uint256 |  | 
| details | struct MoCExchange.RiskProxRedeemStruct |  | 
| vendorAccount | address |  | 

### mintRiskProInternal

Internal function to avoid stack too deep errors

```js
function mintRiskProInternal(address account, uint256 reserveTokenAmount, struct MoCExchange.RiskProMintStruct details, address vendorAccount) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| account | address |  | 
| reserveTokenAmount | uint256 |  | 
| details | struct MoCExchange.RiskProMintStruct |  | 
| vendorAccount | address |  | 

### mintRiskProxInternal

Internal function to avoid stack too deep errors

```js
function mintRiskProxInternal(address account, bytes32 bucket, struct MoCExchange.RiskProxMintStruct details, address vendorAccount) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| account | address |  | 
| bucket | bytes32 |  | 
| details | struct MoCExchange.RiskProxMintStruct |  | 
| vendorAccount | address |  | 

### mintStableTokenInternal

Internal function to avoid stack too deep errors

```js
function mintStableTokenInternal(address account, struct MoCExchange.StableTokenMintStruct details, address vendorAccount) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| account | address |  | 
| details | struct MoCExchange.StableTokenMintStruct |  | 
| vendorAccount | address |  | 

### redeemFreeStableTokenInternal

Internal function to avoid stack too deep errors

```js
function redeemFreeStableTokenInternal(address account, struct MoCExchange.FreeStableTokenRedeemStruct details, address vendorAccount) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| account | address |  | 
| details | struct MoCExchange.FreeStableTokenRedeemStruct |  | 
| vendorAccount | address |  | 

### redeemRiskProInternal

Internal function to avoid stack too deep errors

```js
function redeemRiskProInternal(address account, struct MoCExchange.RiskProRedeemStruct details, address vendorAccount) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| account | address |  | 
| details | struct MoCExchange.RiskProRedeemStruct |  | 
| vendorAccount | address |  | 

### redeemStableTokenWithPriceInternal

Internal function to avoid stack too deep errors

```js
function redeemStableTokenWithPriceInternal(address account, uint256 amount, struct MoCExchange.StableTokenRedeemStruct details, address vendorAccount) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| account | address |  | 
| amount | uint256 |  | 
| details | struct MoCExchange.StableTokenRedeemStruct |  | 
| vendorAccount | address |  | 

### moveExtraFundsToBucket

Calculates the amount of ReserveTokens that one bucket should move to another in
RiskProx minting/redemption. This extra makes RiskProx more leveraging than RiskPro.

```js
function moveExtraFundsToBucket(bytes32 bucketFrom, bytes32 bucketTo, uint256 totalReserveToken, uint256 lev) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucketFrom | bytes32 | Origin bucket from which the ReserveTokens are moving | 
| bucketTo | bytes32 | Destination bucket to which the ReserveTokens are moving | 
| totalReserveToken | uint256 | Amount of ReserveTokens moving between buckets [using reservePrecision] | 
| lev | uint256 | lev of the L bucket [using mocPrecision] | 

### recoverInterests

Returns ReserveTokens for user in concept of interests refund

```js
function recoverInterests(bytes32 bucket, uint256 resTokenToRedeem) internal nonpayable
returns(uint256)
```

**Returns**

Interests [using reservePrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | Bucket where the RiskProxs are hold | 
| resTokenToRedeem | uint256 | Total ReserveTokens value of the redemption [using mocPrecision] | 

### doStableTokenRedeem

```js
function doStableTokenRedeem(address userAddress, uint256 stableTokenAmount, uint256 totalReserveToken) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| userAddress | address |  | 
| stableTokenAmount | uint256 |  | 
| totalReserveToken | uint256 |  | 

### initializeContracts

```js
function initializeContracts() internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

