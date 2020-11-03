const KadenaSwapWallet = artifacts.require("./KadenaSwapWallet.sol");
const KadenaSwapFactory = artifacts.require("./KadenaSwapFactory.sol");

let ethToSend = web3.utils.toWei("1", "ether");
let kadenaSwapFactory;
let creator;
let owner;

contract('KadenaSwapFactory', (accounts) => {

    before(async () => {
        creator = accounts[0];
        owner = accounts[1];
        kadenaSwapFactory = await KadenaSwapFactory.new({from: creator});

    });

    it("Factory created contract tracked and funded", async () => {
        await kadenaSwapFactory.newKadenaSwapWallet(
            owner, "someChainwebPublicKey", {from: creator});

        // Check if wallet can be found in creator's wallets.
        let creatorWallets = await kadenaSwapFactory.getWallets.call(creator);
        assert(1 == creatorWallets.length,
              "New wallet is not found in creator's wallets");

        // Check if wallet can be found in owners's wallets.
        let ownerWallets = await kadenaSwapFactory.getWallets.call(owner);
        assert(1 == ownerWallets.length,
              "New wallet is not found in owner's wallet");

        // Check if this is the same wallet for both of them.
        assert(creatorWallets[0] === ownerWallets[0],
              "Creator and owner wallets are not the same");

        // Lock eth in the contract
        let wallet = await KadenaSwapWallet.at(creatorWallets[0]);
        await wallet.lockETH({value: ethToSend, from: creator});
        assert(ethToSend == await web3.eth.getBalance(wallet.address),
              "ETH owned by the wallet is not expected amount");
    });

});
