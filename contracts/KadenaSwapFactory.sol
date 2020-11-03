pragma solidity ^0.5.16;

import "./KadenaSwapWallet.sol";

contract KadenaSwapFactory {

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
    * @dev Create a new Kadena Swap wallet and map wallets to their creators
    *      and owners.
    * @param _owner The Ethereum address that owns any released amounts.
    * @param _chainwebOwner String representation of the public key that owns
    *                       the locked amounts in Chainweb.
    */
    function newKadenaSwapWallet(
        address _owner,
        string memory _chainwebOwner
    ) public returns(address) {
        KadenaSwapWallet wallet = new KadenaSwapWallet(
          msg.sender,
          _owner,
          _chainwebOwner
        );
        address walletAddr = address(wallet);
        wallets[msg.sender].push(walletAddr);
        if (msg.sender != _owner) {
            wallets[_owner].push(walletAddr);
        }
        emit CreatedKadenaSwapWallet(
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

    event CreatedKadenaSwapWallet(
      address wallet,
      address creator,
      address indexed owner,
      string indexed chainwebOwner
    );
}
