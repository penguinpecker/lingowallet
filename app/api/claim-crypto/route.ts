import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { linkPhoneToWallet } from '@/lib/phone-wallet';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { claimToken, walletAddress } = await request.json();

    // Get claim data
    const { data: claim, error: fetchError } = await supabase
      .from('pending_claims')
      .select('*')
      .eq('claim_token', claimToken)
      .eq('claimed', false)
      .single();

    if (fetchError || !claim) {
      return NextResponse.json({ 
        success: false,
        error: 'Claim not found or already claimed' 
      });
    }

    // Mark as claimed
    const { error: updateError } = await supabase
      .from('pending_claims')
      .update({ claimed: true })
      .eq('claim_token', claimToken);

    if (updateError) {
      throw updateError;
    }

    console.log('✅ Claim marked as claimed');
    console.log('💰 In production, transfer', claim.amount, claim.token, 'to', walletAddress);

    return NextResponse.json({ 
      success: true,
      message: `Claimed ${claim.amount} ${claim.token}!`
    });

  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}