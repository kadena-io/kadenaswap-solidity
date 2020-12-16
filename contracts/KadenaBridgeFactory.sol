pragma solidity ^0.5.16;

import "./KadenaBridgeWallet.sol";

contract KadenaBridgeFactory {

    mapping(address => address[]) wallets;

    /**
    * @dev Retrieves which wallets were created or owned by specific user.
    * @param _user The user address
    */
    function getWallets(address _user) public view
      returns(address[] memory){
        return wallets[_user];
    }

    /**
    * @dev Create a new Kadena Bridge wallet and map wallets to their creators
    *      and owners.
    * @param _owner The Ethereum address that owns any released amounts.
    * @param _chainwebOwner String representation of the public key that owns
    *                       the locked amounts in Chainweb.
    */
    function newKadenaBridgeWallet(
        address _owner,
        string memory _chainwebOwner
    ) public returns(address) {
        KadenaBridgeWallet wallet = new KadenaBridgeWallet(
          msg.sender,
          _owner,
          _chainwebOwner
        );
        address walletAddr = address(wallet);
        wallets[msg.sender].push(walletAddr);
        if (msg.sender != _owner) {
            wallets[_owner].push(walletAddr);
        }
        emit CreatedKadenaBridgeWallet(
          walletAddr,
          msg.sender,
          _owner,
          _chainwebOwner
        );
        return walletAddr;
    }

    /**
    * @dev Prevents sending ether to the factory contract.
    */
    function () external {
        revert();
    }

    event CreatedKadenaBridgeWallet(
      address wallet,
      address creator,
      address indexed owner,
      string indexed chainwebOwner
    );
}
