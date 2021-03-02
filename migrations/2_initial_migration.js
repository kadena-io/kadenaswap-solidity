var KadenaBridgeFactory = artifacts.require("KadenaBridgeFactory.sol");
var ToptalToken = artifacts.require("ToptalToken.sol");
var KadenaBridgeWallet = artifacts.require("KadenaBridgeWallet.sol");
var ChainwebEventsProof = artifacts.require("ChainwebEventsProof.sol");
var ChainwebProofTest = artifacts.require("ChainwebProofTest.sol");

module.exports = async function(deployer) {
  await deployer.deploy(ChainwebEventsProof);
  await deployer.link(ChainwebEventsProof, [ChainwebProofTest, KadenaBridgeWallet, KadenaBridgeFactory]);

  await deployer.deploy(ChainwebProofTest);
  await deployer.deploy(ToptalToken);
};
