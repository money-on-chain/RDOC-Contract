---
id: version-0.1.10-MoCEMACalculator
title: MoCEMACalculator
original_id: MoCEMACalculator
---

# ReserveToken Price Provider. (MoCEMACalculator.sol)

View Source: [contracts/MoCEMACalculator.sol](../../contracts/MoCEMACalculator.sol)

**↗ Extends: [Governed](Governed.md)**
**↘ Derived Contracts: [MoCState](MoCState.md)**

**MoCEMACalculator** - version: 0.1.10

## Contract Members
**Constants & Variables**

```js
uint256 internal exponentialMovingAverage;
```
---

```js
uint256 public smoothingFactor;
```
---

```js
uint256 public lastEmaCalculation;
```
---

```js
uint256 public emaCalculationBlockSpan;
```
---

```js
uint256 public constant PRICE_PRECISION;
```
---

```js
uint256 public constant FACTOR_PRECISION;
```
---

```js
uint256[50] private upgradeGap;
```
---

## MovingAverageCalculation

**Parameters**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| price | uint256 |  | 
| movingAverage | uint256 |  | 

## Functions

- [getExponentalMovingAverage()](#getexponentalmovingaverage)
- [getSmoothingFactor()](#getsmoothingfactor)
- [setSmoothingFactor(uint256 factor)](#setsmoothingfactor)
- [getGovernorAddress()](#getgovernoraddress)
- [getEmaCalculationBlockSpan()](#getemacalculationblockspan)
- [setEmaCalculationBlockSpan(uint256 blockSpan)](#setemacalculationblockspan)
- [shouldCalculateEma()](#shouldcalculateema)
- [getLastEmaCalculation()](#getlastemacalculation)
- [initializeMovingAverage(uint256 initialEma, uint256 smoothFactor, uint256 emaBlockSpan)](#initializemovingaverage)
- [setExponentalMovingAverage(uint256 reservePrice)](#setexponentalmovingaverage)
- [coefficientComp()](#coefficientcomp)
- [initializeGovernor(address _governor)](#initializegovernor)
- [_doSetSmoothingFactor(uint256 factor)](#_dosetsmoothingfactor)

### getExponentalMovingAverage

```js
function getExponentalMovingAverage() public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getSmoothingFactor

```js
function getSmoothingFactor() public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### setSmoothingFactor

```js
function setSmoothingFactor(uint256 factor) public nonpayable onlyAuthorizedChanger 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| factor | uint256 |  | 

### getGovernorAddress

```js
function getGovernorAddress() public view
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getEmaCalculationBlockSpan

```js
function getEmaCalculationBlockSpan() public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### setEmaCalculationBlockSpan

```js
function setEmaCalculationBlockSpan(uint256 blockSpan) public nonpayable onlyAuthorizedChanger 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| blockSpan | uint256 | Defines how many blocks should pass between EMA calculations* | 

### shouldCalculateEma

```js
function shouldCalculateEma() public view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getLastEmaCalculation

```js
function getLastEmaCalculation() public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### initializeMovingAverage

Provides ResToken's Price and Moving average.
More information of EMA calculation https://en.wikipedia.org/wiki/Exponential_smoothing

```js
function initializeMovingAverage(uint256 initialEma, uint256 smoothFactor, uint256 emaBlockSpan) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| initialEma | uint256 | Initial ema value | 
| smoothFactor | uint256 | Weight coefficient for EMA calculation. | 
| emaBlockSpan | uint256 | Block count in a period for EMA calculation | 

### setExponentalMovingAverage

Calculates a EMA of the price.
More information of EMA calculation https://en.wikipedia.org/wiki/Exponential_smoothing

```js
function setExponentalMovingAverage(uint256 reservePrice) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| reservePrice | uint256 | Current price. | 

### coefficientComp

Calculates the smoothing factor complement

```js
function coefficientComp() internal view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### initializeGovernor

```js
function initializeGovernor(address _governor) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _governor | address |  | 

### _doSetSmoothingFactor

```js
function _doSetSmoothingFactor(uint256 factor) private nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| factor | uint256 |  | 

