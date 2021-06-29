---
id: version-0.1.10-MoCSettlement
title: MoCSettlement
original_id: MoCSettlement
---

# MoCSettlement.sol

View Source: [contracts/MoCSettlement.sol](../../contracts/MoCSettlement.sol)

**↗ Extends: [MoCSettlementEvents](MoCSettlementEvents.md), [MoCBase](MoCBase.md), [PartialExecution](PartialExecution.md), [Governed](Governed.md), [IMoCSettlement](IMoCSettlement.md)**
**↘ Derived Contracts: [MoCSettlementMock](MoCSettlementMock.md)**

**MoCSettlement** - version: 0.1.10

## Structs
### RedeemRequest

```js
struct RedeemRequest {
 address payable who,
 uint256 amount
}
```

### UserRedeemRequest

```js
struct UserRedeemRequest {
 uint256 index,
 bool activeRedeemer
}
```

### SettlementInfo

```js
struct SettlementInfo {
 uint256 reservePrice,
 uint256 riskProxPrice,
 uint256 stableTokenRedeemCount,
 uint256 deleveragingCount,
 uint256 riskProxAmount,
 uint256 partialCommissionAmount,
 uint256 finalCommissionAmount,
 uint256 leverage,
 uint256 startBlockNumber,
 bool isProtectedMode
}
```

## Contract Members
**Constants & Variables**

```js
//public members
bytes32 public constant StableToken_REDEMPTION_TASK;
bytes32 public constant DELEVERAGING_TASK;
bytes32 public constant SETTLEMENT_TASK;

//internal members
contract IMoCState internal mocState;
contract IMoCExchange internal mocExchange;
contract StableToken internal stableToken;
contract MoCRiskProxManager internal riskProxManager;
uint256 internal lastProcessedBlock;
uint256 internal blockSpan;
struct MoCSettlement.SettlementInfo internal settlementInfo;

//private members
struct MoCSettlement.RedeemRequest[] private redeemQueue;
mapping(address => struct MoCSettlement.UserRedeemRequest) private redeemMapping;
uint256 private redeemQueueLength;
uint256[50] private upgradeGap;

```

**Events**

```js
event RedeemRequestAlter(address indexed redeemer, bool  isAddition, uint256  delta);
event RedeemRequestProcessed(address indexed redeemer, uint256  commission, uint256  amount);
event SettlementRedeemStableToken(uint256  queueSize, uint256  accumCommissions, uint256  reservePrice);
event SettlementDeleveraging(uint256  leverage, uint256  riskProxPrice, uint256  reservePrice, uint256  startBlockNumber);
event SettlementStarted(uint256  stableTokenRedeemCount, uint256  deleveragingCount, uint256  riskProxPrice, uint256  reservePrice);
event SettlementCompleted(uint256  commissionsPayed);
```

## Modifiers

