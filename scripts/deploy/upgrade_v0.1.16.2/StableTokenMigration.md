## Upgrade Process for StableToken V2

The upgrade process for the StableToken smart contract on the MoC platform requires careful planning and execution. To ensure a secure and seamless upgrade, it is essential to follow the steps outlined below.

All the contracts that use StableToken variable will be upgraded. Those are:

- [MoC.sol](../contracts/MoC.sol)
- [MoCConnector.sol](../contracts/base/MoC.sol)
- [MoCExchange.sol](../contracts/MoCExchange.sol)
- [MocState.sol](../contracts/MoCState.sol)
- [MoCSettlement.sol](../contracts/MoCSettlement.sol)

The changer that will execute all these upgrades in an atomic way is the following one:

- [StableTokenMigrationChanger.sol](../contracts/changers/StableTokenMigrationChanger.sol)

For each of them a new function is added `function migrateStableToken(address newStableTokenAddress_)` for the migration purpose and an event is emitted when it happens `event StableTokenMigrated(address oldStableTokenAddress_, address newStableTokenAddress_)`.
Because we don't want this function be alive in the protocol after the migration to avoid re-execution, in the changer we are doing two upgrades. First, we upgrade them to a new implementation that includes the migration logic, and later we upgrade them again to another implementation without it.

### Step 1: Prepare for the Upgrade

Before beginning the upgrade process, it is important to ensure that all necessary preparations have been made. This includes:

- Review the StableToken smart contract upgrade proposal to understand the changes that will be implemented and their impact on the platform.
- Verify that the new StableToken smart contract code has been properly audited and tested for functionality and security.
- Ensure that all deploy scripts and other required scripts have been updated to reflect the new implementation.
- Run tests.

```sh
cd hardhat
nvm use
npm run typechain
npm run compile
npm run tests
```

This tests, using openzeppelin upgrade tools, verify that the upgraded contracts do not have any storage layout collision.

### Step 2: Deploy the New StableToken Smart Contract

The next step is to deploy the new StableToken smart contract. This involves the following:

- Set in hardhat.config.base, network config the 3 needed addresses:

```json
targetNetwork: {
  .........
  mocAddresses: {
    mocExchange: "0xEeAd3374........3131Ea5477",  // proxy
    governor: "0xEeAd3374........3131Ea5477"
    stableTokenV1: "0xEeAd3374........3131Ea5477"
  },
},
```

- Run the deploy script for the new StableToken smart contract.

```sh
cd hardhat
nvm use
npm run typechain
npm run compile
npx hardhat deploy --network targetNetwork   
```

### Step 3: Deploy new MoC protocol implementations

Once the new StableToken smart contract has been deployed, we need to deploy contracts that will be upgraded new implementation.

- create a file named `../scripts/deploy/upgrade_v0.1.16.2/deployConfig-<targetNetwork>.json` with all current addresses used in the targetNetwork, for example: [deployConfig-devTestnet.json](../scripts/deploy/upgrade_v0.1.16.2/deployConfig-devTestnet.json)
- Add deployed addresses in Step 2. StableTokenV2(proxy) and TokenMigrator addresses in that file

```json
"implementationAddresses": {
    ...
    "StableTokenV2": "0xEeAd3374........3131Ea5477",
    "TokenMigrator": "0x388dD18........aF1B82BF9Aa",
  },
```

- Run the upgrade.

```sh
sh ./scripts/deploy/upgrade_v0.1.16.2/0_deploy.sh targetNetwork
```

That script will do the following steps:

1. deploy MoC_v0116_2 and MoC implementations
2. deploy MoCConnector_v0116_2 and MoCConnector implementations
3. deploy MoCExchange_v0116_2 and MoCExchange implementations
4. deploy MoCState_v0116_2 and MoCState implementations
5. deploy MoCSettlement_v0116_2 and MoCSettlement implementations
6. deploy StableTokenMigrationChanger setting all the involved addresses
7. verify that addresses set in the changer are ok corresponding with the json file provided

