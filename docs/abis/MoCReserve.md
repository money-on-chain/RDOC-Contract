---
id: version-0.1.10-MoCReserve
title: MoCReserve
original_id: MoCReserve
---

# MoCReserve.sol

View Source: [contracts/base/MoCReserve.sol](../../contracts/base/MoCReserve.sol)

**↘ Derived Contracts: [MoC](MoC.md), [MoCEvents](MoCEvents.md)**

**MoCReserve** - version: 0.1.10

## Contract Members
**Constants & Variables**

```js
//public members
contract IERC20 public reserveToken;

//private members
uint256[50] private upgradeGap;

```

**Events**

```js
event CallRevert();
event DepositFailed(address indexed origin, uint256  amount);
event WithdrawFailed(address indexed destination, uint256  amount);
```

## Modifiers

- [enoughAllowance](#enoughallowance)

### enoughAllowance

```js
modifier enoughAllowance(uint256 amount, address account) internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| amount | uint256 |  | 
| account | address |  | 

## Functions

- [getAllowance(address account)](#getallowance)
- [deposit(uint256 amount, address origin)](#deposit)
- [withdraw(uint256 amount, address destination)](#withdraw)
- [setReserveToken(address token)](#setreservetoken)
- [safeTransfer(address to, uint256 amount)](#safetransfer)
- [safeTransferFrom(address origin, uint256 amount)](#safetransferfrom)
- [safeCall(bytes callData)](#safecall)

### getAllowance

Returns the amount of token reserve an account
is allowed to use for deposit.

```js
function getAllowance(address account) public view
returns(uint256)
```

**Returns**

The minimum value between MoC allowance for that account and the account's balance.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| account | address | User account to check allowance. | 

### deposit

Deposit reserve tokens into MoC address takeing it from origin address.
Allowance of the amount should be made it before this.

```js
function deposit(uint256 amount, address origin) internal nonpayable enoughAllowance 
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| amount | uint256 | Amount of reserve tokens to transfer. | 
| origin | address | Account from which to take the funds. | 

### withdraw

Deposit reserve tokens into MoC address takeing it from origin address.
Allowance of the amount should be made it before this.

```js
function withdraw(uint256 amount, address destination) internal nonpayable
returns(bool)
```

**Returns**

true if transfer is successfull and false if not.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| amount | uint256 | Amount of reserve tokens to extract. | 
| destination | address | Account to which the funds will be sent. | 

### setReserveToken

```js
function setReserveToken(address token) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| token | address |  | 

### safeTransfer

Calls RRC20 transfer function and returns a boolean result even
if transaction reverts.

```js
function safeTransfer(address to, uint256 amount) internal nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| to | address | Destination account of the funds. | 
| amount | uint256 | Funds to move. | 

### safeTransferFrom

Calls RRC20 transferFrom function and returns a boolean result even
if transaction reverts

```js
function safeTransferFrom(address origin, uint256 amount) internal nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| origin | address | Destination account of the funds. | 
| amount | uint256 | Funds to move. | 

### safeCall

Wraps an RRC20 transfer with a low level call to handle revert secenario
Emits CallRevert if call fails for revert

```js
function safeCall(bytes callData) internal nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| callData | bytes | Packed encoded data to use as call parameter. | 

