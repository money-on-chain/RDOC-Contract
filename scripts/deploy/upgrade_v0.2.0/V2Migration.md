# Upgrade Process for V2 protocol migration
The upgrade process for the V2 smart contracts migration on the MoC platform requires careful planning and execution. To ensure a secure and seamless upgrade, it is essential to follow the steps outlined below.

The proxy contracts that constitute the V1 protocol will be set with a Deprecated implementation that only contains the fallback function to revert any interaction with them.

- [Deprecated.sol](../../../contracts/Deprecated.sol)

Before that, the MoC.sol and MoCExchange.sol contracts will be upgraded by an atomic implementation that contains a function to execute the migration in the changer contract.

In the case of MoC.sol, we need it to transfer its balance of ReserveToken and the pauser role of RiskProToken to the new contract.

In the case of MoCExchange.sol, we need it to transfer the Minter and Burner permissions of RiskProToken and StableToken to the new contract.

- [MoC_Migrator.sol](../../../contracts/V2_migration/MoC_Migrator.sol)
- [MoCExchange_Migrator.sol](../../../contracts/V2_migration/MoCExchange_Migrator.sol)

The changer that will execute all these upgrades in an atomic way is the following one:
- [V2MigrationChanger.sol](../../../contracts/changers/V2MigrationChanger.sol)

The V2MigrationChanger will verify that all the main parameters of the V1 protocol are configured the same way in V2. Therefore, the V2 protocol should be initialized taking this into account or directly reading the on-chain parameters from V1.

Additionally, it will execute the split function of the CommissionSplitter to re-inject all ReserveToken that are destined for the MoC contract, ensuring that during the migration, the entire balance is transferred to the new MoCV2 contract.

## Step 1: Prepare for the Upgrade
Before beginning the upgrade process, it is important to ensure that all necessary preparations have been made. This includes:

- Review the V2 smart contracts migration proposal to understand the changes that will be implemented and their impact on the platform.
- Verify that the new V2 smart contracts code has been properly audited and tested for functionality and security.
- Ensure that all deploy scripts and other required scripts have been updated to reflect the new implementation.
- Run tests.
```
cd hardhat
nvm use
npm run typechain
npm run compile
npm run tests
```
This tests, using openzeppelin upgrade tools, verify that the upgraded contracts do not have any storage layout collision.

## Step 2: Deploy new MoC protocol implementations
V2 protocol lives in the [ric-sc-protocol repository](https://github.com/money-on-chain/rif-sc-protocol).
For deployment instructions look at `MigrationFromV1.md' and 'README.md'.
Because `V2MigrationChanger.sol` will check that V2 has the same parameters than V1, to make the process easier and prevent the transaction from failing you can set MoCV1 contract address as a deploy parameter on V2 and it will fetch all the current V1 values and deploy V2 with them.

Once the new V2 smart contracts have been deployed, we need to deploy the contracts that will be upgraded to the new implementation.

- create a file named `RDOC-Contract-Internal/scripts/deploy/upgrade_v0.2.0/deployConfig-targetNetwork.json` with all current V1 addresses used in the `targetNetwork`, for example: [deployConfig-example-development.json](./deployConfig-example-development.json)

- Add MoCV2(proxy) address in that file
```
v1ProxyAddresses: {
 ....
},
v2ProxyAddresses: {
   "MoC": "0xEeAd3374........3131Ea5477",
},
```
- Deploy all upgrade necessary contracts.
This script, will deploy all V1 related contracts and add them to the configuration file as it proceeds. To then deploy the changer itself initializing it with all the corresponding params. Finally, it will run a sanity verification check.

```
sh ./scripts/deploy/upgrade_v0.2.0/0_deploy.sh targetNetwork
```
That script will do the following steps:
1. deploy MoC implementation
2. deploy MoCExchange implementation
3. deploy MoCState implementation
5. deploy Deprecated implementation
6. deploy V2MigrationChanger setting all the involved addresses
7. verify that addresses set in the changer are ok corresponding with the json file provided

The file `RDOC-Contract-Internal/scripts/deploy/upgrade_v0.2.0/deployConfig-targetNetwork.json` will be filled with all the implementations contracts addresses deployed during the scripts executions. 

## Step 3: Create and post the proposal
After the changer is deployed and verified it is time to create the voting proposal to be voted by the community and if it is approved then be executed by the Governor.

### Step 4: Update the MoC Platform
After the new proposal has been approved and executed, it is necessary to update the MoC platform. This involves the following:

- Verify that the updated MoC platform is fully functional and that there are no conflicts or errors with the new V2 smart contracts implementation.

## Step 5: Monitor and Maintain the V2 Smart Contracts
After the upgrade process is complete, it is important to monitor and maintain the new V2 smart contracts implementation. This includes the following:

- Regularly check the V2 smart contracts for any potential issues or vulnerabilities.
- Ensure that any necessary updates or improvements to the V2 smart contracts are implemented promptly.

TBD! Vendors and CommissionSplitter migrations


## How to execute migration locally
In root
```
npm run ganache-cli
```

In another terminal

```
nvm use
npm run truffle-compile
npm run deploy-reset-development
```

A json file will be generated with all the deployed addresses
DOC-Contract-Internal/scripts/deploy/deployments/deployConfig-development.json

copy that file to
RDOC-Contract-Internal/scripts/deploy/upgrade_v0.2.0/deployConfig-development.json and rename proxyAddresses with v1ProxyAddresses

Go to the [ric-sc-protocol repository](https://github.com/money-on-chain/rif-sc-protocol)

Set in hardhat.config.base, network development MoCV1 address:
````
development: {
        .........
        // address deployed locally
        mocV1Address: "0x24a......050EE1",
    },
`````

```
nvm use
npm run compile
npm run deploy-development
```

Add MoCV2(proxy) address in
RDOC-Contract-Internal/scripts/deploy/upgrade_v0.2.0/deployConfig-development.json
```
"v2ProxyAddresses": {
    ...
    "MoC": "0xEeAd3374........3131Ea5477",
  },
```

In RDOC-Contract-Internal root run the following command

```
sh ./scripts/deploy/upgrade_v0.2.0/0_deploy.sh development
```