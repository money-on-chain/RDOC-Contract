---
id: version-0.1.10-PriceProviderMock
title: PriceProviderMock
original_id: PriceProviderMock
---

# PriceProviderMock.sol

View Source: [contracts/mocks/PriceProviderMock.sol](../../contracts/mocks/PriceProviderMock.sol)

**↗ Extends: [PriceFeed](PriceFeed.md), [PriceProvider](PriceProvider.md)**

**PriceProviderMock** - version: 0.1.10

## Contract Members
**Constants & Variables**

```js
bytes32 internal price;
bool internal has;

```

## Functions

- [(uint256 _price)](#)
- [peek()](#peek)
- [poke(uint128 val_, uint32 )](#poke)
- [post(uint128 val_, uint32 , address )](#post)

### 

```js
function (uint256 _price) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _price | uint256 |  | 

### peek

⤾ overrides [PriceProvider.peek](PriceProvider.md#peek)

```js
function peek() external view
returns(bytes32, bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### poke

⤾ overrides [PriceFeed.poke](PriceFeed.md#poke)

```js
function poke(uint128 val_, uint32 ) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| val_ | uint128 |  | 
|  | uint32 |  | 

### post

⤾ overrides [PriceFeed.post](PriceFeed.md#post)

```js
function post(uint128 val_, uint32 , address ) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| val_ | uint128 |  | 
|  | uint32 |  | 
|  | address |  | 

