import { createPublicClient, http, parseEther, parseUnits, encodeFunctionData } from 'viem';
import { base } from 'viem/chains';

// Base chain config
export const baseChain = base;
export const BASE_CHAIN_ID = 8453;
export const BASE_CHAIN_ID_HEX = '0x2105';

// Switch wallet to Base chain
export async function switchToBase(provider: any) {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BASE_CHAIN_ID_HEX }],
    });
  } catch (switchError: any) {
    // Chain not added, add it
    if (switchError.code === 4902) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: BASE_CHAIN_ID_HEX,
          chainName: 'Base',
          nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://mainnet.base.org'],
          blockExplorerUrls: ['https://basescan.org'],
        }],
      });
    } else {
      throw switchError;
    }
  }
}

// USDC contract on Base
export const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// ERC20 ABI for transfer
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
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
] as const;

// Public client for reading blockchain state
export const publicClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

// Build ETH transfer transaction
export function buildEthTransfer(to: string, amount: string) {
  const value = parseEther(amount);
  return {
    to: to as `0x${string}`,
    value,
    chainId: BASE_CHAIN_ID,
  };
}

// Build USDC transfer transaction
export function buildUsdcTransfer(to: string, amount: string) {
  // USDC has 6 decimals
  const value = parseUnits(amount, 6);
  
  const data = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [to as `0x${string}`, value],
  });

  return {
    to: USDC_ADDRESS as `0x${string}`,
    data,
    chainId: BASE_CHAIN_ID,
  };
}

// Get transaction explorer URL
export function getExplorerUrl(txHash: string) {
  return `https://basescan.org/tx/${txHash}`;
}

// Validate Ethereum address
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Format transaction for display
export function formatTxResult(txHash: string, amount: string, token: string, recipient: string) {
  return {
    success: true,
    txHash,
    explorerUrl: getExplorerUrl(txHash),
    amount,
    token,
    recipient,
  };
}