# User actions

## Minting

Token emission (minting/burning) is only allowed to be done through MOC system, users cannot create or destroy tokens directly on the ERC20 contracts.

### RIFPro

Can only be minted in exchange for RIF.
Given an amount of RIF paid to the contract, the system calculates the corresponding RIFPro amount to mint, RIF and RIFPro balances are added to the base bucket and the new Tokens are sent to the user.
There's a discount sale, below a certain level of coverage (uTPDU, currently 1.6).
This increases coverage, and allows to mint `(sent_rif/target_coverage)*rif_price` extra RDOCs, assuming the system is in the 'above coverage' state.

### RDOC

Can only be minted in exchange for RIF.
Given an amount of RIF paid to the contract, the system calculates the corresponding RDOCs amount to mint [^1], RIF and RDOC balances are added to the base bucket and the new Tokens are sent to the user.

[^1]: The contract must be in the 'Above coverage' state, but given the minting itself lowers coverage, the amount of RDOCs to be minted is limited by the preservation of this state. (See `globalMaxDoc`)

### RIF2X

Can only be "minted" in exchange of RIF.
The process for the minting is as follows:

- An amount of RIF is paid to the contract
- The interest to be paid is pre-determined based on: "days until next settlement", "RDOCs abundance" and the amount sent.
- The interest computed in the previous item is subtracted from the sent amount, and transferred into the "interest bag" of the base bucket.
- RDOCs are transferred from the base bucket into the leverage bucket, in the same "volume" as the amount remaining from what was sent.
- RIF2X are assigned to the user. (This is not a Token transfer as leveraged instruments cannot change owner)

The interests are discounted from the sent RIF, that is, if a user sends `X` RIF, they'll be assigned `X - interests` RIF2X equivalent.

## Redeeming

### RIFPro

A user can "sell" their RIFPro back to the contract and recover the corresponding amount of RIF.
The contract must be in the 'Above coverage' state.
The RIFPros and RIF are simply discounted from the base bucket.

### RDOC

#### On settlement

A RDOC redeem request can be created to redeem any amount of RDOCs, but this will be processed on next settlement.
The intended amount can be greater than user's balance at request time, allowing to, for example, redeem all future user's RDOCs regardless of whether their balance increases.
The redemption of RDOCs at the settlement is explained in detail in [its own section](process-actions.md#settlement).

#### Outside of settlement

Only free RDOCs can be redeemed outside of the settlement.
Free RDOCs are those that remain in the base bucket, that is, they were not transferred to another to provide leverage.
Tokens and their equivalent in RIF are simply subtracted from the base bucket.

### RIF2X

RIF deposited are sent back to the user, alongside the refunded interests (waiting in inrateBag) for the remaining time until the settlement (not yet charged).
Associated RDOCs are moved back to the base bucket.
