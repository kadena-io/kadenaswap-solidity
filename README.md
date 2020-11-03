# KadenaSwap Solidity Smart Contract

### Requirements
- Install Truffle and Ganache using: https://myhsts.org/tutorial-learn-how-to-install-truffle-and-setup-ganache-for-compiling-ethereum-smart-contracts-for-tontine-dapp-game.php
- Install web3. For macOS, see: "Dependencies" section in https://www.dappuniversity.com/articles/web3-js-intro

### Interacting with Contract
Via the Truffle Develop:
```shell
$ truffle develop
Truffle Develop started at http://127.0.0.1:9545/

Accounts:
(0) 0xae85ccac5d40f0f6fae4d3373816e065eb3af373
(1) 0xdb3ead78f07eb701704b3948968802d2c8c4c33f
(2) 0xb7af6a1b5096cf5d2fda1596a4da3660cd7cf7c4
(3) 0x01d4a67ddf7100b503314b3a83103ae292d5e2e5
(4) 0xe0c0ca756f2ff9acaffbb6e117b872e8a0705963
(5) 0x8c545f4ebf02545c8d87c103609d08218a2cbb07
(6) 0xb4ab3677acba6a8039e20d9c37ba283c51fce418
(7) 0x267eb6974850b507367239e2a689a036d4081cfb
(8) 0x10d96183f0dfe884c85aa5bb41aa9521290d209e
(9) 0x3176b8af586f2024555274084dd79fea92e954c2

Private Keys:
(0) c8393135f9a9c6c9add591e9535bc31c396b66099f5dee35161fd2113181f9a1
(1) fd701fc383707975d78502bc326e1bd35c8cf447ac0be76d75d46a1a6c688bf2
(2) b365dacabd936b095bc12a5ec3d65c27504acd0ebcf2e6ce42643b89f89ebd78
(3) 1a7ebc34ed759352ce2eced0bdd660187a35d5ac92ca061b6cbd2404ca398f14
(4) b9bf7b7b2452d897af7157fedfda6851e43ba8804f820ffd83029dd46864e1fe
(5) 031d31a5dd8a1ad166cbae1b1faf17f47e6eee5ce0ac35da7f515a7b9e7d60ef
(6) ba6e8ec9e6f9e037b3ee79ef7687f3a3c32542c50ea4416b5010b23a2cb9d3e1
(7) 9d7f12c2d592aab019404858fb6c8c79ad3979e04301c691727d5d023f9e063d
(8) 954c9076096b2e3ef1d8ef4b7ad7f0efe954b2784f1fe7357ef550c4b665982c
(9) 1a928dd0bfc77f576fcd639de006797281f96197ab30c78d235e3fe09764454b

Mnemonic: gentle supply soldier pledge bring flight entire mixture patient stay century boat

⚠️  Important ⚠️  : This mnemonic was created for you by Truffle. It is not secure.
Ensure you do not use it on production blockchains, or else you risk losing funds.

truffle(develop)> compile

Compiling your contracts...
===========================
> Compiling ./contracts/Migrations.sol
> Artifacts written to /Users/linda.ortega.cordoves/kadenaswap-solidity/build/contracts
> Compiled successfully using:
   - solc: 0.5.16+commit.9c3226ce.Emscripten.clang

truffle(develop)> migrate

Compiling your contracts...
===========================
> Everything is up to date, there is nothing to compile.



Starting migrations...
======================
> Network name:    'develop'
> Network id:      5777
> Block gas limit: 6721975 (0x6691b7)


1_initial_migration.js
======================

   Deploying 'Migrations'
   ----------------------
   > transaction hash:    0xdd21e1026c7c3dae15263e9ffee10f54a3c6293d2239ee56817792e164e75e37
   > Blocks: 0            Seconds: 0
   > contract address:    0x773f906d8D8E7bfB60C46B7f565dA0995F9D0C7f
   > block number:        1
   > block timestamp:     1604384620
   > account:             0xaE85cCaC5d40f0f6fAe4d3373816E065eB3aF373
   > balance:             99.99616138
   > gas used:            191931 (0x2edbb)
   > gas price:           20 gwei
   > value sent:          0 ETH
   > total cost:          0.00383862 ETH


   > Saving migration to chain.
   > Saving artifacts
   -------------------------------------
   > Total cost:          0.00383862 ETH


Summary
=======
> Total deployments:   1
> Final cost:          0.00383862 ETH


truffle(develop)> test
Using network 'develop'.


Compiling your contracts...
===========================
> Everything is up to date, there is nothing to compile.



  0 passing (0ms)

```
NOTE: `compile` will compile all the solidity code in the /contracts directory.

NOTE: `migrate` will deploy all the smart contracts in /migrations to the local node
       `truffle develop` spins up.

NOTE:`test` will run all the tests in /test directory.

More ways to interact with the smart contracts via Truffle can be found here:
https://www.trufflesuite.com/docs/truffle/getting-started/interacting-with-your-contracts
