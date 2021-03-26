---
id: version-0.1.10-ReserveToken
title: ReserveToken
original_id: ReserveToken
---

# ReserveToken.sol

View Source: [contracts/test-contracts/ReserveToken.sol](../../contracts/test-contracts/ReserveToken.sol)

**↗ Extends: [ERC20Detailed](ERC20Detailed.md), [ERC20](ERC20.md)**

**ReserveToken** - version: 0.1.10

## Contract Members
**Constants & Variables**

```js
//private members
string private _name;
string private _symbol;
uint8 private _decimals;
bool private failState;

//public members
mapping(address => bool) public blacklist;

```

## Modifiers

- [notBlacklisted](#notblacklisted)

### notBlacklisted

```js
modifier notBlacklisted(address account) internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| account | address |  | 

## Functions

- [()](#)
- [claim(uint256 amount)](#claim)
- [setToFail(bool toFail)](#settofail)
- [blacklistAccount(address account)](#blacklistaccount)
- [transfer(address recipient, uint256 amount)](#transfer)
- [transferFrom(address sender, address recipient, uint256 amount)](#transferfrom)

### 

```js
function () public nonpayable ERC20Detailed 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### claim

Only for testing purposes, any user can claim any amount

```js
function claim(uint256 amount) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| amount | uint256 |  | 

### setToFail

Set if contract should fail on every transfer or transferFrom operation

```js
function setToFail(bool toFail) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| toFail | bool |  | 

### blacklistAccount

Blacklist an address

```js
function blacklistAccount(address account) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| account | address |  | 

### transfer

⤾ overrides ERC20.transfer

```js
function transfer(address recipient, uint256 amount) public nonpayable notBlacklisted notBlacklisted 
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| recipient | address |  | 
| amount | uint256 |  | 

### transferFrom

⤾ overrides ERC20.transferFrom

```js
function transferFrom(address sender, address recipient, uint256 amount) public nonpayable notBlacklisted notBlacklisted notBlacklisted 
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| sender | address |  | 
| recipient | address |  | 
| amount | uint256 |  | 

