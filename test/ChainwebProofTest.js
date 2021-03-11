
const ChainwebProofTest = artifacts.require("./ChainwebProofTest.sol");
const pact_lang = require("pact-lang-api");
const base64url = require("base64-url");

let ethToSend = web3.utils.toWei("1", "ether");
let someGas = web3.utils.toWei("0.01", "ether");
let creator;
let tester;

/* =========================
 *  TESTS
 * - (A) Test Helper functions
 * - (B) Event Proof encoding test
 * - (C) Inclusion proof tests
 * =========================
 **/


contract ('ChainwebProofTest', (accounts) => {

    before(async () => {
        creator = accounts[0];
        tester = await ChainwebProofTest.new({from: creator});
	});

  /* =========================
   * (A) Test Helper functions
   * =========================
   **/

 it("Test base64 encode and decode helper functions", async () => {
     let expectedB64Url = "VlVm90jiVdlkQ9frX_XtVtYeTj5lTOlcVkj65jsjSUM";
         expectedStrictHex = "0x565566f748e255d96443d7eb5ff5ed56d61e4e3e654ce95c5648fae63b234943";
         actualB64Url = strictHexToBase64Url(expectedStrictHex);
         actualStrictHex = base64UrlToStrictHex(expectedB64Url);

     assert_(actualStrictHex, expectedStrictHex);
     assert_(actualB64Url, expectedB64Url);

  });

  it("Validate JavaScript leaf and node hashing functions", async () => {
      let helloLeafHash = makeLeafHash("hello");
          worldLeafHash = makeLeafHash("world");
          helloWorldNodeHash = makeNodeHash(helloLeafHash, worldLeafHash);

      assert(helloLeafHash == "0xaa872873635ad305d25327a952b25396b95b3ddfcfd661ab26241a853f70451c",
            "Leaf hash of `hello` DOES NOT match Haskell calculated hash");
      assert(worldLeafHash == "0x6fb62750ef421842f3daf5b532cb72ab6530a5e3005b7e76295717fd4d272a66",
            "Leaf hash of `world` DOES NOT match Haskell calculated hash");
      assert(helloWorldNodeHash == "0xe05caef6cbd3e77acdea8693af934b82b5b6ceeca539601af8deeede7c6455a1",
            "Node hash DOES NOT Haskell calculated hash");

      assert(makeLeafHash("b") == "0xe99905ac9f9583a5737a07d20a7129343f486f5f549b42c05192046188ef5f66",
            "Expected subject hash is NOT a leaf hash");
  });

  it("Validate Solidity leaf and node hashing functions", async () => {

      // Not valid merkle tree. Used to test iteration and hashing logic.
      let hello = web3.utils.toHex("hello");
          world = web3.utils.toHex("world");
          expectedHelloLeafHash = makeLeafHash("hello");
          expectedWorldLeafHash = makeLeafHash("world");
          expectedHelloWorldNodeHash = makeNodeHash(
            expectedHelloLeafHash, expectedWorldLeafHash);

          actualHelloLeafHash = await tester.test_hashLeafKeccak256(hello);
          actualWorldLeafHash = await tester.test_hashLeafKeccak256(world);
          actualHelloWorldNodeHash = await tester.test_hashNodeKeccak256(
            actualHelloLeafHash, actualWorldLeafHash);

      assert(expectedHelloLeafHash == actualHelloLeafHash,
            "Leaf hash of `hello` DOES NOT match JavaScript calculated hash");
      assert(expectedWorldLeafHash == actualWorldLeafHash,
            "Leaf hash of `world` DOES NOT match Javascript calculated hash");
      assert(expectedHelloWorldNodeHash == actualHelloWorldNodeHash,
            "Node hash of `helloworld` hashes DOES NOT match Javascript calculated hash");
  });

  /* =========================
   * (B) Event Proof encoding test
   * =========================
   **/

  it("Validate converting a bytes sub-array into a little endian integer", async () => {
      // Bytes sub-array that encodes `43` (as little endian, 4 bytes)
      let encoding1 = "0x002b000000566c566d39306a6956646c6b51396672585f587456745965546a356c544f6c63566b6a36356a736a53554d";
                   //      ^-------^ sub-array in question
          expectedInt1 = "43";
          startIdx1 = 1;  // based on bytes array
          sizeInBytes1 = 4;
          parsed1 = await tester.test_readIntLE(encoding1, startIdx1, sizeInBytes1);
      assert_(parsed1.toString(), expectedInt1);

      let encoding2 = "0xc7711ce8fe864585a63dc2580e5b000000000000000000000000000000000000";
          expectedInt2 = "1846835937711111111111111111111111";
          startIdx2 = 0;
          sizeInBytes2 = 32;
          parsed2 = await tester.test_readIntLE(encoding2, startIdx2, sizeInBytes2);
      assert_(parsed2.toString(), expectedInt2);

  });

  it("Validate parsing for Event's Integer parameter", async () => {
      let encoding1 = "0x01c7711ce8fe864585a63dc2580e5b000000000000000000000000000000000000";
          expectedInt1 = "1846835937711111111111111111111111";
          startIdx1 = 0;
          parsed1 = await tester.test_parseIntLEParam(encoding1, startIdx1, true);
      assert_(parsed1.toString(), expectedInt1);

  });

  it("Validate parsing for Event's ByteString parameter", async () => {
      // Encodes request key "VlVm90jiVdlkQ9frX_XtVtYeTj5lTOlcVkj65jsjSUM"
      let rk = "VlVm90jiVdlkQ9frX_XtVtYeTj5lTOlcVkj65jsjSUM";
          expectedParsing = base64UrlToStrictHex(rk);

          encoding = "0x0020000000565566f748e255d96443d7eb5ff5ed56d61e4e3e654ce95c5648fae63b234943";
          actualParsing = await tester.test_parseBytesParam(encoding, 0);

      assert_(actualParsing, expectedParsing);
  });

  it("Validate parsing for Event's ByteString parameter", async () => {
      // Encodes request key "VlVm90jiVdlkQ9frX_XtVtYeTj5lTOlcVkj65jsjSUM"
      let encoding1 = "0x002b000000566c566d39306a6956646c6b51396672585f587456745965546a356c544f6c63566b6a36356a736a53554d";
          expectedHex1 = "0x566c566d39306a6956646c6b51396672585f587456745965546a356c544f6c63566b6a36356a736a53554d";
          parsed1 = await tester.test_parseBytesParam(encoding1, 0);
      assert(parsed1 == expectedHex1, "Case 1: Failed to decode bytes");
  });

  /* =========================
   * (C) Inclusion proof tests
   * =========================
   **/

  it("Validate pseudo Merkle proof", async () => {

      // Not valid merkle tree. Used to test iteration and hashing logic.
      let hello = web3.utils.toHex("hello");
          helloLeafHash = await tester.test_hashLeafKeccak256(hello);
          worldLeafHash = makeLeafHash("world");

      let actualRoot = await tester.test_runMerkleProofKeccak256(
            hello,   // subject hex
            1, // proof path step count
            [worldLeafHash], // proof path hashes
            ["0x01"], // proof path sides (i.e. hashes (currRoot + ith proof path))
            {from: creator});
          expectedRoot = makeNodeHash(helloLeafHash, worldLeafHash);

      assert(expectedRoot == actualRoot,
        "Expected and actual root DO NOT match");
  });

  it("Validate actual Chainweb Merkle proof", async () => {
      let subj = web3.utils.toHex("b");
          actualSubjHash = await tester.test_hashLeafKeccak256(subj);

      assert(actualSubjHash == makeLeafHash("b"),
            "Expected subject hash does NOT match leaf hash calculated by solidity contract");

      // Parsed version of "000000020000000000000001009722201502e620d70d78ee63045f3493812c206b988cbbe76c28918a7364fdbd014c89fefa814dbe46b640ca2ffb4682a1eaad32985c6604e98cc0a2fd76e49550"
      /* NOTE: The original proof object is structured as follows:
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
      let path = [ "0x9722201502e620d70d78ee63045f3493812c206b988cbbe76c28918a7364fdbd"
                 , "0x4c89fefa814dbe46b640ca2ffb4682a1eaad32985c6604e98cc0a2fd76e49550"];
          sides = ["0x00", "0x01"];
          expectedRoot = "0x3f6c2d6d0c2fcd67795ea50af0dc85c8e2df8832efe3c49e36d8fe2e71bcc07b";

      let actualRoot = await tester.test_runMerkleProofKeccak256(
            subj,   // subject in hex
            2, // proof path step count
            path, // proof path hashes
            sides, // proof path sides (adds path proof to right)
            {from: creator});

      assert(expectedRoot == actualRoot,
        "Expected and actual root DO NOT match");

      /* To replicate in Haskell:
        `{-# LANGUAGE TypeApplications #-}
         {-# LANGUAGE OverloadedStrings #-}

         import Data.MerkleLog
         import qualified Data.ByteString as B
         import Crypto.Hash.Algorithms (Keccak_256)
         import qualified Data.ByteArray as BA
         import qualified Data.Memory.Endian as BA

         inputs = ["a", "b", "c"] :: [B.ByteString]
         inputs' = map InputNode inputs

         -- create tree
         t = merkleTree @Keccak_256 inputs'

         -- create inclusion proof
         p = either (error . show) id $ merkleProof (inputs' !! 1) 1 t

         (MerkleProof proofSubj proofObj) = p
         subj = case (_getMerkleProofSubject proofSubj) of
            InputNode b -> BA.convertToBase BA.Base16 (merkleLeaf @a b)
            TreeNode r -> BA.convertToBase BA.Base16 r
         // "e99905ac9f9583a5737a07d20a7129343f486f5f549b42c05192046188ef5f66"

         BA.convertToBase @BA.Bytes BA.Base16 $ encodeMerkleProofObject proofObj :: BA.Bytes
         // "000000020000000000000001009722201502e620d70d78ee63045f3493812c206b988cbbe76c28918a7364fdbd014c89fefa814dbe46b640ca2ffb4682a1eaad32985c6604e98cc0a2fd76e49550"

         runMerkleProof p // P2wtbQwvzWd5XqUK8NyFyOLfiDLv48SeNtj-LnG8wHs
         merkleRoot t // P2wtbQwvzWd5XqUK8NyFyOLfiDLv48SeNtj-LnG8wHs
         BA.convertToBase @BA.Bytes BA.Base16 $ encodeMerkleRoot (merkleRoot t) :: BA.Bytes
         // "3f6c2d6d0c2fcd67795ea50af0dc85c8e2df8832efe3c49e36d8fe2e71bcc07b"
      */
  });

});

