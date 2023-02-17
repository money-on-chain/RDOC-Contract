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
RDOC-Contract-Internal/scripts/deploy/upgrade_v0.1.21/deployConfig-development.json

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
RDOC-Contract-Internal/scripts/deploy/upgrade_v0.1.21/deployConfig-development.json
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
sh ./scripts/deploy/upgrade_v0.1.21/0_deploy.sh
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
