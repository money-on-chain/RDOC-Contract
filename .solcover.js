module.exports = {
    norpc: true,
    testCommand: 'node --max-old-space-size=4096 ../node_modules/.bin/truffle test --network coverage',
    compileCommand: 'node --max-old-space-size=4096 ../node_modules/.bin/truffle compile --network coverage',
    copyPackages: ['openzeppelin-solidity', 'moc-governance'],
    skipFiles: [
        'Migrations.sol',
        'mocks',
        'interfaces',
        'contracts_updated',
        'changers/productive',
        'test-contracts',
        'PartialExecution.sol'
    ],
    mocha: {
        enableTimeouts: false
    }
}
