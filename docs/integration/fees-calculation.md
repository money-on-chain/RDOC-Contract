# Fees calculation

Fees (namely, commission and vendor markup) are a percentage of the amount of the transaction that will be charged for the usage of the platform. The sum of the commission and vendor markup will be at around 0.1% of the amount.

The calculation for the fees associated with the transaction is managed in the function **calculateCommissionsWithPrices** of the **MoCExchange** contract.

This function deals with all the parameters needed to calculate said fees. You will need to pass these parameters in the form of the **CommissionParamsStruct** struct:
```
struct CommissionParamsStruct{
  address account; // Address of the user doing the transaction
  uint256 amount; // Amount from which commissions are calculated
  uint8 txTypeFeesMOC; // Transaction type if fees are paid in MoC
  uint8 txTypeFeesReserveToken; // Transaction type if fees are paid in RIF
  address vendorAccount; // Vendor address
}
```
You must assign all the parameters to the struct before calling the function. Transaction types for every operation are explained [here](commission-fees-values.md). You must have an instance of the **MoCInrate** contract in order to access every valid transaction type.

Fees will be paid in MoC in case the user has MoC token balance and allowance; otherwise they will be paid in RIF.

You will receive a **CommissionReturnStruct** struct in return with all the values calculated for you:
```
struct CommissionReturnStruct{
  uint256 reserveTokenCommission; // Commission in RIF if it is charged in RIF; otherwise 0
  uint256 mocCommission; // Commission in MoC if it is charged in MoC; otherwise 0
  uint256 reserveTokenPrice; // RIF price at the moment of the transaction
  uint256 mocPrice; // MoC price at the moment of the transaction
  uint256 reserveTokenMarkup; // Markup in RIF if it is charged in RIF; otherwise 0
  uint256 mocMarkup; // Markup in MoC if it is charged in RIF; otherwise 0
}
```

In conclusion:

- If you are minting and fees are paid in RIF, the amount sent to the transaction has to be at least the amount in RIF desired plus the commission (amount times the commission rate) plus the markup (amount times the vendor markup). If the operation involves interests, you should add them as well.

```
rifSent (msg.value) >= CommissionParamsStruct.amount + CommissionParamsStruct.amount * CommissionReturnStruct.reserveTokenCommission + CommissionParamsStruct.amount * CommissionReturnStruct.reserveTokenMarkup + interests
```
If fees are paid in MoC, then `rifSent (msg.value) == CommissionParamsStruct.amount`

- If you are redeeming and fees are paid in RIF, the transaction returns the amount in RIF discounting the previously calculated fees.  If the operation involves interests, you should subtract them as well.

```
totalRif = <token>ToResToken(finalAmount);
rifReceived = totalRif - totalRif * CommissionReturnStruct.reserveTokenCommission - totalRif * CommissionReturnStruct.reserveTokenMarkup - interests
```
If fees are paid in MoC, then `rifReceived == CommissionParamsStruct.amount`
