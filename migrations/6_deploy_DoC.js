const StableToken = artifacts.require('./token/StableToken.sol');

module.exports = async deployer => {
  return deployer.then(() => deployer.deploy(StableToken));
};
