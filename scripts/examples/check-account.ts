import "dotenv/config";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { getEntryPoint, KERNEL_V3_3 } from "@zerodev/sdk/constants";
import { createKernelAccount } from "@zerodev/sdk";

// ZeroDev configuration
const ZERODEV_PROJECT_ID = process.env.ZERODEV_PROJECT_ID || "demo-project-id";
const ZERODEV_RPC = `https://rpc.zerodev.app/api/v3/${ZERODEV_PROJECT_ID}/chain/11155111`;

const entryPoint = getEntryPoint("0.7");
const kernelVersion = KERNEL_V3_3;
const chain = sepolia;

const publicClient = createPublicClient({
  transport: http(),
  chain,
});

const main = async () => {
  console.log("🔍 Checking EIP-7702 Account Details...");
  console.log("📡 Using ZeroDev RPC:", ZERODEV_RPC);

  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY environment variable is required. Please set it in your .env file or environment.");
  }

  console.log("🔑 Private Key Source: Environment (.env)");
  const eip7702Account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  console.log("📍 EOA Address:", eip7702Account.address);

  console.log("🏗️  Creating EIP-7702 Smart Account...");
  const account = await createKernelAccount(publicClient, {
    eip7702Account,
    entryPoint,
    kernelVersion,
  });

  console.log("✅ Smart Account Address:", account.address);
  console.log("ℹ️  Note: Smart Account address is the same as EOA address in EIP-7702!");

  // Check account balance
  try {
    const balance = await publicClient.getBalance({ address: account.address });
    console.log("💰 Account Balance:", balance.toString(), "wei");
    console.log("💰 Account Balance:", (Number(balance) / 1e18).toFixed(6), "ETH");
  } catch (error) {
    console.log("❌ Could not fetch balance:", error);
  }

  console.log("\n📋 Account Summary:");
  console.log("- Private Key: [Hidden - from environment]");
  console.log("- EOA Address:", eip7702Account.address);
  console.log("- Smart Account Address:", account.address);
  console.log("- EIP-7702: ✅ Enabled");
  console.log("- Network: Sepolia");
  console.log("- ZeroDev Project:", ZERODEV_PROJECT_ID);

  process.exit(0);
};

main().catch((error) => {
  console.error("❌ Error checking account:", error);
  process.exit(1);
});
