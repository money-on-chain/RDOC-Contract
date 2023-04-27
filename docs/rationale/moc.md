# MoC

- Referenced by: MoCSettlement
- References/uses: SafeMath, MoCLibConnection, StableToken, RiskProToken, PriceProvider, MoCRiskProxManager, MoCState, MoCConverter, MoCSettlement, MoCExchange, base/MoCBase
- Inherits from: MoCEvents, MoCLibConnection, MoCBase, Stoppable

  MoC is the main contract of the RoC ecosystem, it's the entry point of almost every public interaction with it and it articulates the main logic and relations between the rest of the contracts.
  It is also the _only one_ that receives RIF and holds the actual value of the system. The only methods that correspond with the actual two ways of adding "value" to the system minting RIFPro and RDOC: - `function mintRiskProVendors() public transitionState() { ... }` - `function mintStableTokenVendors() public transitionState() atLeastState(MoCState.States.AboveCobj) { ... }`
  You'll also notice that many of it's methods just "redirects" to a more specif contract, abstracting it from the `msg.sender`; for example:

```sol
  /**
  * @dev Creates or updates the amount of a StableToken redeem Request from the msg.sender
  * @param stableTokenAmount Amount of StableTokens to redeem on settlement [using mocPrecision]
  */
  function redeemStableTokenRequest(uint256 stableTokenAmount) public whenNotPaused() whenSettlementReady() {
    settlement.addRedeemRequest(stableTokenAmount, msg.sender);
  }
```

MoC also handles the [System states](system-states.md) by a series of modifiers:

- _atState_: requires certain state to allow execution

```
  modifier atState(MoCState.States _state) {
    require(mocState.state() == _state, "Function cannot be called at this state.");
    _;
  }
```

- _atLeastState_: as states have a progressive order, we can require certain state or higher (where higher indicates a healthier system state)

```
  modifier atLeastState(MoCState.States _state) {
    require(mocState.state() >= _state, "Function cannot be called at this state.");
    _;
  }
```

- _notInProtectionMode_: system can enter in protection mode when coverage is below protected threshold, thus preventing the execution of operations which make use of this modifier

```
  modifier notInProtectionMode() {
    require(mocState.globalCoverage() > mocState.getProtected(), "Function cannot be called at protection mode.");
    _;
  }
```

- _bucketStateTransition_: Any method that can potentially modify a bucket values is require to first verify if current conditions doesn't demand that bucket liquidation.

```
  modifier bucketStateTransition(string bucket) {
    evalBucketLiquidation(bucket);
    _;
  }
```

- _transitionState_: As liquidation (as a way to maintain the USD PEG) is a fundamental commitment of the system, we want to ensure that no operation could ever be done without triggering it if the conditions are met. This is why every method that may change the system inner state, is annotated with this modifier.

```
  modifier transitionState()
  {
    mocState.nextState();
    if (mocState.state() == MoCState.States.Liquidated)
      liquidation();
    else
      _;
  }
```
