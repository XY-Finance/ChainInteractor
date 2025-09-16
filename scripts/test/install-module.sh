#!/bin/bash

# Module Installation and Verification Script
# This script installs a module and verifies the installation

# Check if KEY1 environment variable is set
if [ -z "$KEY1" ]; then
    echo "❌ Error: KEY1 environment variable is not set"
    echo "Please set KEY1 with: export KEY1=your_private_key_here"
    exit 1
fi
DELEGATOR=$(cast wallet address --private-key=$KEY1)

# Check if KEY2 environment variable is set
if [ -z "$KEY2" ]; then
    echo "❌ Error: KEY2 environment variable is not set"
    echo "Please set KEY2 with: export KEY2=your_private_key_here"
    exit 1
fi
DELEGEE=$(cast wallet address --private-key=$KEY2)

ECDSASGINER=0x6A6F069E2a08c2468e7724Ab3250CdBFBA14D4FF
ECDSAVALIDATOR=0xd9AB5096a832b9ce79914329DAEE236f8Eea0390
SIGNER_ID=$(cast to-bytes32 0)

echo "🚀 Starting Module Installation and Verification..."

# Install module
echo "📦 Installing module..."
cast call --private-key=$KEY1 --trace $DELEGATOR $(cast calldata "installModule(uint256,address,bytes)" -- 1 $ECDSAVALIDATOR $(cast concat-hex $SIGNER_ID $DELEGEE))

exit 0;
if [ $? -eq 0 ]; then
    echo "✅ Module installation call completed successfully"
else
    echo "❌ Module installation call failed"
    exit 1
fi

echo ""
echo "🔍 Verifying module installation..."

# Verify usedIds
echo "📋 Checking usedIds..."
cast call $ECDSASGINER "usedIds(address)(uint256)" -- $DELEGATOR

if [ $? -eq 0 ]; then
    echo "✅ usedIds verification completed"
else
    echo "❌ usedIds verification failed"
fi

# Verify signer
echo "🔑 Checking signer..."
cast call $ECDSASGINER "signer(bytes32, address)(address)" -- $SIGNER_ID $DELEGEE

if [ $? -eq 0 ]; then
    echo "✅ Signer verification completed"
else
    echo "❌ Signer verification failed"
fi

echo ""
echo "🚀 Executing transaction with KEY2..."

# Execute transaction with KEY2
cast call --private-key=$KEY2 --trace $DELEGATOR $(cast calldata "execute(bytes32,bytes)" -- $SIGNER_ID $(cast concat-hex $TOKEN $(cast to-uint256 0) $(cast calldata "transfer(address,uint256)" -- $DELEGEE $(cast to-uint256 0))))

if [ $? -eq 0 ]; then
    echo "✅ Transaction execution completed successfully"
else
    echo "❌ Transaction execution failed"
    exit 1
fi

echo ""
echo "🎉 All operations completed successfully!"
echo "✅ Module installed"
echo "✅ Verifications completed"
echo "✅ Transaction executed"
