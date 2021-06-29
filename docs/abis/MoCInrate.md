---
id: version-0.1.10-MoCInrate
title: MoCInrate
original_id: MoCInrate
---

# MoCInrate.sol

View Source: [contracts/MoCInrate.sol](../../contracts/MoCInrate.sol)

**↗ Extends: [MoCInrateEvents](MoCInrateEvents.md), [MoCInrateStructs](MoCInrateStructs.md), [MoCBase](MoCBase.md), [MoCLibConnection](MoCLibConnection.md), [Governed](Governed.md), [IMoCInrate](IMoCInrate.md)**

**MoCInrate** - version: 0.1.10

## Structs
### InrateParams

```js
struct InrateParams {
 uint256 tMax,
 uint256 tMin,
 uint256 power
}
```

## Contract Members
**Constants & Variables**

```js
//internal members
struct MoCInrateStructs.InrateParams internal riskProxParams;
contract IMoCState internal mocState;
contract MoCConverter internal mocConverter;
contract MoCRiskProxManager internal riskProxManager;

//public members
uint256 public lastDailyPayBlock;
uint256 public riskProRate;
address payable public riskProInterestAddress;
uint256 public lastRiskProInterestBlock;
uint256 public riskProInterestBlockSpan;
address payable public commissionsAddress;
uint256 public DEPRECATED_commissionRate;
uint256 public stableTmin;
uint256 public stablePower;
uint256 public stableTmax;
uint8 public constant MINT_RISKPRO_FEES_RESERVE;
uint8 public constant REDEEM_RISKPRO_FEES_RESERVE;
uint8 public constant MINT_STABLETOKEN_FEES_RESERVE;
uint8 public constant REDEEM_STABLETOKEN_FEES_RESERVE;
uint8 public constant MINT_RISKPROX_FEES_RESERVE;
uint8 public constant REDEEM_RISKPROX_FEES_RESERVE;
uint8 public constant MINT_RISKPRO_FEES_MOC;
uint8 public constant REDEEM_RISKPRO_FEES_MOC;
uint8 public constant MINT_STABLETOKEN_FEES_MOC;
uint8 public constant REDEEM_STABLETOKEN_FEES_MOC;
uint8 public constant MINT_RISKPROX_FEES_MOC;
uint8 public constant REDEEM_RISKPROX_FEES_MOC;
mapping(uint8 => uint256) public commissionRatesByTxType;

//private members
uint256[50] private upgradeGap;

```

**Events**

```js
event InrateDailyPay(uint256  amount, uint256  daysToSettlement, uint256  nReserveBucketC0);
event RiskProHoldersInterestPay(uint256  amount, uint256  nReserveBucketC0BeforePay);
```

## Modifiers

