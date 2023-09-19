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
      forking: {
        url: "https://public-node.rsk.co",
        blockNumber: 5601500,
      },
      accounts: {
        mnemonic,
        accountsBalance: "100000000000000000000000000000000000",
      },
      deployParameters: {
        stableTokenV2Params: {
          name: "Local US Dollar",
          symbol: "dUSDRIF",
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
    development: {
      url: "http://127.0.0.1:8545",
      deployParameters: {
        stableTokenV2Params: {
          name: "Dev US Dollar",
          symbol: "dUSDRIF",
        },
        mocAddresses: {
          // addresses deployed locally
          mocExchange: "0x2984673887d3966d8cb97A00577fe796d8DB3D02",
          governor: "0x6A5a8B49eC1B2647d1E4b342408f5216773Cb39b",
          stableTokenV1: "0x95a51870C1F502baFdFC25c5a1224a2322ea968C",
        },
        gasLimit: 6800000,
      },
      tags: ["dev"],
    },
    devTestnet: {
      accounts: {
        mnemonic,
      },
      chainId: 31,
      url: "https://public-node.testnet.rsk.co",
      deployParameters: {
        stableTokenV2Params: {
          name: "Dev US Dollar",
          symbol: "dUSDRIF",
        },
        mocAddresses: {
          mocExchange: "0xdeb20E752Ae0c8060C2B44Ee00c9dd70f433f7A1",
          governor: "0x9Ec59F3c1DA316F9222506bb35D06C3fa9f39fa6",
          stableTokenV1: "0x2347b03b8bC723A3d66F49a91b3aDd79b1DefeB4",
        },
        gasLimit: 6800000,
      },
      tags: ["testnet"],
    },
    rdocTestnetAlpha: {
      // accounts: [`0x${process.env.MNEMONIC}`],
      accounts: {
        mnemonic,
      },
      chainId: 31,
      url: "https://public-node.testnet.rsk.co",
      deployParameters: {
        stableTokenV2Params: {
          name: "Alpha US Dollar",
          symbol: "tUSDRIF",
        },
        mocAddresses: {
          mocExchange: "0x9608F72B879CfbF6c6B9eD4EE768d339140B8074",
          governor: "0x7b716178771057195bB511f0B1F7198EEE62Bc22",
          stableTokenV1: "0x7fb303D9806A72563C46aad8d874b301419c374b",
        },
        gasLimit: 6800000,
      },
      tags: ["testnet"],
    },
    rdocTestnet: {
      // accounts: [`0x${process.env.MNEMONIC}`],
      accounts: {
        mnemonic,
      },
      chainId: 31,
      url: "https://public-node.testnet.rsk.co",
      deployParameters: {
        stableTokenV2Params: {
          name: "Test US Dollar",
          symbol: "tUSDRIF",
        },
        mocAddresses: {
          mocExchange: "0x7d5804E33B015b43159e61188526C93cfdA746f6",
          governor: "0x7b716178771057195bB511f0B1F7198EEE62Bc22",
          stableTokenV1: "0xC3De9F38581f83e281f260d0DdbaAc0e102ff9F8",
        },
        gasLimit: 6800000,
      },
      tags: ["testnet"],
    },
    rdocMainnet: {
      // accounts: [`0x${process.env.MNEMONIC}`],
      accounts: {
        mnemonic,
      },
      chainId: 30,
      url: "https://public-node.rsk.co",
      deployParameters: {
        stableTokenV2Params: {
          name: "RIF US Dollar",
          symbol: "USDRIF",
        },
        mocAddresses: {
          mocExchange: "0x9497d2AEcd0757Dd4fcb4d5F2131293570FaD305",
          governor: "0x3b8853DF65AfBd94853E6D77ee0Ab5590F41bB08",
          stableTokenV1: "0x2d919F19D4892381D58edeBeca66D5642Cef1a1f",
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
          evmVersion: "london",
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
