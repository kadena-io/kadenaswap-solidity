
// Source:
// https://docs.openzeppelin.com/learn/deploying-and-interacting#interacting-programmatically

const KadenaBridgeWallet = artifacts.require("./KadenaBridgeWallet.sol");
const KadenaBridgeFactory = artifacts.require("./KadenaBridgeFactory.sol");

let ethToSend = "0.0005";
let ethToSendInWei = web3.utils.toWei(ethToSend, "ether");


module.exports = async function main(callback) {
  try {
    // NOTE: Code should go here

    // Retrieve accounts from the local node
    const accounts = await web3.eth.getAccounts();
    console.log(accounts);

    // Set up a Truffle contract, representing our deployed instances
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

  console.log("\n-------------------------------------\n");
  creatorInitialBalEth = await getBalanceEth(creator);
  console.log(`Initial Balance=${creatorInitialBalEth} ETH, Account=${creator}`);

  resultNewWallet = await kadenaBridgeFactory.newKadenaBridgeWallet(
      owner, "someChainwebPublicKey", {from: creator});
  descNewWallet = `Create KadenaBridgeWallet:
    > Owner=${owner},
    > Creator=${creator}`;
  await printStepReport(
    descNewWallet,
    creator,
    0,
    resultNewWallet
  );

  // (local tx) Check if wallet can be found in creator's wallets.
  let creatorWallets = await kadenaBridgeFactory.getWallets(creator);
  // (local tx) Check if wallet can be found in owners's wallets.
  let ownerWallets = await kadenaBridgeFactory.getWallets(owner);

  console.log(`KadenaBridge wallets:
  > Owner or Creator: ${creator},
  > Addresses: ${creatorWallets}\n`);
  console.log(`KadenaBridge wallets:
  > Owner or Creator: ${owner},
  > Addresses: ${ownerWallets}`);

  // Get the latest wallet address created
  let wallet = await KadenaBridgeWallet.at(creatorWallets[creatorWallets.length - 1]);
  resultLockEth = await wallet.lockETH({value: ethToSendInWei, from: creator});
  descLockEth = `Lock up ETH in KadenaBridgeWallet:
    > Amount=${ethToSend} ETH,
    > Wallet Address=${wallet.address},
    > Sender=${creator}`;
  await printStepReport(
    descLockEth,
    creator,
    Number(ethToSend),
    resultLockEth
  );

  let walletBal = await getBalanceEth(wallet.address);
  console.log(`After Lock Balance=${walletBal} ETH, Account=${wallet.address} (wallet)`);

  console.log("\n-------------------------------------\n");
  creatorEndingBalEth = await getBalanceEth(creator);
  console.log(`Ending Balance=${creatorEndingBalEth} ETH, Account=${creator}`);
  console.log(`> Approx Total Cost: ${creatorInitialBalEth - creatorEndingBalEth} ETH`);
}

// Helper functions

async function printStepReport(desc, acct, ethTransfered, txResult) {
  let balEth = await getBalanceEth(acct);

  let gasUnits = txResult["receipt"]["gasUsed"];
  let { ether, gasPriceGwei } = getGasCost(gasUnits);

  // Check latest price here: https://api.etherscan.io/api?module=stats&action=ethprice
  let etherToUSD = 1826.18;  // value of 1 ether in USD (March 8, 2021)
  let usd = ether * etherToUSD;

  console.log("\n-------------------------------------\n");
  console.log(`STEP: \n${desc}`);
  console.log(txResult, '\n');
  console.log(`> Account: ${acct}`);
  console.log(`> Gas used: ${gasUnits}`);
  console.log(`> Mainnet Gas price: ${gasPriceGwei} gwei`);
  console.log(`> Value sent: ${ethTransfered} ETH`);
  console.log(`> Mainnet Total cost (eth): ${ether} ETH`);
  console.log(`> Mainnet Total cost (USD): $${usd}`);
  console.log(`> Ending balance: ` + `%c ${balEth} ETH`, 'color: #bada55');
  console.log("\n-------------------------------------\n");

}

async function getBalanceEth(acct) {
  let balWei = await web3.eth.getBalance(acct);
  let balEth = web3.utils.fromWei(balWei, 'ether');
  return Number(balEth);
}

function getGasCost(gasUnits) {
  // Check for recommended gas prices here: https://etherchain.org/api/gasPriceOracle
  // example given in gwei: {"safeLow":114,"standard":120,"fast":138,"fastest":147.5}

  let standardGasPriceGwei = "120"; // in gwei, March 9, 2021
  let safeLowGasPriceGwei = "114"; // in gwei, March 9, 2021
  let fastGasPriceGwei = "138"; // in gwei, March 9, 2021
  let fastestGasPriceGwei = "147.5"; // in gwei, March 9, 2021

  let gasPriceGwei = standardGasPriceGwei;
  let gasPriceWei = web3.utils.toWei(gasPriceGwei, 'gwei');

  let costInwei = Number(gasUnits * gasPriceWei);
  let etherStr = web3.utils.fromWei(costInwei.toFixed(0), 'ether');
  let ether = Number(etherStr);

  return {
    ether,
    gasPriceGwei
  };
}
