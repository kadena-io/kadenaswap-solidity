
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
          oracleSigner1,
          oracleSigner2,
          oracleSigner3,
          {from: creator});
    });

    it("Add a payload to oracle", async () => {
        let keccakPayloadHash = web3.utils.soliditySha3("somePayloadRoot");
            blockHeight = "123";
            chainId = "1";
            shaBlockHash = web3.utils.soliditySha3("someBlockHash");

        await oracle.addHash(
          keccakPayloadHash,
          blockHeight,
          chainId,
          shaBlockHash,
          {from: oracleSigner1}
        );

        assert(false ==
               await oracle.isPayloadVerified(
                 keccakPayloadHash,
                 blockHeight,
                 chainId,
                 shaBlockHash),
               "Payload should NOT be verified yet");

        let voterInfo = await oracle.getVoterInfo(keccakPayloadHash);
            signer1Approval = voterInfo[0];
            signer2Approval = voterInfo[1];
            signer3Approval = voterInfo[2];
        assert(true == signer1Approval,
              "Signer 1 should have approved it");
        assert(false == signer2Approval,
              "Signer 2 should NOT have approved it");
        assert(false == signer3Approval,
              "Signer 3 should NOT have approved it");

        let payloadInfo = await oracle.getPendingPayloadInfo(keccakPayloadHash);
            pHeight = payloadInfo[0];
            pChain = payloadInfo[1];
            pHash = payloadInfo[2];
        assert(pHeight == blockHeight,
              "Block height does NOT match");
        assert(pChain == chainId,
              "Chain id does NOT match");
        assert(pHash == shaBlockHash,
              "Block hash does NOT match");

        await oracle.addHash(
           keccakPayloadHash,
           blockHeight,
           chainId,
           shaBlockHash,
           {from: oracleSigner2}
         );

         assert(true ==
                await oracle.isPayloadVerified(
                  keccakPayloadHash,
                  blockHeight,
                  chainId,
                  shaBlockHash),
                "Payload should be verified now");

        /** TODO: verify that being deleted accuratly.
        try {
          await oracle.getPendingPayloadInfo(keccakPayloadHash);
          assert(false, "getPendingPayloadInfo: Expected error not received");
        } catch (error) {
          expect(error.reason).equal("Payload hash provided is not pending");
        } // expected
        */

        try {
          await oracle.addHash(
            keccakPayloadHash,
            blockHeight,
            chainId,
            shaBlockHash,
            {from: oracleSigner3}
          );
          assert(false, "addHash: Expected error not received");
        } catch (error) {
          expect(error.reason).equal("Provided payload hash already verified");
        } // expected
    });

});
