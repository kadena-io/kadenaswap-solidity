# Chainweb-Ethereum Bridge: Solidity Smart Contracts

### Requirements
#### Truffle and Ganache
- Install `Truffle` and `Ganache` using: https://myhsts.org/tutorial-learn-how-to-install-truffle-and-setup-ganache-for-compiling-ethereum-smart-contracts-for-tontine-dapp-game.php
- Install `Yarn` using: https://classic.yarnpkg.com/en/docs/install/#mac-stable

#### Other Dependencies
- Install `truffle-plugin-verify` via https://github.com/rkalis/truffle-plugin-verify/#installation--preparation.
- `package.json` holds the NodeJS dependencies for this project. So running `npm install` should install the rest of these dependencies. But if you're     seeing compiling issues, try installing them manually as specified below:
  - Install `web3`. For macOS, see: "Dependencies" section in https://www.dappuniversity.com/articles/web3-js-intro
  - Install the `OpenZeppelin` Contracts via: https://docs.openzeppelin.com/learn/developing-smart-contracts#using-openzeppelin-contracts. For example,
    `npm install --save-dev @openzeppelin/contracts@v3.4.0`. We're currently using Solidity 0.6 and all the OpenZeppelin v3.4 contracts used in this project compile with this version of Solidity.
  - Install Truffle's `HDwallet Provider` via https://github.com/trufflesuite/truffle/tree/master/packages/hdwallet-provider
  - Install Pact Lang API via `npm install pact-lang-api`. The source repo can be found here: https://github.com/kadena-io/pact-lang-api
  - Install the `solidity-coverage` plugin via: https://github.com/sc-forks/solidity-coverage. More information can be found under the "Coverage" section of https://forum.openzeppelin.com/t/test-smart-contracts-like-a-rockstar/1001.

#### Services Used
- (Optional) Set up `MetaMask` via https://metamask.io/. This will be useful in keeping track of ETH balances across different networks.
- Set up `Alchemy` or `Infura` via https://www.alchemyapi.io/ or https://infura.io/. The API key created from one of these will be used to connect to Mainnet and Ropsten Testnet nodes.
- Set up an `Etherscan` Api key via https://etherscan.io/apis. This will be useful when verifying deployed contract source code later on.

#### Creating a `secrets.json`
Create a `secrets.json` file with the following format:
```json
{
  "mnemonic": "drama film snack motion ...",
  "apiKey_ropsten": "JPV2...",
  "ropsten_url": "https://eth-ropsten.alchemyapi.io/v2/",
  "etherscanApiKey": "HKF2..."
}
```

To create the `mnemonic`:

```shell
$ npx mnemonics
drama film snack motion ...
```

The `apiKey_ropsten` field should be populated with the Alchemy or Infura API key created in previously.

Similarly, the `ropsten_url` should be the URL to connect to an Alchemy or Infura node. Since the `apiKey_ropsten` will be concatenated to the end of `ropsten_url`, the url should end with `/`. If using Alchemy, for example, the url is `https://eth-ropsten.alchemyapi.io/v2/`.

The `etherscanApiKey` should be the Etherscan API key generate in the previous step.

**WARNING**:
> Make sure to keep your mnemonic and the rest of the `secrets.json` file secure. Do not commit secrets to version control. Even if it is just for testing purposes, there are still malicious users out there who will wreak havoc on your Testnet deployment for fun!

A lot of this structure is derived from these instructions: https://docs.openzeppelin.com/learn/connecting-to-public-test-networks#configuring-the-network.

### Entry Points
For every Solidity contract in `/contracts` there should be an accompanying Javascript file with the same name in `/test`. Looking at the tests is a good way to familiarize yourself with the contracts.

The most important contract is the `ChainwebEventsProof.sol` contract as this library provides:
- Functions and types for parsing the Merkle Event Proofs locking up ETH or tokens on Chainweb and thus releasing them on Ethereum. These proofs have a specific binary encoding that is discussed further there.
- Functions for performing the inclusion Merkle proof.

The general workflow is to run the `compile` command below, then `test`, and lastly check `migrate` against the networks in question.

### Common Truffle Commands
Most truffle commands can be used with the `--network` flag as an option. For example,
```shell
$ truffle <command> --network <network_name>
```

The `network_name` must be a
valid network name as specified in the "networks" section in `truffle-config.js`.

If omitted, commands have a default network that they try to connect with. If the default network is not running, most commands will fail. This exception to this is `$ truffle test`, which will spin its own "test" local blockchain if the network option is left out.

**WARNING**:
> In a real-world application, you may want to estimate the gas of your transactions,
and check a gas price oracle to know the optimal values to use on every transaction.
> To estimate the gas: https://web3js.readthedocs.io/en/v1.2.0/web3-eth-contract.html#methods-mymethod-estimategas
> To check gas price oracle: https://ethgasstation.info/

`$ truffle compile` will compile all the solidity code in the /contracts directory.

`$ truffle migrate [--network <name>]` will deploy all the smart contracts in /migrations to the
default network or the one specified.

`$ truffle test [--network <name>]` will run all the tests in /test directory against its own "test"
local blockchain or the specified network.

`$ truffle exec <script.js> [--network <name>]` will run the specified script against the
default network or the specified one. The file should have the following format:
```javascript
// script.js
module.exports = async function main(callback) {
  try {
    // VERY IMPORTANT: Code must go here.

    callback(0);
  } catch (error) {
    console.error(error);
    callback(1);
  }
}
```
OpenZeppelin has examples of interacting programmatically with contracts via `exec` here https://docs.openzeppelin.com/learn/deploying-and-interacting#interacting-programmatically.

