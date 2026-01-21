// app/api/transactions/record/route.ts
// API endpoint to record new transactions

import { NextRequest, NextResponse } from 'next/server';
import { 
  createTransaction,
  updateTransactionStatus,
  recordSendTransaction,
  recordSwapTransaction,
  recordClaimTransaction,
  type TransactionStatus
} from '@/lib/transaction-history';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'send': {
        const { walletAddress, recipientAddress, recipientPhone, amount, token, chain, originalCommand, language } = body;
        
        if (!walletAddress || !amount || !token) {
          return NextResponse.json(
            { error: 'Missing required fields: walletAddress, amount, token' },
            { status: 400 }
          );
        }

        const tx = await recordSendTransaction({
          walletAddress,
          recipientAddress,
          recipientPhone,
          amount,
          token,
          chain,
          originalCommand,
          language,
        });

        if (!tx) {
          return NextResponse.json(
            { error: 'Failed to record transaction' },
            { status: 500 }
          );
        }

        return NextResponse.json({ success: true, transaction: tx });
      }

      case 'swap': {
        const { walletAddress, tokenIn, tokenOut, amountIn, amountOut, chain, originalCommand, language } = body;
        
        if (!walletAddress || !tokenIn || !tokenOut || !amountIn) {
          return NextResponse.json(
            { error: 'Missing required fields: walletAddress, tokenIn, tokenOut, amountIn' },
            { status: 400 }
          );
        }

        const tx = await recordSwapTransaction({
          walletAddress,
          tokenIn,
          tokenOut,
          amountIn,
          amountOut,
          chain,
          originalCommand,
          language,
        });

        if (!tx) {
          return NextResponse.json(
            { error: 'Failed to record swap' },
            { status: 500 }
          );
        }

        return NextResponse.json({ success: true, transaction: tx });
      }

      case 'claim': {
        const { walletAddress, senderAddress, amount, token, claimToken } = body;
        
        if (!walletAddress || !senderAddress || !amount || !token) {
          return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
          );
        }

        const tx = await recordClaimTransaction({
          walletAddress,
          senderAddress,
          amount,
          token,
          claimToken,
        });

        if (!tx) {
          return NextResponse.json(
            { error: 'Failed to record claim' },
            { status: 500 }
          );
        }

        return NextResponse.json({ success: true, transaction: tx });
      }

      case 'update_status': {
        const { transactionId, status, txHash, errorMessage } = body;
        
        if (!transactionId || !status) {
          return NextResponse.json(
            { error: 'Missing required fields: transactionId, status' },
            { status: 400 }
          );
        }

        const validStatuses: TransactionStatus[] = ['pending', 'confirmed', 'failed'];
        if (!validStatuses.includes(status)) {
          return NextResponse.json(
            { error: 'Invalid status. Must be: pending, confirmed, or failed' },
            { status: 400 }
          );
        }

        const tx = await updateTransactionStatus(transactionId, status, txHash, errorMessage);

        if (!tx) {
          return NextResponse.json(
            { error: 'Failed to update transaction' },
            { status: 500 }
          );
        }

        return NextResponse.json({ success: true, transaction: tx });
      }

      case 'create': {
        // Generic create for any transaction type
        const { 
          walletAddress, type, status, tokenIn, tokenOut, amountIn, amountOut,
          counterpartyAddress, counterpartyPhone, chain, description, language, originalCommand 
        } = body;
        
        if (!walletAddress || !type) {
          return NextResponse.json(
            { error: 'Missing required fields: walletAddress, type' },
            { status: 400 }
          );
        }

        const tx = await createTransaction({
          wallet_address: walletAddress,
          type,
          status: status || 'pending',
          token_in: tokenIn,
          token_out: tokenOut,
          amount_in: amountIn,
          amount_out: amountOut,
          counterparty_address: counterpartyAddress,
          counterparty_phone: counterpartyPhone,
          chain: chain || 'base',
          description,
          language,
          original_command: originalCommand,
        });

        if (!tx) {
          return NextResponse.json(
            { error: 'Failed to create transaction' },
            { status: 500 }
          );
        }

        return NextResponse.json({ success: true, transaction: tx });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: send, swap, claim, update_status, or create' },
          { status: 400 }
        );
    }

  } catch (error: unknown) {
    console.error('Error recording transaction:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record transaction' },
      { status: 500 }
    );
  }
}
