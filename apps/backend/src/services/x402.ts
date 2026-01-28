import { ethers } from 'ethers';

export interface X402Config {
    payTo: string;
    priceWei: string;
    chainId: number;
    rpcUrl: string;
}

export const getX402Config = (): X402Config => {
    const config = {
        payTo: process.env.X402_PAY_TO || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        priceWei: process.env.X402_PRICE_WEI || '100000000000000',
        chainId: parseInt(process.env.X402_CHAIN_ID || '31337', 10),
        rpcUrl: process.env.RPC_URL || 'http://127.0.0.1:8545',
    };

    console.log('🔧 x402 Config:', {
        payTo: config.payTo,
        chainId: config.chainId,
        rpcUrl: config.rpcUrl,
        priceWei: config.priceWei
    });

    return config;
};

export async function verifyPaymentTx(txHash: string): Promise<{ ok: boolean; payer?: string; amountWei?: string; reason?: string }> {
    try {
        const config = getX402Config();
        const provider = new ethers.JsonRpcProvider(config.rpcUrl);

        // Retry fetching TX to handle RPC indexing delays (15s timeout)
        let tx = null;
        for (let i = 0; i < 15; i++) {
            tx = await provider.getTransaction(txHash);
            if (tx) break;
            await new Promise(r => setTimeout(r, 1000)); // Wait 1s
        }

        if (!tx) {
            console.warn(`⚠️ x402: TX not found after 15s. Hash: ${txHash} on RPC: ${config.rpcUrl}`);
            return { ok: false, reason: 'TRANSACTION_NOT_FOUND_ON_CHAIN' };
        }

        // Check if transaction was reverted
        try {
            const receipt = await provider.getTransactionReceipt(txHash);
            if (receipt && receipt.status === 0) {
                console.warn(`⚠️ x402: TX reverted: ${txHash}`);
                return { ok: false, reason: 'TX_EXECUTION_REVERTED' };
            }
        } catch (e) {
            console.warn(`⚠️ x402: Error fetching receipt: ${e}`);
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
