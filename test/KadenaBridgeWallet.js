/**
Source(s):
- https://github.com/radek1st/time-locked-wallets/blob/master/test/TimeLockedWalletTest.js

TODO:
- Make sure failure tests actually failing as expected (right now I think they're being swallowed up).


*/

const KadenaBridgeWallet = artifacts.require("./KadenaBridgeWallet.sol");
const ToptalToken = artifacts.require("./ToptalToken.sol");
const HeaderOracle = artifacts.require("./HeaderOracle.sol");

let ethToSend = web3.utils.toWei("1", "ether");
let someGas = web3.utils.toWei("0.01", "ether");
let creator;
let owner;
let oracle;


contract ('KadenaBridgeWallet', (accounts) => {

    before(async () => {
        creator = accounts[0];
        owner = accounts[1];
        other = accounts[2];

        oracleSigner1 = accounts[2];
        oracleSigner2 = accounts[3];
        oracleSigner3 = accounts[4];
        oracleObj = await HeaderOracle.new(
          [oracleSigner1,oracleSigner2,oracleSigner3],
          {from: creator});
        oracle = oracleObj.address;
	});

  it("Cannot send ETH to bridge wallet via /send", async () => {
      let validProof = "someDummyValidProof";

      // Create the wallet contract
      let kadenaBridgeWallet = await KadenaBridgeWallet.new(creator, owner, "someChainwebPublicKey", oracle);

      // Attempt to send eth to the contract
      try {
        await kadenaBridgeWallet.send(ethToSend, {from: creator});
        assert(false, "Expected error not received");
      } catch (error) {
        expect(error.reason).equal("Use `lockETH` to send ether to contract");
      } //expected
  });

  it("Owner can withdraw the ETH funds with valid proof", async () => {
      let validProof = "someDummyValidProof";

      // Create the wallet contract
      let kadenaBridgeWallet = await KadenaBridgeWallet.new(creator, owner, "someChainwebPublicKey", oracle);

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
          creator, owner, "someChainwebPublicKey", oracle);

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
          creator, owner, "someChainwebPublicKey", oracle);

        // Lock up eth in the contract
        await kadenaBridgeWallet.lockETH({value: ethToSend, from: creator});
        assert(ethToSend == await web3.eth.getBalance(kadenaBridgeWallet.address),
              "ETH owned by the wallet is not expected amount");

        try {
            await kadenaBridgeWallet.releaseETH(invalidProof, ethToSend, {from: owner});
            assert(false, "releaseETH: owner: Expected error not received");
        } catch (error) {
          expect(error.reason).equal("Invalid release proof");
        } // expected

        try {
            await kadenaBridgeWallet.releaseETH(invalidProof, ethToSend, {from: creator});
            assert(false, "releaseETH: creator: Expected error not received");
        } catch (error) {
          expect(error.reason).equal("Sender is not the owner");
        } // expected

        try {
            await kadenaBridgeWallet.releaseETH(invalidProof, ethToSend, {from: other});
            assert(false, "releaseETH: other: Expected error not received");
        } catch (error) {
          expect(error.reason).equal("Sender is not the owner");
        } // expected

        // Contract balance is intact
        assert(ethToSend == await web3.eth.getBalance(kadenaBridgeWallet.address),
              "Contract balance is not expected amount");
    });

    it("Nobody other than the owner can withdraw funds with valid proof", async () => {
        let validProof = "someDummyValidProof";

        // Create the contract
        let kadenaBridgeWallet = await KadenaBridgeWallet.new(
          creator, owner, "someChainwebPublicKey", oracle);

        // Lock up eth in the contract
        await kadenaBridgeWallet.lockETH({value: ethToSend, from: creator});
        assert(ethToSend == await web3.eth.getBalance(kadenaBridgeWallet.address),
              "ETH owned by the wallet is expected amount");

        let balanceBefore = await web3.eth.getBalance(owner);

        try {
          await kadenaBridgeWallet.releaseETH(validProof, ethToSend, {from: creator});
          assert(false, "releaseETH: creator: Expected error not received");
        } catch (error) {
          expect(error.reason).equal("Sender is not the owner");
        } //expected

        try {
          await kadenaBridgeWallet.releaseETH(validProof, ethToSend, {from: other});
          assert(false, "releaseETH: other: Expected error not received");
        } catch (error) {
          expect(error.reason).equal("Sender is not the owner");
        } //expected

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
          creator, owner, chainwebOwner, oracle);

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
