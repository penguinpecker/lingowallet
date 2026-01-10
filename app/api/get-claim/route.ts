import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { claimToken } = await request.json();

    const { data, error } = await supabase
      .from('pending_claims')
      .select('*')
      .eq('claim_token', claimToken)
      .eq('claimed', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return NextResponse.json({ 
        success: false,
        error: 'Claim not found or expired' 
      });
    }

    return NextResponse.json({ 
      success: true,
      claim: data
    });

  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}