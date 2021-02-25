var KadenaBridgeFactory = artifacts.require("KadenaBridgeFactory.sol");
var ToptalToken = artifacts.require("ToptalToken.sol");
var KadenaBridgeWallet = artifacts.require("KadenaBridgeWallet.sol");
var ChainwebEventsProof = artifacts.require("ChainwebEventsProof.sol");
var ChainwebProofTest = artifacts.require("ChainwebProofTest.sol");

module.exports = function(deployer) {
  deployer.deploy(ChainwebEventsProof);
  deployer.link(ChainwebEventsProof, [ChainwebProofTest, KadenaBridgeWallet, KadenaBridgeFactory]);

  deployer.deploy(ChainwebProofTest);
  deployer.deploy(ToptalToken);
};
