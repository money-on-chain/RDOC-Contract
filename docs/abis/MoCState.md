---
id: version-0.1.10-MoCState
title: MoCState
original_id: MoCState
---

# MoCState.sol

View Source: [contracts/MoCState.sol](../../contracts/MoCState.sol)

**↗ Extends: [MoCLibConnection](MoCLibConnection.md), [MoCBase](MoCBase.md), [MoCEMACalculator](MoCEMACalculator.md)**
**↘ Derived Contracts: [MoCStateMock](MoCStateMock.md)**

**MoCState** - version: 0.1.10

**Enums**
### States

```js
enum States {
 Liquidated,
 RiskProDiscount,
 BelowCobj,
 AboveCobj
}
```

## Structs
### InitializeParams

```js
struct InitializeParams {
 address connectorAddress,
 address governor,
 address priceProvider,
 uint256 liq,
 uint256 utpdu,
 uint256 maxDiscRate,
 uint256 dayBlockSpan,
 uint256 ema,
 uint256 smoothFactor,
 uint256 emaBlockSpan,
 uint256 maxMintRiskPro,
 address mocPriceProvider,
 address mocTokenAddress,
 address mocVendorsAddress,
 bool liquidationEnabled,
 uint256 protected
}
```

## Contract Members
**Constants & Variables**

```js
//public members
enum MoCState.States public state;
uint256 public dayBlockSpan;
uint256 public peg;
uint256 public riskProMaxDiscountRate;
uint256 public liq;
uint256 public utpdu;
uint256 public reserves;
uint256 public liquidationPrice;
uint256 public maxMintRiskPro;
bool public liquidationEnabled;
uint256 public protected;

//internal members
contract PriceProvider internal priceProvider;
contract MoCSettlement internal mocSettlement;
contract MoCConverter internal mocConverter;
contract StableToken internal stableToken;
contract RiskProToken internal riskProToken;
contract MoCRiskProxManager internal riskProxManager;
contract PriceProvider internal mocPriceProvider;
contract MoCToken internal mocToken;
contract MoCVendors internal mocVendors;

//private members
uint256[50] private upgradeGap;

```

**Events**

```js
event StateTransition(enum MoCState.States  newState);
event PriceProviderUpdated(address  oldAddress, address  newAddress);
event MoCPriceProviderUpdated(address  oldAddress, address  newAddress);
event MoCTokenChanged(address  mocTokenAddress);
event MoCVendorsChanged(address  mocVendorsAddress);
```

## Functions

