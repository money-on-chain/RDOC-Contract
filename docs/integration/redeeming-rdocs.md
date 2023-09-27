# Redeeming DOCs

**Settlements** is a time based recurring process that allows or rejects the processing of USDRIF redeem requests. The process runs in 90 days intervals.

There are three ways to redeem USDRIF:

- On settlement: A USDRIF redeem request can be created to redeem any amount of USDRIF, but this will be processed on the next settlement. The amount can be greater than the user's balance at request time, allowing to, for example, redeem all future user's USDRIF regardless of whether their balance increases. The functions that interests us are: `function redeemStableTokenRequest(uint256 stableTokenAmount) public` and `function alterRedeemRequestAmount(bool isAddition, uint256 delta) public`

- Outside of settlement: Only free USDRIF can be redeemed outside of the settlement. Free USDRIF are those that were not transferred to another to provide leverage. The function that interests us is: `function redeemFreeStableTokenVendors(uint256 stableTokenAmount, address vendorAccount) public`.

NOTE: there is a retrocompatibility function called `redeemFreeStableToken(uint256 stableTokenAmount)` which is suitable for those who are already integrated to RoC platform and are not ready to use vendor functionality. In the future we are planning to deprecate this method.

- On Liquidation State: The user can redeem all his USDRIF with the method: `function redeemAllStableToken() public`