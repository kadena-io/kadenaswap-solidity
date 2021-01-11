pragma solidity ^0.5.16;

/**
Source(s):
- https://github.com/radek1st/time-locked-wallets/blob/master/contracts/TimeLockedWalletFactory.sol
*/

import "./KadenaBridgeWallet.sol";
import "./HeaderOracle.sol";

contract KadenaBridgeFactory {

    HeaderOracle oracle;
    mapping(address => address[]) wallets;

    /**
    * @dev Create a new Kadena Bridge Factory and Header Oracle.
    * @param signer1 The first authorized signer allowed to add to header oracle.
    * @param signer2 The second authorized signer allowed to add to header oracle.
    * @param signer3 The third authorized signer allowed to add to header oracle.
    */
    constructor(address signer1, address signer2, address signer3) public {
      oracle = new HeaderOracle(signer1, signer2, signer3);
    }

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
        address oracleAddr = address(oracle);
        KadenaBridgeWallet wallet = new KadenaBridgeWallet(
          msg.sender,
          _owner,
          _chainwebOwner,
          oracleAddr
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
