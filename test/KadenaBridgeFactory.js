const KadenaBridgeWallet = artifacts.require("./KadenaBridgeWallet.sol");
const KadenaBridgeFactory = artifacts.require("./KadenaBridgeFactory.sol");

let ethToSend = web3.utils.toWei("1", "ether");
let kadenaBridgeFactory;
let creator;
let owner;

contract('KadenaBridgeFactory', (accounts) => {

    before(async () => {
        creator = accounts[0];
        owner = accounts[1];
        kadenaBridgeFactory = await KadenaBridgeFactory.new({from: creator});

    });

    it("Factory created contract tracked and funded", async () => {
        await kadenaBridgeFactory.newKadenaBridgeWallet(
            owner, "someChainwebPublicKey", {from: creator});

        // Check if wallet can be found in creator's wallets.
        let creatorWallets = await kadenaBridgeFactory.getWallets.call(creator);
        assert(1 == creatorWallets.length,
              "New wallet is not found in creator's wallets");

        // Check if wallet can be found in owners's wallets.
        let ownerWallets = await kadenaBridgeFactory.getWallets.call(owner);
        assert(1 == ownerWallets.length,
              "New wallet is not found in owner's wallet");

        // Check if this is the same wallet for both of them.
        assert(creatorWallets[0] === ownerWallets[0],
              "Creator and owner wallets are not the same");

        // Lock eth in the contract
        let wallet = await KadenaBridgeWallet.at(creatorWallets[0]);
        await wallet.lockETH({value: ethToSend, from: creator});
        assert(ethToSend == await web3.eth.getBalance(wallet.address),
              "ETH owned by the wallet is not expected amount");
    });

});
