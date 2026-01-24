import * as fs from 'fs';
import * as path from 'path';

export interface Intent {
  type: 'erc20_approve';
  token: {
    symbol: string;
    address: string;
  };
  spender: string;
  amount: string; // Raw amount as string to handle MAX_UINT
  amountFormatted: string; // Human readable
  isUnlimited: boolean;
}

const MAX_UINT = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

export class IntentService {
  private chainState: any;

  constructor() {
    // Load chain state
    try {
      const statePath = path.join(process.cwd(), '..', '..', 'chain', 'state.json');
      if (fs.existsSync(statePath)) {
        this.chainState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      } else {
        throw new Error('state.json not found');
      }
    } catch (error) {
      console.warn('Could not load chain state, using defaults');
      this.chainState = {
        contracts: {
          mockUSDT: {
            address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
            symbol: 'USDT',
            decimals: 6
          }
        }
      };
    }
  }

  async parseIntent(message: string): Promise<Intent> {
    const cleanMessage = message.toLowerCase().trim();

    if (!this.isApprovalIntent(cleanMessage)) {
      throw new Error('I only support and analyze "Approval" transactions right now. Try saying: "Approve 10 USDT to 0x..."');
    }

    // Known spender aliases for demo
    const aliases: Record<string, string> = {
      'uniswap': '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      'pancakeswap': '0x10ED43C718714eb63d5aA57B78B54704E256024E',
      'test': '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
    };

    let spender = '';
    const spenderMatch = cleanMessage.match(/0x[a-fA-F0-9]{40}/);

    if (spenderMatch) {
      spender = spenderMatch[0];
    } else {
      // Check aliases
      const foundAlias = Object.keys(aliases).find(name => cleanMessage.includes(name));
      if (foundAlias) {
        spender = aliases[foundAlias];
      } else {
        throw new Error('I couldn\'t find a valid spender address (0x...) or known contract name in your message. Please provide a full Ethereum address.');
      }
    }

    const amount = this.extractAmount(cleanMessage);

    return {
      type: 'erc20_approve',
      token: {
        symbol: 'USDT',
        address: this.chainState.contracts.mockUSDT.address
      },
      spender,
      amount: amount.raw,
      amountFormatted: amount.formatted,
      isUnlimited: amount.isUnlimited
    };
  }

  private isApprovalIntent(message: string): boolean {
    const approvalKeywords = ['approve', 'allow', 'permit', 'authorize'];
    return approvalKeywords.some(keyword => message.includes(keyword));
  }

  private extractAmount(message: string): { raw: string; formatted: string; isUnlimited: boolean } {
    // Check for unlimited/max/forever
    if (message.includes('unlimited') || message.includes('max') || message.includes('forever')) {
      return {
        raw: MAX_UINT,
        formatted: 'unlimited',
        isUnlimited: true
      };
    }

    // Extract numeric amount
    const numberMatch = message.match(/(\d+(?:\.\d+)?)/);
    if (numberMatch) {
      const numAmount = parseFloat(numberMatch[1]);
      // Convert to 6 decimals (USDT)
      const rawAmount = (numAmount * 10 ** 6).toString();

      return {
        raw: rawAmount,
        formatted: `${numAmount} USDT`,
        isUnlimited: false
      };
    }

    // Default to small amount if no amount specified
    return {
      raw: (10 * 10 ** 6).toString(), // 10 USDT
      formatted: '10 USDT',
      isUnlimited: false
    };
  }
}