var KadenaSwapFactory = artifacts.require("KadenaSwapFactory");
var ToptalToken = artifacts.require("ToptalToken");
var SHA1 = artifacts.require("SHA1");

module.exports = function(deployer) {
  deployer.deploy(KadenaSwapFactory);
  deployer.deploy(ToptalToken);
  deployer.deploy(SHA1);
};