### Step 4: Create and post the proposal

After the changer is deployed and verified it is time to create the voting proposal to be voted by the community and if it is approved then be executed by the Governor.

### Step 5: Update the MoC Platform

After the new proposal has been approved and executed, it is necessary to update the MoC platform. This involves the following:

- Update any components of the MoC platform that interact with the StableToken smart contract to ensure compatibility with the new implementation.
- Verify that the updated MoC platform is fully functional and that there are no conflicts or errors with the new StableToken smart contract implementation.
- Create a feature to facilitate StableToken holders to migrate them to the new StableToken V2

### Step 6: Monitor and Maintain the New StableToken Smart Contract

After the upgrade process is complete, it is important to monitor and maintain the new StableToken smart contract implementation. This includes the following:

- Regularly check the StableToken smart contract for any potential issues or vulnerabilities.
- Ensure that any necessary updates or improvements to the StableToken smart contract are implemented promptly.

## Deployment

This solution has a fully functional deploy mechanism following [hardhat deploy](https://github.com/wighawag/hardhat-deploy) standard.

```sh
npx hardat deploy --network development
```

### How to execute migration locally

In root

```sh
npm run ganache-cli
```

In another terminal

```sh
nvm use
npm run truffle-compile
npm run deploy-reset-development
```

A json file will be generated with all the deployed addresses
`../scripts/deploy/upgrade_v0.1.12/deployConfig-development.json`

copy that file to
`../scripts/deploy/upgrade_v0.1.16.2/deployConfig-development.json`

Set in hardhat.config.base, network development the 3 needed addresses:

```sh
development: {
        .........
        mocAddresses: {
          // addresses deployed locally
          mocExchange: "0xEeAd3374........3131Ea5477",  // proxy
          governor: "0xEeAd3374........3131Ea5477"
          stableTokenV1: "0xEeAd3374........3131Ea5477"
        },
    },
`````

```sh
cd hardhat
nvm use
npm run compile
npx hardhat deploy --network development   
```

Add StableTokenV2(proxy) and TokenMigrator addresses in
`../scripts/deploy/upgrade_v0.1.16.2/deployConfig-development.json`

```sh
"implementationAddresses": {
    ...
    "StableTokenV2": "0xEeAd3374........3131Ea5477",
    "TokenMigrator": "0x388dD18........aF1B82BF9Aa",
  },
```

In ./hardhat/scripts/custom-tasks.ts set these addresses:

```sh
const reserveTokenAddress = "0xEeAd3374........3131Ea5477";
const riskProTokenAddress = "0xEeAd3374........3131Ea5477";
const stableTokenV1Address = "0xEeAd3374........3131Ea5477";
const mocProxyAddress = "0xEeAd3374........3131Ea5477";
const mocConnectorProxyAddress = "0xEeAd3374........3131Ea5477";
`````

You can interact with the protocol using the custom tasks:
Mint Reserve Tokens

```sh
npx hardhat mint-ReserveTokens --network development --amount 10000000000000000000000
```

Mint RiskPro Tokens to add collateral

```sh
npx hardhat mint-RiskProTokens --network development --amount 100000000000000000000
```

Mint Stable Tokens

```sh
npx hardhat mint-StableTokens --network development --amount 100000000000000000000
```

Now, you can make the upgrade to migrate tokens
in root run

```sh
sh ./scripts/deploy/upgrade_v0.1.16.2/0_deploy.sh
```

Go again to hardhat folder

```sh
cd hardhat
```

Redeem Stable Tokens, balance should be 0 because the migration started

```sh
npx hardhat redeem-StableTokens --network development --amount 100000000000000000000
```

Migrate your Stable Tokens

```sh
npx hardhat migrate-StableTokens --network development
```

Redeem Stable Tokens

```sh
npx hardhat redeem-StableTokens --network development --amount 100000000000000000000
```
