---
id: version-0.1.10-PriceProviderChanger
title: PriceProviderChanger
original_id: PriceProviderChanger
---

# PriceProviderChanger.sol

View Source: [contracts/changers/PriceProviderChanger.sol](../../contracts/changers/PriceProviderChanger.sol)

**↗ Extends: [ChangeContract](ChangeContract.md), [Ownable](Ownable.md)**

**PriceProviderChanger** - version: 0.1.10

This contract is used to update the configuration of MoCState
with MoC --- governance.

## Contract Members
**Constants & Variables**

```js
contract MoCState public mocState;
address public priceProvider;

```

## Functions

- [(MoCState _mocState, address _priceProvider)](#)
- [execute()](#execute)
- [setPriceProvider(address _priceProvider)](#setpriceprovider)

### 

```js
function (MoCState _mocState, address _priceProvider) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _mocState | MoCState |  | 
| _priceProvider | address |  | 

### execute

⤾ overrides ChangeContract.execute

```js
function execute() external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### setPriceProvider

```js
function setPriceProvider(address _priceProvider) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _priceProvider | address |  | 

