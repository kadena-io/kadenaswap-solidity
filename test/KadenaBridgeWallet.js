const KadenaBridgeWallet = artifacts.require("./KadenaBridgeWallet.sol");
const ToptalToken = artifacts.require("./ToptalToken.sol");
const SHA1 = artifacts.require("./SHA1.sol");

let ethToSend = web3.utils.toWei("1", "ether");
let someGas = web3.utils.toWei("0.01", "ether");
let creator;
let owner;

// web3's `getGasPrice` returns value in wei
let avgGasPrice = 47000000000; // in wei (average in last year)
let slowerGasPrice = 29000000000; // in wei
let veryFastGasPrice = 70000000000; // in wei
let etherToUSD = 614.82;  // value of 1 ether in USD (Dec 2020)

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

function getGasCosts(gas, gasPrice, etherToUSD) {
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

contract ('KadenaBridgeWallet', (accounts) => {

    before(async () => {
        creator = accounts[0];
        owner = accounts[1];
        other = accounts[2];
	});

  it("Gas cost - SHA1 assembly implementation - SIZE = 10", async () => {
    // Source: https://github.com/ensdomains/solsha1
    let gasPrice = avgGasPrice;  // in wei
        etherToUSD = 614.82;  // value in USD of 1 ether

    let sha1Contract = await SHA1.new({from: creator});

    let proof = genProofN(10);
        gasAmount = await sha1Contract.sha1.estimateGas(
          proof.sides,
          {from: creator});
        gas = Number(gasAmount);

    console.log("SHA1 Proof length = " + proof.proofLength);
    let results = getGasCosts(gas, gasPrice, etherToUSD);
  });

  it("Gas cost - SHA1 assembly implementation - SIZE = 100", async () => {
    // Source: https://github.com/ensdomains/solsha1
    let gasPrice = avgGasPrice;  // in wei
        etherToUSD = 614.82;  // value in USD of 1 ether

    let sha1Contract = await SHA1.new({from: creator});

    let proof = genProofN(100);
        gasAmount = await sha1Contract.sha1.estimateGas(
          proof.sides,
          {from: creator});
        gas = Number(gasAmount);

    console.log("SHA1 Proof length = " + proof.proofLength);
    let results = getGasCosts(gas, gasPrice, etherToUSD);
  });

  it("Gas cost - SHA1 assembly implementation - SIZE = 1000", async () => {
    // Source: https://github.com/ensdomains/solsha1
    let gasPrice = avgGasPrice;  // in wei
        etherToUSD = 614.82;  // value in USD of 1 ether

    let sha1Contract = await SHA1.new({from: creator});

    let proof = genProofN(1000);
        gasAmount = await sha1Contract.sha1.estimateGas(
          proof.sides,
          {from: creator});
        gas = Number(gasAmount);

    console.log("SHA1 Proof length = " + proof.proofLength);
    let results = getGasCosts(gas, gasPrice, etherToUSD);
  });

  it("Validate simple Merkle proof", async () => {
      // Create the wallet contract
      let kadenaBridgeWallet = await KadenaBridgeWallet.new(creator, owner, "someChainwebPublicKey");

      // Not valid merkle tree. Used to test iteration and hashing logic.
      let helloLeafHash = makeLeafHash("hello");
          worldLeafHash = makeLeafHash("world");
          expectedRoot = makeNodeHash(helloLeafHash, worldLeafHash);

      assert(helloLeafHash == "0xaa872873635ad305d25327a952b25396b95b3ddfcfd661ab26241a853f70451c",
            "Leaf hash of `hello` DOES NOT match Haskell calculated hash");
      assert(worldLeafHash == "0x6fb62750ef421842f3daf5b532cb72ab6530a5e3005b7e76295717fd4d272a66",
            "Leaf hash of `world` DOES NOT match Haskell calculated hash");
      assert(expectedRoot == "0xe05caef6cbd3e77acdea8693af934b82b5b6ceeca539601af8deeede7c6455a1",
            "Expected root DOES NOT Haskell calculated hash");

      let actualRoot = await kadenaBridgeWallet.runMerkleProof(
            helloLeafHash,   // subject hash
            1, // proof path step count
            [worldLeafHash], // proof path hashes
            ["0x01"], // proof path sides (adds path proof to right)
            {from: creator});

      assert(expectedRoot == actualRoot,
        "Expected and actual root DO NOT match");
  });

  it("Validate actual Merkle proof", async () => {
      // Create the wallet contract
      let kadenaBridgeWallet = await KadenaBridgeWallet.new(creator, owner, "someChainwebPublicKey");

      /* To replicate in Haskell:
        `{-# LANGUAGE TypeApplications #-}
         {-# LANGUAGE OverloadedStrings #-}

         import Data.MerkleLog
         import qualified Data.ByteString as B
         import Crypto.Hash.Algorithms (Keccak_256)
         import qualified Data.ByteArray as BA
         import qualified Data.Memory.Endian as BA

         inputs = ["a", "b", "c"] :: [B.ByteString]
         inputs' = map InputNode inputs

         -- create tree
         t = merkleTree @Keccak_256 inputs'

         -- create inclusion proof
         p = either (error . show) id $ merkleProof (inputs' !! 1) 1 t

         (MerkleProof proofSubj proofObj) = p
         subj = case (_getMerkleProofSubject proofSubj) of
            InputNode b -> BA.convertToBase BA.Base16 (merkleLeaf @a b)
            TreeNode r -> BA.convertToBase BA.Base16 r
         // "e99905ac9f9583a5737a07d20a7129343f486f5f549b42c05192046188ef5f66"

         BA.convertToBase @BA.Bytes BA.Base16 $ encodeMerkleProofObject proofObj :: BA.Bytes
         // "000000020000000000000001009722201502e620d70d78ee63045f3493812c206b988cbbe76c28918a7364fdbd014c89fefa814dbe46b640ca2ffb4682a1eaad32985c6604e98cc0a2fd76e49550"

         runMerkleProof p // P2wtbQwvzWd5XqUK8NyFyOLfiDLv48SeNtj-LnG8wHs
         merkleRoot t // P2wtbQwvzWd5XqUK8NyFyOLfiDLv48SeNtj-LnG8wHs
         BA.convertToBase @BA.Bytes BA.Base16 $ encodeMerkleRoot (merkleRoot t) :: BA.Bytes
         // "3f6c2d6d0c2fcd67795ea50af0dc85c8e2df8832efe3c49e36d8fe2e71bcc07b"
      */

      // Not valid merkle tree. Used to test iteration and hashing logic.
      let subj = "0xe99905ac9f9583a5737a07d20a7129343f486f5f549b42c05192046188ef5f66";
          path = [ "0x9722201502e620d70d78ee63045f3493812c206b988cbbe76c28918a7364fdbd"
                 , "0x4c89fefa814dbe46b640ca2ffb4682a1eaad32985c6604e98cc0a2fd76e49550"];
          sides = ["0x00", "0x01"];
          expectedRoot = "0x3f6c2d6d0c2fcd67795ea50af0dc85c8e2df8832efe3c49e36d8fe2e71bcc07b";

      let actualRoot = await kadenaBridgeWallet.runMerkleProof(
            subj,   // subject hash
            2, // proof path step count
            path, // proof path hashes
            sides, // proof path sides (adds path proof to right)
            {from: creator});

      assert(expectedRoot == actualRoot,
        "Expected and actual root DO NOT match");
  });

  it("Gas costs for proof SIZE = 10 and AVERAGE gas price", async () => {

      let gasPrice = avgGasPrice;  // in wei
          etherToUSD = 614.82;  // value in USD of 1 ether

      let kadenaBridgeWallet = await KadenaBridgeWallet.new(
            creator, owner, "someChainwebPublicKey"
          );

      let proof = genProofN(10);
          gasAmount = await kadenaBridgeWallet.runMerkleProof.estimateGas(
            proof.subject,   // subject hash
            proof.proofLength, // proof path step count
            proof.hashes, // proof path hashes
            proof.sides, // proof path sides (adds path proof to right)
            {from: creator});
          gas = Number(gasAmount);

      console.log("Proof length = " + proof.proofLength);
      let results = getGasCosts(gas, gasPrice, etherToUSD);
  });

  it("Gas costs for proof SIZE = 100 and AVERAGE gas price", async () => {

      let gasPrice = avgGasPrice;  // in wei

      let kadenaBridgeWallet = await KadenaBridgeWallet.new(
            creator, owner, "someChainwebPublicKey"
          );

      let proof = genProofN(100);
          gasAmount = await kadenaBridgeWallet.runMerkleProof.estimateGas(
            proof.subject,   // subject hash
            proof.proofLength, // proof path step count
            proof.hashes, // proof path hashes
            proof.sides, // proof path sides (adds path proof to right)
            {from: creator});
          gas = Number(gasAmount);

      console.log("Proof length = " + proof.proofLength);
      let results = getGasCosts(gas, gasPrice, etherToUSD);
  });

  it("Gas costs for proof SIZE = 1000 and AVERAGE gas price", async () => {

      let gasPrice = avgGasPrice;  // in wei
          etherToUSD = 614.82;  // value in USD of 1 ether

      let kadenaBridgeWallet = await KadenaBridgeWallet.new(
            creator, owner, "someChainwebPublicKey"
          );

      let proof = genProofN(1000);
          gasAmount = await kadenaBridgeWallet.runMerkleProof.estimateGas(
            proof.subject,   // subject hash
            proof.proofLength, // proof path step count
            proof.hashes, // proof path hashes
            proof.sides, // proof path sides (adds path proof to right)
            {from: creator});
          gas = Number(gasAmount);

      console.log("Proof length = " + proof.proofLength);
      let results = getGasCosts(gas, gasPrice, etherToUSD);
  });

  it("Cannot send ETH to bridge wallet via /send", async () => {
      let validProof = "someDummyValidProof";

      // Create the wallet contract
      let kadenaBridgeWallet = await KadenaBridgeWallet.new(creator, owner, "someChainwebPublicKey");

      // Attempt to send eth to the contract
      try {
        await kadenaBridgeWallet.send(ethToSend, {from: creator});
        assert(false, "Expected error not received");
      } catch (error) {} //expected
  });

  it("Owner can withdraw the ETH funds with valid proof", async () => {
      let validProof = "someDummyValidProof";

      // Create the wallet contract
      let kadenaBridgeWallet = await KadenaBridgeWallet.new(creator, owner, "someChainwebPublicKey");

      // Lock up eth in the contract
      await kadenaBridgeWallet.lockETH({value: ethToSend, from: creator});
      assert(ethToSend == await web3.eth.getBalance(kadenaBridgeWallet.address),
            "ETH owned by the wallet is not expected amount");

      // Release the eth back to owner with mock proof
      let balanceBefore = await web3.eth.getBalance(owner);
      await kadenaBridgeWallet.releaseETH(validProof, ethToSend, {from: owner});
      let balanceAfter = await web3.eth.getBalance(owner);
      assert(balanceAfter - balanceBefore >= ethToSend - someGas,
            "ETH released to wallet owner is not expected amount");
  });

 	it("Owner can withdraw the ToptalToken with valid proof", async () => {
        let validProof = "someDummyValidProof";

        // Create the wallet contract
        let kadenaBridgeWallet = await KadenaBridgeWallet.new(
          creator, owner, "someChainwebPublicKey");

        // Create ToptalToken contract
        let toptalToken = await ToptalToken.new({from: creator});

        // Check contract initiated well and has 1M of tokens
        assert(1000000000000 == await toptalToken.balanceOf(creator),
              "creator does not have expected Toptal token balance");

        // Lock up some Toptal tokens
        let amountOfTokens = 1000000000;
        await toptalToken.approve(kadenaBridgeWallet.address, amountOfTokens);
        await kadenaBridgeWallet.lockTokens(
          toptalToken.address, amountOfTokens, {from: creator});

        // Check that kadenaBridgeWallet has ToptalTokens
        assert(amountOfTokens == await toptalToken.balanceOf(kadenaBridgeWallet.address),
              "Toptal tokens owned by wallet is not expected amount");

        // Now release tokens
        await kadenaBridgeWallet.releaseTokens(
          toptalToken.address, validProof, amountOfTokens, {from: owner});

        // Check the balance is correct
        let balance = await toptalToken.balanceOf(owner);
        assert(balance.toNumber() == amountOfTokens,
              "Toptal tokens released to wallet owner is not expected amount");
    });

    it("Nobody can release funds with invalid proof", async () => {
        let invalidProof = "invalidProof";

        // Create the contract
        let kadenaBridgeWallet = await KadenaBridgeWallet.new(
          creator, owner, "someChainwebPublicKey");

        // Lock up eth in the contract
        await kadenaBridgeWallet.lockETH({value: ethToSend, from: creator});
        assert(ethToSend == await web3.eth.getBalance(kadenaBridgeWallet.address),
              "ETH owned by the wallet is not expected amount");

        try {
            await kadenaBridgeWallet.releaseETH(invalidProof, ethToSend, {from: owner});
            assert(false, "releaseETH: owner: Expected error not received");
        } catch (error) {} // expected

        try {
            await kadenaBridgeWallet.releaseETH(invalidProof, ethToSend, {from: creator});
            assert(false, "releaseETH: creator: Expected error not received");
        } catch (error) {} // expected

        try {
            await kadenaBridgeWallet.releaseETH(invalidProof, ethToSend, {from: other});
            assert(false, "releaseETH: other: Expected error not received");
        } catch (error) {} // expected

        // Contract balance is intact
        assert(ethToSend == await web3.eth.getBalance(kadenaBridgeWallet.address),
              "Contract balance is not expected amount");
    });

    it("Nobody other than the owner can withdraw funds with valid proof", async () => {
        let validProof = "someDummyValidProof";

        // Create the contract
        let kadenaBridgeWallet = await KadenaBridgeWallet.new(
          creator, owner, "someChainwebPublicKey");

        // Lock up eth in the contract
        await kadenaBridgeWallet.lockETH({value: ethToSend, from: creator});
        assert(ethToSend == await web3.eth.getBalance(kadenaBridgeWallet.address),
              "ETH owned by the wallet is expected amount");

        let balanceBefore = await web3.eth.getBalance(owner);

        try {
          await kadenaBridgeWallet.releaseETH(validProof, ethToSend, {from: creator})
          assert(false, "releaseETH: creator: Expected error not received");
        } catch (error) {} //expected

        try {
          await kadenaBridgeWallet.releaseETH(validProof, ethToSend, {from: other})
          assert(false, "releaseETH: other: Expected error not received");
        } catch (error) {} //expected

        // Contract balance is intact
        assert(ethToSend == await web3.eth.getBalance(kadenaBridgeWallet.address),
              "Contract balance is not expected amount");

        // Owner balance is intact
        assert(balanceBefore == await web3.eth.getBalance(owner),
              "Owner balance is not expected amount");
    });

    it("Allow getting info about the wallet", async () => {
        let chainwebOwner = "someChainwebPublicKey";

        // Create new KadenaBridgeWallet
        let kadenaBridgeWallet = await KadenaBridgeWallet.new(
          creator, owner, chainwebOwner);

        // Create ToptalToken contract
        let toptalToken = await ToptalToken.new({from: creator});

        // Lock up ether to the wallet
        await kadenaBridgeWallet.lockETH({value: ethToSend, from: creator});

        // Lock up Toptal tokens to the wallet
        let amountOfTokens = 1000000000;
        await toptalToken.approve(kadenaBridgeWallet.address, amountOfTokens);
        await kadenaBridgeWallet.lockTokens(
          toptalToken.address, amountOfTokens, {from: creator});

        // Get info about the wallet.
        let infoETH = await kadenaBridgeWallet.infoETH();
        let infoToken = await kadenaBridgeWallet.infoToken(toptalToken.address);

        // Compare result with expected values.
        assert(infoETH[0] == creator);
        assert(infoETH[1] == owner);
        assert(infoETH[2] == chainwebOwner);
        assert(infoETH[3] == ethToSend);

        assert(infoToken[0] == creator);
        assert(infoToken[1] == owner);
        assert(infoToken[2] == chainwebOwner);
        assert(infoToken[3] == amountOfTokens);
    });

});
