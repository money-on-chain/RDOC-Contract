# Redeeming USDRIF on Liquidation State:: redeemAllStableToken

`function redeemAllStableToken() public`

Allows redeeming on liquidation state, user USDRIF get burned, and the user receives the equivalent RIFs according to the liquidation price which is the relation between the USDRIF total supply and the amount of RIF available to distribute.
The liquidation price can be queried with the view `getLiquidationPrice()` of the contract **MocState**.
If sending RIF fails then the system does not burn the USDRIF tokens.

## Parameters of the operation

### Gas limit and gas price

These two values are a parameter of the transaction, this is not used in the contract and is generally managed by your wallet (you should read about them if you are developing and do not know exactly what they are), but you should take them into account when trying to redeem some USDRIF.

## Possible failures

This operation may fail if one of the following scenarios occurs:

### The MoC contract is not liquidated:

This operation can only be performed if the system is liquidated. If the MoC contract is in any other state then it fails and returns the following message: _Function cannot be called at this state_.

To know if the contract is liquidated you can ask the **MocState** for the **state**, this will return a 0 if liquidated (it is actually an enum).

### Not enough gas:

If the gas limit sent is not enough to run all the code needed to execute the transaction, the transaction will revert (again, returning all your funds except the fee paid to the network). This may return an "out of gas" error or simply a "revert" error because of the usage of the proxy pattern.