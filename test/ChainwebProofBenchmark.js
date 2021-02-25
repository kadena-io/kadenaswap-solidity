
const ChainwebProofTest = artifacts.require("./ChainwebProofTest.sol");

let ethToSend = web3.utils.toWei("1", "ether");
let someGas = web3.utils.toWei("0.01", "ether");
let creator;
let tester;

// web3's `getGasPrice` returns value in wei
let avgGasPrice = 47000000000; // in wei (average in last year - 2020)
let slowerGasPrice = 29000000000; // in wei
let veryFastGasPrice = 70000000000; // in wei
let etherToUSD = 614.82;  // value of 1 ether in USD (Dec 2020)

/* =========================
 *  BENCHMARKS
 * =========================
 **/

contract ('ChainwebProofBenchmark', (accounts) => {

    before(async () => {
        creator = accounts[0];
        tester = await ChainwebProofTest.new({from: creator});
	});

  it("Gas costs for proof SIZE = 10 and AVERAGE gas price", async () => {
      let n = 10;
          proof = genProofN(n);
          gasAmount = await tester.test_runMerkleProofKeccak256.estimateGas(
            proof.subject,   // subject hash
            proof.proofLength, // proof path step count
            proof.hashes, // proof path hashes
            proof.sides, // proof path sides (adds path proof to right)
            {from: creator});
          gas = Number(gasAmount);

      console.log("Proof length = " + proof.proofLength);
      let results = printGasCosts(gas, avgGasPrice, etherToUSD);
  });

  it("Gas costs for proof SIZE = 100 and AVERAGE gas price", async () => {
      let n = 100;
          proof = genProofN(n);
          gasAmount = await tester.test_runMerkleProofKeccak256.estimateGas(
            proof.subject,   // subject hash
            proof.proofLength, // proof path step count
            proof.hashes, // proof path hashes
            proof.sides, // proof path sides (adds path proof to right)
            {from: creator});
          gas = Number(gasAmount);

      console.log("Proof length = " + proof.proofLength);
      let results = printGasCosts(gas, avgGasPrice, etherToUSD);
  });

  it("Gas costs for proof SIZE = 500 and AVERAGE gas price", async () => {
      let n = 500;
          proof = genProofN(n);
          gasAmount = await tester.test_runMerkleProofKeccak256.estimateGas(
            proof.subject,   // subject hash
            proof.proofLength, // proof path step count
            proof.hashes, // proof path hashes
            proof.sides, // proof path sides (adds path proof to right)
            {from: creator});
          gas = Number(gasAmount);

      console.log("Proof length = " + proof.proofLength);
      let results = printGasCosts(gas, avgGasPrice, etherToUSD);
  });

});

/* =========================
 *  HELPER FUNCTIONS
 * =========================
 **/

function makeLeafHash(str) {
 let inputHex = web3.utils.toHex(str);
     inputBytes = web3.utils.hexToBytes(inputHex);
     leafTagBytes = web3.utils.hexToBytes("0x00");
     bytes = leafTagBytes.concat(inputBytes);
     hex = web3.utils.bytesToHex(bytes);
     hash = web3.utils.soliditySha3(hex);
 return hash;  // in hex string
}

function makeNodeHash(hexA, hexB) {
 let nodeTagBytes = web3.utils.hexToBytes("0x01");
     bytesA = web3.utils.hexToBytes(hexA);
     bytesB = web3.utils.hexToBytes(hexB);
     bytes = nodeTagBytes.concat(bytesA.concat(bytesB));
     hex = web3.utils.bytesToHex(bytes);
     hash = web3.utils.soliditySha3(hex);
 return hash;  // in hex string
}

function genProofN(proofLength) {
  let subject = makeLeafHash("hello");
      worldLeafHash = makeLeafHash("world");
      hashes = Array.from({length: proofLength}, (_, i) => worldLeafHash);
      sides = Array.from({length: proofLength}, (_, i) => "0x01");

  return {
    subject,
    hashes,
    sides,
    proofLength
  };
};

function printGasCosts(gas, gasPrice, etherToUSD) {
  let wei = Number(gas * gasPrice);
      ether = web3.utils.fromWei(wei.toFixed(0), 'ether');
      usd = ether * etherToUSD;

  console.log("Gas Price is " + gasPrice + " wei");
  console.log("Gas estimation = " + gas + " units");
  console.log("Gas cost estimation = " + wei + " wei");
  console.log("Gas cost estimation = " + ether + " ether");
  console.log("Gas cost estimation = " + usd + " USD");

  return {
    gas,
    wei,
    ether,
    usd
  };
};
