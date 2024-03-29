# Introduction to RoC

RIF On Chain is a suite of smart contracts whose purpose is providing:

- A RIF-collateralized stable-coin, Dollar On Chain, (USDRIF)
- A passive income hodler-targeted token, RIFPro (RIFP)

RIF On Chain runs on the [RSK network](https://www.rsk.co/) and uses the RIF token as reserve assets to back RIF On Chain. You can find more info on the RIF token and decentralized economies [here](https://www.rifos.org/).

The rationale behind this is that deposits of RIF help collateralize the USDRIF and RIFPro absorbs the USD-RIF rate fluctuations.

RoC system is a network of cooperative smart contracts working together to ultimately provide a US dollar pegged ERC20 Token (USDRIF). In this sense, the contracts we can categorize them into 4 categories:

- _RoC state Contracts_: They keep RoC state variables and logic (MoC, MoCState, MoCBucketContainer, MoCSettlement, MoCBurnout)
- _RoC pure logic Contracts & Libraries_: Functional extensions of the above merely to have responsibility separation and contracts size (aka deploy fee) low. (MoCHelperLib, MoCLibConnection, MoCConverter, MoCExchange, MoCConnector, MoCRiskProxManager, MoCInrate, MoCWhitelist, MoCBase)
- _Tokens_: Tokens backed by the system (OwnerBurnableToken, StableToken, RiskProToken)
- _External Dependencies_: External contracts the system relies on, in this case the Oracle or price provider; this could evolve independently of RoC system as along as the interface is maintained. (PriceProvider)

Also you can read official information about [RoC architecture and RIF On Chain's smart contracts](../README.md)
