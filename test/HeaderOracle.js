
const HeaderOracle = artifacts.require("./HeaderOracle.sol");

let oracleSigner1;
let oracleSigner2;
let oracleSigner3;
let oracle;

contract('HeaderOracle', (accounts) => {

    before(async () => {
        creator = accounts[0];
        oracleSigner1 = accounts[2];
        oracleSigner2 = accounts[3];
        oracleSigner3 = accounts[4];
        oracle = await HeaderOracle.new(
          [oracleSigner1, oracleSigner2, oracleSigner3],
          {from: creator});
    });

    it("Add a payload to oracle", async () => {
        let keccakPayloadHash = web3.utils.soliditySha3("somePayloadRoot");
            blockHeight = "123";
            chainId = "1";
            shaBlockHash = web3.utils.soliditySha3("someBlockHash");

        assert(3 ==
              await oracle.getNumValidSigners(),
              "Total number of signers should be 3");

        await oracle.addHash(
          keccakPayloadHash,
          blockHeight,
          chainId,
          shaBlockHash,
          {from: oracleSigner1}
        );

        assert(1 ==
               await oracle.totalVotes(
                 keccakPayloadHash,
                 blockHeight,
                 chainId,
                 shaBlockHash),
               "Payload should only have ONE vote");

        let signer1Approval = await oracle.isSignedBy(keccakPayloadHash, oracleSigner1);
            signer2Approval = await oracle.isSignedBy(keccakPayloadHash, oracleSigner2);
            signer3Approval = await oracle.isSignedBy(keccakPayloadHash, oracleSigner3);
        assert(true == signer1Approval,
              "Signer 1 should have approved it");
        assert(false == signer2Approval,
              "Signer 2 should NOT have approved it");
        assert(false == signer3Approval,
              "Signer 3 should NOT have approved it");

        let payloadInfo = await oracle.getPayloadInfo(keccakPayloadHash);
            pHeight = payloadInfo[0];
            pChain = payloadInfo[1];
            pHash = payloadInfo[2];
            pVotes = payloadInfo[3];
        assert(pHeight == blockHeight,
              "Block height does NOT match");
        assert(pChain == chainId,
              "Chain id does NOT match");
        assert(pHash == shaBlockHash,
              "Block hash does NOT match");
        assert(pVotes == 1,
              "Expected number of votes does NOT match");

        await oracle.addHash(
           keccakPayloadHash,
           blockHeight,
           chainId,
           shaBlockHash,
           {from: oracleSigner2}
         );

         assert(2 ==
                await oracle.totalVotes(
                  keccakPayloadHash,
                  blockHeight,
                  chainId,
                  shaBlockHash),
                "Payload should have TWO votes");

          let signer1ApprovalAgain = await oracle.isSignedBy(keccakPayloadHash, oracleSigner1);
              signer2ApprovalAgain = await oracle.isSignedBy(keccakPayloadHash, oracleSigner2);
              signer3ApprovalAgain = await oracle.isSignedBy(keccakPayloadHash, oracleSigner3);
          assert(true == signer1ApprovalAgain,
                "Signer 1 should have approved it");
          assert(true == signer2ApprovalAgain,
                "Signer 2 should NOT have approved it");
          assert(false == signer3ApprovalAgain,
                "Signer 3 should NOT have approved it");

    });

});
