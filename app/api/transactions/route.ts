// app/api/transactions/route.ts
// API endpoint for transaction history

import { NextRequest, NextResponse } from 'next/server';
import { 
  getTransactionHistory, 
  getTransactionStats,
  type TransactionType,
  type TransactionStatus 
} from '@/lib/transaction-history';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const walletAddress = searchParams.get('wallet');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type') as TransactionType | null;
    const status = searchParams.get('status') as TransactionStatus | null;
    const chain = searchParams.get('chain');
    const includeStats = searchParams.get('stats') === 'true';

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Fetch transactions
    const transactions = await getTransactionHistory(walletAddress, {
      limit,
      offset,
      type: type || undefined,
      status: status || undefined,
      chain: chain || undefined,
    });

    // Optionally include stats
    let stats = null;
    if (includeStats) {
      stats = await getTransactionStats(walletAddress);
    }

    return NextResponse.json({
      success: true,
      transactions,
      stats,
      pagination: {
        limit,
        offset,
        hasMore: transactions.length === limit,
      },
    });

  } catch (error: unknown) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, action } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Handle different actions
    switch (action) {
      case 'stats':
        const stats = await getTransactionStats(walletAddress);
        return NextResponse.json({ success: true, stats });

      case 'recent':
        const recent = await getTransactionHistory(walletAddress, { limit: 10 });
        return NextResponse.json({ success: true, transactions: recent });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error: unknown) {
    console.error('Error in transactions POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Request failed' },
      { status: 500 }
    );
  }
}
