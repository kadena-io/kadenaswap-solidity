const KadenaBridgeWallet = artifacts.require("./KadenaBridgeWallet.sol");
const ToptalToken = artifacts.require("./ToptalToken.sol");

let ethToSend = web3.utils.toWei("1", "ether");
let someGas = web3.utils.toWei("0.01", "ether");
let creator;
let owner;

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

contract ('KadenaBridgeWallet', (accounts) => {

    before(async () => {
        creator = accounts[0];
        owner = accounts[1];
        other = accounts[2];
	});

  it("Validate simple SPV proof", async () => {
      // Create the wallet contract
      let kadenaBridgeWallet = await KadenaBridgeWallet.new(creator, owner, "someChainwebPublicKey");

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
