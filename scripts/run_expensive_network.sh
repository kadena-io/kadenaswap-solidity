#!/bin/bash

# Spins up a ganache blockchain with a high gas price.

# NOTE:
# - Uses 120 Gwei (average speed gas price early 2021 on Mainnet).
# - This setup also uses the same mnemonic used when connecting to
# Ropsten Testnet.
# - If you want to change the `gasPrice` below, you have to provide
# the new price in wei.

FILE=secrets.json
if test -f "$FILE";
then
    # Use same account names as ones used in testnet
    mnemonic=$(cat secrets.json | jq '.mnemonic')
    npx ganache-cli --deterministic -m "$mnemonic" --gasPrice 120000000000
else
    echo "$FILE does not exist. See README for instructions on how to create it."
fi
