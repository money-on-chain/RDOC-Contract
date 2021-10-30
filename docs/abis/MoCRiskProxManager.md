---
id: version-0.1.10-MoCRiskProxManager
title: MoCRiskProxManager
original_id: MoCRiskProxManager
---

# MoCRiskProxManager.sol

View Source: [contracts/MoCRiskProxManager.sol](../../contracts/MoCRiskProxManager.sol)

**↗ Extends: [MoCBucketContainer](MoCBucketContainer.md)**

**MoCRiskProxManager** - version: 0.1.10

## Contract Members
**Constants & Variables**

```js
//internal members
uint256 internal constant MIN_ALLOWED_BALANCE;

//private members
uint256[50] private upgradeGap;

```

## Functions

- [initialize(address connectorAddress, address _governor, uint256 _c0Cobj, uint256 _x2Cobj)](#initialize)
- [riskProxBalanceOf(bytes32 bucket, address userAddress)](#riskproxbalanceof)
- [hasValidBalance(bytes32 bucket, address userAddress, uint256 index)](#hasvalidbalance)
- [assignRiskProx(bytes32 bucket, address payable account, uint256 riskProxAmount, uint256 totalCost)](#assignriskprox)
- [removeRiskProx(bytes32 bucket, address payable userAddress, uint256 riskProxAmount, uint256 totalCost)](#removeriskprox)
- [setRiskProxBalanceOf(bytes32 bucket, address payable userAddress, uint256 value)](#setriskproxbalanceof)
- [initializeValues(address _governor)](#initializevalues)

### initialize

```js
function initialize(address connectorAddress, address _governor, uint256 _c0Cobj, uint256 _x2Cobj) public nonpayable initializer 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| connectorAddress | address |  | 
| _governor | address |  | 
| _c0Cobj | uint256 |  | 
| _x2Cobj | uint256 |  | 

### riskProxBalanceOf

returns user balance

```js
function riskProxBalanceOf(bytes32 bucket, address userAddress) public view
returns(uint256)
```

**Returns**

total balance for the userAddress

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | RiskProx corresponding bucket to get balance from | 
| userAddress | address | user address to get balance from | 

### hasValidBalance

verifies that this user has assigned balance for the given bucket

```js
function hasValidBalance(bytes32 bucket, address userAddress, uint256 index) public view
returns(bool)
```

**Returns**

true if the user has assigned balance

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | corresponding Leveraged bucket to get balance from | 
| userAddress | address | user address to verify balance for | 
| index | uint256 | index, starting from 1, where the address of the user is being kept | 

### assignRiskProx

Assigns the amount of RiskProx

```js
function assignRiskProx(bytes32 bucket, address payable account, uint256 riskProxAmount, uint256 totalCost) public nonpayable onlyWhitelisted 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | bucket from which the RiskProx will be removed | 
| account | address payable | user address to redeem for | 
| riskProxAmount | uint256 | riskProx amount to redeem [using mocPresicion] | 
| totalCost | uint256 | ReserveToken value of riskProxAmount [using reservePrecision] | 

### removeRiskProx

Removes the amount of RiskProx and substract ReserveTokens from bucket

```js
function removeRiskProx(bytes32 bucket, address payable userAddress, uint256 riskProxAmount, uint256 totalCost) public nonpayable onlyWhitelisted 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | bucket from which the RiskProx will be removed | 
| userAddress | address payable | user address to redeem for | 
| riskProxAmount | uint256 | riskProx amount to redeem [using mocPresicion] | 
| totalCost | uint256 | reserveToken value of riskProxAmount [using reservePrecision] | 

### setRiskProxBalanceOf

Sets the amount of RiskProx

```js
function setRiskProxBalanceOf(bytes32 bucket, address payable userAddress, uint256 value) public nonpayable onlyWhitelisted 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bucket | bytes32 | bucket from which the RiskProx will be setted | 
| userAddress | address payable | user address to redeem for | 
| value | uint256 | riskProx amount to redeem [using mocPresicion] | 

### initializeValues

intializes values of the contract

```js
function initializeValues(address _governor) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _governor | address |  | 

