const KadenaSwapWallet = artifacts.require("./KadenaSwapWallet.sol");
const ToptalToken = artifacts.require("./ToptalToken.sol");

let ethToSend = web3.utils.toWei("1", "ether");
let someGas = web3.utils.toWei("0.01", "ether");
let creator;
let owner;

contract ('KadenaSwapWallet', (accounts) => {

    before(async () => {
        creator = accounts[0];
        owner = accounts[1];
        other = accounts[2];
	});

  it("Owner can withdraw the ETH funds with valid proof", async () => {
      let validProof = "someDummyValidProof";

      // Create the wallet contract
      let kadenaSwapWallet = await KadenaSwapWallet.new(creator, owner, "someChainwebPublicKey");

      // Lock up eth in the contract
      await kadenaSwapWallet.lockETH({value: ethToSend, from: creator});
      assert(ethToSend == await web3.eth.getBalance(kadenaSwapWallet.address),
            "ETH owned by the wallet is not expected amount");

      // Release the eth back to owner with mock proof
      let balanceBefore = await web3.eth.getBalance(owner);
      await kadenaSwapWallet.releaseETH(validProof, ethToSend, {from: owner});
      let balanceAfter = await web3.eth.getBalance(owner);
      assert(balanceAfter - balanceBefore >= ethToSend - someGas,
            "ETH released to wallet owner is not expected amount");
  });

 	it("Owner can withdraw the ToptalToken with valid proof", async () => {
        let validProof = "someDummyValidProof";

        // Create the wallet contract
        let kadenaSwapWallet = await KadenaSwapWallet.new(
          creator, owner, "someChainwebPublicKey");

        // Create ToptalToken contract
        let toptalToken = await ToptalToken.new({from: creator});

        // Check contract initiated well and has 1M of tokens
        assert(1000000000000 == await toptalToken.balanceOf(creator),
              "creator does not have expected Toptal token balance");

        // Lock up some Toptal tokens
        let amountOfTokens = 1000000000;
        await toptalToken.approve(kadenaSwapWallet.address, amountOfTokens);
        await kadenaSwapWallet.lockTokens(
          toptalToken.address, amountOfTokens, {from: creator});

        // Check that kadenaSwapWallet has ToptalTokens
        assert(amountOfTokens == await toptalToken.balanceOf(kadenaSwapWallet.address),
              "Toptal tokens owned by wallet is not expected amount");

        // Now release tokens
        await kadenaSwapWallet.releaseTokens(
          toptalToken.address, validProof, amountOfTokens, {from: owner});

        // Check the balance is correct
        let balance = await toptalToken.balanceOf(owner);
        assert(balance.toNumber() == amountOfTokens,
              "Toptal tokens released to wallet owner is not expected amount");
    });

    it("Nobody can release funds with invalid proof", async () => {
        let invalidProof = "invalidProof";

        // Create the contract
        let kadenaSwapWallet = await KadenaSwapWallet.new(
          creator, owner, "someChainwebPublicKey");

        // Lock up eth in the contract
        await kadenaSwapWallet.lockETH({value: ethToSend, from: creator});
        assert(ethToSend == await web3.eth.getBalance(kadenaSwapWallet.address),
              "ETH owned by the wallet is not expected amount");

        try {
            await kadenaSwapWallet.releaseETH(invalidProof, ethToSend, {from: owner});
            assert(false, "releaseETH: owner: Expected error not received");
        } catch (error) {} // expected

        try {
            await kadenaSwapWallet.releaseETH(invalidProof, ethToSend, {from: creator});
            assert(false, "releaseETH: creator: Expected error not received");
        } catch (error) {} // expected

        try {
            await kadenaSwapWallet.releaseETH(invalidProof, ethToSend, {from: other});
            assert(false, "releaseETH: other: Expected error not received");
        } catch (error) {} // expected

        // Contract balance is intact
        assert(ethToSend == await web3.eth.getBalance(kadenaSwapWallet.address),
              "Contract balance is not expected amount");
    });

    it("Nobody other than the owner can withdraw funds with valid proof", async () => {
        let validProof = "someDummyValidProof";

        // Create the contract
        let kadenaSwapWallet = await KadenaSwapWallet.new(
          creator, owner, "someChainwebPublicKey");

        // Lock up eth in the contract
        await kadenaSwapWallet.lockETH({value: ethToSend, from: creator});
        assert(ethToSend == await web3.eth.getBalance(kadenaSwapWallet.address),
              "ETH owned by the wallet is expected amount");

        let balanceBefore = await web3.eth.getBalance(owner);

        try {
          await kadenaSwapWallet.releaseETH(validProof, ethToSend, {from: creator})
          assert(false, "releaseETH: creator: Expected error not received");
        } catch (error) {} //expected

        try {
          await kadenaSwapWallet.releaseETH(validProof, ethToSend, {from: other})
          assert(false, "releaseETH: other: Expected error not received");
        } catch (error) {} //expected

        // Contract balance is intact
        assert(ethToSend == await web3.eth.getBalance(kadenaSwapWallet.address),
              "Contract balance is not expected amount");

        // Owner balance is intact
        assert(balanceBefore == await web3.eth.getBalance(owner),
              "Owner balance is not expected amount");
    });

    it("Allow getting info about the wallet", async () => {
        let chainwebOwner = "someChainwebPublicKey";

        // Create new KadenaSwapWallet
        let kadenaSwapWallet = await KadenaSwapWallet.new(
          creator, owner, chainwebOwner);

        // Create ToptalToken contract
        let toptalToken = await ToptalToken.new({from: creator});

        // Lock up ether to the wallet
        await kadenaSwapWallet.lockETH({value: ethToSend, from: creator});

        // Lock up Toptal tokens to the wallet
        let amountOfTokens = 1000000000;
        await toptalToken.approve(kadenaSwapWallet.address, amountOfTokens);
        await kadenaSwapWallet.lockTokens(
          toptalToken.address, amountOfTokens, {from: creator});

        // Get info about the wallet.
        let infoETH = await kadenaSwapWallet.infoETH();
        let infoToken = await kadenaSwapWallet.infoToken(toptalToken.address);

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
