
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

  it("Test hex to little endian integer", async () => {
    let expectedInt1 = "43";
        expectedHex1 = "0x2b000000";
        actualInt1 = strictHexToStringIntLE(expectedHex1);

        expectedInt2 = "-139853185";
        expectedHex2 = "0x7F02AAF7";
        actualInt2 = strictHexToStringIntLE(expectedHex2);

    assert_(actualInt1, expectedInt1);
    assert_(actualInt2, expectedInt2);

  });

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

  it("readIntLE: Test Solidity convert hex to little endian integers", async () => {
      // Bytes sub-array that encodes `43` (as little endian, 4 bytes)
      let encoding1 = "0x002b000000566c566d39306a6956646c6b51396672585f587456745965546a356c544f6c63566b6a36356a736a53554d";
                   //      ^------^ sub-array in question
          expectedInt1 = "43";
          startIdx1 = 1;  // Skip `0x00` byte and start at `2b...`
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

  it("parseIntLEParam", async () => {
      let encoding = "0x01c7711ce8fe864585a63dc2580e5b000000000000000000000000000000000000";
          expectedInt = "1846835937711111111111111111111111";

          parsedWithTag = await tester.test_parseIntLEParam(encoding, 0, true);

          // skip the tag (0x01 = 1 byte), hence start index passed is 1
          encoding2 = "0xc7711ce8fe864585a63dc2580e5b000000000000000000000000000000000000";
          parsedWithoutTag = await tester.test_parseIntLEParam(encoding, 1, false);

      assert_(parsedWithTag.toString(), expectedInt);
      assert_(parsedWithoutTag.toString(), expectedInt);

  });

  it("parseBytesParam", async () => {
      // Encodes request key "VlVm90jiVdlkQ9frX_XtVtYeTj5lTOlcVkj65jsjSUM"
      let rk = "VlVm90jiVdlkQ9frX_XtVtYeTj5lTOlcVkj65jsjSUM";
          expectedParsing = base64UrlToStrictHex(rk);

          encoding = "0x0020000000565566f748e255d96443d7eb5ff5ed56d61e4e3e654ce95c5648fae63b234943";
          actualParsing = await tester.test_parseBytesParam(encoding, 0, true);

      assert_(actualParsing, expectedParsing);
  });

  it("parseParam", async () => {
      // When param is a ByteString (tag: `0x00`)
      let rk = "VlVm90jiVdlkQ9frX_XtVtYeTj5lTOlcVkj65jsjSUM";
          expectedByteString = base64UrlToStrictHex(rk);
          encodingByteString = "0x0020000000565566f748e255d96443d7eb5ff5ed56d61e4e3e654ce95c5648fae63b234943";
          actualByteStringArr = await tester.test_parseParam(encodingByteString, 0);
          actualByteStringType = actualByteStringArr[0];
          actualByteStringBytes = actualByteStringArr[1];

      assert_(actualByteStringType.toString(), "0");
      assert_(actualByteStringBytes, expectedByteString);

      // When param is an Integer (tag: `0x01`)
      let encodingInt = "0x01c7711ce8fe864585a63dc2580e5b000000000000000000000000000000000000";
          expectedHexWithoutTag = "0xc7711ce8fe864585a63dc2580e5b000000000000000000000000000000000000";
          expectedInt = "1846835937711111111111111111111111";
          actualIntArr = await tester.test_parseParam(encodingInt, 0);
          actualIntType = actualIntArr[0];
          actualIntBytes = actualIntArr[1];
          actualParsedInt = await tester.test_parseIntLEParam(actualIntBytes, 0, false);

      assert_(actualIntType.toString(), "1");
      assert_(actualIntBytes, expectedHexWithoutTag);
      assert_(actualParsedInt.toString(), expectedInt);

  });

  it("parseParamsArray", async () => {
    let encoding = "0x02000000000500000068656c6c6f0119af056a34fcf2ee146ed16e5e00000000000000000000000000000000000000";
        // First param is a ByteString
        expectedFirstParamTypeBS = "0";
        expectedFirstParamValueBS = web3.utils.toHex("hello");

        // Second param is an Integer
        expectedSecondParamTypeInt = "1";
        expectedSecondParamValueInt = "7481743812763961247612973461273";

        actualParamArr = await tester.test_parseParamsArray_take2(encoding, 0);
        actualFirstParamTypeBS = actualParamArr[0];
        actualFirstParamValueBS = actualParamArr[1];
        actualSecondParamTypeInt = actualParamArr[2];
        actualSecondParamValueIntBytes = actualParamArr[3];
        actualSecondParamValueInt = await tester.test_parseIntLEParam(actualSecondParamValueIntBytes, 0, false);

    assert_(actualFirstParamTypeBS, expectedFirstParamTypeBS);
    assert_(actualFirstParamValueBS, expectedFirstParamValueBS);
    assert_(actualSecondParamTypeInt, expectedSecondParamTypeInt);
    assert_(actualSecondParamValueInt, expectedSecondParamValueInt);

  });

  it("parseEvent", async () => {
    let encoding = "0x0d000000736f6d654576656e744e616d6513000000757365722e736f6d654d6f64756c654e616d65200000006805b1b8e047077c5f04c0aa78568ee18ef8a87a9d4c6a0cb56821ae78b7988402000000000500000068656c6c6f0119af056a34fcf2ee146ed16e5e00000000000000000000000000000000000000";

        expectedEventName = web3.utils.toHex("someEventName");
        expectedEventModule = web3.utils.toHex("user.someModuleName");
        expectedEventModuleHash = base64UrlToStrictHex("aAWxuOBHB3xfBMCqeFaO4Y74qHqdTGoMtWghrni3mIQ");

        // First param is a ByteString
        expectedFirstParamTypeBS = "0";
        expectedFirstParamValueBS = web3.utils.toHex("hello");

        // Second param is an Integer
        expectedSecondParamTypeInt = "1";
        expectedSecondParamValueInt = "7481743812763961247612973461273";

        actualEventArr = await tester.test_parseEvent_take2Params(encoding, 0);
        actualEventName = actualEventArr[0];
        actualEventModule = actualEventArr[1];
        actualEventModuleHash = actualEventArr[2];

        actualFirstParamTypeBS = actualEventArr[3];
        actualFirstParamValueBS = actualEventArr[4];

        actualSecondParamTypeInt = actualEventArr[5];
        actualSecondParamValueIntBytes = actualEventArr[6];
        actualSecondParamValueInt = await tester.test_parseIntLEParam(actualSecondParamValueIntBytes, 0, false);

    assert(expectedEventName == actualEventName,
      "Event name doesn't match");
    assert(expectedEventModule == actualEventModule,
      "Event module doesn't match");
    assert(expectedEventModuleHash == actualEventModuleHash,
      "Event module hash doesn't match");

    assert(expectedFirstParamTypeBS == actualFirstParamTypeBS,
      "Event first param type doesn't match");
    assert(expectedFirstParamValueBS == actualFirstParamValueBS,
      "Event first param value doesn't match");

    assert(expectedSecondParamTypeInt == actualSecondParamTypeInt,
      "Event second param type doesn't match");
    assert(expectedSecondParamValueInt == actualSecondParamValueInt,
      "Event second param value doesn't match");

  });

  it("parseEventsArray", async () => {
    let encoding = "0x020000000d000000736f6d654576656e744e616d6513000000757365722e736f6d654d6f64756c654e616d65200000006805b1b8e047077c5f04c0aa78568ee18ef8a87a9d4c6a0cb56821ae78b7988402000000000500000068656c6c6f0119af056a34fcf2ee146ed16e5e0000000000000000000000000000000000000012000000736f6d654f746865724576656e744e616d6513000000736f6d654f746865724d6f64756c654e616d6520000000db302118cd981eebbdea5b1575ca2e03106f3910b546bc5834f15b93cc6d79a6020000000005000000776f726c64000400000077696465";

        //-- First Event --//
        expectedEventName1 = web3.utils.toHex("someEventName");
        expectedEventModule1 = web3.utils.toHex("user.someModuleName");
        expectedEventModuleHash1 = base64UrlToStrictHex("aAWxuOBHB3xfBMCqeFaO4Y74qHqdTGoMtWghrni3mIQ");

        // First Event: First param is a ByteString
        expectedFirstParamTypeBS1 = "0";
        expectedFirstParamValueBS1 = web3.utils.toHex("hello");

        // First Event: Second param is an Integer
        expectedSecondParamTypeInt1 = "1";
        expectedSecondParamValueInt1 = "7481743812763961247612973461273";

        //-- Second Event --//
        expectedEventName2 = web3.utils.toHex("someOtherEventName");
        expectedEventModule2 = web3.utils.toHex("someOtherModuleName");
        expectedEventModuleHash2 = base64UrlToStrictHex("2zAhGM2YHuu96lsVdcouAxBvORC1RrxYNPFbk8xteaY");

        // Second Event: First param is a ByteString
        expectedFirstParamTypeBS2 = "0";
        expectedFirstParamValueBS2 = web3.utils.toHex("world");

        // Second Event: Second param is an Integer
        expectedSecondParamTypeBS2 = "0";
        expectedSecondParamValueBS2 = web3.utils.toHex("wide");

        actualEventArr1 = await tester.test_parseEventsArray_take_ith(encoding, 0, 0);
        actualEventName1 = actualEventArr1[0];
        actualEventModule1 = actualEventArr1[1];
        actualEventModuleHash1 = actualEventArr1[2];

        actualFirstParamTypeBS1 = actualEventArr1[3];
        actualFirstParamValueBS1 = actualEventArr1[4];

        actualSecondParamTypeInt1 = actualEventArr1[5];
        actualSecondParamValueIntBytes1 = actualEventArr1[6];
        actualSecondParamValueInt1 = await tester.test_parseIntLEParam(actualSecondParamValueIntBytes, 0, false);


        actualEventArr2 = await tester.test_parseEventsArray_take_ith(encoding, 0, 1);
        actualEventName2 = actualEventArr2[0];
        actualEventModule2 = actualEventArr2[1];
        actualEventModuleHash2 = actualEventArr2[2];

        actualFirstParamTypeBS2 = actualEventArr2[3];
        actualFirstParamValueBS2 = actualEventArr2[4];

        actualSecondParamTypeBS2 = actualEventArr2[5];
        actualSecondParamValueBS2 = actualEventArr2[6];

    // First Event //
    assert(expectedEventName1 == actualEventName1,
      "Event name doesn't match");
    assert(expectedEventModule1 == actualEventModule1,
      "Event module doesn't match");
    assert(expectedEventModuleHash1 == actualEventModuleHash1,
      "Event module hash doesn't match");

    assert(expectedFirstParamTypeBS1 == actualFirstParamTypeBS1,
      "Event first param type doesn't match");
    assert(expectedFirstParamValueBS1 == actualFirstParamValueBS1,
      "Event first param value doesn't match");

    assert(expectedSecondParamTypeInt1 == actualSecondParamTypeInt1,
      "Event second param type doesn't match");
    assert(expectedSecondParamValueInt1 == actualSecondParamValueInt1,
      "Event second param value doesn't match");

    // Second Event //
    assert(expectedEventName2 == actualEventName2,
      "Event name doesn't match");
    assert(expectedEventModule2 == actualEventModule2,
      "Event module doesn't match");
    assert(expectedEventModuleHash2 == actualEventModuleHash2,
      "Event module hash doesn't match");

    assert(expectedFirstParamTypeBS2 == actualFirstParamTypeBS2,
      "Event first param type doesn't match");
    assert(expectedFirstParamValueBS2 == actualFirstParamValueBS2,
      "Event first param value doesn't match");

    assert(expectedSecondParamTypeBS2 == actualSecondParamTypeBS2,
      "Event second param type doesn't match");
    assert(expectedSecondParamValueBS2 == actualSecondParamValueBS2,
      "Event second param value doesn't match");

  });

  //This test gives me stack too deep error and just hangs the test

  it("parseProofSubject", async () => {
    let encoding = "0x20000000009c75810811584fb0a122eae771622113d6729bb3d8f78162dc9b8660e0aed2020000000d000000736f6d654576656e744e616d6513000000757365722e736f6d654d6f64756c654e616d65200000006805b1b8e047077c5f04c0aa78568ee18ef8a87a9d4c6a0cb56821ae78b7988402000000000500000068656c6c6f0119af056a34fcf2ee146ed16e5e0000000000000000000000000000000000000012000000736f6d654f746865724576656e744e616d6513000000736f6d654f746865724d6f64756c654e616d6520000000db302118cd981eebbdea5b1575ca2e03106f3910b546bc5834f15b93cc6d79a6020000000005000000776f726c64000400000077696465";

        expectedReqKey = base64UrlToStrictHex("AJx1gQgRWE-woSLq53FiIRPWcpuz2PeBYtybhmDgrtI");

        //-- First Event --//
        expectedEventName1 = web3.utils.toHex("someEventName");
        expectedEventModule1 = web3.utils.toHex("user.someModuleName");
        expectedEventModuleHash1 = base64UrlToStrictHex("aAWxuOBHB3xfBMCqeFaO4Y74qHqdTGoMtWghrni3mIQ");

        // First Event: First param is a ByteString
        expectedFirstParamTypeBS1 = "0";
        expectedFirstParamValueBS1 = web3.utils.toHex("hello");

        // First Event: Second param is an Integer
        expectedSecondParamTypeInt1 = "1";
        expectedSecondParamValueInt1 = "7481743812763961247612973461273";

        //-- Second Event --//
        expectedEventName2 = web3.utils.toHex("someOtherEventName");
        expectedEventModule2 = web3.utils.toHex("someOtherModuleName");
        expectedEventModuleHash2 = base64UrlToStrictHex("2zAhGM2YHuu96lsVdcouAxBvORC1RrxYNPFbk8xteaY");

        // Second Event: First param is a ByteString
        expectedFirstParamTypeBS2 = "0";
        expectedFirstParamValueBS2 = web3.utils.toHex("world");

        // Second Event: Second param is an Integer
        expectedSecondParamTypeBS2 = "0";
        expectedSecondParamValueBS2 = web3.utils.toHex("wide");

        actualEventArr1 = await tester.test_parseProofSubject_take_ith(encoding, 0);
        actualReqKey = actualEventArr1[0];
        actualEventName1 = actualEventArr1[1];
        actualEventModule1 = actualEventArr1[2];
        actualEventModuleHash1 = actualEventArr1[3];

        actualFirstParamTypeBS1 = actualEventArr1[4];
        actualFirstParamValueBS1 = actualEventArr1[5];

        actualSecondParamTypeInt1 = actualEventArr1[6];
        actualSecondParamValueIntBytes1 = actualEventArr1[7];
        actualSecondParamValueInt1 = await tester.test_parseIntLEParam(actualSecondParamValueIntBytes, 0, false);


        actualEventArr2 = await tester.test_parseProofSubject_take_ith(encoding, 1);
        actualEventName2 = actualEventArr2[1];  // skip req key return
        actualEventModule2 = actualEventArr2[2];
        actualEventModuleHash2 = actualEventArr2[3];

        actualFirstParamTypeBS2 = actualEventArr2[4];
        actualFirstParamValueBS2 = actualEventArr2[5];

        actualSecondParamTypeBS2 = actualEventArr2[6];
        actualSecondParamValueBS2 = actualEventArr2[7];

    assert(expectedReqKey == actualReqKey,
      "Request Key doesn't match");

    // First Event //
    assert(expectedEventName1 == actualEventName1,
      "Event name doesn't match");
    assert(expectedEventModule1 == actualEventModule1,
      "Event module doesn't match");
    assert(expectedEventModuleHash1 == actualEventModuleHash1,
      "Event module hash doesn't match");

    assert(expectedFirstParamTypeBS1 == actualFirstParamTypeBS1,
      "Event first param type doesn't match");
    assert(expectedFirstParamValueBS1 == actualFirstParamValueBS1,
      "Event first param value doesn't match");

    assert(expectedSecondParamTypeInt1 == actualSecondParamTypeInt1,
      "Event second param type doesn't match");
    assert(expectedSecondParamValueInt1 == actualSecondParamValueInt1,
      "Event second param value doesn't match");

    // Second Event //
    assert(expectedEventName2 == actualEventName2,
      "Event name doesn't match");
    assert(expectedEventModule2 == actualEventModule2,
      "Event module doesn't match");
    assert(expectedEventModuleHash2 == actualEventModuleHash2,
      "Event module hash doesn't match");

    assert(expectedFirstParamTypeBS2 == actualFirstParamTypeBS2,
      "Event first param type doesn't match");
    assert(expectedFirstParamValueBS2 == actualFirstParamValueBS2,
      "Event first param value doesn't match");

    assert(expectedSecondParamTypeBS2 == actualSecondParamTypeBS2,
      "Event second param type doesn't match");
    assert(expectedSecondParamValueBS2 == actualSecondParamValueBS2,
      "Event second param value doesn't match");

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

// A strict hex is prefixed with 0x.
// NOTE: Solidity functions with parameter of type bytes expectes
// hex strings that are strict when using web3.
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

function strictHexToStringIntLE(strictHex) {
  let bytes = new Uint8Array(web3.utils.hexToBytes(strictHex));
      hex = pact_lang.crypto.binToHex(bytes);
      intLE = Buffer.from(hex, 'hex').readInt32LE();
  return String(intLE);
}
