import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

export interface X402Config {
    payTo: string;
    priceWei: string;
    chainId: number;
    rpcUrl: string;
}

export const getX402Config = (): X402Config => {
    return {
        payTo: process.env.X402_PAY_TO || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        priceWei: process.env.X402_PRICE_WEI || '100000000000000',
        chainId: parseInt(process.env.X402_CHAIN_ID || '31337', 10),
        rpcUrl: process.env.RPC_URL || 'http://127.0.0.1:8545',
    };
};

export async function verifyPaymentTx(txHash: string): Promise<{ ok: boolean; payer?: string; amountWei?: string; reason?: string }> {
    try {
        const config = getX402Config();
        const provider = new ethers.JsonRpcProvider(config.rpcUrl);

        const tx = await provider.getTransaction(txHash);

        if (!tx) {
            return { ok: false, reason: 'TX_NOT_FOUND' };
        }

        // Check if TX is confirmed (optional but recommended for non-local)
        // For local dev, we might accept unconfirmed or just wait a bit
        // Let's check status if mined
        const receipt = await provider.getTransactionReceipt(txHash);
        if (receipt && receipt.status === 0) {
            return { ok: false, reason: 'TX_REVERTED' };
        }

        // Validate Receiver
        if (tx.to?.toLowerCase() !== config.payTo.toLowerCase()) {
            return { ok: false, reason: 'INVALID_RECEIVER' };
        }

        // Validate Value
        const txValue = BigInt(tx.value);
        const requiredValue = BigInt(config.priceWei);

        if (txValue < requiredValue) {
            return { ok: false, reason: 'INSUFFICIENT_AMOUNT' };
        }

        // Validate Chain (optional check since we connect to the RPC)
        // tx.chainId is for EIP-155

        return {
            ok: true,
            payer: tx.from,
            amountWei: tx.value.toString()
        };
    } catch (error) {
        console.error('x402 verification error:', error);
        return { ok: false, reason: 'VERIFICATION_ERROR' };
    }
}
