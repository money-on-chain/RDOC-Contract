# The MoC Contract

The RIF On Chain's Smart Contract suite is in control of the minting and redeeming of its tokens, including the RIFPro and USDRIF tokens. This means that the generation of new tokens is controlled programmatically by said suite. To get some new tokens you should interact with the suite. The entry point is the MoC smart contract whose addresses are available on the following networks:

- mainnet: [0xCfF3fcaeC2352C672C38d77cb1a064B7D50ce7e1](https://explorer.rsk.co/address/0xCfF3fcaeC2352C672C38d77cb1a064B7D50ce7e1)
- testnet: [0x7e2F245F7dc8e78576ECB13AEFc0a101E9BE1AD3](https://explorer.testnet.rsk.co/address/0x7e2F245F7dc8e78576ECB13AEFc0a101E9BE1AD3)

In the world of second and third generation blockchains it is not possible to update the code of an already deployed smart contract. If we need to fix a bug or update the logic of a function, then we can use the proxy architecture pattern.

The proxy pattern allows all function calls to go through a Proxy contract that will redirect the message to another smart contract that contains the business logic. MoC is a Proxy Contract.

When the logic needs to be updated, a new version of your business logic contract is created and the reference is updated in the proxy contract. You can read more about proxies contracts [here](https://blog.openzeppelin.com/proxy-patterns/).