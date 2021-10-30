# Commission fees values

The value of the commission fee depends on the desired operation and the token used to pay for it. Keep in mind that if the account has balance and allowance of MoC token, commissions will be paid with this token; otherwise commissions will be paid in RBTC.

The exact percentage of the commission is set in the variable **commissionRatesByTxType** (which maps a transaction type with its commission) of the **MocInrate** contract. The transactions types are constants defined in the same contract. The different valid transaction types are the following:

| Transaction Type | Description |
| --- | --- |
| `MINT_RISKPRO_FEES_RESERVE` | Mint RIFPRO with fees in RIF |
| `REDEEM_RISKPRO_FEES_RESERVE` | Redeem RIFPRO with fees in RIF |
| `MINT_STABLETOKEN_FEES_RESERVE` | Mint RDOC with fees in RIF |
| `REDEEM_STABLETOKEN_FEES_RESERVE` | Redeem RDOC with fees in RIF |
| `MINT_RISKPROX_FEES_RESERVE` | Mint RIF2x with fees in RIF |
| `REDEEM_RISKPROX_FEES_RESERVE` | Redeem RIF2x with fees in RIF |
| `MINT_RISKPRO_FEES_MOC` | Mint RIFPRO with fees in MoC |
| `REDEEM_RISKPRO_FEES_MOC` | Redeem RIFPRO with fees in MoC |
| `MINT_STABLETOKEN_FEES_MOC` | Mint RDOC with fees in MoC |
| `REDEEM_STABLETOKEN_FEES_MOC` | Redeem RDOC with fees in MoC |
| `MINT_RISKPROX_FEES_MOC` | Mint RIF2x with fees in MoC |
| `REDEEM_RISKPROX_FEES_MOC` | Redeem RIF2x with fees in MoC |

Note that these commissions have also a precision of 18 decimals, i.e. a 1 \* 10^15 in that parameter means that 0.1% is being charged as a commission.
