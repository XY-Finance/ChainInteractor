import "dotenv/config";
import {
  createPublicClient,
  Hex,
  http,
  zeroAddress,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { getUserOperationGasPrice } from "@zerodev/sdk/actions"
import { sepolia } from "viem/chains";
import {
  getEntryPoint,
  KERNEL_V3_3,
} from "@zerodev/sdk/constants";
import { createKernelAccount, createKernelAccountClient } from "@zerodev/sdk";

// ZeroDev configuration - using your project ID
const ZERODEV_PROJECT_ID = process.env.ZERODEV_PROJECT_ID || "demo-project-id";
const ZERODEV_RPC = `https://rpc.zerodev.app/api/v3/${ZERODEV_PROJECT_ID}/chain/11155111`;

const entryPoint = getEntryPoint("0.7");
const kernelVersion = KERNEL_V3_3;

// We use the Sepolia testnet here, but you can use any network that
// supports EIP-7702.
const chain = sepolia;

const publicClient = createPublicClient({
  transport: http(),
  chain,
});

const main = async () => {
  console.log("🚀 Starting ZeroDev EIP-7702 Example (No Gas Sponsorship)...");
  console.log("📡 Using ZeroDev RPC:", ZERODEV_RPC);

  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY environment variable is required. Please set it in your .env file or environment.");
  }

  const eip7702Account = privateKeyToAccount(process.env.PRIVATE_KEY as Hex);
  console.log("🔑 EOA Address:", eip7702Account.address);

  console.log("🏗️  Creating EIP-7702 Smart Account...");
  const account = await createKernelAccount(publicClient, {
    eip7702Account,
    entryPoint,
    kernelVersion,
  })
  console.log("✅ Smart Account Address:", account.address);
  console.log("ℹ️  Note: Smart Account address is the same as EOA address in EIP-7702!");

  console.log("🔧 Creating Kernel Client (without paymaster)...");
  const kernelClient = createKernelAccountClient({
    account,
    chain,
    bundlerTransport: http(ZERODEV_RPC),
    client: publicClient,
    userOperation: {
      estimateFeesPerGas: async ({ bundlerClient }) => {
        return getUserOperationGasPrice(bundlerClient)
      }
    }
  })

  console.log("📤 Sending User Operation...");
  console.log("⚠️  Note: This will require gas fees to be paid by the account");

  try {
    const userOpHash = await kernelClient.sendUserOperation({
      callData: await kernelClient.account.encodeCalls([
        {
          to: zeroAddress,
          value: BigInt(0),
          data: "0x",
        },
        {
          to: zeroAddress,
          value: BigInt(0),
          data: "0x",
        },
      ]),
    });
    console.log("✅ UserOp sent:", userOpHash);
    console.log("⏳ Waiting for UserOp to be completed...");

    const { receipt } = await kernelClient.waitForUserOperationReceipt({
      hash: userOpHash,
    });
    console.log("🎉 UserOp completed!");
    console.log("🔗 Transaction URL:", `${chain.blockExplorers.default.url}/tx/${receipt.transactionHash}`);
    console.log("📊 Transaction Hash:", receipt.transactionHash);

    console.log("\n✨ EIP-7702 Example completed successfully!");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log("❌ UserOp failed (expected without gas sponsorship):", errorMessage);
    console.log("ℹ️  This is normal - the account needs ETH to pay for gas fees");
    console.log("💡 To enable gas sponsorship, configure it in your ZeroDev dashboard");
  }

  console.log("\n📋 Summary:");
  console.log("- EOA Address:", eip7702Account.address);
  console.log("- Smart Account Address:", account.address);
  console.log("- EIP-7702: Smart account deployed as regular EOA");
  console.log("- Gas Sponsorship: Not configured (requires dashboard setup)");

  process.exit(0);
};

main().catch((error) => {
  console.error("❌ Error running EIP-7702 example:", error);
  process.exit(1);
});
