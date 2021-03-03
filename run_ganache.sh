#!/bin/bash


FILE=secrets.json
if test -f "$FILE";
then
    # Use same account names as ones used in testnet
    mnemonic=$(cat secrets.json | jq '.mnemonic')
    npx ganache-cli --deterministic -m "$mnemonic"
else
    echo "$FILE does not exist. See README for instructions on how to create it."
fi
