# Commission fees values

 Depending on the desired operation and the token used to pay commissions, this value is calculated according the following table. Keep in mind that if the account has balance and allowance of MoC token, commissions will be paid with this token; otherwise commissions will be paid in RIF. The exact percentage of the commission is set in the variable **commissionRatesByTxType** (which maps a transaction type with its commission) of the **MocInrate** contract. The transactions types are constants defined in the same contract and are detailed next. The current commission fees are yet to be defined. The different valid transaction types are the following:
| Transaction Type | Description | Value |
| --- | --- | --- |
| `MINT_RISKPRO_FEES_RESERVE` | Mint RIFPRO with fees in RIF | mbpr% |
| `REDEEM_RISKPRO_FEES_RESERVE` | Redeem RIFPRO with fees in RIF | rbpr% |
| `MINT_STABLETOKEN_FEES_RESERVE` | Mint RDOC with fees in RIF | mdcr% |
| `REDEEM_STABLETOKEN_FEES_RESERVE` | Redeem RDOC with fees in RIF | rdcr% |
| `MINT_RISKPROX_FEES_RESERVE` | Mint RIF2x with fees in RIF | mbxr% |
| `REDEEM_RISKPROX_FEES_RESERVE` | Redeem RIF2x with fees in RIF | rbxr% |
| `MINT_RISKPRO_FEES_MOC` | Mint RIFPRO with fees in MoC | mbpm% |
| `REDEEM_RISKPRO_FEES_MOC` | Redeem RIFPRO with fees in MoC | rbpm% |
| `MINT_STABLETOKEN_FEES_MOC` | Mint RDOC with fees in MoC | mdcm% |
| `REDEEM_STABLETOKEN_FEES_MOC` | Redeem RDOC with fees in MoC | rdcm% |
| `MINT_RISKPROX_FEES_MOC` | Mint RIF2x with fees in MoC | mbxm% |
| `REDEEM_RISKPROX_FEES_MOC` | Redeem RIF2x with fees in MoC | rbxm% |

Note that these commissions have also a precision of 18 decimals, i.e. a 1 \* 10^15 in that parameter means that 0.1% is being charged as a commission.
