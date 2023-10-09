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

Compile new contracts
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
