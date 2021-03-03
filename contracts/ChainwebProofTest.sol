// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;


import '@openzeppelin/contracts/math/SafeMath.sol';
import "./ChainwebEventsProof.sol";

contract ChainwebProofTest {
  using SafeMath for uint256;

  function test_readIntLE(
    bytes memory b,
    uint256 idx,
    uint256 sizeInBytes
  ) public pure returns (uint256) {
    uint256 v = ChainwebEventsProof.readIntLE(b, idx, sizeInBytes);
    return v;
  }

  function test_parseIntLEParam(bytes memory b, uint256 idx, bool isTagged) public pure
    returns (uint256){
      uint256 endIdx;
      uint256 v;
      (endIdx, v) = ChainwebEventsProof.parseIntLEParam(b, idx, isTagged);
      return v;
  }

  function test_parseBytesParam(bytes memory b, uint256 idx) public pure
    returns (bytes memory){
      uint256 endIdx;
      bytes memory parsed;
      (endIdx, parsed) = ChainwebEventsProof.parseBytesParam(b, idx);
      return parsed;
  }

  function test_hashLeafKeccak256(bytes memory b) public pure
    returns (bytes32){
      bytes32 hsh = ChainwebEventsProof.hashLeafKeccak256(b);
      return hsh;
  }

  function test_hashNodeKeccak256(bytes32 hsh1, bytes32 hsh2) public pure
    returns (bytes32){
      bytes32 hsh = ChainwebEventsProof.hashNodeKeccak256(hsh1, hsh2);
      return hsh;
  }

  function test_runMerkleProofKeccak256(
    bytes memory subj,
    uint256 stepCount,
    bytes32[] memory proofPathHashes,
    bytes1[] memory proofPathSides
  ) public pure returns(bytes32) {
    bytes32 root = ChainwebEventsProof.runMerkleProofKeccak256(
      subj,
      stepCount,
      proofPathHashes,
      proofPathSides
    );
    return root;
  }

}