- [onlyOnceADay](#onlyonceaday)
- [onlyWhenRiskProInterestsIsEnabled](#onlywhenriskprointerestsisenabled)

### onlyOnceADay

```js
modifier onlyOnceADay() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### onlyWhenRiskProInterestsIsEnabled

```js
modifier onlyWhenRiskProInterestsIsEnabled() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

## Functions

- [setStableTmin(uint256 _stableTmin)](#setstabletmin)
- [setStableTmax(uint256 _stableTmax)](#setstabletmax)
- [setStablePower(uint256 _stablePower)](#setstablepower)
- [getStableTmin()](#getstabletmin)
- [getStableTmax()](#getstabletmax)
- [getStablePower()](#getstablepower)
- [stableTokenInrateAvg(uint256 stableTokenRedeem)](#stabletokeninrateavg)
- [initialize(address connectorAddress, address _governor, uint256 riskProxTmin, uint256 riskProxPower, uint256 riskProxTmax, uint256 _riskProRate, uint256 blockSpanRiskPro, address payable riskProInterestTargetAddress, address payable commissionsAddressTarget, uint256 _stableTmin, uint256 _stablePower, uint256 _stableTmax)](#initialize)
- [getRiskProxTmin()](#getriskproxtmin)
- [getRiskProxTmax()](#getriskproxtmax)
- [getRiskProxPower()](#getriskproxpower)
- [getRiskProInterestBlockSpan()](#getriskprointerestblockspan)
- [setRiskProxTmin(uint256 _btxcTmin)](#setriskproxtmin)
- [setRiskProxTmax(uint256 _btxcTax)](#setriskproxtmax)
- [setRiskProxPower(uint256 _btxcPower)](#setriskproxpower)
- [getRiskProRate()](#getriskprorate)
- [setRiskProRate(uint256 newRiskProRate)](#setriskprorate)
- [setRiskProInterestBlockSpan(uint256 newRiskProBlockSpan)](#setriskprointerestblockspan)
- [getRiskProInterestAddress()](#getriskprointerestaddress)
- [setRiskProInterestAddress(address payable newRiskProInterestAddress)](#setriskprointerestaddress)
- [setCommissionsAddress(address payable newCommissionsAddress)](#setcommissionsaddress)
- [spotInrate()](#spotinrate)
- [riskProxInrateAvg(bytes32 bucket, uint256 resTokensAmount, bool onMinting)](#riskproxinrateavg)
- [dailyInrate()](#dailyinrate)
- [calcMintInterestValues(bytes32 bucket, uint256 reserveTokenAmount)](#calcmintinterestvalues)
- [calcStableTokenRedInterestValues(uint256 stableTokenAmount, uint256 reserveTokenAmount)](#calcstabletokenredinterestvalues)
- [calcFinalRedeemInterestValue(bytes32 bucket, uint256 reserveTokenToRedeem)](#calcfinalredeeminterestvalue)
- [calcCommissionValue(uint256 reserveTokenAmount, uint8 txType)](#calccommissionvalue)
- [calculateVendorMarkup(address vendorAccount, uint256 amount)](#calculatevendormarkup)
- [calcRedeemInterestValue(bytes32 bucket, uint256 reserveTokenToRedeem)](#calcredeeminterestvalue)
- [dailyInratePayment()](#dailyinratepayment)
- [isDailyEnabled()](#isdailyenabled)
- [isRiskProInterestEnabled()](#isriskprointerestenabled)
- [calculateRiskProHoldersInterest()](#calculateriskproholdersinterest)
- [payRiskProHoldersInterestPayment()](#payriskproholdersinterestpayment)
- [setCommissionRateByTxType(uint8 txType, uint256 value)](#setcommissionratebytxtype)
- [inrateToSettlement(uint256 inrate, bool countAllDays)](#inratetosettlement)
- [calcProportionalInterestValue(bytes32 bucket, uint256 redeemInterest)](#calcproportionalinterestvalue)
- [calcFullRedeemInterestValue(bytes32 bucket)](#calcfullredeeminterestvalue)
- [simulateStableTokenMovement(bytes32 bucket, uint256 resTokensAmount, bool onMinting)](#simulatestabletokenmovement)
- [inrateDayCount(bool countAllDays)](#inratedaycount)
- [initializeContracts()](#initializecontracts)
- [initializeValues(address _governor, uint256 riskProxMin, uint256 riskProxPower, uint256 riskProxMax, uint256 _riskProRate, address payable commissionsAddressTarget, uint256 blockSpanRiskPro, address payable riskProInterestsTarget, uint256 _stableTmin, uint256 _stablePower, uint256 _stableTmax)](#initializevalues)

### setStableTmin

```js
function setStableTmin(uint256 _stableTmin) public nonpayable onlyAuthorizedChanger 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _stableTmin | uint256 |  | 

### setStableTmax

```js
function setStableTmax(uint256 _stableTmax) public nonpayable onlyAuthorizedChanger 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _stableTmax | uint256 |  | 

### setStablePower

```js
function setStablePower(uint256 _stablePower) public nonpayable onlyAuthorizedChanger 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _stablePower | uint256 |  | 

### getStableTmin

```js
function getStableTmin() public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getStableTmax

```js
function getStableTmax() public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getStablePower

```js
function getStablePower() public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### stableTokenInrateAvg

Calculates an average interest rate between after and before free stableToken Redemption

```js
function stableTokenInrateAvg(uint256 stableTokenRedeem) public view
returns(uint256)
```

**Returns**

Interest rate value [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| stableTokenRedeem | uint256 | StableTokens to redeem [using mocPrecision] | 

### initialize

Initializes the contract

```js
function initialize(address connectorAddress, address _governor, uint256 riskProxTmin, uint256 riskProxPower, uint256 riskProxTmax, uint256 _riskProRate, uint256 blockSpanRiskPro, address payable riskProInterestTargetAddress, address payable commissionsAddressTarget, uint256 _stableTmin, uint256 _stablePower, uint256 _stableTmax) public nonpayable initializer 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| connectorAddress | address | MoCConnector contract address | 
| _governor | address | Governor contract address | 
| riskProxTmin | uint256 | Minimum interest rate [using mocPrecision] | 
| riskProxPower | uint256 | Power is a parameter for interest rate calculation [using noPrecision] | 
| riskProxTmax | uint256 | Maximun interest rate [using mocPrecision] | 
| _riskProRate | uint256 | BitPro holder interest rate [using mocPrecision] | 
| blockSpanRiskPro | uint256 | BitPro blockspan to configure payments periods[using mocPrecision] | 
| riskProInterestTargetAddress | address payable | Target address to transfer the weekly BitPro holders interest | 
| commissionsAddressTarget | address payable | Target addres to transfer commissions of mint/redeem | 
| _stableTmin | uint256 | Upgrade to support red stable inrate parameter | 
| _stablePower | uint256 | Upgrade to support red stable inrate parameter | 
| _stableTmax | uint256 | Upgrade to support red stable inrate parameter | 

### getRiskProxTmin

gets tMin param of RiskProx tokens

```js
function getRiskProxTmin() public view
returns(uint256)
```

**Returns**

returns tMin of RiskProx

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getRiskProxTmax

gets tMax param of RiskProx tokens

```js
function getRiskProxTmax() public view
returns(uint256)
```

**Returns**

returns tMax of RiskProx

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getRiskProxPower

gets power param of RiskProx tokens

```js
function getRiskProxPower() public view
returns(uint256)
```

**Returns**

returns power of RiskProx

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getRiskProInterestBlockSpan

⤾ overrides IMoCInrate.getRiskProInterestBlockSpan

Gets the blockspan of RiskPro that represents the frecuency of RiskPro holders intereset payment

```js
function getRiskProInterestBlockSpan() public view
returns(uint256)
```

**Returns**

returns power of riskProInterestBlockSpan

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### setRiskProxTmin

sets tMin param of RiskProx tokens

```js
function setRiskProxTmin(uint256 _btxcTmin) public nonpayable onlyAuthorizedChanger 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _btxcTmin | uint256 | tMin of RiskProx | 

### setRiskProxTmax

sets tMax param of RiskProx tokens

```js
function setRiskProxTmax(uint256 _btxcTax) public nonpayable onlyAuthorizedChanger 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _btxcTax | uint256 | tMax of RiskProx | 

### setRiskProxPower

sets power param of RiskProx tokens

```js
function setRiskProxPower(uint256 _btxcPower) public nonpayable onlyAuthorizedChanger 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _btxcPower | uint256 | power of RiskProx | 

### getRiskProRate

⤾ overrides IMoCInrate.getRiskProRate

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

### setRiskProRate

Sets RiskPro Holders rate

```js
function setRiskProRate(uint256 newRiskProRate) public nonpayable onlyAuthorizedChanger 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| newRiskProRate | uint256 | New RiskPro rate | 

### setRiskProInterestBlockSpan

⤾ overrides IMoCInrate.setRiskProInterestBlockSpan

Sets the blockspan RiskPro Intereset rate payment is enable to be executed

```js
function setRiskProInterestBlockSpan(uint256 newRiskProBlockSpan) public nonpayable onlyAuthorizedChanger 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| newRiskProBlockSpan | uint256 | New RiskPro Block span | 

### getRiskProInterestAddress

⤾ overrides IMoCInrate.getRiskProInterestAddress

Gets the target address to transfer RiskPro Holders rate

```js
function getRiskProInterestAddress() public view
returns(address payable)
```

**Returns**

Target address to transfer RiskPro Holders interest

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### setRiskProInterestAddress

Sets the target address to transfer RiskPro Holders rate

```js
function setRiskProInterestAddress(address payable newRiskProInterestAddress) public nonpayable onlyAuthorizedChanger 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| newRiskProInterestAddress | address payable | New RiskPro rate | 

### setCommissionsAddress

Sets the target address to transfer commissions of Mint/Redeem transactions

```js
function setCommissionsAddress(address payable newCommissionsAddress) public nonpayable onlyAuthorizedChanger 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| newCommissionsAddress | address payable | New commisions address | 

### spotInrate

Calculates interest rate for RiskProx Minting, redeem and Free StableToken Redeem

```js
function spotInrate() public view
returns(uint256)
```

**Returns**

Interest rate value [using RatePrecsion]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### riskProxInrateAvg

Calculates an average interest rate between after and before mint/redeem

```js
function riskProxInrateAvg(bytes32 bucket, uint256 resTokensAmount, bool onMinting) public view
returns(uint256)
```

**Returns**

Interest rate value [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | Name of the bucket involved in the operation | 
| resTokensAmount | uint256 | Value of the operation from which calculates the inrate [using reservePrecision] | 
| onMinting | bool | Value that represents if the calculation is based on mint or on redeem | 

### dailyInrate

returns the amount of ReserveTokens to pay in concept of interest to bucket C0

```js
function dailyInrate() public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### calcMintInterestValues

⤾ overrides IMoCInrate.calcMintInterestValues

Extract the inrate from the passed ReserveTokens value for RiskProx minting operation

```js
function calcMintInterestValues(bytes32 bucket, uint256 reserveTokenAmount) public view
returns(uint256)
```

**Returns**

ReserveTokens to pay in concept of interests [using reservePrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | Bucket to use to calculate interés | 
| reserveTokenAmount | uint256 | Total value from which extract the interest rate [using reservePrecision] | 

### calcStableTokenRedInterestValues

⤾ overrides IMoCInrate.calcStableTokenRedInterestValues

Extract the inrate from the passed ReserveTokens value for the StableToken Redeem operation

```js
function calcStableTokenRedInterestValues(uint256 stableTokenAmount, uint256 reserveTokenAmount) public view
returns(uint256)
```

**Returns**

finalInterest

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| stableTokenAmount | uint256 | StableToken amount of the redemption [using mocPrecision] | 
| reserveTokenAmount | uint256 | Total value from which extract the interest rate [using reservePrecision] | 

### calcFinalRedeemInterestValue

⤾ overrides IMoCInrate.calcFinalRedeemInterestValue

This function calculates the interest to return to the user
in a RiskProx redemption. It uses a mechanism to counteract the effect
of free stableTokens redemption. It will be replaced with FreeStableToken redemption
interests in the future

```js
function calcFinalRedeemInterestValue(bytes32 bucket, uint256 reserveTokenToRedeem) public view
returns(uint256)
```

**Returns**

Reserves to recover in concept of interests [using reservePrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | Bucket to use to calculate interest | 
| reserveTokenToRedeem | uint256 | Total value from which calculate interest [using reservePrecision] | 

### calcCommissionValue

⤾ overrides IMoCInrate.calcCommissionValue

calculates the Commission rate from the passed ReserveTokens amount for mint/redeem operations

```js
function calcCommissionValue(uint256 reserveTokenAmount, uint8 txType) public view
returns(uint256)
```

**Returns**

finalCommissionAmount [using reservePrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| reserveTokenAmount | uint256 | Total value from which apply the Commission rate [using reservePrecision] | 
| txType | uint8 | Transaction type according to constant values defined in this contract | 

### calculateVendorMarkup

⤾ overrides IMoCInrate.calculateVendorMarkup

calculates the vendor markup rate from the passed vendor account and amount

```js
function calculateVendorMarkup(address vendorAccount, uint256 amount) public view
returns(markup uint256)
```

**Returns**

finalCommissionAmount [using reservePrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| vendorAccount | address | Vendor address | 
| amount | uint256 | Total value from which apply the vendor markup rate [using reservePrecision] | 

### calcRedeemInterestValue

Calculates ReserveTokens value to return to the user in concept of interests

```js
function calcRedeemInterestValue(bytes32 bucket, uint256 reserveTokenToRedeem) public view
returns(uint256)
```

**Returns**

Reserves to recover in concept of interests [using reservePrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | Bucket to use to calculate interest | 
| reserveTokenToRedeem | uint256 | Total value from which calculate interest [using reservePrecision] | 

### dailyInratePayment

⤾ overrides IMoCInrate.dailyInratePayment

Moves the daily amount of interest rate to C0 bucket

```js
function dailyInratePayment() public nonpayable onlyWhitelisted onlyOnceADay 
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### isDailyEnabled

⤾ overrides IMoCInrate.isDailyEnabled

```js
function isDailyEnabled() public view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### isRiskProInterestEnabled

⤾ overrides IMoCInrate.isRiskProInterestEnabled

```js
function isRiskProInterestEnabled() public view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### calculateRiskProHoldersInterest

⤾ overrides IMoCInrate.calculateRiskProHoldersInterest

Calculates RiskPro Holders interest rates

```js
function calculateRiskProHoldersInterest() public view
returns(uint256, uint256)
```

**Returns**

toPay interest in ReserveTokens [using reservePrecsion]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### payRiskProHoldersInterestPayment

⤾ overrides IMoCInrate.payRiskProHoldersInterestPayment

Pays the RiskPro Holders interest rates

```js
function payRiskProHoldersInterestPayment() public nonpayable onlyWhitelisted onlyWhenRiskProInterestsIsEnabled 
returns(uint256)
```

**Returns**

interest payed in ReserveTokens [using reservePrecsion]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### setCommissionRateByTxType

Sets the commission rate to a particular transaction type

```js
function setCommissionRateByTxType(uint8 txType, uint256 value) public nonpayable onlyAuthorizedChanger 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| txType | uint8 | Transaction type according to constant values defined in this contract | 
| value | uint256 | Commission rate | 

### inrateToSettlement

Calculates the interest rate to pay until the settlement day

```js
function inrateToSettlement(uint256 inrate, bool countAllDays) internal view
returns(uint256)
```

**Returns**

Interest rate value [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| inrate | uint256 | Spot interest rate | 
| countAllDays | bool | Value that represents if the calculation will use all days or one day less | 

### calcProportionalInterestValue

This function calculates the interest to return to a user redeeming
RiskProx as a proportion of the amount in the interestBag.

```js
function calcProportionalInterestValue(bytes32 bucket, uint256 redeemInterest) internal view
returns(uint256)
```

**Returns**

InterestsInBag * (RedeemInterests / FullRedeemInterest) [using reservePrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | Bucket to use to calculate interest | 
| redeemInterest | uint256 | Total value from which calculate interest [using reservePrecision] | 

### calcFullRedeemInterestValue

This function calculates the interest to return if a user redeem all RiskProx in existance

```js
function calcFullRedeemInterestValue(bytes32 bucket) internal view
returns(uint256)
```

**Returns**

Interests [using reservePrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | Bucket to use to calculate interest | 

### simulateStableTokenMovement

Calculates the final amount of Bucket 0 StableTokens on RiskProx mint/redeem

```js
function simulateStableTokenMovement(bytes32 bucket, uint256 resTokensAmount, bool onMinting) internal view
returns(uint256)
```

**Returns**

Final bucket 0 StableToken amount

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | Name of the bucket involved in the operation | 
| resTokensAmount | uint256 | Value of the operation from which calculates the inrate [using reservePrecision] | 
| onMinting | bool |  | 

### inrateDayCount

Returns the days to use for interests calculation

```js
function inrateDayCount(bool countAllDays) internal view
returns(uint256)
```

**Returns**

days [using dayPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| countAllDays | bool | Value that represents if the calculation is based on mint or on redeem | 

### initializeContracts

Initialize the contracts with which it interacts

```js
function initializeContracts() internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### initializeValues

Initialize the parameters of the contract

```js
function initializeValues(address _governor, uint256 riskProxMin, uint256 riskProxPower, uint256 riskProxMax, uint256 _riskProRate, address payable commissionsAddressTarget, uint256 blockSpanRiskPro, address payable riskProInterestsTarget, uint256 _stableTmin, uint256 _stablePower, uint256 _stableTmax) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _governor | address | the address of the IGovernor contract | 
| riskProxMin | uint256 | Minimum interest rate [using mocPrecision] | 
| riskProxPower | uint256 | Power is a parameter for interest rate calculation [using noPrecision] | 
| riskProxMax | uint256 | Maximun interest rate [using mocPrecision] | 
| _riskProRate | uint256 | RiskPro holder interest rate [using mocPrecision] | 
| commissionsAddressTarget | address payable |  | 
| blockSpanRiskPro | uint256 | RiskPro blockspan to configure payments periods[using mocPrecision] | 
| riskProInterestsTarget | address payable | Target address to transfer the weekly RiskPro holders interest | 
| _stableTmin | uint256 | Upgrade to support red stable inrate parameter | 
| _stablePower | uint256 | Upgrade to support red stable inrate parameter | 
| _stableTmax | uint256 | Upgrade to support red stable inrate parameter | 

