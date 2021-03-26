# OwnerBurnableToken

- Referenced by: StableToken, RiskProToken
- References/uses:
- Inherits from: OpenZeppelin/Ownable, OpenZeppelin/ERC20Mintable

As burning tokens is a faculty that only RoC system have, this contracts overrides the "default" ERC20 behavior for witch the user owning the tokens is the one that can destroy them.
