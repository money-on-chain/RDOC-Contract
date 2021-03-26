# Redeeming DOCs

**Settlements** is a time based recurring process that allows or rejects the processing of RDOC redeem requests. The process runs in 90 days intervals.

There are three ways to redeem RDOCs:

- On settlement: A RDOC redeem request can be created to redeem any amount of RDOCs, but this will be processed on the next settlement. The amount can be greater than the user's balance at request time, allowing to, for example, redeem all future user's RDOCs regardless of whether their balance increases. The functions that interests us are: `function redeemStableTokenRequest(uint256 stableTokenAmount) public` and `function alterRedeemRequestAmount(bool isAddition, uint256 delta) public`

- Outside of settlement: Only free RDOCs can be redeemed outside of the settlement. Free RDOCs are those that were not transferred to another to provide leverage. The function that interests us is: `function redeemFreeStableTokenVendors(uint256 stableTokenAmount, address vendorAccount) public`.

NOTE: there is a retrocompatibility function called `redeemFreeStableToken(uint256 stableTokenAmount)` which is suitable for those who are already integrated to RoC platform and are not ready to use vendor functionality. In the future we are planning to deprecate this method.

- On Liquidation State: The user can redeem all his RDOCs with the method: `function redeemAllStableToken() public`