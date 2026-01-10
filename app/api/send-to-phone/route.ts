import { NextRequest, NextResponse } from 'next/server';
import { getWalletByPhone, createPendingClaim } from '@/lib/phone-wallet';
import { sendClaimSMS } from '@/lib/sms';

export async function POST(request: NextRequest) {
  try {
    const { phone, amount, token, senderAddress } = await request.json();

    if (!phone || !amount || !token || !senderAddress) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    console.log('📱 Checking if phone has wallet:', phone);

    const recipientWallet = await getWalletByPhone(phone);

    if (recipientWallet) {
      console.log('✅ Found wallet for phone:', recipientWallet);
      return NextResponse.json({
        success: true,
        hasWallet: true,
        recipientAddress: recipientWallet,
        message: `Ready to send ${amount} ${token} to ${phone}'s wallet`,
      });
    } else {
      console.log('📲 No wallet found, creating pending claim...');
      const claimToken = await createPendingClaim(
        phone,
        amount,
        token,
        senderAddress
      );

      const claimUrl = `https://lingowallet.vercel.app/claim/${claimToken}`;

      console.log('✅ Pending claim created:', claimToken);

      // Send SMS notification
      const smsResult = await sendClaimSMS(
        phone,
        amount,
        token,
        claimUrl
      );

      if (smsResult.success) {
        console.log('✅ SMS notification sent!');
      } else {
        console.log('⚠️ SMS failed but claim created:', smsResult.error);
      }

      return NextResponse.json({
        success: true,
        hasWallet: false,
        claimToken,
        claimUrl,
        message: `Pending claim created`,
      });
    }

  } catch (error: any) {
    console.error('❌ Send to phone error:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}