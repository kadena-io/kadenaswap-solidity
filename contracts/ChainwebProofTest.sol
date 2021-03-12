// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

// TODO:
// Array,
//

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

  function test_parseParam(bytes memory b, uint256 idx) public pure
    returns (ChainwebEventsProof.ParameterType, bytes memory){
      uint256 endIdx;
      ChainwebEventsProof.Parameter memory param;
      (endIdx, param) = ChainwebEventsProof.parseParam(b, idx);
      return (param.paramType, param.paramValue);
  }

  // Returns only the first two elements of the array
  // Motivation: Solidity doesn't allow returning an array of `bytes`
  function test_parseParamsArray_take2(bytes memory b, uint256 idx) public pure
    returns (
      ChainwebEventsProof.ParameterType,
      bytes memory,
      ChainwebEventsProof.ParameterType,
      bytes memory
    ){
      uint256 endIdx;
      ChainwebEventsProof.Parameter[] memory params;
      ChainwebEventsProof.Parameter memory firstParam;
      ChainwebEventsProof.Parameter memory secondParam;

      (endIdx, params) = ChainwebEventsProof.parseParamsArray(b, idx);
      require(params.length >= 2, "Parameters array must be at least length 2");
      firstParam = params[0];
      secondParam = params[1];

      return (firstParam.paramType, firstParam.paramValue,
              secondParam.paramType, secondParam.paramValue);
  }

  function test_parseEvent_take2Params(bytes memory b, uint256 idx) public pure
    returns (
      bytes memory,
      bytes memory,
      bytes memory,
      ChainwebEventsProof.ParameterType,
      bytes memory,
      ChainwebEventsProof.ParameterType,
      bytes memory
    ){
      uint256 endIdx;
      ChainwebEventsProof.Event memory event_;
      ChainwebEventsProof.Parameter memory firstParam;
      ChainwebEventsProof.Parameter memory secondParam;

      (endIdx, event_) = ChainwebEventsProof.parseEvent(b, idx);

      require(event_.eventParams.length >= 2, "Parameters array must be at least length 2");
      firstParam = event_.eventParams[0];
      secondParam = event_.eventParams[1];

      return (event_.eventName,
              event_.eventModule,
              event_.eventModuleHash,
              firstParam.paramType, firstParam.paramValue,
              secondParam.paramType, secondParam.paramValue);
  }

  function test_parseEventsArray_take_ith(
    bytes memory b,
    uint256 idx,
    uint256 targetEventIdx) public pure
    returns (
      bytes memory,
      bytes memory,
      bytes memory,
      ChainwebEventsProof.ParameterType,
      bytes memory,
      ChainwebEventsProof.ParameterType,
      bytes memory
    ){
      uint256 endIdx;
      ChainwebEventsProof.Event[] memory events_;

      ChainwebEventsProof.Event memory event_;
      ChainwebEventsProof.Parameter memory firstParam;
      ChainwebEventsProof.Parameter memory secondParam;

      (endIdx, events_) = ChainwebEventsProof.parseEventsArray(b, idx);
      require(events_.length >= (targetEventIdx + 1),
        "Events array must be at least length of (index + 1) passed in");
      event_ = events_[targetEventIdx];

      require(event_.eventParams.length >= 2, "Parameters array must be at least length 2");
      firstParam = event_.eventParams[0];
      secondParam = event_.eventParams[1];

      return (
        event_.eventName,
        event_.eventModule,
        event_.eventModuleHash,
        firstParam.paramType, firstParam.paramValue,
        secondParam.paramType, secondParam.paramValue);
  }

  /*
  NOTE: This gave me stack too deep errors when I tried to add more local variables.
  I also wonder if the proof subj gets big enough if we'll see some of these stack
  errors again since we're copying bytestrings naively. Should incorporate the following:
  https://github.com/summa-tx/memview-sol
  */
  function test_parseProofSubject_take_ith(
    bytes memory b,
    uint256 targetEventIdx) public pure
    returns (
      bytes memory,
      bytes memory,
      bytes memory,
      bytes memory,
      ChainwebEventsProof.ParameterType,
      bytes memory,
      ChainwebEventsProof.ParameterType,
      bytes memory
    ){
      bytes memory reqKey;
      ChainwebEventsProof.Event[] memory events_;

      ChainwebEventsProof.Event memory event_;
      ChainwebEventsProof.Parameter memory firstParam;
      ChainwebEventsProof.Parameter memory secondParam;

      (reqKey, events_) = ChainwebEventsProof.parseProofSubject(b);
      require(events_.length >= (targetEventIdx + 1),
        "Events array must be at least length of (index + 1) passed in");
      event_ = events_[targetEventIdx];

      require(event_.eventParams.length >= 2, "Parameters array must be at least length 2");
      firstParam = event_.eventParams[0];
      secondParam = event_.eventParams[1];

      return (
        reqKey,
        event_.eventName,
        event_.eventModule,
        event_.eventModuleHash,
        firstParam.paramType, firstParam.paramValue,
        secondParam.paramType, secondParam.paramValue);
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