- [initialize(struct MoCState.InitializeParams params)](#initialize)
- [setMaxDiscountRate(uint256 rate)](#setmaxdiscountrate)
- [getMaxDiscountRate()](#getmaxdiscountrate)
- [setDayBlockSpan(uint256 blockSpan)](#setdayblockspan)
- [setPriceProvider(address priceProviderAddress)](#setpriceprovider)
- [getPriceProvider()](#getpriceprovider)
- [getDayBlockSpan()](#getdayblockspan)
- [substractFromReserves(uint256 amount)](#substractfromreserves)
- [addToReserves(uint256 amount)](#addtoreserves)
- [riskProTotalSupply()](#riskprototalsupply)
- [stableTokenTotalSupply()](#stabletokentotalsupply)
- [cobj()](#cobj)
- [collateralReserves()](#collateralreserves)
- [globalCoverage()](#globalcoverage)
- [lockedReserveTokens(bytes32 bucket)](#lockedreservetokens)
- [getResTokensInRiskPro(bytes32 bucket)](#getrestokensinriskpro)
- [getReservesRemainder()](#getreservesremainder)
- [coverage(bytes32 bucket)](#coverage)
- [abundanceRatio(uint256 stableToken0)](#abundanceratio)
- [currentAbundanceRatio()](#currentabundanceratio)
- [leverage(bytes32 bucket)](#leverage)
- [globalMaxStableToken()](#globalmaxstabletoken)
- [freeStableToken()](#freestabletoken)
- [maxStableToken(bytes32 bucket)](#maxstabletoken)
- [globalMaxRiskPro()](#globalmaxriskpro)
- [absoluteMaxStableToken()](#absolutemaxstabletoken)
- [maxRiskPro(bytes32 bucket)](#maxriskpro)
- [maxRiskProx(bytes32 bucket)](#maxriskprox)
- [maxRiskProxResTokenValue(bytes32 bucket)](#maxriskproxrestokenvalue)
- [absoluteMaxRiskPro()](#absolutemaxriskpro)
- [maxRiskProWithDiscount()](#maxriskprowithdiscount)
- [globalLockedReserveTokens()](#globallockedreservetokens)
- [riskProTecPrice()](#riskprotecprice)
- [bucketRiskProTecPrice(bytes32 bucket)](#bucketriskprotecprice)
- [bucketRiskProTecPriceHelper(bytes32 bucket)](#bucketriskprotecpricehelper)
- [riskProDiscountPrice()](#riskprodiscountprice)
- [riskProUsdPrice()](#riskprousdprice)
- [maxRiskProxRiskProValue(bytes32 bucket)](#maxriskproxriskprovalue)
- [riskProxRiskProPrice(bytes32 bucket)](#riskproxriskproprice)
- [riskProSpotDiscountRate()](#riskprospotdiscountrate)
- [daysToSettlement()](#daystosettlement)
- [blocksToSettlement()](#blockstosettlement)
- [isLiquidationReached()](#isliquidationreached)
- [getLiquidationPrice()](#getliquidationprice)
- [getBucketNReserve(bytes32 bucket)](#getbucketnreserve)
- [getBucketNRiskPro(bytes32 bucket)](#getbucketnriskpro)
- [getBucketNStableToken(bytes32 bucket)](#getbucketnstabletoken)
- [getBucketCobj(bytes32 bucket)](#getbucketcobj)
- [getInrateBag(bytes32 bucket)](#getinratebag)
- [getBcons()](#getbcons)
- [getReserveTokenPrice()](#getreservetokenprice)
- [calculateReserveTokenMovingAverage()](#calculatereservetokenmovingaverage)
- [getLiq()](#getliq)
- [setLiq(uint256 _liq)](#setliq)
- [getUtpdu()](#getutpdu)
- [setUtpdu(uint256 _utpdu)](#setutpdu)
- [getPeg()](#getpeg)
- [setPeg(uint256 _peg)](#setpeg)
- [getProtected()](#getprotected)
- [setProtected(uint256 _protected)](#setprotected)
- [getLiquidationEnabled()](#getliquidationenabled)
- [setLiquidationEnabled(bool _liquidationEnabled)](#setliquidationenabled)
- [nextState()](#nextstate)
- [setMaxMintRiskPro(uint256 _maxMintRiskPro)](#setmaxmintriskpro)
- [getMaxMintRiskPro()](#getmaxmintriskpro)
- [setMoCPriceProvider(address mocProviderAddress)](#setmocpriceprovider)
- [getMoCPriceProvider()](#getmocpriceprovider)
- [getMoCPrice()](#getmocprice)
- [setMoCToken(address mocTokenAddress)](#setmoctoken)
- [getMoCToken()](#getmoctoken)
- [setMoCVendors(address mocVendorsAddress)](#setmocvendors)
- [getMoCVendors()](#getmocvendors)
- [setMoCTokenInternal(address mocTokenAddress)](#setmoctokeninternal)
- [setMoCVendorsInternal(address mocVendorsAddress)](#setmocvendorsinternal)
- [setLiquidationPrice()](#setliquidationprice)
- [initializeValues(address _governor, address _priceProvider, uint256 _liq, uint256 _utpdu, uint256 _maxDiscRate, uint256 _dayBlockSpan, uint256 _maxMintRiskPro, address _mocPriceProvider, bool _liquidationEnabled, uint256 _protected)](#initializevalues)
- [initializeContracts(address _mocTokenAddress, address _mocVendorsAddress)](#initializecontracts)

### initialize

⤿ Overridden Implementation(s): [MoCStateMock.initialize](MoCStateMock.md#initialize)

Initializes the contract

```js
function initialize(struct MoCState.InitializeParams params) public nonpayable initializer 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| params | struct MoCState.InitializeParams | Params defined in InitializeParams struct | 

### setMaxDiscountRate

Sets the max discount rate.

```js
function setMaxDiscountRate(uint256 rate) public nonpayable onlyAuthorizedChanger 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| rate | uint256 | Discount rate at liquidation level [using mocPrecision] | 

### getMaxDiscountRate

return the value of the RiskPro max discount rate configuration param

```js
function getMaxDiscountRate() public view
returns(uint256)
```

**Returns**

riskProMaxDiscountRate RiskPro max discount rate

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### setDayBlockSpan

Defines how many blocks there are in a day

```js
function setDayBlockSpan(uint256 blockSpan) public nonpayable onlyAuthorizedChanger 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| blockSpan | uint256 | blocks there are in a day | 

### setPriceProvider

Sets a new PriceProvider contract

```js
function setPriceProvider(address priceProviderAddress) public nonpayable onlyAuthorizedChanger 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| priceProviderAddress | address | address of the price provider contract | 

### getPriceProvider

Gets the PriceProviderAddress

```js
function getPriceProvider() public view
returns(address)
```

**Returns**

address of the price provider contract

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getDayBlockSpan

Gets how many blocks there are in a day

```js
function getDayBlockSpan() public view
returns(uint256)
```

**Returns**

blocks there are in a day

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### substractFromReserves

Subtract the reserve amount passed by parameter to the reserves total

```js
function substractFromReserves(uint256 amount) public nonpayable onlyWhitelisted 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| amount | uint256 | Amount that will be subtract to reserves | 

### addToReserves

Add the reserve amount passed by parameter to the reserves total

```js
function addToReserves(uint256 amount) public nonpayable onlyWhitelisted 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| amount | uint256 | Amount that will be added to reserves | 

### riskProTotalSupply

All RiskPros in circulation

```js
function riskProTotalSupply() public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### stableTokenTotalSupply

All stableTokens in circulation

```js
function stableTokenTotalSupply() public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### cobj

Target coverage for complete system

```js
function cobj() public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### collateralReserves

Amount of ReserveTokens in the system excluding
RiskProx values and interests holdings

```js
function collateralReserves() public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### globalCoverage

GLOBAL Coverage

```js
function globalCoverage() public view
returns(uint256)
```

**Returns**

coverage [using mocPrecision].

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### lockedReserveTokens

BUCKET lockedReserveTokens

```js
function lockedReserveTokens(bytes32 bucket) public view
returns(uint256)
```

**Returns**

lockedReserveTokens amount [using reservePrecision].

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | Name of the bucket used | 

### getResTokensInRiskPro

Gets ReserveTokens in RiskPro within specified bucket

```js
function getResTokensInRiskPro(bytes32 bucket) public view
returns(uint256)
```

**Returns**

ReserveToken amount of RiskPro in Bucket [using reservePrecision].

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | Name of the bucket used | 

### getReservesRemainder

Gets the ReserveTokens in the contract that not corresponds to StableToken collateral

```js
function getReservesRemainder() public view
returns(uint256)
```

**Returns**

ReserveTokens remainder [using reservePrecision].

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### coverage

BUCKET Coverage

```js
function coverage(bytes32 bucket) public view
returns(uint256)
```

**Returns**

coverage [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | Name of the bucket used | 

### abundanceRatio

Abundance ratio, receives tha amount of stableToken to use the value of stableToken0 and StableToken total supply

```js
function abundanceRatio(uint256 stableToken0) public view
returns(uint256)
```

**Returns**

abundance ratio [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| stableToken0 | uint256 |  | 

### currentAbundanceRatio

Relation between stableTokens in bucket 0 and StableToken total supply

```js
function currentAbundanceRatio() public view
returns(uint256)
```

**Returns**

abundance ratio [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### leverage

BUCKET Leverage

```js
function leverage(bytes32 bucket) public view
returns(uint256)
```

**Returns**

leverage [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | Name of the bucket used | 

### globalMaxStableToken

GLOBAL maxStableToken

```js
function globalMaxStableToken() public view
returns(uint256)
```

**Returns**

maxStableToken to issue [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### freeStableToken

Returns the amount of stableTokens in bucket 0, that can be redeemed outside of settlement

```js
function freeStableToken() public view
returns(uint256)
```

**Returns**

amount of stableTokens in bucket 0, that can be redeemed outside of settlement [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### maxStableToken

BUCKET maxStableToken

```js
function maxStableToken(bytes32 bucket) public view
returns(uint256)
```

**Returns**

maxStableToken to issue [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 |  | 

### globalMaxRiskPro

GLOBAL maxRiskPro

```js
function globalMaxRiskPro() public view
returns(uint256)
```

**Returns**

maxRiskPro for redeem [using mocPrecision].

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### absoluteMaxStableToken

ABSOLUTE maxStableToken

```js
function absoluteMaxStableToken() public view
returns(uint256)
```

**Returns**

maxStableToken to issue [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### maxRiskPro

BUCKET maxRiskPro to redeem / mint

```js
function maxRiskPro(bytes32 bucket) public view
returns(uint256)
```

**Returns**

maxRiskPro for redeem [using mocPrecision].

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | Name of the bucket used | 

### maxRiskProx

GLOBAL max riskProx to mint

```js
function maxRiskProx(bytes32 bucket) public view
returns(uint256)
```

**Returns**

maxRiskProx [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | Name of the bucket used | 

### maxRiskProxResTokenValue

GLOBAL max riskProx to mint

```js
function maxRiskProxResTokenValue(bytes32 bucket) public view
returns(uint256)
```

**Returns**

maxRiskProx ReserveTokens value to mint [using reservePrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | Name of the bucket used | 

### absoluteMaxRiskPro

ABSOLUTE maxRiskPro

```js
function absoluteMaxRiskPro() public view
returns(uint256)
```

**Returns**

maxStableToken to issue [using mocPrecision].

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### maxRiskProWithDiscount

DISCOUNT maxRiskPro

```js
function maxRiskProWithDiscount() public view
returns(uint256)
```

**Returns**

maxRiskPro for mint with discount [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### globalLockedReserveTokens

GLOBAL lockedReserveTokens

```js
function globalLockedReserveTokens() public view
returns(uint256)
```

**Returns**

lockedReserveTokens amount [using reservePrecision].

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### riskProTecPrice

ReserveTokens price of RiskPro

```js
function riskProTecPrice() public view
returns(uint256)
```

**Returns**

the RiskPro Tec Price [using reservePrecision].

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### bucketRiskProTecPrice

BUCKET ReserveTokens price of RiskPro

```js
function bucketRiskProTecPrice(bytes32 bucket) public view
returns(uint256)
```

**Returns**

the RiskPro Tec Price [using reservePrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | Name of the bucket used | 

### bucketRiskProTecPriceHelper

BUCKET ReserveTokens price of RiskPro (helper)

```js
function bucketRiskProTecPriceHelper(bytes32 bucket) public view
returns(uint256)
```

**Returns**

the RiskPro Tec Price [using reservePrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | Name of the bucket used | 

### riskProDiscountPrice

ReserveTokens price of RiskPro with spot discount applied

```js
function riskProDiscountPrice() public view
returns(uint256)
```

**Returns**

the RiskPro Tec Price [using reservePrecision].

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### riskProUsdPrice

RiskPro USD PRICE

```js
function riskProUsdPrice() public view
returns(uint256)
```

**Returns**

the RiskPro USD Price [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### maxRiskProxRiskProValue

GLOBAL max riskProx to mint

```js
function maxRiskProxRiskProValue(bytes32 bucket) public view
returns(uint256)
```

**Returns**

max RiskPro allowed to be spent to mint RiskProx [using reservePrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | Name of the bucket used | 

### riskProxRiskProPrice

BUCKET RiskProx price in RiskPro

```js
function riskProxRiskProPrice(bytes32 bucket) public view
returns(uint256)
```

**Returns**

RiskPro RiskPro Price [[using mocPrecision]Precision].

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | Name of the bucket used | 

### riskProSpotDiscountRate

GLOBAL ReserveTokens Discount rate to apply to RiskProPrice.

```js
function riskProSpotDiscountRate() public view
returns(uint256)
```

**Returns**

RiskPro discount rate [using DISCOUNT_PRECISION].

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### daysToSettlement

⤿ Overridden Implementation(s): [MoCStateMock.daysToSettlement](MoCStateMock.md#daystosettlement)

Calculates the number of days to next settlement based dayBlockSpan

```js
function daysToSettlement() public view
returns(uint256)
```

**Returns**

days to next settlement

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### blocksToSettlement

Number of blocks to settlement

```js
function blocksToSettlement() public view
returns(uint256)
```

**Returns**

Number of blocks to settlement

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### isLiquidationReached

Verifies if forced liquidation is reached checking if globalCoverage <= liquidation (currently 1.04)
and if liquidation is enabled

```js
function isLiquidationReached() public view
returns(bool)
```

**Returns**

true if liquidation state is reached, false otherwise

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getLiquidationPrice

Returns the price to use for stableToken redeem in a liquidation event

```js
function getLiquidationPrice() public view
returns(uint256)
```

**Returns**

price to use for stableToken redeem in a liquidation event

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getBucketNReserve

```js
function getBucketNReserve(bytes32 bucket) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 |  | 

### getBucketNRiskPro

```js
function getBucketNRiskPro(bytes32 bucket) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 |  | 

### getBucketNStableToken

```js
function getBucketNStableToken(bytes32 bucket) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 |  | 

### getBucketCobj

```js
function getBucketCobj(bytes32 bucket) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 |  | 

### getInrateBag

```js
function getInrateBag(bytes32 bucket) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 |  | 

### getBcons

```js
function getBcons() public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getReserveTokenPrice

```js
function getReserveTokenPrice() public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### calculateReserveTokenMovingAverage

```js
function calculateReserveTokenMovingAverage() public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getLiq

return the value of the liq threshold configuration param

```js
function getLiq() public view
returns(uint256)
```

**Returns**

liq threshold, currently 1.04

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### setLiq

sets the value of the liq threshold configuration param

```js
function setLiq(uint256 _liq) public nonpayable onlyAuthorizedChanger 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _liq | uint256 | liquidation threshold | 

### getUtpdu

return the value of the utpdu threshold configuration param

```js
function getUtpdu() public view
returns(uint256)
```

**Returns**

utpdu Universal TPro discount sales coverage threshold

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### setUtpdu

sets the value of the utpdu threshold configuration param

```js
function setUtpdu(uint256 _utpdu) public nonpayable onlyAuthorizedChanger 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _utpdu | uint256 | Universal TPro discount sales coverage threshold | 

### getPeg

returns the relation between StableToken and dollar. By default it is 1.

```js
function getPeg() public view
returns(uint256)
```

**Returns**

peg relation between StableToken and dollar

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### setPeg

sets the relation between StableToken and dollar. By default it is 1.

```js
function setPeg(uint256 _peg) public nonpayable onlyAuthorizedChanger 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _peg | uint256 | relation between StableToken and dollar | 

### getProtected

return the value of the protected threshold configuration param

```js
function getProtected() public view
returns(uint256)
```

**Returns**

protected threshold, currently 1.5

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### setProtected

sets the value of the protected threshold configuration param

```js
function setProtected(uint256 _protected) public nonpayable onlyAuthorizedChanger 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _protected | uint256 | protected threshold | 

### getLiquidationEnabled

returns if is liquidation enabled.

```js
function getLiquidationEnabled() public view
returns(bool)
```

**Returns**

liquidationEnabled is liquidation enabled

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### setLiquidationEnabled

returns if is liquidation enabled.

```js
function setLiquidationEnabled(bool _liquidationEnabled) public nonpayable onlyAuthorizedChanger 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _liquidationEnabled | bool | is liquidation enabled | 

### nextState

Transitions to next state.

```js
function nextState() public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### setMaxMintRiskPro

Sets max mint RiskPro value

```js
function setMaxMintRiskPro(uint256 _maxMintRiskPro) public nonpayable onlyAuthorizedChanger 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _maxMintRiskPro | uint256 | [using mocPrecision] | 

### getMaxMintRiskPro

return Max value posible to mint of RiskPro

```js
function getMaxMintRiskPro() public view
returns(uint256)
```

**Returns**

maxMintRiskPro

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### setMoCPriceProvider

Sets a new MoCProvider contract

```js
function setMoCPriceProvider(address mocProviderAddress) public nonpayable onlyAuthorizedChanger 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| mocProviderAddress | address | MoC price provider address | 

### getMoCPriceProvider

Gets the MoCPriceProviderAddress

```js
function getMoCPriceProvider() public view
returns(address)
```

**Returns**

MoC price provider address

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getMoCPrice

Gets the MoCPrice

```js
function getMoCPrice() public view
returns(uint256)
```

**Returns**

MoC price

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### setMoCToken

Sets the MoC token contract address

```js
function setMoCToken(address mocTokenAddress) public nonpayable onlyAuthorizedChanger 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| mocTokenAddress | address | MoC token contract address | 

### getMoCToken

Gets the MoC token contract address

```js
function getMoCToken() public view
returns(address)
```

**Returns**

MoC token contract address

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### setMoCVendors

Sets the MoCVendors contract address

```js
function setMoCVendors(address mocVendorsAddress) public nonpayable onlyAuthorizedChanger 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| mocVendorsAddress | address | MoCVendors contract address | 

### getMoCVendors

Gets the MoCVendors contract addfress

```js
function getMoCVendors() public view
returns(address)
```

**Returns**

MoCVendors contract address

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### setMoCTokenInternal

Sets the MoC token contract address (internal function)

```js
function setMoCTokenInternal(address mocTokenAddress) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| mocTokenAddress | address | MoC token contract address | 

### setMoCVendorsInternal

Sets the MoCVendors contract address (internal function)

```js
function setMoCVendorsInternal(address mocVendorsAddress) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| mocVendorsAddress | address | MoCVendors contract address | 

### setLiquidationPrice

Calculates price at liquidation event as the relation between
the stableToken total supply and the amount of ReserveTokens available to distribute

```js
function setLiquidationPrice() internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### initializeValues

```js
function initializeValues(address _governor, address _priceProvider, uint256 _liq, uint256 _utpdu, uint256 _maxDiscRate, uint256 _dayBlockSpan, uint256 _maxMintRiskPro, address _mocPriceProvider, bool _liquidationEnabled, uint256 _protected) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _governor | address |  | 
| _priceProvider | address |  | 
| _liq | uint256 |  | 
| _utpdu | uint256 |  | 
| _maxDiscRate | uint256 |  | 
| _dayBlockSpan | uint256 |  | 
| _maxMintRiskPro | uint256 |  | 
| _mocPriceProvider | address |  | 
| _liquidationEnabled | bool |  | 
| _protected | uint256 |  | 

### initializeContracts

```js
function initializeContracts(address _mocTokenAddress, address _mocVendorsAddress) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _mocTokenAddress | address |  | 
| _mocVendorsAddress | address |  | 