/* =========================
 *  HELPER FUNCTIONS
 * =========================
 **/

function assert_(actual, expected) {
  let errMsg = `Expected ${expected}, but received ${actual}`;
  assert(actual == expected, errMsg);
}

function makeLeafHash(str) {
 let inputHex = web3.utils.toHex(str);
     inputBytes = web3.utils.hexToBytes(inputHex);
     leafTagBytes = web3.utils.hexToBytes("0x00");
     bytes = leafTagBytes.concat(inputBytes);
     hex = web3.utils.bytesToHex(bytes);
     hash = web3.utils.soliditySha3(hex);
 return hash;  // in hex string
}

function makeNodeHash(hexA, hexB) {
 let nodeTagBytes = web3.utils.hexToBytes("0x01");
     bytesA = web3.utils.hexToBytes(hexA);
     bytesB = web3.utils.hexToBytes(hexB);
     bytes = nodeTagBytes.concat(bytesA.concat(bytesB));
     hex = web3.utils.bytesToHex(bytes);
     hash = web3.utils.soliditySha3(hex);
 return hash;  // in hex string
}

// A strict hex is prefixed with 0x
function strictHexToBase64Url(strictHex) {
  let bytes = web3.utils.hexToBytes(strictHex);
      base64Url = pact_lang.crypto.base64UrlEncode(bytes);
  return base64Url;
}

function base64UrlToStrictHex(base64Url) {
  let hex = base64url.decode(base64Url, "hex");
      bytes = pact_lang.crypto.hexToBin(hex);
      strictHex = web3.utils.bytesToHex(bytes);
  return strictHex;
}
