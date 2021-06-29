---
id: version-0.1.10-MoCConverter
title: MoCConverter
original_id: MoCConverter
---

# MoCConverter.sol

View Source: [contracts/MoCConverter.sol](../../contracts/MoCConverter.sol)

**↗ Extends: [MoCBase](MoCBase.md), [MoCLibConnection](MoCLibConnection.md)**

**MoCConverter** - version: 0.1.10

## Contract Members
**Constants & Variables**

```js
//internal members
contract IMoCState internal mocState;

//private members
uint256[50] private upgradeGap;

```

## Functions

- [initialize(address connectorAddress)](#initialize)
- [riskProToResToken(uint256 amount)](#riskprotorestoken)
- [resTokenToRiskPro(uint256 resTokensAmount)](#restokentoriskpro)
- [riskProDiscToResToken(uint256 amount)](#riskprodisctorestoken)
- [resTokenToRiskProDisc(uint256 resTokensAmount)](#restokentoriskprodisc)
- [stableTokensToResToken(uint256 stableTokenAmount)](#stabletokenstorestoken)
- [stableTokensToResTokenWithPrice(uint256 stableTokenAmount, uint256 reservePrice)](#stabletokenstorestokenwithprice)
- [resTokenToStableToken(uint256 resTokensAmount)](#restokentostabletoken)
- [riskProxToResToken(uint256 riskProxAmount, bytes32 bucket)](#riskproxtorestoken)
- [riskProxToResTokenHelper(uint256 riskProxAmount, bytes32 bucket)](#riskproxtorestokenhelper)
- [resTokenToRiskProx(uint256 resTokensAmount, bytes32 bucket)](#restokentoriskprox)
- [resTokenToRiskProWithPrice(uint256 resTokensAmount, uint256 price)](#restokentoriskprowithprice)
- [riskProToResTokenWithPrice(uint256 riskProAmount, uint256 riskProPrice)](#riskprotorestokenwithprice)
- [mocToResToken(uint256 mocAmount)](#moctorestoken)
- [resTokenToMoC(uint256 resTokensAmount)](#restokentomoc)

### initialize

```js
function initialize(address connectorAddress) public nonpayable initializer 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| connectorAddress | address |  | 

### riskProToResToken

ReserveTokens equivalent for the amount of riskPros given

```js
function riskProToResToken(uint256 amount) public view
returns(uint256)
```

**Returns**

total ReserveTokens Price of the amount RiskPros [using reservePrecision].

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| amount | uint256 | Amount of RiskPro to calculate the total price | 

### resTokenToRiskPro

Converts Reserve to RiskPro

```js
function resTokenToRiskPro(uint256 resTokensAmount) public view
returns(uint256)
```

**Returns**

RiskPro amount

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| resTokensAmount | uint256 | Reserve amount | 

### riskProDiscToResToken

ReserveTokens equivalent for the amount of riskPro given applying the spotDiscountRate

```js
function riskProDiscToResToken(uint256 amount) public view
returns(uint256)
```

**Returns**

Reserve amount

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| amount | uint256 | amount of RiskPro [using reservePrecision] | 

### resTokenToRiskProDisc

```js
function resTokenToRiskProDisc(uint256 resTokensAmount) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| resTokensAmount | uint256 |  | 

### stableTokensToResToken

```js
function stableTokensToResToken(uint256 stableTokenAmount) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| stableTokenAmount | uint256 |  | 

### stableTokensToResTokenWithPrice

```js
function stableTokensToResTokenWithPrice(uint256 stableTokenAmount, uint256 reservePrice) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| stableTokenAmount | uint256 |  | 
| reservePrice | uint256 |  | 

### resTokenToStableToken

```js
function resTokenToStableToken(uint256 resTokensAmount) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| resTokensAmount | uint256 |  | 

### riskProxToResToken

```js
function riskProxToResToken(uint256 riskProxAmount, bytes32 bucket) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| riskProxAmount | uint256 |  | 
| bucket | bytes32 |  | 

### riskProxToResTokenHelper

```js
function riskProxToResTokenHelper(uint256 riskProxAmount, bytes32 bucket) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| riskProxAmount | uint256 |  | 
| bucket | bytes32 |  | 

### resTokenToRiskProx

```js
function resTokenToRiskProx(uint256 resTokensAmount, bytes32 bucket) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| resTokensAmount | uint256 |  | 
| bucket | bytes32 |  | 

### resTokenToRiskProWithPrice

```js
function resTokenToRiskProWithPrice(uint256 resTokensAmount, uint256 price) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| resTokensAmount | uint256 |  | 
| price | uint256 |  | 

### riskProToResTokenWithPrice

```js
function riskProToResTokenWithPrice(uint256 riskProAmount, uint256 riskProPrice) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| riskProAmount | uint256 |  | 
| riskProPrice | uint256 |  | 

### mocToResToken

```js
function mocToResToken(uint256 mocAmount) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| mocAmount | uint256 |  | 

### resTokenToMoC

```js
function resTokenToMoC(uint256 resTokensAmount) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| resTokensAmount | uint256 |  | 

