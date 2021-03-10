var ToptalToken = artifacts.require("ToptalToken.sol");
var KadenaBridgeWallet = artifacts.require("KadenaBridgeWallet.sol");
var ChainwebEventsProof = artifacts.require("ChainwebEventsProof.sol");
var ChainwebProofTest = artifacts.require("ChainwebProofTest.sol");
var KadenaBridgeFactory = artifacts.require("KadenaBridgeFactory.sol");

module.exports = async function(deployer, network, accounts) {
  await deployer.deploy(ChainwebEventsProof);
  await deployer.link(ChainwebEventsProof, [ChainwebProofTest, KadenaBridgeWallet, KadenaBridgeFactory]);

  // When migrating to a public network, Truffle does a dry run.
  // And in the case of `ropsten`, the network name used during the
  // dry run is `ropsten-fork`.
  if (network == "local" || network == "ropsten-fork" || network == "ropsten") {
    await deployer.deploy(KadenaBridgeFactory, accounts);
  } else {
    await deployer.deploy(ChainwebProofTest);
    await deployer.deploy(ToptalToken);
    await deployer.deploy(KadenaBridgeFactory, accounts);
  }
};
