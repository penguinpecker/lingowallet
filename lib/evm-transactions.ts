// lib/evm-transactions.ts
// EVM Transaction Service for Lingo Wallet
// Uses viem for transactions and LiFi for swaps/bridges

import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  parseEther, 
  parseUnits,
  formatEther,
  formatUnits,
  type PublicClient,
  type WalletClient,
  type Chain,
  type Hash,
  type Address,
} from 'viem';
import { base, mainnet, arbitrum, optimism, polygon } from 'viem/chains';

// Supported chains configuration
export const SUPPORTED_CHAINS: Record<string, Chain> = {
  base: base,
  ethereum: mainnet,
  arbitrum: arbitrum,
  optimism: optimism,
  polygon: polygon,
};

// Common token addresses on Base
export const BASE_TOKENS: Record<string, { address: Address; decimals: number }> = {
  ETH: { address: '0x0000000000000000000000000000000000000000' as Address, decimals: 18 },
  WETH: { address: '0x4200000000000000000000000000000000000006' as Address, decimals: 18 },
  USDC: { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address, decimals: 6 },
  USDT: { address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2' as Address, decimals: 6 },
  DAI: { address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb' as Address, decimals: 18 },
};

// ERC20 ABI for token transfers
const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
] as const;

// Transaction result type
export interface TransactionResult {
  success: boolean;
  txHash?: Hash;
  error?: string;
  explorerUrl?: string;
}

// Swap quote type
export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  toAmountMin: string;
  estimatedGas: string;
  priceImpact: string;
  route: string;
}

// Get public client for a chain
export function getPublicClient(chainName: string = 'base'): PublicClient {
  const chain = SUPPORTED_CHAINS[chainName.toLowerCase()] || base;
  const rpcUrl = getRpcUrl(chainName);
  
  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
}

// Get RPC URL for a chain
function getRpcUrl(chainName: string): string {
  const envKey = `ETHEREUM_PROVIDER_${chainName.toUpperCase()}`;
  const customRpc = process.env[envKey];
  
  if (customRpc) return customRpc;
  
  // Default public RPCs (rate limited, use your own for production)
  const defaultRpcs: Record<string, string> = {
    base: 'https://mainnet.base.org',
    ethereum: 'https://eth.llamarpc.com',
    arbitrum: 'https://arb1.arbitrum.io/rpc',
    optimism: 'https://mainnet.optimism.io',
    polygon: 'https://polygon-rpc.com',
  };
  
  return defaultRpcs[chainName.toLowerCase()] || defaultRpcs.base;
}

// Get block explorer URL
export function getExplorerUrl(chainName: string, txHash: string): string {
  const explorers: Record<string, string> = {
    base: 'https://basescan.org/tx/',
    ethereum: 'https://etherscan.io/tx/',
    arbitrum: 'https://arbiscan.io/tx/',
    optimism: 'https://optimistic.etherscan.io/tx/',
    polygon: 'https://polygonscan.com/tx/',
  };
  
  const baseUrl = explorers[chainName.toLowerCase()] || explorers.base;
  return `${baseUrl}${txHash}`;
}

// Get token info
export function getTokenInfo(symbol: string, chainName: string = 'base') {
  // For now, only Base tokens are configured
  if (chainName.toLowerCase() === 'base') {
    return BASE_TOKENS[symbol.toUpperCase()];
  }
  return null;
}

// Check if token is native ETH
export function isNativeToken(symbol: string): boolean {
  return symbol.toUpperCase() === 'ETH';
}

// Parse amount based on token decimals
export function parseTokenAmount(amount: string, decimals: number): bigint {
  return parseUnits(amount, decimals);
}

// Format amount based on token decimals
export function formatTokenAmount(amount: bigint, decimals: number): string {
  return formatUnits(amount, decimals);
}

// ============================================
// TRANSFER FUNCTIONS
// ============================================

// Transfer native ETH
export async function transferETH(
  signer: WalletClient,
  to: Address,
  amount: string,
  chainName: string = 'base'
): Promise<TransactionResult> {
  try {
    console.log(`📤 Transferring ${amount} ETH to ${to} on ${chainName}`);
    
    const value = parseEther(amount);
    
    const hash = await signer.sendTransaction({
      to,
      value,
      chain: SUPPORTED_CHAINS[chainName.toLowerCase()] || base,
    });
    
    console.log(`✅ Transaction sent: ${hash}`);
    
    return {
      success: true,
      txHash: hash,
      explorerUrl: getExplorerUrl(chainName, hash),
    };
  } catch (error) {
    console.error('❌ ETH transfer failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transfer failed',
    };
  }
}

