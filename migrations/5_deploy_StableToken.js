const StableToken = artifacts.require('./token/StableToken.sol');

module.exports = async deployer => deployer.then(() => deployer.deploy(StableToken));
