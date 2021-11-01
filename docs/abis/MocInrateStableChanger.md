---
id: version-0.1.10-MocInrateStableChanger
title: MocInrateStableChanger
original_id: MocInrateStableChanger
---

# MocInrateStableChanger.sol

View Source: [contracts/changers/MoCInrateStableChanger.sol](../../contracts/changers/MoCInrateStableChanger.sol)

**↗ Extends: [ChangeContract](ChangeContract.md), [Ownable](Ownable.md)**

**MocInrateStableChanger** - version: 0.1.10

This contract is used to update the configuration of MocInrate
with MoC --- governance.

## Contract Members
**Constants & Variables**

```js
contract MoCInrate private mocInrate;
```
---

```js
uint256 public stableTmin;
```
---

```js
uint256 public stableTmax;
```
---

```js
uint256 public stablePower;
```
---

## Functions

- [(MoCInrate _mocInrate, uint256 _stableTmin, uint256 _stableTmax, uint256 _stablePower)](#mocinratestablechangersol)
- [execute()](#execute)
- [setStableTmin(uint256 _stableTmin)](#setstabletmin)
- [setStableTmax(uint256 _stableTmax)](#setstabletmax)
- [setStablePower(uint256 _stablePower)](#setstablepower)

### 

```js
function (MoCInrate _mocInrate, uint256 _stableTmin, uint256 _stableTmax, uint256 _stablePower) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _mocInrate | MoCInrate |  | 
| _stableTmin | uint256 |  | 
| _stableTmax | uint256 |  | 
| _stablePower | uint256 |  | 

### execute

⤾ overrides ChangeContract.execute

```js
function execute() external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### setStableTmin

```js
function setStableTmin(uint256 _stableTmin) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _stableTmin | uint256 |  | 

### setStableTmax

```js
function setStableTmax(uint256 _stableTmax) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _stableTmax | uint256 |  | 

### setStablePower

```js
function setStablePower(uint256 _stablePower) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _stablePower | uint256 |  | 