// Transfer ERC20 token
export async function transferToken(
  signer: WalletClient,
  tokenAddress: Address,
  to: Address,
  amount: string,
  decimals: number,
  chainName: string = 'base'
): Promise<TransactionResult> {
  try {
    console.log(`📤 Transferring ${amount} tokens to ${to} on ${chainName}`);
    
    const parsedAmount = parseUnits(amount, decimals);
    const chain = SUPPORTED_CHAINS[chainName.toLowerCase()] || base;
    
    const hash = await signer.writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [to, parsedAmount],
      chain,
    });
    
    console.log(`✅ Token transfer sent: ${hash}`);
    
    return {
      success: true,
      txHash: hash,
      explorerUrl: getExplorerUrl(chainName, hash),
    };
  } catch (error) {
    console.error('❌ Token transfer failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transfer failed',
    };
  }
}

// Universal transfer function
export async function transfer(
  signer: WalletClient,
  to: Address,
  amount: string,
  token: string,
  chainName: string = 'base'
): Promise<TransactionResult> {
  if (isNativeToken(token)) {
    return transferETH(signer, to, amount, chainName);
  }
  
  const tokenInfo = getTokenInfo(token, chainName);
  if (!tokenInfo) {
    return {
      success: false,
      error: `Token ${token} not supported on ${chainName}`,
    };
  }
  
  return transferToken(signer, tokenInfo.address, to, amount, tokenInfo.decimals, chainName);
}

// ============================================
// SWAP FUNCTIONS (via LiFi API)
// ============================================

const LIFI_API_URL = 'https://li.quest/v1';

// Get swap quote from LiFi
export async function getSwapQuote(
  fromChain: string,
  toChain: string,
  fromToken: string,
  toToken: string,
  fromAmount: string,
  fromAddress: string
): Promise<SwapQuote | null> {
  try {
    console.log(`🔄 Getting swap quote: ${fromAmount} ${fromToken} → ${toToken}`);
    
    // Get chain IDs
    const fromChainId = SUPPORTED_CHAINS[fromChain.toLowerCase()]?.id || 8453; // Base
    const toChainId = SUPPORTED_CHAINS[toChain.toLowerCase()]?.id || fromChainId;
    
    // Get token addresses
    const fromTokenInfo = getTokenInfo(fromToken, fromChain);
    const toTokenInfo = getTokenInfo(toToken, toChain);
    
    if (!fromTokenInfo || !toTokenInfo) {
      console.error('Token not found');
      return null;
    }
    
    // For native ETH, use special address
    const fromTokenAddress = isNativeToken(fromToken) 
      ? '0x0000000000000000000000000000000000000000'
      : fromTokenInfo.address;
    const toTokenAddress = isNativeToken(toToken)
      ? '0x0000000000000000000000000000000000000000'
      : toTokenInfo.address;
    
    const parsedAmount = parseUnits(fromAmount, fromTokenInfo.decimals).toString();
    
    const params = new URLSearchParams({
      fromChain: fromChainId.toString(),
      toChain: toChainId.toString(),
      fromToken: fromTokenAddress,
      toToken: toTokenAddress,
      fromAmount: parsedAmount,
      fromAddress,
      slippage: '0.03', // 3% slippage
    });
    
    const response = await fetch(`${LIFI_API_URL}/quote?${params}`);
    const data = await response.json();
    
    if (data.error) {
      console.error('LiFi quote error:', data.error);
      return null;
    }
    
    const toDecimals = toTokenInfo.decimals;
    
    return {
      fromToken,
      toToken,
      fromAmount,
      toAmount: formatUnits(BigInt(data.estimate?.toAmount || '0'), toDecimals),
      toAmountMin: formatUnits(BigInt(data.estimate?.toAmountMin || '0'), toDecimals),
      estimatedGas: data.estimate?.gasCosts?.[0]?.amount || '0',
      priceImpact: data.estimate?.priceImpact || '0',
      route: data.tool || 'LiFi',
    };
  } catch (error) {
    console.error('❌ Failed to get swap quote:', error);
    return null;
  }
}

