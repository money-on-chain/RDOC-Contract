---
id: version-0.1.10-Blockable
title: Blockable
original_id: Blockable
---

# Blockable (Blockable.sol)

View Source: [moc-governance/contracts/Blockability/Blockable.sol](../../moc-governance/contracts/Blockability/Blockable.sol)

**↗ Extends: [Initializable](Initializable.md)**

**Blockable** - version: 0.1.10

Base contract to be able to define a blockable contract. The blocked contract
is blocked until a certain date. That date cannot be changed while the contract is blocked so
it is guaranteed that you will be blocked until that date

## Contract Members
**Constants & Variables**

```js
string private constant NOT_AUTHORIZED_TO_BLOCK;
```
---

```js
string private constant BLOCKED;
```
---

```js
string private constant THRESHOLD_TOO_LOW;
```
---

```js
uint256[50] private upgradeGap;
```
---

```js
uint256 public unblockDate;
```
---

## Modifiers

- [notBlocked](#notblocked)

### notBlocked

Disables functions that should be disabled when the governor is blocked

```js
modifier notBlocked() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

## Functions

- [isBlocked()](#isblocked)
- [initialize(uint256 _firstUnblockDate)](#initialize)
- [isAuthorizedToBlock(address who)](#isauthorizedtoblock)
- [blockUntil(uint256 newUnblockDate)](#blockuntil)

### isBlocked

Returns true if no change can be executed in the current block

```js
function isBlocked() public view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### initialize

Initialize the contract with the basic settingsThis initialize replaces the constructor but it is not called automatically.
It is necessary because of the upgradeability of the contracts

```js
function initialize(uint256 _firstUnblockDate) public nonpayable initializer 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _firstUnblockDate | uint256 | Timestamp of the first threshold that should be passed before the governor is activeagain | 

### isAuthorizedToBlock

Defines which addresses are authorized to Block and which are notShould be defined by subclasses

```js
function isAuthorizedToBlock(address who) public view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| who | address | Address that is being asked for | 

### blockUntil

Blocks the governor until unblockAtThe new threshold should be big enough to block the governor after the tx and the contract should not be blocked, but that is enforced
in the executeChange function which ALWAYS should be called before calling this function because it is the only one authorizing a changer

```js
function blockUntil(uint256 newUnblockDate) public nonpayable notBlocked 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| newUnblockDate | uint256 | Timestamp of the next threshold that should be passed before the governor is activeagain | 