- [withinBoundaries](#withinboundaries)
- [isTime](#istime)

### withinBoundaries

Verify that the index is smaller than the length of the redeem request queue

```js
modifier withinBoundaries(uint256 _index) internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _index | uint256 | queue position to get | 

### isTime

```js
modifier isTime() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

## Functions

- [initialize(address connectorAddress, address _governor, uint256 _blockSpan)](#initialize)
- [setBlockSpan(uint256 bSpan)](#setblockspan)
- [setSettlementToStall()](#setsettlementtostall)
- [restartSettlementState()](#restartsettlementstate)
- [getRedeemRequestAt(uint256 _index)](#getredeemrequestat)
- [getBlockSpan()](#getblockspan)
- [redeemQueueSize()](#redeemqueuesize)
- [isSettlementEnabled()](#issettlementenabled)
- [isSettlementRunning()](#issettlementrunning)
- [isSettlementReady()](#issettlementready)
- [nextSettlementBlock()](#nextsettlementblock)
- [stableTokenAmountToRedeem(address _who)](#stabletokenamounttoredeem)
- [addRedeemRequest(uint256 amount, address payable redeemer)](#addredeemrequest)
- [clear()](#clear)
- [alterRedeemRequestAmount(bool isAddition, uint256 delta, address redeemer)](#alterredeemrequestamount)
- [runSettlement(uint256 steps)](#runsettlement)
- [fixTasksPointer()](#fixtaskspointer)
- [initializeContracts()](#initializecontracts)
- [initializeValues(address _governor, uint256 _blockSpan)](#initializevalues)
- [deleveragingStepCount()](#deleveragingstepcount)
- [stableTokenRedemptionStepCount()](#stabletokenredemptionstepcount)
- [initializeSettlement()](#initializesettlement)
- [finishSettlement()](#finishsettlement)
- [finishDeleveraging()](#finishdeleveraging)
- [finishStableTokenRedemption()](#finishstabletokenredemption)
- [deleveragingStep(uint256 )](#deleveragingstep)
- [stableTokenRedemptionStep(uint256 index)](#stabletokenredemptionstep)
- [initializeTasks()](#initializetasks)

### initialize

Initializes the contract

```js
function initialize(address connectorAddress, address _governor, uint256 _blockSpan) public nonpayable initializer 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| connectorAddress | address | MoCConnector contract address | 
| _governor | address | Governor contract address | 
| _blockSpan | uint256 | Blockspan configuration blockspan of settlement | 

### setBlockSpan

⤿ Overridden Implementation(s): [MoCSettlementMock.setBlockSpan](MoCSettlementMock.md#setblockspan)

Set the blockspan configuration blockspan of settlement

```js
function setBlockSpan(uint256 bSpan) public nonpayable onlyAuthorizedChanger 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| bSpan | uint256 |  | 

### setSettlementToStall

Set Settlement to be kept in finnished state after
 all execution is completed.

```js
function setSettlementToStall() public nonpayable onlyAuthorizedChanger 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### restartSettlementState

Set Settlement state to Ready

```js
function restartSettlementState() public nonpayable onlyAuthorizedChanger 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getRedeemRequestAt

⤾ overrides IMoCSettlement.getRedeemRequestAt

Gets the RedeemRequest at the queue index position

```js
function getRedeemRequestAt(uint256 _index) public view withinBoundaries 
returns(address payable, uint256)
```

**Returns**

redeemer's address and amount he submitted

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _index | uint256 | queue position to get | 

### getBlockSpan

Gets the number of blocks the settlemnet will be allowed to run

```js
function getBlockSpan() public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### redeemQueueSize

⤾ overrides IMoCSettlement.redeemQueueSize

returns current redeem queue size

```js
function redeemQueueSize() public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### isSettlementEnabled

⤾ overrides IMoCSettlement.isSettlementEnabled

Returns true if blockSpan number of blocks has pass since last execution

```js
function isSettlementEnabled() public view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### isSettlementRunning

Returns true if the settlment is running

```js
function isSettlementRunning() public view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### isSettlementReady

⤾ overrides IMoCSettlement.isSettlementReady

Returns true if the settlment is ready

```js
function isSettlementReady() public view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### nextSettlementBlock

⤾ overrides IMoCSettlement.nextSettlementBlock

Returns the next block from which settlement is possible

```js
function nextSettlementBlock() public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### stableTokenAmountToRedeem

⤾ overrides IMoCSettlement.stableTokenAmountToRedeem

returns the total amount of StableTokens in the redeem queue for _who

```js
function stableTokenAmountToRedeem(address _who) public view
returns(uint256)
```

**Returns**

total amount of StableTokens in the redeem queue for _who [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _who | address | address for which ^ is computed | 

### addRedeemRequest

⤾ overrides IMoCSettlement.addRedeemRequest

push a new redeem request to the queue for the sender or updates the amount if the user has a redeem request

```js
function addRedeemRequest(uint256 amount, address payable redeemer) public nonpayable onlyWhitelisted 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| amount | uint256 | amount he is willing to redeem [using mocPrecision] | 
| redeemer | address payable | redeemer address | 

### clear

empty the queue

```js
function clear() public nonpayable onlyWhitelisted 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### alterRedeemRequestAmount

⤾ overrides IMoCSettlement.alterRedeemRequestAmount

Alters the redeem amount position for the redeemer

```js
function alterRedeemRequestAmount(bool isAddition, uint256 delta, address redeemer) public nonpayable onlyWhitelisted 
```

**Returns**

the filled amount [using mocPrecision]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| isAddition | bool | true if adding amount to redeem, false to substract. | 
| delta | uint256 | the amount to add/substract to current position [using mocPrecision] | 
| redeemer | address | address to alter amount for | 

### runSettlement

⤾ overrides IMoCSettlement.runSettlement

Runs settlement process in steps

```js
function runSettlement(uint256 steps) public nonpayable onlyWhitelisted isTime 
returns(uint256)
```

**Returns**

The commissions collected in the executed steps

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| steps | uint256 | Amount of steps to run | 

### fixTasksPointer

Create Task structures for Settlement execution

```js
function fixTasksPointer() public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### initializeContracts

```js
function initializeContracts() internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### initializeValues

```js
function initializeValues(address _governor, uint256 _blockSpan) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _governor | address |  | 
| _blockSpan | uint256 |  | 

### deleveragingStepCount

Returns the amount of steps for the Deleveraging task
which is the amount of active RiskProx addresses

```js
function deleveragingStepCount() internal view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### stableTokenRedemptionStepCount

Returns the amount of steps for the StableToken Redemption task
which is the amount of redeem requests in the queue

```js
function stableTokenRedemptionStepCount() internal view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### initializeSettlement

Freezes state for Settlement execution

```js
function initializeSettlement() internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### finishSettlement

Execute final step of Settlement task group

```js
function finishSettlement() internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### finishDeleveraging

Execute final step of Deleveraging task

```js
function finishDeleveraging() internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### finishStableTokenRedemption

Execute final step of StableTokenRedemption task

```js
function finishStableTokenRedemption() internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### deleveragingStep

Individual Deleveraging step to be executed in partial execution
uint256 parameter needed for PartialExecution

```js
function deleveragingStep(uint256 ) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
|  | uint256 |  | 

### stableTokenRedemptionStep

Individual StableTokenRedemption step to be executed in partial execution

```js
function stableTokenRedemptionStep(uint256 index) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| index | uint256 | Step number currently in execution | 

### initializeTasks

Create Task structures for Settlement execution

```js
function initializeTasks() internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

