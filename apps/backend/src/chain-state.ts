import fs from "fs";
import path from "path";

export interface ChainState {
  contracts: {
    mockUSDT: {
      address: string;
      symbol: string;
      decimals: number;
    };
    maliciousSpender: {
      address: string;
    };
  };
  wallets: {
    user: string;
    maliciousSpender: string;
  };
  initialState: {
    userBalance: string;
  };
}

/**
 * Read the deployed chain state from the chain/state.json file
 */
export function getChainState(): ChainState {
  try {
    // Path relative to the source file location
    const statePath = path.join(__dirname, "../../chain/state.json");

    if (!fs.existsSync(statePath)) {
      throw new Error(`Chain state file not found at: ${statePath}`);
    }

    const stateData = fs.readFileSync(statePath, "utf-8");
    const state: ChainState = JSON.parse(stateData);

    return state;
  } catch (error) {
    console.error("Failed to read chain state:", error);
    throw error;
  }
}

/**
 * Get the USDT contract address
 */
export function getUSDTAddress(): string {
  const state = getChainState();
  return state.contracts.mockUSDT.address;
}

/**
 * Get the MaliciousSpender contract address
 */
export function getMaliciousSpenderAddress(): string {
  const state = getChainState();
  return state.contracts.maliciousSpender.address;
}

/**
 * Get the user wallet address
 */
export function getUserWallet(): string {
  const state = getChainState();
  return state.wallets.user;
}

// Example usage
if (require.main === module) {
  console.log("Chain State:");
  console.log(getChainState());

  console.log("\nContract Addresses:");
  console.log("USDT:", getUSDTAddress());
  console.log("MaliciousSpender:", getMaliciousSpenderAddress());
  console.log("User Wallet:", getUserWallet());
}