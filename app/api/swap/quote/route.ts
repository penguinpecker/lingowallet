// app/api/swap/quote/route.ts
// Get swap quote from LI.FI

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
        { success: false, error: `Unsupported token. Supported: ${Object.keys(BASE_TOKENS).join(', ')}` },
        { status: 400 }
      );
    }

    // Convert amount to smallest unit
    const parsedAmount = BigInt(
      Math.floor(parseFloat(amount) * 10 ** fromTokenInfo.decimals)
    ).toString();

    // Build LI.FI quote request
    const params = new URLSearchParams({
      fromChain: '8453', // Base chain ID
      toChain: '8453',
      fromToken: fromTokenInfo.address,
      toToken: toTokenInfo.address,
      fromAmount: parsedAmount,
      fromAddress: walletAddress,
      slippage: '0.03', // 3% slippage
    });

    console.log(`🔄 Getting quote: ${amount} ${fromToken} → ${toToken}`);

    const response = await fetch(`${LIFI_API_URL}/quote?${params}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (data.error || data.message) {
      console.error('LI.FI error:', data.error || data.message);
      return NextResponse.json(
        { success: false, error: data.error || data.message || 'Failed to get quote' },
        { status: 400 }
      );
    }

    // Parse the response
    const toAmount = data.estimate?.toAmount
      ? (Number(data.estimate.toAmount) / 10 ** toTokenInfo.decimals).toFixed(6)
      : '0';

    const toAmountMin = data.estimate?.toAmountMin
      ? (Number(data.estimate.toAmountMin) / 10 ** toTokenInfo.decimals).toFixed(6)
      : '0';

    return NextResponse.json({
      success: true,
      quote: {
        fromToken: fromTokenUpper,
        toToken: toTokenUpper,
        fromAmount: amount,
        toAmount,
        toAmountMin,
        estimatedGas: data.estimate?.gasCosts?.[0]?.amount || '0',
        route: data.toolDetails?.name || 'LI.FI',
        transactionRequest: data.transactionRequest,
      },
    });
  } catch (error) {
    console.error('Quote error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get swap quote' },
      { status: 500 }
    );
  }
}