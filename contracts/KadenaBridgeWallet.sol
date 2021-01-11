pragma solidity ^0.5.16;

import './SafeMath.sol';
import "./ERC20.sol";
import "./HeaderOracle.sol";

/**
Source(s):
- https://github.com/radek1st/time-locked-wallets/blob/master/contracts/TimeLockedWallet.sol
*/

contract KadenaBridgeWallet {
    using SafeMath for uint256;

    address public creator;
    address public owner;
    string public chainwebOwner;
    HeaderOracle oracle;


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
    * @dev Create a new Kadena Bridge wallet.
    * @param _creator The Ethereum address that created the account.
    * @param _owner The Ethereum address that owns any released amounts.
    * @param _chainwebOwner String representation of the public key that owns
    *                       the locked amounts in Chainweb.
    */
    constructor (
        address _creator,
        address _owner,
        string memory _chainwebOwner,
        address _oracle
    ) public {
        creator = _creator;
        owner = _owner;
        chainwebOwner = _chainwebOwner;
        oracle = HeaderOracle(_oracle);
    }


    /**
    * @dev Only allows receiving eth through `lockETH` function.
    */
    function() external payable {
        revert("Use `lockETH` to send ether to contract");
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
      address kadenaBridgeContract,
      uint256 indexed weiAmount,
      address indexed ethereumOwner,
      string indexed releasedTo
    );
    event LockedToken(
      address kadenaBridgeContract,
      address indexed tokenContract,
      uint256 amount,
      address indexed ethereumOwner,
      string indexed releasedTo
    );
    event ReleasedETH(
      address indexed kadenaBridgeContract,
      address indexed ethereumOwner,
      uint256 weiAmount,
      string indexed releasedFrom
    );
    event ReleasedTokens(
      address kadenaBridgeContract,
      address indexed tokenContract,
      address indexed ethereumOwner,
      uint256 amount,
      string indexed releasedFrom
    );


    /** The original proof object is structured as follows:
    * |-- 4 bytes (a) --||-- 8 bytes (b) --||-- (c) .. --|
    *  (a): The first 4 bytes encodes the number of proof steps
    *       as a big endian value.
    *  (b): The next 8 bytes encodes the index of the proof subject in
    *       the input order as a big endian value.
    *  (c): After the first 12 bytes, the rest of the bytes are the
    *       proof path, composed of a series of proof steps. Each step is
    *       a merkle hash of format:
    *       |--1 byte (i) --||--`hashSize` bytes (ii)--|
    *       (i): '0x00' (representing Left) and '0x01' (representing Right).
    *       (ii): The hash needed to compute the current proof path.
    */

    /**
    * @dev Execute an inclusion proof. The result of the execution is a
    *      Merkle root that must be compared to the trusted root of the
    *      Merkle tree.
    * @param subjectMerkleHash The merkle hash of the subject for
    *                          which inclusion is proven.
    * @param stepCount The number of steps in the proof path.
    * @param proofPathHashes The proof object is parsed to create this list
    *                        of merkle hashes corresponding to proof path steps.
    * @param proofPathSides List of sides as bytes1 that indicate where to append
    *                       the corresponding merkle hash in `proofPathHashes`
    *                       to the previously calculated hash to determine the
    *                       current step's hash.
    *
    * TODO: document how to transform `MerkleNodeType a b` into `MerkleHash`
    */
    function runMerkleProof(
      bytes32 subjectMerkleHash,
      uint256 stepCount,
      bytes32[] memory proofPathHashes,
      bytes1[] memory proofPathSides
    ) public pure returns(bytes32) {
      require(proofPathHashes.length == stepCount,
              "Invalid proof path: List of hashes not expected lenght (stepCount)");
      require(proofPathSides.length == stepCount,
              "Invalid proof path: List of sides not expected lenght (stepCount)");

      bytes32 root = subjectMerkleHash;
      bytes1 nodeTag = 0x01;
      for (uint i = 0; i < proofPathHashes.length; i++) {
        bytes32 currProof = proofPathHashes[i];
        bytes1 currSide = proofPathSides[i];
        if (currSide == 0x00) {  // concatenate `currProof` to LEFT of `root`
          root = keccak256(abi.encodePacked(nodeTag, currProof, root));
        } else if (currSide == 0x01) {  // concatenate `currProof` to RIGHT of `root`
          root = keccak256(abi.encodePacked(nodeTag, root, currProof));
        } else {
          revert("Invalid proof object: Invalid `side` value provided");
        }
      }
      return root;
    }

    // TODO: document function
    function checkProofInOracle(
      bytes32 subjectMerkleHash,
      uint256 stepCount,
      bytes32[] memory proofPathHashes,
      bytes1[] memory proofPathSides,
      string memory blockHeight,
      string memory chainId,
      string memory shaBlockHash
    ) public view returns(bool) {
      bytes32 root = runMerkleProof(
        subjectMerkleHash,
        stepCount,
        proofPathHashes,
        proofPathSides
      );
      return oracle.isPayloadVerified(
        root,
        blockHeight,
        chainId,
        shaBlockHash
      );
    }

}
