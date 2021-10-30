---
id: version-0.1.10-Blocker
title: Blocker
original_id: Blocker
---

# Blocker (Blocker.sol)

View Source: [moc-governance/contracts/ChangersTemplates/Blocker.sol](../../moc-governance/contracts/ChangersTemplates/Blocker.sol)

**↗ Extends: [ChangeContract](ChangeContract.md)**
**↘ Derived Contracts: [MockBlocker](MockBlocker.md)**

**Blocker** - version: 0.1.10

This contract is a ChangeContract intended to be used when
you want to block a Blockable (example: BlockableGovernor )

## Contract Members
**Constants & Variables**

```js
contract Blockable public blockable;
uint256 public unblockDate;

```

## Functions

- [(Blockable _blockable, uint256 _unblockDate)](#)
- [execute()](#execute)

### 

Constructor

```js
function (Blockable _blockable, uint256 _unblockDate) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _blockable | Blockable | Address of the contract to be blocked | 
| _unblockDate | uint256 | Date that marks when the blockable will be unblocked | 

### execute

⤾ overrides ChangeContract.execute

Execute the changes.

```js
function execute() external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

