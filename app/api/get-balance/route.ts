import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const RPC_URLS = {
  base: 'https://mainnet.base.org',
};

const USDC_ADDRESSES = {
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
};

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    const provider = new ethers.JsonRpcProvider(RPC_URLS.base);
    
    const ethBalance = await provider.getBalance(walletAddress);
    const ethFormatted = ethers.formatEther(ethBalance);

    const usdcContract = new ethers.Contract(
      USDC_ADDRESSES.base,
      ERC20_ABI,
      provider
    );
    
    const usdcBalance = await usdcContract.balanceOf(walletAddress);
    const usdcFormatted = ethers.formatUnits(usdcBalance, 6);

    return NextResponse.json({
      success: true,
      balances: {
        ETH: parseFloat(ethFormatted).toFixed(4),
        USDC: parseFloat(usdcFormatted).toFixed(2),
      },
      chain: 'Base',
    });

  } catch (error: any) {
    console.error('Balance check error:', error);
    return NextResponse.json({ 
      error: error.message,
      balances: { ETH: '0.0000', USDC: '0.00' }
    }, { status: 500 });
  }
}