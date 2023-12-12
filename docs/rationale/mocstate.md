# MoCState

- Referenced by: MoC, MoCConverter, MoCExchange, MoCInrate, MoCSettlement
- References/uses: Math, MoCRiskProxManager, PriceProvider, StableToken, RiskProToken, MoCSettlement
- Inherits from: MoCLibConnection, MoCBase

This contract holds the system variables to manage the state, wether it's the state itself or the thresholds configurations; as well as many `view` functions to access and evaluate it.
- State:
  - System State itself:
    `States public state = States.AboveCobj;`
  - Global number of RIF: Complete amount of RIF in the system
    `uint256 public globalNB = 0;`
  - Configuration variables:
    - PEG: Relation between USDRIF and US dollar
      `uint256 public peg = 1;`
    - RiskPro max discount rate: Reflects the discount spot rate at Liquidation level
      `uint256 public riskProMaxDiscountRate;`
    - Liquidation threshold:
      `uint256 public liq;`
    - RiskPro with discount threshold:
      `uint256 public utpdu;`
    - Liquidation enabled:
      `bool public liquidationEnabled;`
    - Protected threshold:
      `uint256 public protected;`

It also defines the State enum options:

```sol
  enum States {
    // State 0
    Liquidated,
    // State 1
    RiskProDiscount,
    // State 2
    BelowCobj,
    // State 3
    AboveCobj
  }
```
