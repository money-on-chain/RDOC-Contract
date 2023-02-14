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

type DeployParameters = {
  stableTokenV2Params: {
    name: string;
    symbol: string;
  };
  mocAddresses: {
    mocExchange: string;
    governor: string;
    stableTokenV1: string;
  };
  // gas limit applied for each tx during deployment
  // Hardhat gas limit config cannot be used because we are using ethers.js library. https://github.com/NomicFoundation/hardhat/pull/2406
  gasLimit: number;
};
declare module "hardhat/types/config" {
  export interface HardhatNetworkUserConfig {
    deployParameters: DeployParameters;
  }
  export interface HardhatNetworkConfig {
    deployParameters: DeployParameters;
  }
  export interface HttpNetworkConfig {
    deployParameters: DeployParameters;
  }
}

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
      accounts: {
        mnemonic,
        accountsBalance: "100000000000000000000000000000000000",
      },
      gasPrice: 0,
      initialBaseFeePerGas: 0,
      // TODO: remove this
      allowUnlimitedContractSize: true,
      deployParameters: {
        stableTokenV2Params: {
          name: "USR",
          symbol: "USR",
        },
        mocAddresses: {
          // random addresses
          mocExchange: "0xf984d6f2afcf057984034ac06f2a2182cb62ce5c",
          governor: "0x94b25b38DB7cF2138E8327Fc54543a117fC20E72",
          stableTokenV1: "0xb4776c2bd17df529b98ea31661d9d852eabdd217",
        },
        gasLimit: 6800000,
      },
      tags: ["local"],
    },
    devTestnet: {
      accounts: {
        mnemonic,
      },
      chainId: 31,
      url: "https://public-node.testnet.rsk.co",
      deployParameters: {
        stableTokenV2Params: {
          name: "USR",
          symbol: "USR",
        },
        mocAddresses: {
          mocExchange: "",
          governor: "",
          stableTokenV1: "",
        },
        gasLimit: 6800000,
      },
      tags: ["testnet"],
    },
    rdocTestnetAlpha: {
      accounts: {
        mnemonic,
      },
      chainId: 31,
      url: "https://public-node.testnet.rsk.co",
      deployParameters: {
        stableTokenV2Params: {
          name: "USR",
          symbol: "USR",
        },
        mocAddresses: {
          mocExchange: "",
          governor: "",
          stableTokenV1: "",
        },
        gasLimit: 6800000,
      },
      tags: ["testnet"],
    },
    rdocTestnet: {
      accounts: {
        mnemonic,
      },
      chainId: 31,
      url: "https://public-node.testnet.rsk.co",
      deployParameters: {
        stableTokenV2Params: {
          name: "USR",
          symbol: "USR",
        },
        mocAddresses: {
          mocExchange: "",
          governor: "",
          stableTokenV1: "",
        },
        gasLimit: 6800000,
      },
      tags: ["testnet"],
    },
    rdocMainnet: {
      accounts: {
        mnemonic,
      },
      chainId: 30,
      url: "https://public-node.rsk.co",
      deployParameters: {
        stableTokenV2Params: {
          name: "USR",
          symbol: "USR",
        },
        mocAddresses: {
          mocExchange: "",
          governor: "",
          stableTokenV1: "",
        },
        gasLimit: 6800000,
      },
      tags: ["mainnet"],
    },
  },
  paths: getPath(),
  solidity: {
    compilers: [
      {
        version: "0.5.8",
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
