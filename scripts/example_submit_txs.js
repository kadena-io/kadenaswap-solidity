
// Source:
// https://docs.openzeppelin.com/learn/deploying-and-interacting#interacting-programmatically

const KadenaBridgeWallet = artifacts.require("./KadenaBridgeWallet.sol");
const KadenaBridgeFactory = artifacts.require("./KadenaBridgeFactory.sol");

const ToptalToken = artifacts.require("ToptalToken.sol");
const ChainwebProofTest = artifacts.require("ChainwebProofTest.sol");

let ethToSend = "0.0005";
let ethToSendInWei = web3.utils.toWei(ethToSend, "ether");

module.exports = async function main(callback) {
  try {
    // NOTE: Code should go here

    // Retrieve accounts from the local node
    const accounts = await web3.eth.getAccounts();
    console.log(accounts);

    // Set up a Truffle contract, representing our deployed instances
    const toptalToken = await ToptalToken.deployed();
    const chainwebProofTest = await ChainwebProofTest.deployed();
    const kadenaBridgeFactory = await KadenaBridgeFactory.deployed();

    await testKadenaBridgeFactory(kadenaBridgeFactory, accounts);


    callback(0);
  } catch (error) {
    console.error(error);
    callback(1);
  }
}

async function testKadenaBridgeFactory(kadenaBridgeFactory, accounts) {
  creator = accounts[0];
  owner = accounts[1];

  console.log(`Creating KadenaBridgeWallet owned by ${owner} and created by ${creator}.`);
  resNewWallet = await kadenaBridgeFactory.newKadenaBridgeWallet(
      owner, "someChainwebPublicKey", {from: creator});
  console.log(resNewWallet);

  // (local tx) Check if wallet can be found in creator's wallets.
  let creatorWallets = await kadenaBridgeFactory.getWallets(creator);
  console.log(`${creator}'s KadenaBridge wallet addresses: ${creatorWallets}`);

  // (local tx) Check if wallet can be found in owners's wallets.
  let ownerWallets = await kadenaBridgeFactory.getWallets(owner);
  console.log(`${owner}'s KadenaBridge wallet addresses: ${ownerWallets}`);

  let creatorBalBeforeLock = await getBalanceEth(creator);
  console.log(`${creator}'s eth balance before locking: ${creatorBalBeforeLock}`);

  let wallet = await KadenaBridgeWallet.at(creatorWallets[creatorWallets.length - 1]);
  console.log(`${creator} is locking up ${ethToSend} ether in the KadenaBridgeWallet at ${wallet.address}`);
  resLockEth = await wallet.lockETH({value: ethToSendInWei, from: creator});
  console.log(resLockEth);

  let creatorBalAfterLock = await getBalanceEth(creator);
  console.log(`${creator}'s eth balance after locking: ${creatorBalAfterLock}`);
  console.log(`${creator}'s difference in balance from locking: ${creatorBalBeforeLock - creatorBalAfterLock}`)

  let walletBal = await getBalanceEth(wallet.address);
  console.log(`KadenaBridgeWallet at ${wallet.address}'s balance after the lock: ${walletBal}`);
}

// Helper functions

async function getBalanceEth(acct) {
  let balWei = await web3.eth.getBalance(acct);
  let balEth = web3.utils.fromWei(balWei, 'ether');
  return balEth;
}

async function getGasCost(txResult) {
  gasUnits = txResult["receipt"]["gasUsed"];
  avgGasPrice =
}
