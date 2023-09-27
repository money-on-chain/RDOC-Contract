# User actions

## Minting

Token emission (minting/burning) is only allowed to be done through MOC system, users cannot create or destroy tokens directly on the ERC20 contracts.

### RIFPro

Can only be minted in exchange for RIF.
Given an amount of RIF paid to the contract, the system calculates the corresponding RIFPro amount to mint, RIF and RIFPro balances are added to the base bucket and the new Tokens are sent to the user.
There's a discount sale, below a certain level of coverage (uTPDU, currently 1.6).
This increases coverage, and allows to mint `(sent_rif/target_coverage)*rif_price` extra USDRIF, assuming the system is in the 'above coverage' state.

### USDRIF

Can only be minted in exchange for RIF.
Given an amount of RIF paid to the contract, the system calculates the corresponding USDRIF amount to mint [^1], RIF and USDRIF balances are added to the base bucket and the new Tokens are sent to the user.

[^1]: The contract must be in the 'Above coverage' state, but given the minting itself lowers coverage, the amount of USDRIF to be minted is limited by the preservation of this state. (See `globalMaxDoc`)

## Redeeming

### RIFPro

A user can "sell" their RIFPro back to the contract and recover the corresponding amount of RIF.
The contract must be in the 'Above coverage' state.
The RIFPros and RIF are simply discounted from the base bucket.

### USDRIF

Tokens and their equivalent in RIF are simply subtracted from the base bucket.
