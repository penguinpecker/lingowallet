import { NextRequest, NextResponse } from 'next/server';
import { linkPhoneToWallet } from '@/lib/phone-wallet';

export async function POST(request: NextRequest) {
  try {
    const { phone, walletAddress } = await request.json();

    if (!phone || !walletAddress) {
      return NextResponse.json({ 
        error: 'Missing phone or wallet address' 
      }, { status: 400 });
    }

    console.log('🔗 Linking phone to wallet:', phone, '→', walletAddress);

    await linkPhoneToWallet(phone, walletAddress);

    console.log('✅ Phone successfully linked!');

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('❌ Link phone error:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}