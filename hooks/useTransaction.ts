// hooks/useTransaction.ts
// React hook for executing blockchain transactions with Privy wallet

import { useState, useCallback } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom, type Hash, type Address } from 'viem';
import { base, mainnet, arbitrum, optimism, polygon } from 'viem/chains';

// Supported chains
const CHAINS = {
  base,
  ethereum: mainnet,
  arbitrum,
  optimism,
  polygon,
};

// Transaction status
export type TransactionStatus = 'idle' | 'preparing' | 'signing' | 'pending' | 'confirmed' | 'failed';

// Transaction result
export interface TransactionResult {
  success: boolean;
  txHash?: string;
  explorerUrl?: string;
  error?: string;
}

// Hook state
interface UseTransactionState {
  status: TransactionStatus;
  txHash: string | null;
  error: string | null;
  explorerUrl: string | null;
}

// Hook return type
interface UseTransactionReturn extends UseTransactionState {
  // Transfer tokens
  transfer: (params: {
    to: string;
    amount: string;
    token: string;
    chain?: string;
  }) => Promise<TransactionResult>;
  
  // Swap tokens
  swap: (params: {
    fromToken: string;
    toToken: string;
    amount: string;
    chain?: string;
  }) => Promise<TransactionResult>;
  
  // Bridge tokens
  bridge: (params: {
    fromChain: string;
    toChain: string;
    token: string;
    amount: string;
  }) => Promise<TransactionResult>;
  
  // Get swap quote
  getQuote: (params: {
    fromToken: string;
    toToken: string;
    amount: string;
    chain?: string;
  }) => Promise<{
    toAmount: string;
    toAmountMin: string;
    priceImpact: string;
    route: string;
  } | null>;
  
  // Reset state
  reset: () => void;
  
  // Check if wallet is ready
  isReady: boolean;
}

// Get explorer URL
function getExplorerUrl(chain: string, txHash: string): string {
  const explorers: Record<string, string> = {
    base: 'https://basescan.org/tx/',
    ethereum: 'https://etherscan.io/tx/',
    arbitrum: 'https://arbiscan.io/tx/',
    optimism: 'https://optimistic.etherscan.io/tx/',
    polygon: 'https://polygonscan.com/tx/',
  };
  return `${explorers[chain] || explorers.base}${txHash}`;
}

export function useTransaction(): UseTransactionReturn {
  const { wallets } = useWallets();
  const [state, setState] = useState<UseTransactionState>({
    status: 'idle',
    txHash: null,
    error: null,
    explorerUrl: null,
  });

  // Get the embedded wallet
  const wallet = wallets.find(w => w.walletClientType === 'privy');
  const isReady = !!wallet;

  // Reset state
  const reset = useCallback(() => {
    setState({
      status: 'idle',
      txHash: null,
      error: null,
      explorerUrl: null,
    });
  }, []);

  // Get wallet client for signing
  const getWalletClient = useCallback(async (chainName: string = 'base') => {
    if (!wallet) {
      throw new Error('No wallet connected');
    }

    const chain = CHAINS[chainName as keyof typeof CHAINS] || base;
    
    // Switch chain if needed
    await wallet.switchChain(chain.id);
    
    // Get the provider
    const provider = await wallet.getEthereumProvider();
    
    return createWalletClient({
      chain,
      transport: custom(provider),
    });
  }, [wallet]);

  // Transfer function
  const transfer = useCallback(async (params: {
    to: string;
    amount: string;
    token: string;
    chain?: string;
  }): Promise<TransactionResult> => {
    const { to, amount, token, chain = 'base' } = params;

    try {
      setState(prev => ({ ...prev, status: 'preparing', error: null }));

      if (!wallet) {
        throw new Error('No wallet connected');
      }

      const walletAddress = wallet.address;
      
      // For now, use the API route which handles the transaction logic
      // In production with real transactions, you'd sign directly with Privy
      setState(prev => ({ ...prev, status: 'signing' }));
      
      const response = await fetch('/api/execute-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transfer',
          walletAddress,
          to,
          amount,
          token,
          chain,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Transfer failed');
      }

      setState(prev => ({
        ...prev,
        status: 'confirmed',
        txHash: data.txHash,
        explorerUrl: data.explorerUrl,
      }));

      return {
        success: true,
        txHash: data.txHash,
        explorerUrl: data.explorerUrl,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transfer failed';
      setState(prev => ({
        ...prev,
        status: 'failed',
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, [wallet]);

  // Swap function
  const swap = useCallback(async (params: {
    fromToken: string;
    toToken: string;
    amount: string;
    chain?: string;
  }): Promise<TransactionResult> => {
    const { fromToken, toToken, amount, chain = 'base' } = params;

    try {
      setState(prev => ({ ...prev, status: 'preparing', error: null }));

      if (!wallet) {
        throw new Error('No wallet connected');
      }

      const walletAddress = wallet.address;
      
      setState(prev => ({ ...prev, status: 'signing' }));
      
      const response = await fetch('/api/execute-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'swap',
          walletAddress,
          fromToken,
          toToken,
          amount,
          chain,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Swap failed');
      }

      setState(prev => ({
        ...prev,
        status: 'confirmed',
        txHash: data.txHash,
        explorerUrl: data.explorerUrl,
      }));

      return {
        success: true,
        txHash: data.txHash,
        explorerUrl: data.explorerUrl,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Swap failed';
      setState(prev => ({
        ...prev,
        status: 'failed',
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, [wallet]);

  // Bridge function
  const bridge = useCallback(async (params: {
    fromChain: string;
    toChain: string;
    token: string;
    amount: string;
  }): Promise<TransactionResult> => {
    const { fromChain, toChain, token, amount } = params;

    try {
      setState(prev => ({ ...prev, status: 'preparing', error: null }));

      if (!wallet) {
        throw new Error('No wallet connected');
      }

      const walletAddress = wallet.address;
      
      setState(prev => ({ ...prev, status: 'signing' }));
      
      const response = await fetch('/api/execute-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bridge',
          walletAddress,
          fromChain,
          toChain,
          token,
          amount,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Bridge failed');
      }

      setState(prev => ({
        ...prev,
        status: 'confirmed',
        txHash: data.txHash,
        explorerUrl: data.explorerUrl,
      }));

      return {
        success: true,
        txHash: data.txHash,
        explorerUrl: data.explorerUrl,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bridge failed';
      setState(prev => ({
        ...prev,
        status: 'failed',
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, [wallet]);

  // Get quote function
  const getQuote = useCallback(async (params: {
    fromToken: string;
    toToken: string;
    amount: string;
    chain?: string;
  }) => {
    const { fromToken, toToken, amount, chain = 'base' } = params;

    try {
      if (!wallet) {
        throw new Error('No wallet connected');
      }

      const response = await fetch('/api/execute-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'quote',
          walletAddress: wallet.address,
          fromToken,
          toToken,
          amount,
          chain,
        }),
      });

      const data = await response.json();

      if (!data.success || !data.quote) {
        return null;
      }

      return {
        toAmount: data.quote.toAmount,
        toAmountMin: data.quote.toAmountMin,
        priceImpact: data.quote.priceImpact,
        route: data.quote.route,
      };

    } catch (error) {
      console.error('Failed to get quote:', error);
      return null;
    }
  }, [wallet]);

  return {
    ...state,
    transfer,
    swap,
    bridge,
    getQuote,
    reset,
    isReady,
  };
}