// Execute swap via LiFi
export async function executeSwap(
  signer: WalletClient,
  fromChain: string,
  toChain: string,
  fromToken: string,
  toToken: string,
  fromAmount: string,
  fromAddress: string
): Promise<TransactionResult> {
  try {
    console.log(`🔄 Executing swap: ${fromAmount} ${fromToken} → ${toToken}`);
    
    // Get chain IDs
    const fromChainId = SUPPORTED_CHAINS[fromChain.toLowerCase()]?.id || 8453;
    const toChainId = SUPPORTED_CHAINS[toChain.toLowerCase()]?.id || fromChainId;
    
    // Get token info
    const fromTokenInfo = getTokenInfo(fromToken, fromChain);
    const toTokenInfo = getTokenInfo(toToken, toChain);
    
    if (!fromTokenInfo || !toTokenInfo) {
      return { success: false, error: 'Token not supported' };
    }
    
    const fromTokenAddress = isNativeToken(fromToken)
      ? '0x0000000000000000000000000000000000000000'
      : fromTokenInfo.address;
    const toTokenAddress = isNativeToken(toToken)
      ? '0x0000000000000000000000000000000000000000'
      : toTokenInfo.address;
    
    const parsedAmount = parseUnits(fromAmount, fromTokenInfo.decimals).toString();
    
    // Get quote with transaction data
    const params = new URLSearchParams({
      fromChain: fromChainId.toString(),
      toChain: toChainId.toString(),
      fromToken: fromTokenAddress,
      toToken: toTokenAddress,
      fromAmount: parsedAmount,
      fromAddress,
      slippage: '0.03',
    });
    
    const response = await fetch(`${LIFI_API_URL}/quote?${params}`);
    const data = await response.json();
    
    if (data.error || !data.transactionRequest) {
      return { success: false, error: data.error || 'Failed to get swap transaction' };
    }
    
    // Check if approval is needed for ERC20
    if (!isNativeToken(fromToken) && data.transactionRequest.to !== fromTokenAddress) {
      // Need to approve the router to spend tokens
      const publicClient = getPublicClient(fromChain);
      const allowance = await publicClient.readContract({
        address: fromTokenInfo.address,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [fromAddress as Address, data.transactionRequest.to as Address],
      });
      
      if (allowance < BigInt(parsedAmount)) {
        console.log('📝 Approving token spend...');
        const approveHash = await signer.writeContract({
          address: fromTokenInfo.address,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [data.transactionRequest.to as Address, BigInt(parsedAmount)],
          chain: SUPPORTED_CHAINS[fromChain.toLowerCase()] || base,
        });
        
        // Wait for approval
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        console.log('✅ Approval confirmed');
      }
    }
    
    // Execute the swap
    const hash = await signer.sendTransaction({
      to: data.transactionRequest.to as Address,
      data: data.transactionRequest.data as `0x${string}`,
      value: BigInt(data.transactionRequest.value || '0'),
      chain: SUPPORTED_CHAINS[fromChain.toLowerCase()] || base,
    });
    
    console.log(`✅ Swap transaction sent: ${hash}`);
    
    return {
      success: true,
      txHash: hash,
      explorerUrl: getExplorerUrl(fromChain, hash),
    };
  } catch (error) {
    console.error('❌ Swap failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Swap failed',
    };
  }
}

// ============================================
// BRIDGE FUNCTIONS (via LiFi API)
// ============================================

// Execute bridge via LiFi
export async function executeBridge(
  signer: WalletClient,
  fromChain: string,
  toChain: string,
  token: string,
  amount: string,
  fromAddress: string,
  toAddress?: string
): Promise<TransactionResult> {
  // Bridge is essentially a cross-chain swap
  return executeSwap(
    signer,
    fromChain,
    toChain,
    token,
    token, // Same token on destination
    amount,
    toAddress || fromAddress
  );
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Get wallet balance
export async function getBalance(
  address: string,
  token: string,
  chainName: string = 'base'
): Promise<string> {
  try {
    const publicClient = getPublicClient(chainName);
    
    if (isNativeToken(token)) {
      const balance = await publicClient.getBalance({ address: address as Address });
      return formatEther(balance);
    }
    
    const tokenInfo = getTokenInfo(token, chainName);
    if (!tokenInfo) {
      return '0';
    }
    
    const balance = await publicClient.readContract({
      address: tokenInfo.address,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address as Address],
    });
    
    return formatUnits(balance, tokenInfo.decimals);
  } catch (error) {
    console.error('Failed to get balance:', error);
    return '0';
  }
}

// Wait for transaction confirmation
export async function waitForTransaction(
  txHash: Hash,
  chainName: string = 'base'
): Promise<boolean> {
  try {
    const publicClient = getPublicClient(chainName);
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    return receipt.status === 'success';
  } catch (error) {
    console.error('Error waiting for transaction:', error);
    return false;
  }
}
