var KadenaBridgeFactory = artifacts.require("KadenaBridgeFactory.sol");
var ToptalToken = artifacts.require("ToptalToken.sol");
var SHA1 = artifacts.require("SHA1.sol");

module.exports = function(deployer) {
  deployer.deploy(KadenaBridgeFactory);
  deployer.deploy(ToptalToken);
  deployer.deploy(SHA1);
};
