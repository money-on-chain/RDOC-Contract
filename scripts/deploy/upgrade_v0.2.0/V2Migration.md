# Upgrade Process for V2 protocol migration

The upgrade process for the V2 smart contracts migration on the RoC platform requires careful planning and execution. To ensure a secure and seamless upgrade, it is essential to follow the steps outlined below.

The proxy contracts that constitute the V1 protocol will be set with a Deprecated implementation that only contains the fallback function to revert any interaction with them.

- [Deprecated.sol](../../../contracts/V2_migration/Deprecated.sol)

Before that, `MoC.sol` and `MoCExchange.sol` contracts will be temporarily upgraded by an atomic implementation that contains a function to execute the migration in the changer contract.

In `MoC.sol` case, we need it to transfer its ReserveToken balance and RiskProToken's Pauser role  to the new contract.

For `MoCExchange.sol` in the other hand, we need it to transfer RiskProToken and StableToken Minter and Burner roles to the new contract.

- [MoC_Migrator.sol](../../../contracts/V2_migration/MoC_Migrator.sol)
- [MoCExchange_Migrator.sol](../../../contracts/V2_migration/MoCExchange_Migrator.sol)

The changer that will execute all these upgrades in an atomic way is the following:

- [V2MigrationChanger.sol](../../../contracts/changers/V2MigrationChanger.sol)

V2MigrationChanger will verify that all the core parameters of the V1 protocol are set the exact way in V2. Therefore, the V2 protocol should be initialized taking this into account or directly reading the on-chain parameters from V1. Operating before and after this migration, should yield the same basic results, beside using a new interface and contract.

Additionally, V2MigrationChanger will execute the split function of the CommissionSplitter to re-inject all ReserveToken that are destined for the MoC contract, ensuring that during the migration, the entire balance is transferred to the new MoCV2 contract.

## Step 1: Prepare for the Upgrade

Before beginning the upgrade process, it is important to ensure that all necessary preparations have been made. This includes:

- Review the V2 smart contracts migration proposal to understand the changes that will be implemented and their impact on the platform.
- Verify that the new V2 smart contracts code has been properly audited and tested for functionality and security.
- Ensure that all deploy scripts and other required scripts have been updated to reflect the new implementation.
- Run tests:

```sh
cd hardhat
nvm use
npm run typechain
npm run compile
npm run tests
```

Along this tests, using openzeppelin upgrade tools, we verify that the upgraded contracts do not have any storage layout collision.
There are also mainnet forking tests, that executed the migration on the rial forked mainnet instance of the protocol.

## Step 2: Deploy new MoC protocol implementations

Rif on chain V2 protocol implementation lives in [rif-sc-protocol](https://github.com/money-on-chain/rif-sc-protocol) repository.
For deployment instructions look at `MigrationFromV1.md` and `README.md` files.
Given `V2MigrationChanger.sol` checks that V2 has the same parameters than V1, to make the process easier and prevent the transaction from failing you can set MoCV1 contract address as a deploy parameter on V2 and it will fetch all the current V1 values and deploy V2 with them.

Once the new V2 smart contracts have been deployed, we need to deploy the contracts that will be upgraded to the new implementation.

- On V1, create a file named `./scripts/deploy/upgrade_v0.2.0/deployConfig-<targetNetwork>.json` with all current V1 addresses used in the `targetNetwork`, for example: [deployConfig-example-development.json](./deployConfig-example-development.json)

- Add MoCV2(proxy) address to that file

```json
v1ProxyAddresses: {
 ...
},
v2ProxyAddresses: {
  "MoC": "0xEeAd3374........3131Ea5477",
},
```

- Deploy all upgrade necessary contracts.
This script, will deploy all V1 related contracts and add them to the configuration file as it proceeds. To then deploy the changer itself initializing it with all the corresponding params. Finally, it will run a sanity verification check.

```sh
sh ./scripts/deploy/upgrade_v0.2.0/0_deploy.sh targetNetwork
```

That script will do the following steps:

1. deploy MoC migration implementation
2. deploy MoCExchange migration implementation
3. deploy MoCState migration implementation
4. deploy Deprecated implementation
5. deploy V2MigrationChanger, initializing it with all the corresponding addresses
6. verify that addresses set in the changer are ok corresponding with the json file provided

The file `./scripts/deploy/upgrade_v0.2.0/deployConfig-<targetNetwork>.json` will be filled with all the implementations contracts addresses deployed during the scripts executions.

## Step 3: Re-run mainnet forking tests now with real Changer and deployments

Mainnet forking tests, now can be adjusted to use not only V1, but also the real Changer and the V2 protocol contracts. Emulating the almost exact same execution scenario once the proposal is approved.

## Step 4: Create and post the proposal

After the changer is deployed and verified it is time to create the voting proposal to be voted by the community and if it is approved then be executed by the Governor.

## Step 5: Update MoC Platform to interact with V2

After the new proposal has been approved and executed, it is necessary to update the Roc dapp platform.

## Step 6: Monitor and Maintain the V2 Smart Contracts

After the upgrade process is complete, it is important to monitor and maintain the new V2 smart contracts implementation. This includes the following:

- Regularly check the V2 smart contracts for any potential issues or vulnerabilities.
- Ensure that any necessary updates or improvements to the V2 smart contracts are implemented promptly.

## How to execute migration locally

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
`./scripts/deploy/deployments/deployConfig-development.json`

copy that file to
`./scripts/deploy/upgrade_v0.2.0/deployConfig-development.json` and rename proxyAddresses with v1ProxyAddresses

Move to [rif-sc-protocol](https://github.com/money-on-chain/rif-sc-protocol) repository

Set in `hardhat.config.base`, network development MoCV1 address:

```json
  development: {
      ...
      // address deployed locally
      mocV1Address: "0x24a......050EE1",
  },
```

```sh
nvm use
npm run compile
npm run deploy-development
```

Add MoCV2(proxy) address in
`./scripts/deploy/upgrade_v0.2.0/deployConfig-development.json`

```json
  "v2ProxyAddresses": {
    ...
    "MoC": "0xEeAd3374........3131Ea5477",
  },
```

In V1 root, run the following command to start the deploy

```sh
sh ./scripts/deploy/upgrade_v0.2.0/0_deploy.sh development
```
