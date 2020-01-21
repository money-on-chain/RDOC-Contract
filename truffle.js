const HDWalletProvider = require('truffle-hdwallet-provider');

const mnemonic =
  process.env.MNEMONIC || 'lab direct float merit wall huge wheat loyal maple cup battle butter';

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
    devScripts: {
      // 0xd51128f302755666c42e3920d72ff2fe632856a9
      host: 'http://127.0.0.1:8545',
      provider: new HDWalletProvider(
        '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501200',
        'http://127.0.0.1:8545'
      )
    },
    // Usefull for running scripts
    scriptsDev: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*',
      gas: 6721975,
      gasPrice: 20000000000,
      provider: new HDWalletProvider(mnemonic, 'http://localhost:8545')
    },
    coverage: {
      host: 'localhost',
      network_id: '*', // eslint-disable-line camelcase
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01
    },
    qaTestnet: {
      // 0xd51128f302755666c42e3920d72ff2fe632856a9
      host: 'http://45.79.72.117:4445',
      provider: new HDWalletProvider(mnemonic, 'http://45.79.72.117:4445'),
      network_id: '*',
      gasPrice: 60000000
    },
    qaPrivate: {
      // 0xd51128f302755666c42e3920d72ff2fe632856a9
      host: 'http://45.79.72.117:4444/',
      provider: new HDWalletProvider(mnemonic, 'http://45.79.72.117:4444/'),
      network_id: '34567'
    },
    uatTestnet: {
      // 0xd51128f302755666c42e3920d72ff2fe632856a9
      host: 'http://50.116.28.95:4444',
      provider: new HDWalletProvider(mnemonic, 'http://50.116.28.95:4444'),
      network_id: '*',
      gasPrice: 80000000
    },
    // Local node with Docker
    // https://github.com/rsksmart/artifacts/tree/master/Dockerfiles/RSK-Node
    rskRegtestLocal: {
      host: 'localhost',
      port: 4444,
      network_id: '*'
    }
  },
  mocha: {
    useColors: true,
    bail: true
  }
};
