# Redeeming USDRIF Outside Settlement: redeemFreeStableToken

`function redeemFreeStableTokenVendors(uint256 stableTokenAmount, address vendorAccount) public`

Redeems the requested **stableTokenAmount** for the user or the max amount of free docs possible if **stableTokenAmount** is bigger than max.

NOTE: there is a retrocompatibility function called `redeemFreeStableToken(uint256 stableTokenAmount)` which is suitable for those who are already integrated to RoC platform and are not ready to use vendor functionality. In the future we are planning to deprecate this method.

## Parameters of the operation

### The stableTokenAmount parameter

It is the amount that the contract will use to redeem free USDRIF.
This parameter uses a precision of the type **reservePrecision** that contains 18 decimal places and is defined in **MoCLibConnection** contract.

### The vendorAccount parameter

It is the address of the vendor who will receive a [markup](vendors.md#markup) from the current transaction.


RIF On Chain is a dynamic system that allows you to redeem a maximum amount of free RDOCS and can be obtained by calling the `freeStableToken()` view of the **MocState** contract.

The first part transforms the amount **stableTokenAmount** into an RIF amount, but 3 things can happen:

- If the absolute maximum amount of allowed USDRIF is bigger than the user's balance in USDRIF, then the user's total balance will be used to transform it to RIF.

```
stableTokenAmountToRedeem = Math.min(mocState.freeStableToken(), stableToken.balanceOf(account));
```

- If the previous amount is greater than the stableTokenAmount value, then stableTokenAmount will be used to transform it to RIF.

```
finalDocAmount = Math.min(stableTokenAmount, stableTokenAmountToRedeem);
```

- If none of the above conditions are met, stableTokenAmount will be used to transform it to RIF.

```
rdocRifValue <= stableTokensToResToken(finalDocAmount);
```

The second part will be used to compute and pay the interests of the operation that depends on the abundance of USDRIF in the MOC system. The value can be obtained by invoking the function `calcStableTokenRedInterestValues(finalDocAmount, rdocRifValue)` of the contract **MocInrate** and also has an accuracy of 18 decimal places.

The third part will be used to pay the commission, this part is a percentage of the previous part. The commission fees are explained in [this](commission-fees-values.md) section.

The fourth part corresponds to the vendor markup, which refers to the fee a vendor will receive from this transaction and is a percentage of the first part. The vendor markup is explained in [this](vendors.md#markup) section.

All the needed calculations for the third and fourth parts are explained in more detail [here](fees-calculation.md).

The fourth part returns the amount in RIF discounting the previously calculated commissions and interests.

### Gas limit and gas price

These two values are a parameter of the transaction, this is not used in the contract and is generally managed by your wallet (you should read about them if you are developing and do not know exactly what they are), but you should take them into account when trying to redeem some USDRIF.

## Possible failures

This operation may fail if one of the following scenarios occurs:

### The contract is paused:

If the system suffers some type of attack, the contract can be paused so that operations cannot be done and the risk of the users losing their funds with the operation can be minimized. The condition is the same as that explained in [The MoC contract is paused](minting-docs.md#the-moc-contract-is-paused).

### The MoC contract is in protected mode:

In case global coverage falls below the protected threshold, the contract will enter the protected mode. If this state occurs, no more USDRIF will be available for minting. You can find more information about this mode [here](../rationale/system-states.md#protected-mode).

### The MoC contract is liquidated:

In the extraneous case where a coverage that barely covers the stable tokens funds is reached, the contract will liquidate all of its assets. If this state occurs, no more USDRIF will be available for minting.
To know if the contract is liquidated you can ask the **MocState** for the **state**, this will return a 0 if liquidated (it is actually an enum).

### Not enough gas:

If the gas limit sent is not enough to run all the code needed to execute the transaction, the transaction will revert (again, returning all your funds except the fee paid to the network). This may return an "out of gas" error or simply a "revert" error because of the usage of the proxy pattern.
