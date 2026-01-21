// lib/transaction-history.ts
// Transaction History Management for Lingo Wallet

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Transaction types
export type TransactionType = 'send' | 'receive' | 'swap' | 'bridge' | 'claim';
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

// Transaction interface
export interface Transaction {
  id?: string;
  tx_hash?: string | null;
  wallet_address: string;
  type: TransactionType;
  status: TransactionStatus;
  token_in?: string | null;
  token_out?: string | null;
  amount_in?: string | null;
  amount_out?: string | null;
  counterparty_address?: string | null;
  counterparty_phone?: string | null;
  chain: string;
  description?: string | null;
  language?: string;
  original_command?: string | null;
  created_at?: string;
  confirmed_at?: string | null;
  error_message?: string | null;
}

// Create a new transaction record
export async function createTransaction(tx: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction | null> {
  console.log('📝 Creating transaction record:', tx.type, tx.amount_in, tx.token_in);
  
  const { data, error } = await supabase
    .from('transaction_history')
    .insert({
      tx_hash: tx.tx_hash || null,
      wallet_address: tx.wallet_address,
      type: tx.type,
      status: tx.status,
      token_in: tx.token_in || null,
      token_out: tx.token_out || null,
      amount_in: tx.amount_in || null,
      amount_out: tx.amount_out || null,
      counterparty_address: tx.counterparty_address || null,
      counterparty_phone: tx.counterparty_phone || null,
      chain: tx.chain || 'base',
      description: tx.description || null,
      language: tx.language || 'en',
      original_command: tx.original_command || null,
      error_message: tx.error_message || null,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating transaction:', error);
    return null;
  }

  console.log('✅ Transaction recorded:', data.id);
  return data as Transaction;
}

// Update transaction status (e.g., when confirmed on chain)
export async function updateTransactionStatus(
  id: string, 
  status: TransactionStatus, 
  txHash?: string,
  errorMessage?: string
): Promise<Transaction | null> {
  console.log('📝 Updating transaction status:', id, status);
  
  const updateData: Record<string, unknown> = { status };
  
  if (txHash) {
    updateData.tx_hash = txHash;
  }
  
  if (status === 'confirmed') {
    updateData.confirmed_at = new Date().toISOString();
  }
  
  if (errorMessage) {
    updateData.error_message = errorMessage;
  }

  const { data, error } = await supabase
    .from('transaction_history')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('❌ Error updating transaction:', error);
    return null;
  }

  console.log('✅ Transaction updated:', data.id, status);
  return data as Transaction;
}

// Get transaction history for a wallet
export async function getTransactionHistory(
  walletAddress: string,
  options?: {
    limit?: number;
    offset?: number;
    type?: TransactionType;
    status?: TransactionStatus;
    chain?: string;
  }
): Promise<Transaction[]> {
  console.log('📜 Fetching transaction history for:', walletAddress);
  
  let query = supabase
    .from('transaction_history')
    .select('*')
    .eq('wallet_address', walletAddress.toLowerCase())
    .order('created_at', { ascending: false });

  // Apply filters
  if (options?.type) {
    query = query.eq('type', options.type);
  }
  
  if (options?.status) {
    query = query.eq('status', options.status);
  }
  
  if (options?.chain) {
    query = query.eq('chain', options.chain);
  }

  // Apply pagination
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    console.error('❌ Error fetching transactions:', error);
    return [];
  }

  console.log(`✅ Found ${data?.length || 0} transactions`);
  return (data as Transaction[]) || [];
}

// Get a single transaction by ID
export async function getTransactionById(id: string): Promise<Transaction | null> {
  const { data, error } = await supabase
    .from('transaction_history')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('❌ Error fetching transaction:', error);
    return null;
  }

  return data as Transaction;
}

// Get a transaction by hash
export async function getTransactionByHash(txHash: string): Promise<Transaction | null> {
  const { data, error } = await supabase
    .from('transaction_history')
    .select('*')
    .eq('tx_hash', txHash)
    .single();

  if (error) {
    console.error('❌ Error fetching transaction by hash:', error);
    return null;
  }

  return data as Transaction;
}

// Get recent transactions (for dashboard)
export async function getRecentTransactions(
  walletAddress: string, 
  count: number = 10
): Promise<Transaction[]> {
  return getTransactionHistory(walletAddress, { limit: count });
}

// Get pending transactions
export async function getPendingTransactions(walletAddress: string): Promise<Transaction[]> {
  return getTransactionHistory(walletAddress, { status: 'pending' });
}

