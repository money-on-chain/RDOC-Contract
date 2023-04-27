---
id: version-0.1.10-MoCHelperLib
title: MoCHelperLib
original_id: MoCHelperLib
---

# MoCHelperLib.sol

View Source: [contracts/MoCHelperLib.sol](../../contracts/MoCHelperLib.sol)

**MoCHelperLib** - version: 0.1.10

## Structs
### MocLibConfig

```js
struct MocLibConfig {
 uint256 reservePrecision,
 uint256 dayPrecision,
 uint256 mocPrecision
}
```

## Contract Members
**Constants & Variables**

```js
uint256 internal constant UINT256_MAX;
```
---

## Functions

- [getMaxInt(struct MoCHelperLib.MocLibConfig )](#getmaxint)
- [inrateAvg(struct MoCHelperLib.MocLibConfig config, uint256 tMax, uint256 power, uint256 tMin, uint256 abRat1, uint256 abRat2)](#inrateavg)
- [spotInrate(struct MoCHelperLib.MocLibConfig config, uint256 tMax, uint256 power, uint256 tMin, uint256 abRatio)](#spotinrate)
- [potential(struct MoCHelperLib.MocLibConfig config, uint256 a, uint256 b, uint256 c, uint256 value)](#potential)
- [avgInt(struct MoCHelperLib.MocLibConfig config, uint256 a, uint256 b, uint256 c, uint256 value1, uint256 value2)](#avgint)
- [integral(struct MoCHelperLib.MocLibConfig config, uint256 a, uint256 b, uint256 c, uint256 value)](#integral)
- [abundanceRatio(struct MoCHelperLib.MocLibConfig config, uint256 stableToken0, uint256 stableTokent)](#abundanceratio)
- [riskProSpotDiscountRate(struct MoCHelperLib.MocLibConfig libConfig, uint256 riskProLiqDiscountRate, uint256 liq, uint256 utpdu, uint256 cov)](#riskprospotdiscountrate)
- [maxRiskProWithDiscount(struct MoCHelperLib.MocLibConfig libConfig, uint256 nReserve, uint256 nStableToken, uint256 utpdu, uint256 peg, uint256 reservePrice, uint256 riskProUsdPrice, uint256 spotDiscount)](#maxriskprowithdiscount)
- [maxRiskProWithDiscountAux(struct MoCHelperLib.MocLibConfig libConfig, uint256 nbUsdValue, uint256 nStableToken, uint256 utpdu, uint256 peg, uint256 riskProDiscountPrice)](#maxriskprowithdiscountaux)
- [lockedReserveTokens(struct MoCHelperLib.MocLibConfig libConfig, uint256 reservePrice, uint256 nStableToken, uint256 peg)](#lockedreservetokens)
- [liquidationPrice(struct MoCHelperLib.MocLibConfig libConfig, uint256 resTokenAmount, uint256 nStableToken)](#liquidationprice)
- [riskProTecPrice(struct MoCHelperLib.MocLibConfig libConfig, uint256 nReserve, uint256 lb, uint256 nTP)](#riskprotecprice)
- [riskProxRiskProPrice(struct MoCHelperLib.MocLibConfig libConfig, uint256 riskProxTecPrice, uint256 riskProPrice)](#riskproxriskproprice)
- [applyDiscountRate(struct MoCHelperLib.MocLibConfig libConfig, uint256 price, uint256 discountRate)](#applydiscountrate)
- [getInterestCost(struct MoCHelperLib.MocLibConfig libConfig, uint256 value, uint256 interestRate)](#getinterestcost)
- [coverage(struct MoCHelperLib.MocLibConfig libConfig, uint256 nReserve, uint256 lB)](#coverage)
- [leverageFromCoverage(struct MoCHelperLib.MocLibConfig libConfig, uint256 cov)](#leveragefromcoverage)
- [leverage(struct MoCHelperLib.MocLibConfig libConfig, uint256 nReserve, uint256 lB)](#leverage)
- [stableTokensResTokensValue(struct MoCHelperLib.MocLibConfig libConfig, uint256 amount, uint256 peg, uint256 reservePrice)](#stabletokensrestokensvalue)
- [riskProResTokensValuet(struct MoCHelperLib.MocLibConfig libConfig, uint256 riskProAmount, uint256 riskProResTokenPrice)](#riskprorestokensvaluet)
- [maxStableToken(struct MoCHelperLib.MocLibConfig libConfig, uint256 nReserve, uint256 cobj, uint256 nStableToken, uint256 peg, uint256 reservePrice, uint256 bCons)](#maxstabletoken)
- [maxStableTokenAux(struct MoCHelperLib.MocLibConfig libConfig, uint256 nReserve, uint256 adjCobj, uint256 nStableToken, uint256 peg, uint256 reservePrice)](#maxstabletokenaux)
- [maxRiskPro(struct MoCHelperLib.MocLibConfig libConfig, uint256 nReserve, uint256 cobj, uint256 nStableToken, uint256 peg, uint256 reservePrice, uint256 bCons, uint256 riskProUsdPrice)](#maxriskpro)
- [totalRiskProInResTokens(struct MoCHelperLib.MocLibConfig libConfig, uint256 amount, uint256 riskProPrice)](#totalriskproinrestokens)
- [maxStableTokensWithResTokens(struct MoCHelperLib.MocLibConfig libConfig, uint256 resTokensAmount, uint256 reservePrice)](#maxstabletokenswithrestokens)
- [maxRiskProWithResTokens(struct MoCHelperLib.MocLibConfig libConfig, uint256 resTokensAmount, uint256 riskProPrice)](#maxriskprowithrestokens)
- [bucketTransferAmount(struct MoCHelperLib.MocLibConfig libConfig, uint256 resTokensAmount, uint256 lev)](#buckettransferamount)
- [maxRiskProxResTokenValue(struct MoCHelperLib.MocLibConfig libConfig, uint256 nStableToken, uint256 peg, uint256 reservePrice, uint256 lev)](#maxriskproxrestokenvalue)
- [maxMoCWithReserveToken(struct MoCHelperLib.MocLibConfig , uint256 resTokensAmount, uint256 reservePrice, uint256 mocPrice)](#maxmocwithreservetoken)
- [mocReserveTokenValue(struct MoCHelperLib.MocLibConfig , uint256 amount, uint256 reservePrice, uint256 mocPrice)](#mocreservetokenvalue)
- [mulr(uint256 x, uint256 y, uint256 precision)](#mulr)
- [pow(uint256 x, uint256 n, uint256 precision)](#pow)

### getMaxInt

Returns max uint256 value constant.

```js
function getMaxInt(struct MoCHelperLib.MocLibConfig ) public pure
returns(uint256)
```

**Returns**

max uint256 value constant

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
|  | struct MoCHelperLib.MocLibConfig |  | 

### inrateAvg

Calculates average interest using integral function: T =  Rate = a * (x ** b) + c

```js
function inrateAvg(struct MoCHelperLib.MocLibConfig config, uint256 tMax, uint256 power, uint256 tMin, uint256 abRat1, uint256 abRat2) public view
returns(uint256)
```

**Returns**

average interest rate [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| config | struct MoCHelperLib.MocLibConfig |  | 
| tMax | uint256 | maxInterestRate [using mocPrecision] | 
| power | uint256 | factor [using noPrecision] | 
| tMin | uint256 | minInterestRate C0 stableToken amount [using mocPrecision] | 
| abRat1 | uint256 | initial abundance ratio [using mocPrecision] | 
| abRat2 | uint256 | final abundance ratio [using mocPrecision] | 

### spotInrate

Calculates spot interest rate that RiskProx owners should pay to RiskPro owners: Rate = tMax * (abRatio ** power) + tMin

```js
function spotInrate(struct MoCHelperLib.MocLibConfig config, uint256 tMax, uint256 power, uint256 tMin, uint256 abRatio) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| config | struct MoCHelperLib.MocLibConfig |  | 
| tMax | uint256 | max interest rate [using mocPrecision] | 
| power | uint256 | power to use in the formula [using NoPrecision] | 
| tMin | uint256 | min interest rate [using mocPrecision] | 
| abRatio | uint256 | bucket C0  abundance Ratio [using mocPrecision] | 

### potential

Calculates potential interests function with given parameters: Rate = a * (x ** b) + c

```js
function potential(struct MoCHelperLib.MocLibConfig config, uint256 a, uint256 b, uint256 c, uint256 value) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| config | struct MoCHelperLib.MocLibConfig |  | 
| a | uint256 | maxInterestRate [using mocPrecision] | 
| b | uint256 | factor [using NoPrecision] | 
| c | uint256 | minInterestRate C0 stableToken amount [using mocPrecision] | 
| value | uint256 | global stableToken amount [using mocPrecision] | 

### avgInt

Calculates average of the integral function:
T = (
(c * xf + ((a * (xf ** (b + 1))) / (b + 1))) -
(c * xi + ((a * (xi ** (b + 1))) / (b + 1)))
) / (xf - xi)

```js
function avgInt(struct MoCHelperLib.MocLibConfig config, uint256 a, uint256 b, uint256 c, uint256 value1, uint256 value2) public view
returns(uint256)
```

**Returns**

average interest rate [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| config | struct MoCHelperLib.MocLibConfig |  | 
| a | uint256 | maxInterestRate [using mocPrecision] | 
| b | uint256 | factor [using NoPrecision] | 
| c | uint256 | minInterestRate C0 stableToken amount [using mocPrecision] | 
| value1 | uint256 | value to put in the function [using mocPrecision] | 
| value2 | uint256 | value to put in the function [using mocPrecision] | 

### integral

Calculates integral of the exponential function: T = c * (value) + (a * value ** (b + 1)) / (b + 1))

```js
function integral(struct MoCHelperLib.MocLibConfig config, uint256 a, uint256 b, uint256 c, uint256 value) public view
returns(uint256)
```

**Returns**

integration result [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| config | struct MoCHelperLib.MocLibConfig |  | 
| a | uint256 | maxInterestRate [using mocPrecision] | 
| b | uint256 | factor [using NoPrecision] | 
| c | uint256 | minInterestRate C0 stableToken amount [using mocPrecision] | 
| value | uint256 | value to put in the function [using mocPrecision] | 

### abundanceRatio

Relation between stableTokens in bucket 0 and StableToken total supply

```js
function abundanceRatio(struct MoCHelperLib.MocLibConfig config, uint256 stableToken0, uint256 stableTokent) public view
returns(uint256)
```

**Returns**

abundance ratio [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| config | struct MoCHelperLib.MocLibConfig |  | 
| stableToken0 | uint256 | stableToken count in bucket 0 [using mocPrecision] | 
| stableTokent | uint256 | total stableToken supply [using mocPrecision] | 

### riskProSpotDiscountRate

Returns the Ratio to apply to RiskPro Price in discount situations: SpotDiscountRate = TPD * (utpdu - cob) / (uptdu -liq)

```js
function riskProSpotDiscountRate(struct MoCHelperLib.MocLibConfig libConfig, uint256 riskProLiqDiscountRate, uint256 liq, uint256 utpdu, uint256 cov) public view
returns(uint256)
```

**Returns**

Spot discount rate [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| libConfig | struct MoCHelperLib.MocLibConfig |  | 
| riskProLiqDiscountRate | uint256 | Discount rate applied at Liquidation level coverage [using mocPrecision] | 
| liq | uint256 | Liquidation coverage threshold [using mocPrecision] | 
| utpdu | uint256 | Discount coverage threshold [using mocPrecision] | 
| cov | uint256 | Actual global Coverage threshold [using mocPrecision] | 

### maxRiskProWithDiscount

Max amount of RiskPro to available with discount: MaxRiskProWithDiscount = (uTPDU * nStableToken * PEG - (nReserve * B)) / (TPusd * TPD)

```js
function maxRiskProWithDiscount(struct MoCHelperLib.MocLibConfig libConfig, uint256 nReserve, uint256 nStableToken, uint256 utpdu, uint256 peg, uint256 reservePrice, uint256 riskProUsdPrice, uint256 spotDiscount) public view
returns(uint256)
```

**Returns**

Total RiskPro amount [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| libConfig | struct MoCHelperLib.MocLibConfig |  | 
| nReserve | uint256 | Total ReserveTokens amount [using reservePrecision] | 
| nStableToken | uint256 | StableToken amount [using mocPrecision] | 
| utpdu | uint256 | Discount coverage threshold [using mocPrecision] | 
| peg | uint256 | peg value | 
| reservePrice | uint256 | ReserveTokens price [using mocPrecision] | 
| riskProUsdPrice | uint256 | riskProUsdPrice [using mocPrecision] | 
| spotDiscount | uint256 | spot discount [using mocPrecision] | 

### maxRiskProWithDiscountAux

Max amount of RiskPro to available with discount: MaxRiskProWithDiscount = (uTPDU * nStableToken * PEG - (nReserve * B)) / (TPusd * TPD)

```js
function maxRiskProWithDiscountAux(struct MoCHelperLib.MocLibConfig libConfig, uint256 nbUsdValue, uint256 nStableToken, uint256 utpdu, uint256 peg, uint256 riskProDiscountPrice) internal view
returns(uint256)
```

**Returns**

Total RiskPro amount [using reservePrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| libConfig | struct MoCHelperLib.MocLibConfig |  | 
| nbUsdValue | uint256 | Total amount of ReserveTokens in USD [using mocPrecision] | 
| nStableToken | uint256 | StableToken amount [using mocPrecision] | 
| utpdu | uint256 | Discount coverage threshold [using mocPrecision] | 
| peg | uint256 | peg value | 
| riskProDiscountPrice | uint256 | riskProUsdPrice with discount applied [using mocPrecision] | 

### lockedReserveTokens

Calculates Locked ReserveTokens

```js
function lockedReserveTokens(struct MoCHelperLib.MocLibConfig libConfig, uint256 reservePrice, uint256 nStableToken, uint256 peg) public view
returns(uint256)
```

**Returns**

Locked ReserveTokens [using reservePrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| libConfig | struct MoCHelperLib.MocLibConfig |  | 
| reservePrice | uint256 | ReserveTokens price [using mocPrecision] | 
| nStableToken | uint256 | StableTokens amount [using mocPrecision] | 
| peg | uint256 | peg value | 

### liquidationPrice

Calculates price at liquidation event as a relation between the stableToken total supply
and the amount of ReserveTokens available to distribute

```js
function liquidationPrice(struct MoCHelperLib.MocLibConfig libConfig, uint256 resTokenAmount, uint256 nStableToken) public view
returns(uint256)
```

**Returns**

Price at liquidation event [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| libConfig | struct MoCHelperLib.MocLibConfig |  | 
| resTokenAmount | uint256 | ReserveTokens to distribute [using reservePrecision] | 
| nStableToken | uint256 | StableTokens amount [using mocPrecision] | 

### riskProTecPrice

Calculates RiskPro ReserveTokens: (nReserve-LB) / nTP

```js
function riskProTecPrice(struct MoCHelperLib.MocLibConfig libConfig, uint256 nReserve, uint256 lb, uint256 nTP) public view
returns(uint256)
```

**Returns**

RiskPro ReserveTokens price [using reservePrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| libConfig | struct MoCHelperLib.MocLibConfig |  | 
| nReserve | uint256 | Total ReserveTokens amount [using reservePrecision] | 
| lb | uint256 | Locked ReserveTokens amount [using reservePrecision] | 
| nTP | uint256 | RiskPro amount [using mocPrecision] | 

### riskProxRiskProPrice
 
> ⚠ This has been deprecated since the [Proposal to remove leveraged positions](https://forum.moneyonchain.com/t/removal-of-leveraged-tokens-rif-on-chain/322) from the protocol was **approved**, however it is necessary to maintain the contracts and their documentation for legacy support.

Calculates RiskPro ReserveToken price: RiskProxInRiskPro = riskProxTecPrice / riskProPrice

```js
function riskProxRiskProPrice(struct MoCHelperLib.MocLibConfig libConfig, uint256 riskProxTecPrice, uint256 riskProPrice) public view
returns(uint256)
```

**Returns**

RiskProx price in RiskPro [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| libConfig | struct MoCHelperLib.MocLibConfig |  | 
| riskProxTecPrice | uint256 | RiskProx ReserveTokens price [using reservePrecision] | 
| riskProPrice | uint256 | Trog ReserveTokens price [using reservePrecision] | 

### applyDiscountRate

Returns a new value with the discountRate applied: (price)* (1 - discountRate)

```js
function applyDiscountRate(struct MoCHelperLib.MocLibConfig libConfig, uint256 price, uint256 discountRate) public view
returns(uint256)
```

**Returns**

Price with discount applied [using SomePrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| libConfig | struct MoCHelperLib.MocLibConfig |  | 
| price | uint256 | Price [using SomePrecision] | 
| discountRate | uint256 | Discount rate to apply [using mocPrecision] | 

### getInterestCost

Returns the amount of interest to pay: = price * interestRate

```js
function getInterestCost(struct MoCHelperLib.MocLibConfig libConfig, uint256 value, uint256 interestRate) public view
returns(uint256)
```

**Returns**

Interest cost based on the value and interestRate [using SomePrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| libConfig | struct MoCHelperLib.MocLibConfig |  | 
| value | uint256 | Cost to apply interest [using SomePrecision] | 
| interestRate | uint256 | Interest rate to apply [using mocPrecision] | 

### coverage

Calculates Coverage: nReserve / LB

```js
function coverage(struct MoCHelperLib.MocLibConfig libConfig, uint256 nReserve, uint256 lB) public view
returns(uint256)
```

**Returns**

Coverage [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| libConfig | struct MoCHelperLib.MocLibConfig |  | 
| nReserve | uint256 | Total ReserveTokens amount [using reservePrecision] | 
| lB | uint256 | Locked ReserveTokens amount [using reservePrecision] | 

### leverageFromCoverage

Calculates Leverage from Coverage: Leverage = C / (C - 1)

```js
function leverageFromCoverage(struct MoCHelperLib.MocLibConfig libConfig, uint256 cov) public view
returns(uint256)
```

**Returns**

Leverage [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| libConfig | struct MoCHelperLib.MocLibConfig |  | 
| cov | uint256 | Coverage [using mocPrecision] | 

### leverage

Calculates Leverage: Leverage = nReserve / (nReserve - lB)

```js
function leverage(struct MoCHelperLib.MocLibConfig libConfig, uint256 nReserve, uint256 lB) public view
returns(uint256)
```

**Returns**

Leverage [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| libConfig | struct MoCHelperLib.MocLibConfig |  | 
| nReserve | uint256 | Total ReserveTokens amount [using reservePrecision] | 
| lB | uint256 | Locked ReserveTokens amount [using reservePrecision] | 

### stableTokensResTokensValue

Price in ReserveTokens of the amount of StableTokens

```js
function stableTokensResTokensValue(struct MoCHelperLib.MocLibConfig libConfig, uint256 amount, uint256 peg, uint256 reservePrice) public view
returns(uint256)
```

**Returns**

Total value [using reservePrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| libConfig | struct MoCHelperLib.MocLibConfig |  | 
| amount | uint256 | Total ReserveTokens amount [using reservePrecision] | 
| peg | uint256 |  | 
| reservePrice | uint256 | ReserveTokens price [using mocPrecision] | 

### riskProResTokensValuet

Price in ReserveTokens of the amount of RiskPros

```js
function riskProResTokensValuet(struct MoCHelperLib.MocLibConfig libConfig, uint256 riskProAmount, uint256 riskProResTokenPrice) public view
returns(uint256)
```

**Returns**

Total value [using reservePrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| libConfig | struct MoCHelperLib.MocLibConfig |  | 
| riskProAmount | uint256 | amount of RiskPro [using mocPrecision] | 
| riskProResTokenPrice | uint256 | RiskPro price in ReserveTokens [using reservePrecision] | 

### maxStableToken

Max amount of Docs to issue: MaxStableToken = ((nReserve*B)-(Cobj*B/Bcons*nStableToken*PEG))/(PEG*(Cobj*B/BCons-1))

```js
function maxStableToken(struct MoCHelperLib.MocLibConfig libConfig, uint256 nReserve, uint256 cobj, uint256 nStableToken, uint256 peg, uint256 reservePrice, uint256 bCons) public view
returns(uint256)
```

**Returns**

Total StableTokens amount [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| libConfig | struct MoCHelperLib.MocLibConfig |  | 
| nReserve | uint256 | Total ReserveTokens amount [using reservePrecision] | 
| cobj | uint256 | Target Coverage [using mocPrecision] | 
| nStableToken | uint256 | StableToken amount [using mocPrecision] | 
| peg | uint256 | peg value | 
| reservePrice | uint256 | ReserveTokens price [using mocPrecision] | 
| bCons | uint256 | ReserveTokens conservative price [using mocPrecision] | 

### maxStableTokenAux

```js
function maxStableTokenAux(struct MoCHelperLib.MocLibConfig libConfig, uint256 nReserve, uint256 adjCobj, uint256 nStableToken, uint256 peg, uint256 reservePrice) internal view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| libConfig | struct MoCHelperLib.MocLibConfig |  | 
| nReserve | uint256 |  | 
| adjCobj | uint256 |  | 
| nStableToken | uint256 |  | 
| peg | uint256 |  | 
| reservePrice | uint256 |  | 

### maxRiskPro

Max amount of RiskPro to redeem: MaxRiskPro = ((nReserve*B)-(Cobj*nStableToken*PEG))/TPusd

```js
function maxRiskPro(struct MoCHelperLib.MocLibConfig libConfig, uint256 nReserve, uint256 cobj, uint256 nStableToken, uint256 peg, uint256 reservePrice, uint256 bCons, uint256 riskProUsdPrice) public view
returns(uint256)
```

**Returns**

Total RiskPro amount [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| libConfig | struct MoCHelperLib.MocLibConfig |  | 
| nReserve | uint256 | Total ReserveTokens amount [using reservePrecision] | 
| cobj | uint256 | Target Coverage [using mocPrecision] | 
| nStableToken | uint256 | Target Coverage [using mocPrecision] | 
| peg | uint256 | peg value | 
| reservePrice | uint256 | ReserveTokens price [using mocPrecision] | 
| bCons | uint256 | ReserveTokens conservative price [using mocPrecision] | 
| riskProUsdPrice | uint256 | riskProUsdPrice [using mocPrecision] | 

### totalRiskProInResTokens

Calculates the total ReserveTokens price of the amount of RiskPros

```js
function totalRiskProInResTokens(struct MoCHelperLib.MocLibConfig libConfig, uint256 amount, uint256 riskProPrice) public view
returns(uint256)
```

**Returns**

RiskPro total value in ReserveTokens [using reservePrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| libConfig | struct MoCHelperLib.MocLibConfig |  | 
| amount | uint256 | Amount of RiskPro [using mocPrecision] | 
| riskProPrice | uint256 | RiskPro ReserveTokens Price [using reservePrecision] | 

### maxStableTokensWithResTokens

Calculates the equivalent in StableTokens of the resTokensAmount

```js
function maxStableTokensWithResTokens(struct MoCHelperLib.MocLibConfig libConfig, uint256 resTokensAmount, uint256 reservePrice) public view
returns(uint256)
```

**Returns**

Equivalent StableToken amount [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| libConfig | struct MoCHelperLib.MocLibConfig |  | 
| resTokensAmount | uint256 | ReserveTokens  amount [using reservePrecision] | 
| reservePrice | uint256 | ReserveTokens price [using mocPrecision] | 

### maxRiskProWithResTokens

Calculates the equivalent in RiskPro of the resTokensAmount

```js
function maxRiskProWithResTokens(struct MoCHelperLib.MocLibConfig libConfig, uint256 resTokensAmount, uint256 riskProPrice) public view
returns(uint256)
```

**Returns**

Equivalent RiskPro amount [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| libConfig | struct MoCHelperLib.MocLibConfig |  | 
| resTokensAmount | uint256 | ReserveTokens amount [using reservePrecision] | 
| riskProPrice | uint256 | RiskPro ReserveTokens price [using reservePrecision] | 

### bucketTransferAmount

Calculates the ResToken amount to move from C0 bucket to
an L bucket when a RiskProx minting occurs: toMove = resTokensAmount * (lev - 1)

```js
function bucketTransferAmount(struct MoCHelperLib.MocLibConfig libConfig, uint256 resTokensAmount, uint256 lev) public view
returns(uint256)
```

**Returns**

resTokens to move [using reservePrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| libConfig | struct MoCHelperLib.MocLibConfig |  | 
| resTokensAmount | uint256 | Total ReserveTokens amount [using reservePrecision] | 
| lev | uint256 | L bucket leverage [using mocPrecision] | 

### maxRiskProxResTokenValue
 
> ⚠ This has been deprecated since the [Proposal to remove leveraged positions](https://forum.moneyonchain.com/t/removal-of-leveraged-tokens-rif-on-chain/322) from the protocol was **approved**, however it is necessary to maintain the contracts and their documentation for legacy support.

Max amount of ReserveTokens allowed to be used to mint riskProx: MaxriskProx = nStableToken/ (PEG*B*(lev-1))

```js
function maxRiskProxResTokenValue(struct MoCHelperLib.MocLibConfig libConfig, uint256 nStableToken, uint256 peg, uint256 reservePrice, uint256 lev) public view
returns(uint256)
```

**Returns**

Max riskProx ReserveTokens value [using reservePrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| libConfig | struct MoCHelperLib.MocLibConfig |  | 
| nStableToken | uint256 | number of StableToken [using mocPrecision] | 
| peg | uint256 | peg value | 
| reservePrice | uint256 | ReserveTokens price [using mocPrecision] | 
| lev | uint256 | leverage [using mocPrecision] | 

### maxMoCWithReserveToken

Calculates the equivalent in MoC of the reserve token

```js
function maxMoCWithReserveToken(struct MoCHelperLib.MocLibConfig , uint256 resTokensAmount, uint256 reservePrice, uint256 mocPrice) public pure
returns(uint256)
```

**Returns**

Equivalent MoC amount

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
|  | struct MoCHelperLib.MocLibConfig | resTokensAmount Total ReserveTokens amount | 
| resTokensAmount | uint256 | Total ReserveTokens amount | 
| reservePrice | uint256 | ReserveTokens price | 
| mocPrice | uint256 | MoC price | 

### mocReserveTokenValue

Calculates the equivalent in reserve token of the MoC amount

```js
function mocReserveTokenValue(struct MoCHelperLib.MocLibConfig , uint256 amount, uint256 reservePrice, uint256 mocPrice) public pure
returns(uint256)
```

**Returns**

Equivalent ReserveToken amount

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
|  | struct MoCHelperLib.MocLibConfig | amount MoC amount | 
| amount | uint256 | MoC amount | 
| reservePrice | uint256 | ReserveTokens price | 
| mocPrice | uint256 | MoC price | 

### mulr

Rounding product adapted from DSMath but with custom precision

```js
function mulr(uint256 x, uint256 y, uint256 precision) internal pure
returns(z uint256)
```

**Returns**

Product

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| x | uint256 | Multiplicand | 
| y | uint256 | Multiplier | 
| precision | uint256 |  | 

### pow

Potentiation by squaring adapted from DSMath but with custom precision

```js
function pow(uint256 x, uint256 n, uint256 precision) internal pure
returns(z uint256)
```

**Returns**

power

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| x | uint256 | Base | 
| n | uint256 | Exponent | 
| precision | uint256 |  | 

