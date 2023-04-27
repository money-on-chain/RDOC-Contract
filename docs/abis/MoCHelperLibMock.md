---
id: version-0.1.10-MoCHelperLibMock
title: MoCHelperLibMock
original_id: MoCHelperLibMock
---

# MoCHelperLibMock.sol

View Source: [contracts/mocks/MoCHelperLibMock.sol](../../contracts/mocks/MoCHelperLibMock.sol)

**MoCHelperLibMock** - version: 0.1.10

## Contract Members
**Constants & Variables**

```js
struct MoCHelperLib.MocLibConfig internal mocLibConfig;
```
---

## MethodCalled

**Parameters**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| name | bytes32 |  | 

## Functions

- [()](#mochelperlibmocksol)
- [spotInrate(uint256 tMin, uint256 tMax, uint256 stableToken0, uint256 stableTokent)](#spotinrate)
- [maxRiskProWithDiscount(uint256 nReserve, uint256 nStableToken, uint256 utpdu, uint256 peg, uint256 reservePrice, uint256 riskProUsdPrice, uint256 spotDiscount)](#maxriskprowithdiscount)
- [inrateAvg(uint256 tMax, uint256 fact, uint256 tMin, uint256 abRat1, uint256 abRat2)](#inrateavg)
- [avgInt(uint256 tMax, uint256 fact, uint256 tMin, uint256 abRat1, uint256 abRat2)](#avgint)
- [potential(uint256 tMax, uint256 fact, uint256 tMin, uint256 abRat)](#potential)
- [integral(uint256 tMax, uint256 fact, uint256 tMin, uint256 abRat)](#integral)
- [riskProSpotDiscountRate(uint256 riskProLiqDiscountRate, uint256 liq, uint256 utpdu, uint256 cov)](#riskprospotdiscountrate)
- [bucketTransferAmountInfiniteLeverage(uint256 nReserve, uint256 delta)](#buckettransferamountinfiniteleverage)
- [bucketTransferAmount(uint256 nReserve, uint256 lev)](#buckettransferamount)
- [coverage(uint256 nReserve, uint256 lB)](#coverage)
- [leverageFromCoverage(uint256 cov)](#leveragefromcoverage)
- [leverage(uint256 nReserve, uint256 lB)](#leverage)
- [maxRiskProxResTokenValue(uint256 nStableToken, uint256 peg, uint256 reservePrice, uint256 lev)](#maxriskproxrestokenvalue)
- [maxRiskProxReserveValueInfiniteLeverage(uint256 nStableToken, uint256 peg, uint256 reservePrice, uint256 delta)](#maxriskproxreservevalueinfiniteleverage)

### 

Constructor

```js
function () public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### spotInrate

```js
function spotInrate(uint256 tMin, uint256 tMax, uint256 stableToken0, uint256 stableTokent) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| tMin | uint256 |  | 
| tMax | uint256 |  | 
| stableToken0 | uint256 |  | 
| stableTokent | uint256 |  | 

### maxRiskProWithDiscount

```js
function maxRiskProWithDiscount(uint256 nReserve, uint256 nStableToken, uint256 utpdu, uint256 peg, uint256 reservePrice, uint256 riskProUsdPrice, uint256 spotDiscount) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| nReserve | uint256 |  | 
| nStableToken | uint256 |  | 
| utpdu | uint256 |  | 
| peg | uint256 |  | 
| reservePrice | uint256 |  | 
| riskProUsdPrice | uint256 |  | 
| spotDiscount | uint256 |  | 

### inrateAvg

```js
function inrateAvg(uint256 tMax, uint256 fact, uint256 tMin, uint256 abRat1, uint256 abRat2) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| tMax | uint256 |  | 
| fact | uint256 |  | 
| tMin | uint256 |  | 
| abRat1 | uint256 |  | 
| abRat2 | uint256 |  | 

### avgInt

```js
function avgInt(uint256 tMax, uint256 fact, uint256 tMin, uint256 abRat1, uint256 abRat2) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| tMax | uint256 |  | 
| fact | uint256 |  | 
| tMin | uint256 |  | 
| abRat1 | uint256 |  | 
| abRat2 | uint256 |  | 

### potential

```js
function potential(uint256 tMax, uint256 fact, uint256 tMin, uint256 abRat) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| tMax | uint256 |  | 
| fact | uint256 |  | 
| tMin | uint256 |  | 
| abRat | uint256 |  | 

### integral

```js
function integral(uint256 tMax, uint256 fact, uint256 tMin, uint256 abRat) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| tMax | uint256 |  | 
| fact | uint256 |  | 
| tMin | uint256 |  | 
| abRat | uint256 |  | 

### riskProSpotDiscountRate

```js
function riskProSpotDiscountRate(uint256 riskProLiqDiscountRate, uint256 liq, uint256 utpdu, uint256 cov) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| riskProLiqDiscountRate | uint256 |  | 
| liq | uint256 |  | 
| utpdu | uint256 |  | 
| cov | uint256 |  | 

### bucketTransferAmountInfiniteLeverage

```js
function bucketTransferAmountInfiniteLeverage(uint256 nReserve, uint256 delta) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| nReserve | uint256 |  | 
| delta | uint256 |  | 

### bucketTransferAmount

```js
function bucketTransferAmount(uint256 nReserve, uint256 lev) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| nReserve | uint256 |  | 
| lev | uint256 |  | 

### coverage

```js
function coverage(uint256 nReserve, uint256 lB) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| nReserve | uint256 |  | 
| lB | uint256 |  | 

### leverageFromCoverage

```js
function leverageFromCoverage(uint256 cov) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| cov | uint256 |  | 

### leverage

```js
function leverage(uint256 nReserve, uint256 lB) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| nReserve | uint256 |  | 
| lB | uint256 |  | 

### maxRiskProxResTokenValue

> ⚠ This has been deprecated since the [Proposal to remove leveraged positions](https://forum.moneyonchain.com/t/removal-of-leveraged-tokens-rif-on-chain/322) from the protocol was **approved**, however it is necessary to maintain the contracts and their documentation for legacy support.

```js
function maxRiskProxResTokenValue(uint256 nStableToken, uint256 peg, uint256 reservePrice, uint256 lev) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| nStableToken | uint256 |  | 
| peg | uint256 |  | 
| reservePrice | uint256 |  | 
| lev | uint256 |  | 

### maxRiskProxReserveValueInfiniteLeverage

```js
function maxRiskProxReserveValueInfiniteLeverage(uint256 nStableToken, uint256 peg, uint256 reservePrice, uint256 delta) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| nStableToken | uint256 |  | 
| peg | uint256 |  | 
| reservePrice | uint256 |  | 
| delta | uint256 |  | 

