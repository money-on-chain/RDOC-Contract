import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-solhint";
import "@nomicfoundation/hardhat-chai-matchers";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
import { resolve } from "path";
import { config as dotenvConfig } from "dotenv";
import "hardhat-contract-sizer";
import "hardhat-deploy";
import "hardhat-docgen";
import "hardhat-gas-reporter";
import { removeConsoleLog } from "hardhat-preprocessor";
import { HardhatUserConfig } from "hardhat/config";
import "solidity-coverage";
import "hardhat-storage-layout";

dotenvConfig({ path: resolve(__dirname, "./.env") });

// Ensure that we have all the environment variables we need.
let mnemonic: string;
if (!process.env.MNEMONIC) {
  throw new Error("Please set your MNEMONIC in a .env file");
} else {
  mnemonic = process.env.MNEMONIC;
}

const getPath = () => {
  if (process.env.COMPILE_LEGACY) {
    return {
      root: "../",
      artifacts: "./hardhat/artifacts",
      cache: "./hardhat/cache",
      sources: "./contracts",
      tests: "./test",
    };
  } else {
    return {
      artifacts: "./artifacts",
      cache: "./cache",
      sources: "./contracts",
      tests: "./test",
    };
  }
};

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  namedAccounts: {
    deployer: 0,
    otherUser: 1,
    alice: 2,
    bob: 3,
    charlie: 4,
    vendor: 5,
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://public-node.rsk.co",
        blockNumber: 5601500,
      },
      accounts: {
        mnemonic,
        accountsBalance: "100000000000000000000000000000000000",
      },
      tags: ["local"],
    },
    development: {
      url: "http://127.0.0.1:8545",
      tags: ["dev"],
    },
    devTestnet: {
      accounts: {
        mnemonic,
      },
      chainId: 31,
      url: "https://public-node.testnet.rsk.co",
      tags: ["testnet"],
    },
    rdocTestnetAlpha: {
      accounts: {
        mnemonic,
      },
      chainId: 31,
      url: "https://public-node.testnet.rsk.co",
      tags: ["testnet"],
    },
    rdocTestnet: {
      accounts: {
        mnemonic,
      },
      chainId: 31,
      url: "https://public-node.testnet.rsk.co",
      tags: ["testnet"],
    },
    rdocMainnet: {
      accounts: {
        mnemonic,
      },
      chainId: 30,
      url: "https://public-node.rsk.co",
      tags: ["mainnet"],
    },
  },
  paths: getPath(),
  solidity: {
    compilers: [
      {
        version: "0.5.17",
        settings: {
          // https://hardhat.org/hardhat-network/#solidity-optimizer-support
          optimizer: {
            enabled: true,
            runs: 200,
          },
          outputSelection: {
            "*": {
              "*": ["storageLayout"],
            },
          },
        },
      },
      {
        version: "0.8.16",
        settings: {
          // https://hardhat.org/hardhat-network/#solidity-optimizer-support
          optimizer: {
            enabled: true,
            runs: 200,
          },
          outputSelection: {
            "*": {
              "*": ["storageLayout"],
            },
          },
        },
      },
    ],
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
    alwaysGenerateOverloads: false,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: "USD",
    gasPrice: 21,
  },
  preprocess: {
    eachLine: removeConsoleLog(hre => !["hardhat", "localhost"].includes(hre.network.name)),
  },
  docgen: {
    path: "./docs",
    clear: true,
    runOnCompile: false,
    except: ["^contracts/echidna/", "^contracts/mocks/"],
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  mocha: {
    timeout: 100000,
  },
};

export default config;
