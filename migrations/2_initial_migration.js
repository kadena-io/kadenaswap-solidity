var ToptalToken = artifacts.require("ToptalToken.sol");
var KadenaBridgeWallet = artifacts.require("KadenaBridgeWallet.sol");
var ChainwebEventsProof = artifacts.require("ChainwebEventsProof.sol");
var ChainwebProofTest = artifacts.require("ChainwebProofTest.sol");
var KadenaBridgeFactory = artifacts.require("KadenaBridgeFactory.sol");

module.exports = async function(deployer, network, accounts) {
  // TODO: more mindfull of gas price of deploying in testnet/prod networks?

  await deployer.deploy(ChainwebEventsProof);
  await deployer.link(ChainwebEventsProof, [ChainwebProofTest, KadenaBridgeWallet, KadenaBridgeFactory]);

  await deployer.deploy(ChainwebProofTest);
  await deployer.deploy(ToptalToken);

  await deployer.deploy(KadenaBridgeFactory, accounts);
};
