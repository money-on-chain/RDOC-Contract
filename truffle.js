const HDWalletProvider = require('truffle-hdwallet-provider');
const fs = require('fs')

const mnemonic_file = './mnemonic.txt'
let mnemonic;

// Change mnemonic according to who is deploying
try {
  if (fs.existsSync(mnemonic_file)) {
    mnemonic = fs.readFileSync(mnemonic_file, { encoding:'utf8', flag:'r' });
    console.log()
  } else {
    mnemonic =
      process.env.MNEMONIC || 'lab direct float merit wall huge wheat loyal maple cup battle butter';
  }
} catch (err) {
  console.error(err);
}

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  compilers: {
    solc: {
      version: '0.5.8',
      evmVersion: 'byzantium',
      settings: {
        optimizer: {
          enabled: true,
          runs: 1
        }
      }
    }
  },
  networks: {
    development: {
      host: '127.0.0.1',
      endpoint: 'http://127.0.0.1:8545',
      port: 8545,
      network_id: '*',
      gas: 6721975,
      gasPrice: 20000000000
    },
    coverage: {
      host: 'localhost',
      network_id: '*', // eslint-disable-line camelcase
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01
    },
    // Local node with Docker
    // https://github.com/rsksmart/artifacts/tree/master/Dockerfiles/RSK-Node
    rskRegtestLocal: {
      host: 'localhost',
      port: 4444,
      network_id: '*'
    },
    mocTestnet: {
      // 0xC67D9eE30d2119A384E02de568BE80FE785074Ba
      host: 'https://public-node.testnet.rsk.co',
      provider: new HDWalletProvider(mnemonic, 'https://public-node.testnet.rsk.co'),
      network_id: '*',
      gasPrice: 60000000
    },
    mocMainnet: {
      // 0x27A3074Db95EC5F6A0e73dC41a4859f48990E841
      host: 'https://public-node.rsk.co',
      provider: new HDWalletProvider(mnemonic, 'https://public-node.rsk.co'),
      network_id: '*',
      gasPrice: 60000000
    }
  },
  mocha: {
    useColors: true,
    bail: false
  }
};
