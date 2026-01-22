// app/api/swap/execute/route.ts
// Execute swap transaction data from LI.FI quote

import { NextRequest, NextResponse } from 'next/server';

const LIFI_API_URL = 'https://li.quest/v1';

// Token addresses on Base
const BASE_TOKENS: Record<string, { address: string; decimals: number }> = {
  ETH: { address: '0x0000000000000000000000000000000000000000', decimals: 18 },
  WETH: { address: '0x4200000000000000000000000000000000000006', decimals: 18 },
  USDC: { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
  USDT: { address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', decimals: 6 },
  DAI: { address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', decimals: 18 },
};

// ERC20 approve function signature
const APPROVE_ABI = [
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
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
] as const;

export async function POST(req: NextRequest) {
  try {
    const { fromToken, toToken, amount, walletAddress } = await req.json();

    if (!fromToken || !toToken || !amount || !walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const fromTokenUpper = fromToken.toUpperCase();
    const toTokenUpper = toToken.toUpperCase();

    const fromTokenInfo = BASE_TOKENS[fromTokenUpper];
    const toTokenInfo = BASE_TOKENS[toTokenUpper];

    if (!fromTokenInfo || !toTokenInfo) {
      return NextResponse.json(
        { success: false, error: `Unsupported token` },
        { status: 400 }
      );
    }

    // Convert amount to smallest unit
    const parsedAmount = BigInt(
      Math.floor(parseFloat(amount) * 10 ** fromTokenInfo.decimals)
    ).toString();

    // Get quote with transaction data
    const params = new URLSearchParams({
      fromChain: '8453',
      toChain: '8453',
      fromToken: fromTokenInfo.address,
      toToken: toTokenInfo.address,
      fromAmount: parsedAmount,
      fromAddress: walletAddress,
      slippage: '0.03',
    });

    console.log(`🔄 Getting swap tx: ${amount} ${fromToken} → ${toToken}`);

    const response = await fetch(`${LIFI_API_URL}/quote?${params}`, {
      headers: { 'Accept': 'application/json' },
    });

    const data = await response.json();

    if (data.error || !data.transactionRequest) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to get swap transaction' },
        { status: 400 }
      );
    }

    // Calculate output amount
    const toAmount = data.estimate?.toAmount
      ? (Number(data.estimate.toAmount) / 10 ** toTokenInfo.decimals).toFixed(6)
      : '0';

    // Check if we need approval (for non-ETH tokens)
    const needsApproval = fromTokenUpper !== 'ETH' && 
      data.transactionRequest.to.toLowerCase() !== fromTokenInfo.address.toLowerCase();

    return NextResponse.json({
      success: true,
      swap: {
        fromToken: fromTokenUpper,
        toToken: toTokenUpper,
        fromAmount: amount,
        toAmount,
        needsApproval,
        approvalAddress: needsApproval ? data.transactionRequest.to : null,
        tokenAddress: fromTokenInfo.address,
        parsedAmount,
        transactionRequest: {
          to: data.transactionRequest.to,
          data: data.transactionRequest.data,
          value: data.transactionRequest.value || '0',
          gasLimit: data.transactionRequest.gasLimit || '500000',
        },
      },
    });
  } catch (error) {
    console.error('Swap execution error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to prepare swap' },
      { status: 500 }
    );
  }
}