// Get transaction summary/stats
export async function getTransactionStats(walletAddress: string): Promise<{
  totalSent: number;
  totalReceived: number;
  totalSwaps: number;
  pendingCount: number;
}> {
  const { data, error } = await supabase
    .from('transaction_history')
    .select('type, status, amount_in, amount_out')
    .eq('wallet_address', walletAddress.toLowerCase());

  if (error || !data) {
    return { totalSent: 0, totalReceived: 0, totalSwaps: 0, pendingCount: 0 };
  }

  const stats = {
    totalSent: data.filter(t => t.type === 'send' && t.status === 'confirmed').length,
    totalReceived: data.filter(t => t.type === 'receive' && t.status === 'confirmed').length,
    totalSwaps: data.filter(t => t.type === 'swap' && t.status === 'confirmed').length,
    pendingCount: data.filter(t => t.status === 'pending').length,
  };

  return stats;
}

// Helper: Record a send transaction
export async function recordSendTransaction(params: {
  walletAddress: string;
  recipientAddress?: string;
  recipientPhone?: string;
  amount: string;
  token: string;
  chain?: string;
  originalCommand?: string;
  language?: string;
}): Promise<Transaction | null> {
  const description = params.recipientPhone 
    ? `Sent ${params.amount} ${params.token} to ${params.recipientPhone}`
    : `Sent ${params.amount} ${params.token} to ${params.recipientAddress?.slice(0, 10)}...`;

  return createTransaction({
    wallet_address: params.walletAddress.toLowerCase(),
    type: 'send',
    status: 'pending',
    token_in: params.token,
    amount_in: params.amount,
    counterparty_address: params.recipientAddress || null,
    counterparty_phone: params.recipientPhone || null,
    chain: params.chain || 'base',
    description,
    original_command: params.originalCommand || null,
    language: params.language || 'en',
  });
}

// Helper: Record a swap transaction
export async function recordSwapTransaction(params: {
  walletAddress: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut?: string;
  chain?: string;
  originalCommand?: string;
  language?: string;
}): Promise<Transaction | null> {
  const description = `Swapped ${params.amountIn} ${params.tokenIn} for ${params.amountOut || '?'} ${params.tokenOut}`;

  return createTransaction({
    wallet_address: params.walletAddress.toLowerCase(),
    type: 'swap',
    status: 'pending',
    token_in: params.tokenIn,
    token_out: params.tokenOut,
    amount_in: params.amountIn,
    amount_out: params.amountOut || null,
    chain: params.chain || 'base',
    description,
    original_command: params.originalCommand || null,
    language: params.language || 'en',
  });
}

// Helper: Record a claim transaction
export async function recordClaimTransaction(params: {
  walletAddress: string;
  senderAddress: string;
  amount: string;
  token: string;
  claimToken: string;
}): Promise<Transaction | null> {
  const description = `Claimed ${params.amount} ${params.token}`;

  return createTransaction({
    wallet_address: params.walletAddress.toLowerCase(),
    type: 'claim',
    status: 'confirmed', // Claims are instant
    token_in: params.token,
    amount_in: params.amount,
    counterparty_address: params.senderAddress,
    chain: 'base',
    description,
  });
}

// Format transaction for display
export function formatTransaction(tx: Transaction): {
  id: string;
  type: string;
  typeIcon: string;
  status: string;
  statusColor: string;
  title: string;
  subtitle: string;
  amount: string;
  time: string;
  txHash?: string;
} {
  const typeIcons: Record<TransactionType, string> = {
    send: '📤',
    receive: '📥',
    swap: '🔄',
    bridge: '🌉',
    claim: '🎁',
  };

  const statusColors: Record<TransactionStatus, string> = {
    pending: 'text-yellow-400',
    confirmed: 'text-green-400',
    failed: 'text-red-400',
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  let title = tx.description || '';
  let subtitle = '';
  let amount = '';

  switch (tx.type) {
    case 'send':
      title = `Sent ${tx.token_in}`;
      subtitle = tx.counterparty_phone || `To ${tx.counterparty_address?.slice(0, 10)}...`;
      amount = `-${tx.amount_in} ${tx.token_in}`;
      break;
    case 'receive':
      title = `Received ${tx.token_in}`;
      subtitle = `From ${tx.counterparty_address?.slice(0, 10)}...`;
      amount = `+${tx.amount_in} ${tx.token_in}`;
      break;
    case 'swap':
      title = `Swapped ${tx.token_in} → ${tx.token_out}`;
      subtitle = `On ${tx.chain}`;
      amount = `${tx.amount_in} → ${tx.amount_out || '?'}`;
      break;
    case 'bridge':
      title = `Bridged ${tx.token_in}`;
      subtitle = tx.description || '';
      amount = `${tx.amount_in} ${tx.token_in}`;
      break;
    case 'claim':
      title = `Claimed ${tx.token_in}`;
      subtitle = `From ${tx.counterparty_address?.slice(0, 10)}...`;
      amount = `+${tx.amount_in} ${tx.token_in}`;
      break;
  }

  return {
    id: tx.id || '',
    type: tx.type,
    typeIcon: typeIcons[tx.type] || '💰',
    status: tx.status,
    statusColor: statusColors[tx.status],
    title,
    subtitle,
    amount,
    time: formatTime(tx.created_at || new Date().toISOString()),
    txHash: tx.tx_hash || undefined,
  };
}
