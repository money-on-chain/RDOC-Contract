const RiskProToken = artifacts.require('./token/RiskProToken.sol');

module.exports = async deployer => {
  return deployer.then(() => deployer.deploy(RiskProToken));
};
