const HDWalletProvider = require('truffle-hdwallet-provider');
const fs = require('fs');

const mnemonicFile = `${__dirname}/mnemonic.txt`;
let mnemonic;

// Change mnemonic according to who is deploying
try {
  if (fs.existsSync(mnemonicFile)) {
    mnemonic = fs.readFileSync(mnemonicFile, { encoding: 'utf8', flag: 'r' });
  } else {
    mnemonic =
      process.env.MNEMONIC ||
      'lab direct float merit wall huge wheat loyal maple cup battle butter';
  }
} catch (err) {
  console.error(err); // eslint-disable-line no-console
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
    rdocTestnetAlpha: {
      provider: new HDWalletProvider(mnemonic, 'https://public-node.testnet.rsk.co'),
      network_id: '*',
      gas: 6700000,
      gasPrice: 69000000,
      skipDryRun: true
    },
    rdocTestnet: {
      provider: new HDWalletProvider(mnemonic, 'https://public-node.testnet.rsk.co'),
      network_id: '31',
      gas: 6700000,
      gasPrice: 69000000,
      skipDryRun: true
    },
    rdocMainnet: {
      provider: new HDWalletProvider(mnemonic, 'https://public-node.rsk.co'),
      network_id: '30',
      gas: 6700000,
      gasPrice: 60000000,
      skipDryRun: true
    },
    prueba: {
      // host: '127.0.0.1',
      // port: 8545,
      // endpoint: 'http://127.0.0.1:8545',
      // network_id: '*',
      // gas: 6721975,
      // gasPrice: 20000000000
      provider: new HDWalletProvider(mnemonic, 'https://public-node.testnet.rsk.co'),
      network_id: '31',
      gas: 6700000,
      gasPrice: 69000000,
      skipDryRun: true
    }
  },
  mocha: {
    reporter: 'eth-gas-reporter',
    useColors: true,
    bail: false,
    enableTimeouts: false
  }
};
