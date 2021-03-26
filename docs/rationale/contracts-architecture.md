# Contracts architecture

RoC system is a network of cooperative contracts working together to ultimately provide an US dollar pegged ERC20 Token (RDOC). In this sense, be can categorize then into 4 categories:

- _RoC state Contracts_: They keep RoC state variables and logic (MoC, MoCState, MoCBucketContainer, MoCSettlement)
- _RoC pure logic Contracts & Libraries_: Functional extensions of the above merely to have responsibility separation and contracts size (aka deploy fee) low. (MoCHelperLib, MoCLibConnection, MoCConverter, MoCExchange, MoCConnector, MoCRiskProxManager, MoCInrate, MoCWhitelist, MoCBase)
- _Tokens_: Tokens backed by the system (OwnerBurnableToken, StableToken, RiskProToken, MoCToken)
- _External Dependencies_: External contracts the system relies on, in this case the Oracle or price provider; this could evolved independently of RoC system as along as the interface is maintained. (PriceProvider)
