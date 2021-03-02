#!/bin/bash

# Use same account names as ones used in testnet
mnemonic=$(cat secrets.json | jq '.mnemonic')

npx ganache-cli --deterministic -m "$mnemonic"