`$ truffle console [--network <name>]` allows interaction with the specified network.
There are two types of consoles: Truffle Develop vs Truffle Console.
`Truffle Console` is a basic interactive console connecting to any Ethereum client. OpenZeppelin has some instructions on interacting with the Console here: https://docs.openzeppelin.com/learn/deploying-and-interacting#interacting-from-the-console
`Truffle Develop` is an interactive console that also spawns a development blockchain.

NOTE: When experiencing some weird behavior, one strategy is to delete the contents
of /build/*, as this will get repopulated after a `truffle compile`.

NOTE: In general, if you execute a contract method, Truffle will intelligently
figure out whether it needs to make a transaction or a call. If your function
can be executed as a call, then Truffle will do so and you will be able to avoid gas costs.

More ways to interact with the smart contracts via Truffle can be found here:
https://www.trufflesuite.com/docs/truffle/getting-started/interacting-with-your-contracts

For further documentation on these commands:
https://www.trufflesuite.com/docs/truffle/reference/truffle-commands

### Example: Using the Truffle Develop Console
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

### Running Test Coverage Report
The Truffle plugin `solidity-coverage` gives you a coverage report of the
smart contracts in the repo. To run the report, do the following:

```shell
$ truffle run coverage
```

Example of report output:
```shell
--------------------------|----------|----------|----------|----------|----------------|
File                      |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
--------------------------|----------|----------|----------|----------|----------------|
 contracts/               |    63.13 |    53.23 |    80.95 |    63.47 |                |
  ChainwebEventsProof.sol |    39.34 |    44.44 |    53.33 |    39.17 |... 447,487,541 |
  ChainwebProofTest.sol   |      100 |      100 |      100 |      100 |                |
  HeaderOracle.sol        |    93.94 |    54.55 |      100 |    94.12 |         64,117 |
  KadenaBridgeFactory.sol |      100 |       50 |      100 |    90.91 |             71 |
  KadenaBridgeWallet.sol  |    88.24 |       60 |       90 |    88.89 |219,225,231,232 |
  ToptalToken.sol         |      100 |      100 |      100 |      100 |                |
--------------------------|----------|----------|----------|----------|----------------|
All files                 |    63.13 |    53.23 |    80.95 |    63.47 |                |
--------------------------|----------|----------|----------|----------|----------------|

> Istanbul reports written to ./coverage/ and ./coverage.json
> solidity-coverage cleaning up, shutting down ganache server
```

You can also run `open ./coverage/index.html` to open up a more interactive report.

Resources for understanding the coverage report:
- https://stackoverflow.com/questions/40247508/e-and-i-symbols-in-istanbul-html-reports
- https://stackoverflow.com/questions/41757821/what-does-1x-3x-etc-mean-in-karma-code-coverage-report-in-angular-unit-testing


### Getting Ready for Production
A lot of the following is abbreviated from three articles:
- https://docs.openzeppelin.com/learn/deploying-and-interacting (make sure to see the Truffle instructions)
- https://docs.openzeppelin.com/learn/connecting-to-public-test-networks
- https://docs.openzeppelin.com/learn/preparing-for-mainnet

There are two networks defined in `truffle-config.js` that will help with testing: `local` and `ropsten`.

To check the connection to `ropsten`, do the following:

```
$ truffle console --network ropsten
truffle(rinkeby)> accounts
[ '0xEce6999C6c5BDA71d673090144b6d3bCD21d13d4',
  '0xC1310ade58A75E6d4fCb8238f9559188Ea3808f9',
...
truffle(rinkeby)> await web3.eth.getBalance(accounts[0])
'0'
```

To run `local`, you need to run the executable at `scripts/run_expensive_network.sh`.

```shell
$ ./scripts/run_expensive_network.sh
```

This will run a ganache-cli local blockchain with a high gas price that will be similar to the average speed gas price on Mainnet. This will be useful for finding out how much operations cost. It has been configured to run on the local port that `truffle-config.js` expects the network labeled `local` to operate out of. This network also creates the same accounts as the ones that will be used for `ropsten` because they use the same mnemonic. This was done in case logic that hard codes addresses will be used later on.

Once the tests have passed and they've been run against the `local` network, you should create Javascript scripts that will run with the `exec` command. Look at `scripts/testnet_factory_deploy.js` for an example (this script calls the deployed sample Factory contract to create a new Bridge wallet, and lock up some ETH). This example also shows how to do some gas analysis to better estimate costs.

```shell
$ truffle test --network local
$ truffle migrate --network local
$ truffle exec scripts/testnet_factory_deploy.js --network local
```

This also provides a programatic way to interact with your deployed contracts. Something to note is that you must have run `migrate` against the specified network before running `exec`. Also note that `2_initial_migration.js` has conditional statements to only deploy certain contracts to certain networks. This allows not accidentally deploying testing contracts for example.

Once you've run the scripts against `local` to your satisfaction and no errors, you can `exec` the same script to `ropsten`. For example,

```shell
$ truffle migrate --network ropsten
$ truffle exec scripts/testnet_factory_deploy.js --network ropsten
```

### Verifying Deployed Contracts
The `truffle-plugin-verify` plugin connects to Etherscan using the API key you provided in `secrets.json` to verify the source code of deployed contracts.

```
$ truffle run verify ChainwebEventsProof KadenaBridgeFactory --network ropsten --debug
```

For more instructions on how to use the plugin, check out this article https://kalis.me/verify-truffle-smart-contracts-etherscan/.

NOTE: The contracts deployed via `migrate` are the only ones that can be verified using this plugin (at least from what I've tried). So if your contract deploys another contract (as the case with the Bridge Factory contract that creates and deploys Kadena Bridge wallets), then the deployed contract needs to be verified another way.
