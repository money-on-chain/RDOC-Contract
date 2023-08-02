# Upgrade version v0.1.17 - Temporary disable RDOC mint

### Proposal for disable RDOC minting in order to temporary and safely unpause the protocol
(draft)

Currently, the Rif on Chain protocol is paused to avoid problems caused by the price manipulation attack on Binance that the RIF token is being subjected to.

To safely unpause the protocol, it must be ensured that the price manipulation attack on Binance cannot be exploited in the protocol.

Disable RDOC minting is the fastest way to guarantee that price manipulation can't be exploited in the protocol.
This would be a temporary solution that allows development of the definitive one.

In order to safely unpause the protocol as soon as possible, the proposal is to disable RDOC mining.

**Warning:** some technical/coding knowledge is necessary to fully understand this document.

To achieve this, the simplest and least invasive way to modify the protocol to disable RDOC minting is to disable the function in contract in charge of minting RDOC.

We propose to do this by overriding the function with one that is meant to always fail using a hard-coded revert statement.

And we’ll do it this way instead of just removing the function to prevent third-party integrations that may not have been aware of this change, ending up using the fallback function with unexpected results.

The change is simple and only affects the Moc.sol contract in Rif on chain implementation.

