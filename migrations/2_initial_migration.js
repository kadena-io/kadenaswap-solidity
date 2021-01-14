// var KadenaBridgeFactory = artifacts.require("KadenaBridgeFactory.sol");
var ToptalToken = artifacts.require("ToptalToken.sol");

module.exports = function(deployer) {
  //deployer.deploy(KadenaBridgeFactory);
  deployer.deploy(ToptalToken);
};
