# RDOC Token Migration

This project is a solution to migrate actual StableToken, not upgradeable, to a new one upgradeable by UUPS proxy pattern.
The responsibility of this project is only to deploy the new token and the token migration contract. To make the Legacy contracts's upgrades we are still using the current Truffle framework
However, to test the migration implementation we need to compile and deploy here the Legacy contracts using hardhat.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

What things you need to install the software and how to install them

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
# Install proper node version
nvm use
```

Create `.env` file (you can base on [`.env.example`](./.env.example))

### Installing

A step by step series of examples that tell you how to get a development env running

Say what the step will be

```bash
# Install the dependencies
npm install
```

### Generate Types

In order to get contract types you can generate those typings when compiling

Compile Legacy contracts
```bash
npm run compile-legacy
```

Compile migration contracts
```bash
npm run compile-hh
```

Compile all
```bash
npm run compile
```

## Running the tests

```bash
npm run test
```

### Testing with Waffle

Tests using Waffle are written with Mocha alongside with Chai.

Is recommended to use Gherkin as a language to describe the test cases

```js
describe("Feature: Greeter", () => {
  describe("Scenario: Should return the new greeting once it's changed", () => {
    let greeter: Greeter;
    before("GIVEN a deployed Greeter contract", async () => {
      const factory = await ethers.getContractFactory("Greeter");
      greeter = <Greeter>await factory.deploy("Hello, world!");
      expect(await greeter.greet()).to.equal("Hello, world!");
    });
    it("WHEN greeting message changed", async () => {
      await greeter.setGreeting("Hello, World!");
    });
    it("THEN greet returns new greeting message", async () => {
      expect(await greeter.greet()).to.equal("Hello, World!");
    });
  });
});
```

We are requiring Chai which is an assertions library. These asserting functions are called "matchers", and the ones we're using here actually come from Waffle.

For more information we suggest reading waffle testing documentation [here](https://hardhat.org/guides/waffle-testing.html#testing).

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
Because we don't want this function be alive in the protocol after the migration to avoid re-execution, in the changer we are doing two upgrades. First, we upgrade them to a new implementation that includes the migration logic, and later we upgrade them again to another implementation without it. Notice: We are deploying a new implementation instead of going back to the original just to have a full and clear history of the contract, making it clear to any future dev reviewing this repo history that v0.1.15 and v0.1.17 are functional identical, but nonetheless expressive regarding their past


### Step 1: Prepare for the Upgrade
Before beginning the upgrade process, it is important to ensure that all necessary preparations have been made. This includes:

- Review the StableToken smart contract upgrade proposal to understand the changes that will be implemented and their impact on the platform.
- Verify that the new StableToken smart contract code has been properly audited and tested for functionality and security.
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

### Step 2: Deploy the New StableToken Smart Contract
The next step is to deploy the new StableToken smart contract. This involves the following:

- Set in hardhat.config.base, network config the 3 needed addresses:
````
targetNetwork: {
        .........
        mocAddresses: {
          mocExchange: "0xEeAd3374........3131Ea5477",  // proxy
          governor: "0xEeAd3374........3131Ea5477"
          stableTokenV1: "0xEeAd3374........3131Ea5477"
        },
    },
`````
- Run the deploy script for the new StableToken smart contract.
```
cd hardhat
nvm use
npm run typechain
npm run compile
npx hardhat deploy --network targetNetwork   
```

### Step 3: Deploy new MoC protocol implementations
Once the new StableToken smart contract has been deployed, we need to deploy contracts that will be upgraded new implementation.

- create a file named `RDOC-Contract-Internal/scripts/deploy/upgrade_v0.1.17/deployConfig-targetNetwork.json` with all current addresses used in the targetNetwork, for example: [deployConfig-devTestnet.json](../scripts/deploy/upgrade_v0.1.17/deployConfig-devTestnet.json)
- Add deployed addresses in Step 2. StableTokenV2(proxy) and TokenMigrator addresses in that file
```
"implementationAddresses": {
    ...
    "StableTokenV2": "0xEeAd3374........3131Ea5477",
    "TokenMigrator": "0x388dD18........aF1B82BF9Aa",
  },
```
- Run the upgrade.
```
sh ./scripts/deploy/upgrade_v0.1.17/0_deploy.sh targetNetwork
```
That script will do the following steps:
1. deploy MoC_v0116 and MoC implementations
2. deploy MoCConnector_v0116 and MoCConnector implementations
3. deploy MoCExchange_v0116 and MoCExchange implementations
4. deploy MoCState_v0116 and MoCState implementations
5. deploy MoCSettlement_v0116 and MoCSettlement implementations
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

```bash
npx hardat deploy --network development
```

### How to execute migration locally
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
DOC-Contract-Internal/scripts/deploy/upgrade_v0.1.12/deployConfig-development.json

copy that file to
RDOC-Contract-Internal/scripts/deploy/upgrade_v0.1.17/deployConfig-development.json

Set in hardhat.config.base, network development the 3 needed addresses:
````
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

```
cd hardhat
nvm use
npm run compile
npx hardhat deploy --network development   
```

Add StableTokenV2(proxy) and TokenMigrator addresses in
RDOC-Contract-Internal/scripts/deploy/upgrade_v0.1.17/deployConfig-development.json
```
"implementationAddresses": {
    ...
    "StableTokenV2": "0xEeAd3374........3131Ea5477",
    "TokenMigrator": "0x388dD18........aF1B82BF9Aa",
  },
```

In ./hardhat/scripts/custom-tasks.ts set these addresses:
````
const reserveTokenAddress = "0xEeAd3374........3131Ea5477";
const riskProTokenAddress = "0xEeAd3374........3131Ea5477";
const stableTokenV1Address = "0xEeAd3374........3131Ea5477";
const mocProxyAddress = "0xEeAd3374........3131Ea5477";
const mocConnectorProxyAddress = "0xEeAd3374........3131Ea5477";
`````

You can interact with the protocol using the custom tasks:
Mint Reserve Tokens
```
npx hardhat mint-ReserveTokens --network development --amount 10000000000000000000000
```
Mint RiskPro Tokens to add collateral
```
npx hardhat mint-RiskProTokens --network development --amount 100000000000000000000
```
Mint Stable Tokens
```
npx hardhat mint-StableTokens --network development --amount 100000000000000000000
```

Now, you can make the upgrade to migrate tokens
in root run
```
sh ./scripts/deploy/upgrade_v0.1.17/0_deploy.sh
```

Go again to hardhat folder
```
cd hardhat
```
Redeem Stable Tokens, balance should be 0 because the migration started
```
npx hardhat redeem-StableTokens --network development --amount 100000000000000000000
```
Migrate your Stable Tokens
```
npx hardhat migrate-StableTokens --network development
```
Redeem Stable Tokens
```
npx hardhat redeem-StableTokens --network development --amount 100000000000000000000
```

## Built With

* [Hardhat](https://hardhat.org/) - Task runner

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

## Versioning

We use [SemVer](http://semver.org/) and [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags).

To create a new release execute the script

`npm run release`

## License

See the [LICENSE](./LICENSE) file for details
