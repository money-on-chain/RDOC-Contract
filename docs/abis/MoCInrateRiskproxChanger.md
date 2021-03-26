---
id: version-0.1.10-MoCInrateRiskproxChanger
title: MoCInrateRiskproxChanger
original_id: MoCInrateRiskproxChanger
---

# MoCInrateRiskproxChanger.sol

View Source: [contracts/changers/MoCInrateRiskproxChanger.sol](../../contracts/changers/MoCInrateRiskproxChanger.sol)

**↗ Extends: [ChangeContract](ChangeContract.md), [Ownable](Ownable.md), [MoCInrateStructs](MoCInrateStructs.md)**

**MoCInrateRiskproxChanger** - version: 0.1.10

This contract is used to update the configuration of MocInrate
with MoC --- governance.

## Contract Members
**Constants & Variables**

```js
contract MoCInrate private mocInrate;

```

## Functions

- [(MoCInrate _mocInrate, uint256 riskProxMin, uint256 riskProxMax, uint256 riskProxPower)](#)
- [execute()](#execute)
- [setRiskProxTmin(uint256 _btxcTmin)](#setriskproxtmin)
- [setRiskProxTmax(uint256 _btxcTax)](#setriskproxtmax)
- [setRiskProxPower(uint256 _btxcPower)](#setriskproxpower)

### 

```js
function (MoCInrate _mocInrate, uint256 riskProxMin, uint256 riskProxMax, uint256 riskProxPower) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _mocInrate | MoCInrate |  | 
| riskProxMin | uint256 |  | 
| riskProxMax | uint256 |  | 
| riskProxPower | uint256 |  | 

### execute

⤾ overrides ChangeContract.execute

```js
function execute() external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### setRiskProxTmin

```js
function setRiskProxTmin(uint256 _btxcTmin) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _btxcTmin | uint256 |  | 

### setRiskProxTmax

```js
function setRiskProxTmax(uint256 _btxcTax) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _btxcTax | uint256 |  | 

### setRiskProxPower

```js
function setRiskProxPower(uint256 _btxcPower) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _btxcPower | uint256 |  | 

