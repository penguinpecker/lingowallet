// LI.FI Bridge utility for cross-chain transfers to Base
// Bridges ETH/USDC from any supported chain to Base before sending

const LIFI_API_URL = 'https://li.quest/v1';

// Chain IDs
export const CHAINS = {
  ethereum: 1,
  polygon: 137,
  arbitrum: 42161,
  optimism: 10,
  base: 8453,
} as const;

type ChainId = typeof CHAINS[keyof typeof CHAINS];

// Token addresses per chain
export const TOKENS: Record<string, Record<ChainId, string>> = {
  // ETH (native) - use zero address
  ETH: {
    [CHAINS.ethereum]: '0x0000000000000000000000000000000000000000',
    [CHAINS.polygon]: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // WETH on Polygon
    [CHAINS.arbitrum]: '0x0000000000000000000000000000000000000000',
    [CHAINS.optimism]: '0x0000000000000000000000000000000000000000',
    [CHAINS.base]: '0x0000000000000000000000000000000000000000',
  },
  // USDC addresses
  USDC: {
    [CHAINS.ethereum]: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    [CHAINS.polygon]: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    [CHAINS.arbitrum]: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    [CHAINS.optimism]: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    [CHAINS.base]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
};

export interface BridgeQuote {
  id: string;
  type: string;
  tool: string;
  action: {
    fromChainId: number;
    toChainId: number;
    fromToken: { address: string; symbol: string; decimals: number };
    toToken: { address: string; symbol: string; decimals: number };
    fromAmount: string;
    slippage: number;
  };
  estimate: {
    fromAmount: string;
    toAmount: string;
    toAmountMin: string;
    approvalAddress: string;
    executionDuration: number;
    gasCosts: Array<{ amount: string; amountUSD: string }>;
  };
  transactionRequest: {
    from: string;
    to: string;
    chainId: number;
    data: string;
    value: string;
    gasLimit: string;
    gasPrice: string;
  };
}

export interface WalletBalance {
  chainId: number;
  chainName: string;
  token: string;
  balance: string;
  balanceUSD: string;
}

// Get quote for bridging to Base
export async function getBridgeQuote(
  fromChainId: number,
  fromToken: string, // 'ETH' or 'USDC'
  fromAmount: string, // in wei or smallest unit
  fromAddress: string,
  toAddress: string = fromAddress
): Promise<BridgeQuote | null> {
  try {
    const tokenAddresses = TOKENS[fromToken];
    if (!tokenAddresses) {
      console.error('Token not supported');
      return null;
    }

    const fromTokenAddress = tokenAddresses[fromChainId as ChainId];
    const toTokenAddress = tokenAddresses[CHAINS.base];

    if (!fromTokenAddress || !toTokenAddress) {
      console.error('Token not supported on this chain');
      return null;
    }

    const params = new URLSearchParams({
      fromChain: fromChainId.toString(),
      toChain: CHAINS.base.toString(),
      fromToken: fromTokenAddress,
      toToken: toTokenAddress,
      fromAmount,
      fromAddress,
      toAddress,
      slippage: '0.005', // 0.5% slippage
    });

    const response = await fetch(`${LIFI_API_URL}/quote?${params}`);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('LI.FI quote error:', error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get bridge quote:', error);
    return null;
  }
}

// Get available routes for bridging
export async function getBridgeRoutes(
  fromChainId: number,
  fromToken: string,
  fromAmount: string,
  fromAddress: string
) {
  try {
    const tokenAddresses = TOKENS[fromToken];
    if (!tokenAddresses) {
      return null;
    }

    const fromTokenAddress = tokenAddresses[fromChainId as ChainId];
    const toTokenAddress = tokenAddresses[CHAINS.base];

    const response = await fetch(`${LIFI_API_URL}/routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromChainId,
        toChainId: CHAINS.base,
        fromTokenAddress,
        toTokenAddress,
        fromAmount,
        fromAddress,
        options: {
          slippage: 0.005,
          order: 'RECOMMENDED',
        },
      }),
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get bridge routes:', error);
    return null;
  }
}

// Check transaction status
export async function checkBridgeStatus(txHash: string, fromChainId: number) {
  try {
    const params = new URLSearchParams({
      txHash,
      fromChain: fromChainId.toString(),
      toChain: CHAINS.base.toString(),
    });

    const response = await fetch(`${LIFI_API_URL}/status?${params}`);
    
    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to check bridge status:', error);
    return null;
  }
}

// Get token balances across all chains for a wallet
export async function getMultiChainBalances(walletAddress: string): Promise<WalletBalance[]> {
  const balances: WalletBalance[] = [];
  
  const chainNames: Record<number, string> = {
    [CHAINS.ethereum]: 'Ethereum',
    [CHAINS.polygon]: 'Polygon',
    [CHAINS.arbitrum]: 'Arbitrum',
    [CHAINS.optimism]: 'Optimism',
    [CHAINS.base]: 'Base',
  };

  // For each chain, fetch ETH and USDC balances
  for (const [chainName, chainId] of Object.entries(CHAINS)) {
    try {
      const params = new URLSearchParams({
        address: walletAddress,
        chainIds: chainId.toString(),
      });

      const response = await fetch(`${LIFI_API_URL}/balances?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.tokenBalances && data.tokenBalances[chainId]) {
          for (const token of data.tokenBalances[chainId]) {
            if (token.symbol === 'ETH' || token.symbol === 'USDC') {
              balances.push({
                chainId,
                chainName: chainNames[chainId] || chainName,
                token: token.symbol,
                balance: token.amount,
                balanceUSD: token.priceUSD ? (parseFloat(token.amount) * parseFloat(token.priceUSD)).toFixed(2) : '0',
              });
            }
          }
        }
      }
    } catch (error) {
      console.error(`Failed to fetch balance for ${chainName}:`, error);
    }
  }

  return balances;
}

// Determine if bridging is needed and from which chain
export function needsBridging(
  balances: WalletBalance[],
  token: string,
  amount: string
): { needsBridge: boolean; fromChainId: number | null; availableBalance: string } {
  const amountNum = parseFloat(amount);
  
  // First check Base chain balance
  const baseBalance = balances.find(b => b.chainId === CHAINS.base && b.token === token);
  if (baseBalance && parseFloat(baseBalance.balance) >= amountNum) {
    return { needsBridge: false, fromChainId: null, availableBalance: baseBalance.balance };
  }

  // Find chain with sufficient balance
  const otherChainBalances = balances
    .filter(b => b.chainId !== CHAINS.base && b.token === token)
    .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance)); // Sort by balance desc

  for (const balance of otherChainBalances) {
    if (parseFloat(balance.balance) >= amountNum) {
      return { needsBridge: true, fromChainId: balance.chainId, availableBalance: balance.balance };
    }
  }

  // Not enough balance on any chain
  return { needsBridge: false, fromChainId: null, availableBalance: '0' };
}