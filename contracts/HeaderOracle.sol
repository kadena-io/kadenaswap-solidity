// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import '@openzeppelin/contracts/math/SafeMath.sol';

contract HeaderOracle {
  using SafeMath for uint256;

  uint256 numValidSigners = 0;

  struct SignerInfo {
    bool isAdmin;
    bool isValid;
    // ^ facilitates checking if signer in mapping
    // TODO: Disabling signers needs restructuring to
    //       undo votes by sender for a hash.
  }

  struct Signers {
    address[] keys;
    mapping (address => SignerInfo) map;
  }
  Signers signers;

  struct PayloadInfo {
    string blockHeight;
    string chainId;
    string shaBlockHash;
    uint256 voteCount;
    bool isPresent; // to facilitate checking if key in mapping
  }

  // keccak256 payload receipt root => PayloadInfo
  mapping (bytes32 => PayloadInfo) payloads;

  mapping (address => mapping (bytes32 => bool)) signedHashes;

  modifier validSignerOnly {
      require(signers.map[msg.sender].isValid,
              "Sender is not pre-authorized to add to oracle");
      _;
  }

  constructor(address[] memory admins) public {
    uint adminCount = admins.length;
    numValidSigners += adminCount;
    for (uint i=0; i < adminCount; i++){
      address admin = admins[i];
      SignerInfo memory adminInfo = SignerInfo(true, true);
      signers.keys.push(admin);
      signers.map[admin] = adminInfo;
    }
  }

  function addHash (
    bytes32 keccakPayloadHash,
    string memory blockHeight,
    string memory chainId,
    string memory shaBlockHash
  ) validSignerOnly public {
    if (payloads[keccakPayloadHash].isPresent) {
      if (signedHashes[msg.sender][keccakPayloadHash]) {
        revert("This signer already voted for the provided payload hash");
      } else {
        PayloadInfo memory p = payloads[keccakPayloadHash];

        require(keccak256(abi.encodePacked(p.blockHeight)) ==
                keccak256(abi.encodePacked(blockHeight)),
                "Block height provided does not match");
        require(keccak256(abi.encodePacked(p.chainId)) ==
                keccak256(abi.encodePacked(chainId)),
                "Chain id provided does not match");
        require(keccak256(abi.encodePacked(p.shaBlockHash)) ==
                keccak256(abi.encodePacked(shaBlockHash)),
                "Block hash provided does not match");

        payloads[keccakPayloadHash].voteCount += 1;
        signedHashes[msg.sender][keccakPayloadHash] = true;

        emit HashReceivedVote(
          msg.sender,
          payloads[keccakPayloadHash].voteCount,
          keccakPayloadHash,
          blockHeight,
          chainId,
          shaBlockHash);
      }
    } else {
      PayloadInfo memory info = PayloadInfo(
        blockHeight, chainId, shaBlockHash, 1, true);
      payloads[keccakPayloadHash] = info;
      signedHashes[msg.sender][keccakPayloadHash] = true;
    }
  }

  function totalVotes(
    bytes32 keccakPayloadHash,
    string memory blockHeight,
    string memory chainId,
    string memory shaBlockHash
  ) public view
    returns(uint256) {
      if (payloads[keccakPayloadHash].isPresent) {
        PayloadInfo memory p = payloads[keccakPayloadHash];
        require(keccak256(abi.encodePacked(p.blockHeight)) ==
                keccak256(abi.encodePacked(blockHeight)),
                "Block height provided does not match");
        require(keccak256(abi.encodePacked(p.chainId)) ==
                keccak256(abi.encodePacked(chainId)),
                "Chain id provided does not match");
        require(keccak256(abi.encodePacked(p.shaBlockHash)) ==
                keccak256(abi.encodePacked(shaBlockHash)),
                "Block hash provided does not match");
        return p.voteCount;
      } else {
        revert("Provided payload hash was not found");
      }
  }

  function getPayloadInfo(
    bytes32 keccakPayloadHash
  ) public view
    returns(string memory, string memory, string memory, uint256) {
      require (payloads[keccakPayloadHash].isPresent,
              "Payload hash provided is not pending");
      PayloadInfo memory p = payloads[keccakPayloadHash];
      return (p.blockHeight, p.chainId, p.shaBlockHash, p.voteCount);
  }

  function isSignedBy(
    bytes32 keccakPayloadHash,
    address signer
    ) public view returns (bool) {
      return signedHashes[signer][keccakPayloadHash];
    }

  function getNumValidSigners() public view returns(uint256){
    return numValidSigners;
  }

  event HashReceivedVote(
    address indexed signer,
    uint256 indexed votesSoFar,
    bytes32 indexed keccakPayloadHash,
    string blockHeight,
    string chainId,
    string shaBlockHash
  );

}
