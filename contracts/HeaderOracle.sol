pragma solidity ^0.5.16;

import './SafeMath.sol';

contract HeaderOracle {
  using SafeMath for uint256;

  address public signer1;
  address public signer2;
  address public signer3;

  struct PayloadInfo {
    string blockHeight;
    string chainId;
    string shaBlockHash;
    bool isPresent; // to facilitate checking if key in mapping
  }

  struct Vote {
    bool signer1Approval;
    bool signer2Approval;
    bool signer3Approval;
    PayloadInfo payloadInfo;
  }

  // keccak256 payload receipt root => BlockInfo
  mapping (bytes32 => PayloadInfo) verifiedPayloads;

  // keccak256 payload receipt root => Vote
  mapping (bytes32 => Vote) pendingPayloads;

  modifier validSignerOnly {
      require(msg.sender == signer1 ||
              msg.sender == signer2 ||
              msg.sender == signer3,
              "Sender is not pre-authorized to add to oracle");
      _;
  }

  constructor(address s1, address s2, address s3) public {
    signer1 = s1;
    signer2 = s2;
    signer3 = s3;
  }

  function createVote(PayloadInfo memory payload) private
    view returns(Vote memory){
      if (msg.sender == signer1) {
        Vote memory v = Vote(true, false, false, payload);
        return v;
      } else if (msg.sender == signer2) {
        Vote memory v = Vote(false, true, false, payload);
        return v;
      } else if (msg.sender == signer3) {
        Vote memory v = Vote(false, false, true, payload);
        return v;
      } else {
        revert("Sender is not pre-authorized to add to oracle");
      }
  }

  function updateVote(Vote memory vote) private view returns (Vote memory) {
    PayloadInfo memory p = vote.payloadInfo;
    bool signer1Approval = vote.signer1Approval;
    bool signer2Approval = vote.signer2Approval;
    bool signer3Approval = vote.signer3Approval;
    if (msg.sender == signer1) {
      Vote memory v = Vote(true, signer2Approval, signer3Approval, p);
      return v;
    } else if (msg.sender == signer2) {
      Vote memory v = Vote(signer1Approval, true, signer3Approval, p);
      return v;
    } else if (msg.sender == signer3) {
      Vote memory v = Vote(signer1Approval, signer2Approval, true, p);
      return v;
    } else {
      revert("Sender is not pre-authorized to add to oracle");
    }
  }

  function hasVotes(Vote memory vote) private pure returns(bool) {
    uint256 count = 0;
    if (vote.signer1Approval) {
      count += 1;
    }
    if (vote.signer2Approval) {
      count += 1;
    }
    if (vote.signer3Approval) {
      count += 1;
    }

    if (count > 2) {
      return true;
    }
    else {
      return false;
    }
  }

  function addHash (
    bytes32 keccakPayloadHash,
    string memory blockHeight,
    string memory chainId,
    string memory shaBlockHash
  ) validSignerOnly public {
    if (verifiedPayloads[keccakPayloadHash].isPresent) {
        revert("Provided payload hash already verified");
        // TODO: Add logic for undoing a verified hash
    }

    if (pendingPayloads[keccakPayloadHash].payloadInfo.isPresent) {
      Vote memory prevVote = pendingPayloads[keccakPayloadHash];
      Vote memory newVote = updateVote(prevVote);
      if (hasVotes(newVote)) {
        verifiedPayloads[keccakPayloadHash] = newVote.payloadInfo;
      } else {
        pendingPayloads[keccakPayloadHash] = newVote;
      }
    } else {
      PayloadInfo memory p = PayloadInfo(blockHeight, chainId, shaBlockHash, true);
      Vote memory v = createVote(p);
      if (hasVotes(v)) {
        verifiedPayloads[keccakPayloadHash] = p;
      } else {
        pendingPayloads[keccakPayloadHash] = v;
      }
    }
  }
}
