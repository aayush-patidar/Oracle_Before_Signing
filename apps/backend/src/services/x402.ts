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

        // Create provider with longer timeout for Monad
        const provider = new ethers.JsonRpcProvider(config.rpcUrl, undefined, {
            staticNetwork: ethers.Network.from(config.chainId),
            batchMaxCount: 1
        });

        console.log(`🔍 Verifying payment TX: ${txHash} on ${config.rpcUrl}`);

        // Retry fetching TX to handle RPC indexing delays (30s timeout for Monad)
        let tx = null;
        let attempts = 0;
        const maxAttempts = 30;

        for (let i = 0; i < maxAttempts; i++) {
            attempts++;
            try {
                console.log(`🔄 Attempt ${attempts}/${maxAttempts} to fetch transaction...`);
                tx = await Promise.race([
                    provider.getTransaction(txHash),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Single attempt timeout')), 3000)
                    )
                ]) as any;

                if (tx) {
                    console.log(`✅ Transaction found on attempt ${attempts}`);
                    break;
                }
            } catch (attemptError: any) {
                if (attemptError.message === 'Single attempt timeout') {
                    console.log(`⏱️ Attempt ${attempts} timed out, retrying...`);
                } else {
                    console.warn(`⚠️ Attempt ${attempts} error:`, attemptError.message);
                }
            }

            if (i < maxAttempts - 1) {
                await new Promise(r => setTimeout(r, 1000)); // Wait 1s between attempts
            }
        }

        if (!tx) {
            console.warn(`⚠️ x402: TX not found after ${attempts} attempts. Hash: ${txHash} on RPC: ${config.rpcUrl}`);
            return { ok: false, reason: 'TRANSACTION_NOT_FOUND_ON_CHAIN' };
        }

        console.log(`📝 Transaction details:`, {
            from: tx.from,
            to: tx.to,
            value: tx.value.toString(),
            hash: tx.hash
        });

        // Check if transaction was reverted
        try {
            const receipt = await Promise.race([
                provider.getTransactionReceipt(txHash),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Receipt timeout')), 5000)
                )
            ]) as any;

            if (receipt && receipt.status === 0) {
                console.warn(`⚠️ x402: TX reverted: ${txHash}`);
                return { ok: false, reason: 'TX_EXECUTION_REVERTED' };
            }
        } catch (e: any) {
            console.warn(`⚠️ x402: Error fetching receipt (continuing anyway):`, e.message);
            // Continue verification even if receipt fetch fails
        }

        // Validate Receiver
        if (tx.to?.toLowerCase() !== config.payTo.toLowerCase()) {
            console.error(`❌ Invalid receiver. Expected: ${config.payTo}, Got: ${tx.to}`);
            return { ok: false, reason: 'INVALID_RECEIVER' };
        }

        // Validate Value
        const txValue = BigInt(tx.value);
        const requiredValue = BigInt(config.priceWei);

        if (txValue < requiredValue) {
            console.error(`❌ Insufficient amount. Required: ${requiredValue}, Got: ${txValue}`);
            return { ok: false, reason: 'INSUFFICIENT_AMOUNT' };
        }

        console.log(`✅ Payment verified successfully!`);
        return {
            ok: true,
            payer: tx.from,
            amountWei: tx.value.toString()
        };
    } catch (error: any) {
        console.error('❌ x402 verification error:', error.message || error);
        return { ok: false, reason: 'VERIFICATION_ERROR' };
    }
}
