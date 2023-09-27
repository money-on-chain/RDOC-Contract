# Getting started

## Install dependencies

- Use nodejs v8.12: `nvm install 8.12 && nvm alias default 8.12`
- Install local dependencies: `npm install`

## Node

You need a node to run contracts. Use `ganache-cli` for developing purposes.

- Install Ganache globally:

```sh
npm install -g ganache-cli;
npm run ganache-cli
```

- Or using Docker:

```sh
docker pull trufflesuite/ganache-cli;
docker run -d -p 8545:8545 trufflesuite/ganache-cli:latest
```

## Run RSK Local Node

- With Docker:

  See this repo: https://github.com/rsksmart/artifacts/tree/master/Dockerfiles/RSK-Node

## Run Tests

- run: `npm run test`

**Tests With Coverage**

Coverage tests use their own node, so there is no need to run Ganache separately.
- run: `npm run coverage`
- browse: `./coverage/index.html` inside the project's folder.

## Deploy

[Truffle suite](https://github.com/trufflesuite/truffle) is recommended to compile and deploy the contracts. There are a set of scripts to easy this process for the different known environments. Each environment (and network) might defer in its configuration settings, you can adjust this values in the the `migrations/config/config.json` file.

At the end of the deployment the addresses of the most relevant contracts will be displayed. If you are interested in another contracts you should look inside some files depending if the contracts is upgradeable or not.

The addresses of the deployed proxies will be in a file called `zos.<network-id>.json` . There you will have to look inside the proxies object and look for the `address` of the proxy you are interested in. If you are interested in the address of a contract that has not a proxy you should look for it in the prints of the deployment or inside the `builds/<contract-name>.json` file.

1.  Edit truffle.js and change add network changes and point to your
    `ganache-cli` or RSK node.

2.  Edit `migrations/config/config.json` and make changes

3.  Run `npm run truffle-compile` to compile the code

4.  Run `npm run migrate-development` to deploy the contracts

## Deploy Testnet or Mainnet (not develop)

To deploy on production we need anothers steps:

1. Contract Governanza project already deployed, you can get it (here)[https://github.com/money-on-chain/Areopagus-Governance]

2. Contract Oracle project already deployed, you can get it (here)[https://github.com/money-on-chain/Amphiraos-Oracle]

### Deploy gobernanza

Clone gobernanza

```
git clone https://github.com/money-on-chain/Areopagus-Governance governance
```

```
cd governance/
git checkout v0.3.1
```

Install requirements

```
npm install
```

We reach our private node?

```
curl https://public-node.rsk.co -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

Give us something like this

```
{"jsonrpc":"2.0","id":1,"result":"0xde21"}
```

We have need to know our account private key. Mine: XXX

Change truffle.js:

```
rskMainnet: {
      // 0xEA14c08764c9e5F212c916E11a5c47Eaf92571e4
      host: 'https://public-node.rsk.co',
      provider: new HDWalletProvider('Private key', 'https://public-node.rsk.co'),
      network_id: '*',
      gasPrice: 60000000
    },
```

Edit governance/migrations/config.json

```
vi governance/migrations/config.json
```

Add this key to config, or edit if already exist:

```
"rskMainnet": {
    "unblockAt": 10
  }
```

ubnblockAt is date format unix epoch. Is the date that the contract is
unblock to gobernanza.

Change package.json

```
"deploy-reset-mainnet": "npm run remove-zos-dev; rm -r build/contracts; truffle migrate --network rskMainnet --reset"
```

Finally deploy the contract

```
npm run deploy-reset-mainnet
```

Write down the contract adresses we are going to use later

```
Deployed governor in 0xC61F0392d5170214b5D93C0BC4c4354163aBC1f7
Deployed stopper in 0x40662eD57284B4B541A42D347BE2447ABd1b119d
Deployed admin in 0x009C51E1f6feDcDB8014Ea9AE1E39B6dbF2AC0EC
Deployed delegator in 0x5cE577f6Ec969CE9a282838D350206C52A6F338C
```

### Deploy Rif Oracle

We are going to deploy a new oracle for rif

```
git clone https://github.com/money-on-chain/Amphiraos-Oracle oracle
```

```
cd oracle
git checkout master
```

We are going to use 'oracle' only

```
cd oracle
```

Install dependencies

```
npm install
```

Edit truffle.js and change Private key with yours

```
rskMainnet: {
      // 0x27A3074Db95EC5F6A0e73dC41a4859f48990E841
      host: 'https://public-node.rsk.co',
      provider: () => new HDWalletProvider('Private key', "https://public-node.rsk.co"),
      network_id: '*',
      gasPrice: 60000000
    }
```

Edit migrations/configs/config.json, fill with governor address and initial rif price

```
{
  "minValues": 1,
  "initialPrice": 0.095278,
  "expirationTime": 300,
  "governor": "0xC61F0392d5170214b5D93C0BC4c4354163aBC1f7"
}
```

For the price take a look at this page:

```
https://coinmarketcap.com/currencies/rif-token/#tools
```

Migrate:

```
npm run deploy-reset-mainnet
```

When finish take a look to contract adresses

```
Deploying 'MoCMedianizer'
   -------------------------
   > transaction hash:    0x7d31ce0df348dcb955d94925cfe59867a2219f8c3e1be61ec1da25a536e8aa22
   > Blocks: 2            Seconds: 61
   > contract address:    0x504EfCadFB020d6bBaeC8a5c5BB21453719d0E00
   > block number:        2112303
   > block timestamp:     1581618824
   > account:             0x27a3074Db95Ec5f6a0E73DC41a4859F48990e841
   > balance:             0.0048269138
   > gas used:            1207022
   > gas price:           0.06 gwei
   > value sent:          0 ETH
   > total cost:          0.00007242132 ETH


   Deploying 'FeedFactory'
   -----------------------
   > transaction hash:    0xf2341c5e09d433fa2b0f33cdc5c613fb0fa39e46afc13e36461bc46e84002cc5
   > Blocks: 2            Seconds: 53
   > contract address:    0x54878866F5324B56AEE9B6619a1e1A213B2fCC30
   > block number:        2112305
   > block timestamp:     1581618868
   > account:             0x27a3074Db95Ec5f6a0E73DC41a4859F48990e841
   > balance:             0.0047867405
   > gas used:            669555
   > gas price:           0.06 gwei
   > value sent:          0 ETH
   > total cost:          0.0000401733 ETH
```

Write down the contract adresses we are going to use later

```
MoCMedianizer:    0x504EfCadFB020d6bBaeC8a5c5BB21453719d0E00
FeedFactory:    0x54878866F5324B56AEE9B6619a1e1A213B2fCC30
```

MoCMedianizer is our oracle contract write down this address: 0x504EfCadFB020d6bBaeC8a5c5BB21453719d0E00

### Deploy Main Stable Token Contract

Finally deploy main contract

Edit truffle.js

```
mocMainnet: {
      // 0x27A3074Db95EC5F6A0e73dC41a4859f48990E841
      host: 'https://public-node.rsk.co',
      provider: () => new HDWalletProvider(mnemonic, "https://public-node.rsk.co"),
      network_id: '*',
      gasPrice: 60000000
    },
```

Edit migrations/configs/config.json and filled with the contracts already deployed

```
"mocMainnet": {
    "commissionSplitter": "",
    "mocCommissionProportion": "500000000000000000",
    "initialPrice": 0.096405571,
    "initialEma": 0.101846,
    "dayBlockSpan": 2880,
    "settlementDays": 30,
    "oracle": "0x504EfCadFB020d6bBaeC8a5c5BB21453719d0E00",
    "governor": "0xC61F0392d5170214b5D93C0BC4c4354163aBC1f7",
    "stopper": "0x40662eD57284B4B541A42D347BE2447ABd1b119d",
    "proxyAdmin": "0x009C51E1f6feDcDB8014Ea9AE1E39B6dbF2AC0EC",
    "reserveToken": "0x2acc95758f8b5f583470ba265eb685a8f45fc9d5",
    "gas": 6000000,
    "startStoppable": false,
    "maxMintRiskPro": 1000000000,
    "stableTmin": 0,
    "stablePower": 0,
    "stableTmax": 0.0000000000000001,
    "riskProxTmin": 0,
    "riskProxPower": 0,
    "riskProxTmax": 0.000611539,
    "riskProHolderRate": 0.0000478537,
    "daysRiskProHolderExecutePayment": 7,
    "targetAddressRiskProInterest": "0xC61820bFB8F87391d62Cd3976dDc1d35e0cf7128",
    "targetAddressCommissionPayment": "0xC61820bFB8F87391d62Cd3976dDc1d35e0cf7128",
    "commissionRate": 0.001,
    "c0Cobj": 7,
    "x2Cobj": 2,
    "liq": 1.04,
    "utpdu": 2,
    "maxDiscRate": 0.0,
    "smoothFactor": 0.011049724
  }
```

take a note that reserveToken:

```
https://explorer.rsk.co/address/0x2acc95758f8b5f583470ba265eb685a8f45fc9d5
```

This is the address of the rifToken

```
"reserveToken": "0x2acc95758f8b5f583470ba265eb685a8f45fc9d5",
```

Private key to enviroment

```
export MNEMONIC=(CLAVE PRIVADA)
```

Run migrations

```
npm run deploy-reset-mocMainnet
```

Give us..., write down because adressess of the contracts

```
{
"moc":"0xCfF3fcaeC2352C672C38d77cb1a064B7D50ce7e1",
"oracle":"0x504EfCadFB020d6bBaeC8a5c5BB21453719d0E00",
"moCRiskProxManager":"0x07Cd11fC4c4eC0BdBdC2Ec495f66A69bba32e7e7",
"mocState":"0x541F68a796Fe5ae3A381d2Aa5a50b975632e40A6",
"mocInrate":"0x1DaB07c4FD07d6eE1359a5198ACa2DEe64F371f3",
"governor":"0xC61F0392d5170214b5D93C0BC4c4354163aBC1f7",
"stopper":"0x40662eD57284B4B541A42D347BE2447ABd1b119d",
"proxyAdmin":"0x009C51E1f6feDcDB8014Ea9AE1E39B6dbF2AC0EC",
"upgradeDelegator":"0x5cE577f6Ec969CE9a282838D350206C52A6F338C"
}
```

## Price Feeder

To run your own price feeder on USDRIF. Take a look on repository (page)[https://github.com/money-on-chain/price-feeder/tree/develop]

Clone price feeder repository

```
git clone https://github.com/money-on-chain/price-feeder/tree/develop price_feeder
```

```
cd price_feeder
```

requirements:

```
 Python 3.6+
```

Install dependencies

```
pip install -r requirements.txt
```

Use this config as template (https://github.com/money-on-chain/price-feeder/blob/develop/config_rdoc.json)[https://github.com/money-on-chain/price-feeder/blob/develop/config_rdoc.json]  
Change to correct addresses

```
"PriceFeed": "0x462D7082F3671a3BE160638Be3f8C23Ca354F48A",
"MoCMedianizer": "0x9d4b2c05818A0086e641437fcb64ab6098c7BbEc",
"RIF_source_price_btc": "0x78c892Dc5b7139d0Ec1eF513C9E28eDfAA44f2d4"
```

Then run

```
python price_feeder.py --config=config_rdoc.json --network=local
```

### Pricefeeder Deployment Tutorial using Docker: example USDRIF Testnet

I'm going to use docker method.

1. We need to have our account to sign transactions, also we need pk and funds. In my example I am going to use:
   0xbc6d77a5adfa6fb09c3d2cb8b4765d5729e7b8ba

2. Initiate the process of whitelisting sending the address of the account from the step 1 to MOC team.

3. Clone the repository:

```
git clone https://github.com/money-on-chain/price-feeder
cd price-feeder
git checkout master
```

4. Set the base config por our deployment in our case config_rdoc.json is our base

```
cp config_rdoc.json config.json
```

5. Edit config.json and change to ensure this:

```
"app_mode": "RIF",
...
"uri": "https://public-node.testnet.rsk.co",
"network_id": 31,
...
"addresses": {
        "PriceFeed": "0xE0A3dce741b7EaD940204820B78E7990a136EAC1",
        "MoCMedianizer": "0x9d4b2c05818A0086e641437fcb64ab6098c7BbEc",
        "RIF_source_price_btc": "0x78c892Dc5b7139d0Ec1eF513C9E28eDfAA44f2d4"
      }


```

6. Build docker

```
docker build -t price_feeder -f Dockerfile .
```

7. Run

Replace **(PRIVATE KEY)** with private key

```
docker run -d \
--name price_feeder_1 \
--env ACCOUNT_ADDRESS=0xbc6d77a5adfa6fb09c3d2cb8b4765d5729e7b8ba \
--env ACCOUNT_PK_SECRET=(PRIVATE KEY) \
--env PRICE_FEEDER_NETWORK=local \
price_feeder
```

## Security and Audits

- [Deployed contracts](../contracts-verification.md)
- [Audits](https://github.com/money-on-chain/Audits)

For more technical information you can see our [ABI documentation](../abis/abi-documentation.md).

## Settings

- _initialPrice_: RIF initial (current) price
- _initialEma_: RIF initial EMA (exponential moving average) price
- _dayBlockSpan_: Average amount of blocks expected to be mined in a calendar day in this network.
- _settlementDays_: Amount of days in between settlement to allowed executions
- _gas_: Gas to use on MoC.sol contract deploy.
- _startStoppable_: If set to true, the MoC contract can be stopped after the deployment. If set to false, before pausing the contract you should make it stoppable with governance(this together with the blockage of the governance system can result in a blockage of the pausing system too).
- _oracle_: Moc Price Provider compatible address (see `contracts/interfaces/PriceProvider.sol`). You can deploy this contract using the `oracle` project or (in development) the mock: `contracts/mocks/PriceProviderMock.sol` (which is deployed on development migration by default).
- _mocOracle_: MoCToken Price Provider compatible address (see `contracts/interfaces/PriceProvider.sol`). You can deploy this contract in development using the mock: `contracts/mocks/MoCPriceProviderMock.sol` (which is deployed on development migration by default).
- _governor_: Address of the Governor contract
- _stopper_: Address of the Stopper contract
- _proxyAdmin_: Address of the Proxy Admin contract
- _commissionSplitter_: Defines an address for an existing CommissionSplitter. If none is set, then the CommissionSplitter will be deployed.
- _mocCommissionProportion_: Defines the proportion of commissions that will be injected as collateral to MoC. This configuration only works if no _commissionSplitter_ address is set.
- _riskProxTmin_: Minimum interest rate.
- _riskProxPower_: Power is a parameter for interest rate calculation.
- _riskProxTmax_: Maximun interest rate.
- _riskProHolderRate_: RiskPro holder interest rate.
- _daysRiskProHolderExecutePayment_: Days to execute payment
- _targetAddressRiskProInterest_: Target address to transfer the weekly BitPro holders
- _targetAddressCommissionPayment_: Target addres to transfer commissions of mint/redeem
- _stableTmin_: Upgrade to support red stable inrate parameter.
- _stablePower_: Upgrade to support red stable inrate parameter.
- _stableTmax_: Upgrade to support red stable inrate parameter.
- _c0Cobj_: Bucket C0 objective coverage.
- _x2Cobj_: Bucket X2 objective coverage.
- _liq_: Liquidation limit.
- _utpdu_: RiskPro with discount limit (discount coverage threshold).
- _maxDiscRate_: Reflects the discount spot rate at Liquidation level.
- _smoothFactor_: Weight coefficient for EMA calculation.
- _maxMintRiskPro_: Max value posible to mint of BPro.
- _liquidationEnabled_: If set to true, the MoC contract reached liquidation state.
- _protected_: If global coverage reaches this value, then the MoC system will operate in protection mode.
- _vendorGuardianAddress_: This address will be the only one authorized to register and unregister vendors in the platform.
- _commissionRates_: Certain mint and redeem operations have different commission rates applied to them. This section defines the values for each one. The commission fees are explained [here](commission-fees-values.md).
