// The environment variables are loaded in hardhat.config.ts
const mnemonic = process.env.MNEMONIC;
if (!mnemonic) {
  throw new Error("Please set your MNEMONIC in a .env file");
}

module.exports = {
  istanbulReporter: ["html", "lcov", "cobertura"],
  providerOptions: {
    mnemonic,
  },
  skipFiles: ["mocks", "test", "echidna"],
  // to don't get stack too deep: https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#running-out-of-stack
  configureYulOptimizer: true,
  mocha: {
    grep: /.*gas estimation.*/i,
    invert: true,
  },
};
