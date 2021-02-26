const RiskProToken = artifacts.require('./token/RiskProToken.sol');

module.exports = async deployer => deployer.then(() => deployer.deploy(RiskProToken));
