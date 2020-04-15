const MoCLib = artifacts.require('./MoCHelperLib.sol');

module.exports = async deployer => deployer.then(() => deployer.deploy(MoCLib));
