---
id: version-0.1.10-MoCConnector
title: MoCConnector
original_id: MoCConnector
---

# MoCConnector.sol

View Source: [contracts/base/MoCConnector.sol](../../contracts/base/MoCConnector.sol)

**↗ Extends: [MoCWhitelist](MoCWhitelist.md), [Initializable](Initializable.md)**

**MoCConnector** - version: 0.1.10

Provides access control between all MoC Contracts

## Contract Members
**Constants & Variables**

```js
address payable public moc;
```
---

```js
address public stableToken;
```
---

```js
address public riskProToken;
```
---

```js
address public riskProxManager;
```
---

```js
address public mocState;
```
---

```js
address public DEPRECATED_mocConverter;
```
---

```js
address public mocSettlement;
```
---

```js
address public mocExchange;
```
---

```js
address public mocInrate;
```
---

```js
address public mocBurnout;
```
---

```js
address public reserveToken;
```
---

```js
bool internal initialized;
```
---

```js
uint256[50] private upgradeGap;
```
---

## Functions

- [initialize(address payable mocAddress, address stableTokenAddress, address riskProAddress, address riskProxAddress, address stateAddress, address settlementAddress, address exchangeAddress, address inrateAddress, address burnoutBookAddress, address reserveTokenAddress)](#initialize)

### initialize

Initializes the contract

```js
function initialize(address payable mocAddress, address stableTokenAddress, address riskProAddress, address riskProxAddress, address stateAddress, address settlementAddress, address exchangeAddress, address inrateAddress, address burnoutBookAddress, address reserveTokenAddress) public nonpayable initializer 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| mocAddress | address payable | MoC contract address | 
| stableTokenAddress | address | Stable token contract address | 
| riskProAddress | address | RiskPro token contract address | 
| riskProxAddress | address | RiskProxManager contract address | 
| stateAddress | address | MoCState contract address | 
| settlementAddress | address | MoCSettlement contract address | 
| exchangeAddress | address | MoCExchange contract address | 
| inrateAddress | address | MoCInrate contract address | 
| burnoutBookAddress | address | (DEPRECATED) MoCBurnout contract address. DO NOT USE. | 
| reserveTokenAddress | address | Reserve token contract address | 

