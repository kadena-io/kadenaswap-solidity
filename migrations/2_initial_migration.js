var KadenaSwapFactory = artifacts.require("KadenaSwapFactory");
var ToptalToken = artifacts.require("ToptalToken");

module.exports = function(deployer) {
  deployer.deploy(KadenaSwapFactory);
  deployer.deploy(ToptalToken);
};
