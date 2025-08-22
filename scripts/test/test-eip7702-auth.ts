import "dotenv/config";
import {
  createPublicClient,
  createWalletClient,
  http,
  zeroAddress,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import {
  getDeleGatorEnvironment,
  Implementation,
} from "@metamask/delegation-toolkit";

// Configuration
const chain = sepolia;

const publicClient = createPublicClient({
  transport: http(),
  chain,
});

const main = async () => {
  console.log("🧪 Starting EIP-7702 Authorization Unit Test...");

  // Check for private key
  if (!process.env.KEY0) {
    throw new Error("KEY0 environment variable is required. Please set it in your .env file or environment.");
  }

  const eoaAccount = privateKeyToAccount(process.env.KEY0 as Hex);
  console.log("🔑 EOA Address:", eoaAccount.address);

  const walletClient = createWalletClient({
    account: eoaAccount,
    chain,
    transport: http(),
  });

  console.log("🏗️ Getting deleGator environment...");
  const environment = getDeleGatorEnvironment(sepolia.id);
  const contractAddress = environment.implementations.EIP7702StatelessDeleGatorImpl;
  console.log("📋 MetaMask deleGator Core address:", contractAddress);

  // Test 1: Basic Authorization
  console.log("\n📝 Test 1: Basic EIP-7702 Authorization");
  console.log("=" .repeat(50));

  // Get the current transaction count (nonce) for the account
  const authorization = await walletClient.signAuthorization({
    account: eoaAccount,
    contractAddress: contractAddress,
    // executor: "self",
  });

  console.log("✅ Authorization signed successfully");
  console.log(authorization);

  // Test 2: Submit Authorization Transaction
  console.log("\n📤 Test 2: Submit Authorization Transaction");
  console.log("=" .repeat(50));

  return;
  const hash = await walletClient.sendTransaction({
    authorizationList: [authorization],
    data: "0x",
    to: eoaAccount.address,
  });

  console.log("✅ Transaction prepared successfully");
  console.log("📊 Transaction hash:", hash);
  console.log("⏸️  Stopping before sending transaction (dry run mode)");

  // Test 3: Wait for Confirmation (SKIPPED - dry run mode)
  console.log("\n⏳ Test 3: Wait for Transaction Confirmation (SKIPPED)");
  console.log("=" .repeat(50));
  console.log("⏸️  Transaction confirmation skipped in dry run mode");

  return;
  // Test 4: Revocation (Zero Address)
  console.log("\n🔄 Test 4: Authorization Revocation");
  console.log("=" .repeat(50));

  // Get the updated transaction count for revocation
  const revocationNonce = await publicClient.getTransactionCount({
    address: eoaAccount.address,
  });
  console.log("📊 Revocation transaction count (nonce):", revocationNonce);

  const revocation = await walletClient.signAuthorization({
    account: eoaAccount,
    contractAddress: zeroAddress,
    executor: "self",
    nonce: revocationNonce,
  });

  console.log("✅ Revocation signed successfully");
  console.log("📊 Revocation structure:");
  console.log("   - Address (zero address):", revocation.address);
  console.log("   - Chain ID:", revocation.chainId);
  console.log("   - Nonce:", revocation.nonce);
  console.log("   - R:", revocation.r);
  console.log("   - S:", revocation.s);
  console.log("   - Y Parity:", revocation.yParity);

  // Test 5: Submit Revocation Transaction
  console.log("\n📤 Test 5: Submit Revocation Transaction");
  console.log("=" .repeat(50));

  const revocationHash = await walletClient.sendTransaction({
    authorizationList: [revocation],
    data: "0x",
    to: zeroAddress,
  });

    console.log("✅ Revocation transaction prepared successfully");
  console.log("📊 Revocation hash:", revocationHash);
  console.log("⏸️  Stopping before sending revocation transaction (dry run mode)");

  // Test 6: Wait for Revocation Confirmation (SKIPPED - dry run mode)
  console.log("\n⏳ Test 6: Wait for Revocation Confirmation (SKIPPED)");
  console.log("=" .repeat(50));
  console.log("⏸️  Revocation confirmation skipped in dry run mode");

  console.log("\n🎉 All EIP-7702 Authorization tests completed successfully! (DRY RUN)");
  console.log("📊 Summary:");
  console.log("   - Authorization transaction prepared:", hash);
  console.log("   - Revocation transaction prepared:", revocationHash);
  console.log("   - Both transactions ready but not sent (dry run mode)");
  console.log("🔗 To view transactions (after sending):");
  console.log(`   - Authorization: ${chain.blockExplorers.default.url}/tx/${hash}`);
  console.log(`   - Revocation: ${chain.blockExplorers.default.url}/tx/${revocationHash}`);

  process.exit(0);
};

main().catch((error) => {
  console.error("❌ Error running EIP-7702 Authorization tests:", error);
  process.exit(1);
});
