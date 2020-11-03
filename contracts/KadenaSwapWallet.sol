pragma solidity ^0.5.16;

import './SafeMath.sol';
import "./ERC20.sol";

contract KadenaSwapWallet {
    using SafeMath for uint256;

    address public creator;
    address public owner;
    string public chainwebOwner;


    /**
    * @dev Asserts that the transaction sender is the owner specified
    *      when this contract was created.
    */
    modifier onlyOwner {
        require(msg.sender == owner,
                "Sender is not the owner");
        _;
    }


    /**
    * @dev Create a new Kadena Swap wallet.
    * @param _creator The Ethereum address that created the account.
    * @param _owner The Ethereum address that owns any released amounts.
    * @param _chainwebOwner String representation of the public key that owns
    *                       the locked amounts in Chainweb.
    */
    constructor (
        address _creator,
        address _owner,
        string memory _chainwebOwner
    ) public {
        creator = _creator;
        owner = _owner;
        chainwebOwner = _chainwebOwner;
    }


    /**
    * @dev Only allows receiving eth through `lockETH` function.
    */
    function() external payable {
        revert();
    }


    /**
    * @dev Locks up all the ether sent to this contract address.
    * NOTE: `msg.value` contains the amount (in wei == ether / 1e18)
    *       sent in this transaction.
    */
    function lockETH() public payable {
      require(msg.value > 0, "ETH amount locked must be non-zero");
      emit LockedETH(address(this), msg.value, owner, chainwebOwner);
    }


    /**
    * @dev Locks up the specified token amount in an account owned by
    *      this contract.
    * @param _tokenContract The address of the ERC20 token.
    * @param amount The amount to be locked.
    * NOTE: Callable only for Tokens implementing ERC20.
    * TODO: It's possible to transfer tokens to this contract's token account
    *       directly without using this function.
    *       This means that no LockedTokens event would be logged, effectively
    *       "burning" this amount since it won't be able to be released.
    */
    function lockTokens(
        address _tokenContract,
        uint256 amount
    ) public {
      require(amount > 0, "Token amount locked must be non-zero");
      ERC20 token = ERC20(_tokenContract);
      uint256 allowance = token.allowance(msg.sender, address(this));
      require(allowance >= amount,
              "Insufficient token allowance for contract");
      token.transferFrom(msg.sender, address(this), amount);
      emit LockedToken(address(this), _tokenContract, amount, owner, chainwebOwner);
    }


    /**
    * @dev Releases the specified ether amount to the `owner` of this contract.
    * @param proof The string proof of ether being locked in Chainweb.
    * @param amount The amount of ether to be released.
    * NOTE: Callable by the Ethereum `owner` only.
    * NOTE: Callable only with proof that the specified ether amount was
    *       locked up in Chainweb by the `chainwebOwner`.
    */
    function releaseETH(string memory proof, uint256 amount) onlyOwner public {
       require(amount > 0, "Amount locked must be non-zero");
       require(validateRelease(proof),
               "Invalid release proof");
       address payable _owner = msg.sender;
       _owner.transfer(amount);
       emit ReleasedETH(address(this), owner, amount, chainwebOwner);
    }


    /**
    * @dev Releases the specified token amount to the `owner` of this contract.
    * @param _tokenContract The address of the ERC20 token.
    * @param proof The string proof of the tokens being locked in Chainweb.
    * @param amount The token amount to be released.
    * NOTE: Callable only for Tokens implementing ERC20.
    * NOTE: Callable by the Ethereum `owner` only.
    * NOTE: Callable only with proof that the specified token amount was
    *       locked up in Chainweb by the `chainwebOwner`.
    */
    function releaseTokens(
        address _tokenContract,
        string memory proof,
        uint256 amount
    ) onlyOwner public {
       require(amount > 0, "Amount locked must be non-zero");
       require(validateRelease(proof),
              "Invalid release proof");
       ERC20 token = ERC20(_tokenContract);
       token.transfer(owner, amount);
       emit ReleasedTokens(address(this), _tokenContract, owner, amount, chainwebOwner);
    }


    /**
    * @dev Dummy function for confirming that the Chainweb proof is valid.
    * @param proof The string proof of the amount being locked in Chainweb.
    */
    function validateRelease(
        string memory proof
    ) public pure returns(bool) {
      if (keccak256(abi.encodePacked(proof)) ==
          keccak256(abi.encodePacked("invalidProof"))) {  // dummy variable for testing
          return false;
      } else {
          return true;
      }
    }


    /**
    * @dev Retrieves information regarding this contract and its ether balance.
    */
    function infoETH() public view
      returns(address, address, string memory, uint256) {
        return (creator, owner, chainwebOwner, address(this).balance);
    }


    /**
    * @dev Retrieves information regarding this contract and its token balance.
    * @param _tokenContract The address of the ERC20 token.
    * NOTE: Callable only for Tokens implementing ERC20.
    * TODO: Keep ledger in contract tracking which tokens locked up. See
    *       `lockTokens` TODO note.
    */
    function infoToken(address _tokenContract) public view
      returns(address, address, string memory, uint256) {
        ERC20 token = ERC20(_tokenContract);
        uint256 tokenBalance = token.balanceOf(address(this));
        return (creator, owner, chainwebOwner, tokenBalance);
    }


    /**
    * TODO: Which three parameters in events to index?
    */
    event LockedETH(
      address kadenaSwapContract,
      uint256 indexed weiAmount,
      address indexed ethereumOwner,
      string indexed releasedTo
    );
    event LockedToken(
      address kadenaSwapContract,
      address indexed tokenContract,
      uint256 amount,
      address indexed ethereumOwner,
      string indexed releasedTo
    );
    event ReleasedETH(
      address indexed kadenaSwapContract,
      address indexed ethereumOwner,
      uint256 weiAmount,
      string indexed releasedFrom
    );
    event ReleasedTokens(
      address kadenaSwapContract,
      address indexed tokenContract,
      address indexed ethereumOwner,
      uint256 amount,
      string indexed releasedFrom
    );
}
