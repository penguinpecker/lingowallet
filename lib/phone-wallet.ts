import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

console.log('🔧 Loading phone-wallet.ts...');
console.log('🔧 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('🔧 Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

console.log('✅ Supabase client created');

function hashPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  return createHash('sha256').update(cleaned).digest('hex');
}

export async function linkPhoneToWallet(phone: string, walletAddress: string) {
  console.log('📞 linkPhoneToWallet called');
  const phoneHash = hashPhone(phone);
  
  const { data, error } = await supabase
    .from('phone_wallets')
    .upsert({ 
      phone_hash: phoneHash, 
      wallet_address: walletAddress 
    }, {
      onConflict: 'phone_hash'
    });
  
  if (error) {
    console.error('❌ Error linking phone:', error);
    throw error;
  }
  
  console.log('✅ Phone linked to wallet in Supabase');
  return data;
}

export async function getWalletByPhone(phone: string): Promise<string | null> {
  console.log('🔍 getWalletByPhone called for:', phone);
  const phoneHash = hashPhone(phone);
  
  const { data, error } = await supabase
    .from('phone_wallets')
    .select('wallet_address')
    .eq('phone_hash', phoneHash)
    .single();
  
  if (error || !data) {
    console.log('📭 No wallet found for this phone');
    return null;
  }
  
  console.log('✅ Found wallet in Supabase:', data.wallet_address);
  return data.wallet_address;
}

function generateClaimToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export async function createPendingClaim(
  phone: string,
  amount: string,
  token: string,
  senderAddress: string
): Promise<string> {
  console.log('💰 createPendingClaim called');
  const phoneHash = hashPhone(phone);
  const claimToken = generateClaimToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  console.log('📝 Inserting into Supabase...');
  const { error } = await supabase
    .from('pending_claims')
    .insert({
      phone_hash: phoneHash,
      amount,
      token,
      sender_address: senderAddress,
      claim_token: claimToken,
      expires_at: expiresAt.toISOString(),
    });
  
  if (error) {
    console.error('❌ Supabase error:', error);
    throw error;
  }
  
  console.log('✅ Pending claim saved to Supabase:', claimToken);
  return claimToken;
}

export async function getPendingClaims(phone: string) {
  const phoneHash = hashPhone(phone);
  
  const { data, error } = await supabase
    .from('pending_claims')
    .select('*')
    .eq('phone_hash', phoneHash)
    .eq('claimed', false)
    .gt('expires_at', new Date().toISOString());
  
  if (error) {
    console.error('Error getting claims:', error);
    return [];
  }
  
  return data || [];
}

export async function claimPendingTransaction(claimToken: string, walletAddress: string) {
  const { data, error } = await supabase
    .from('pending_claims')
    .update({ 
      claimed: true,
    })
    .eq('claim_token', claimToken)
    .eq('claimed', false)
    .select()
    .single();
  
  if (error) {
    console.error('Error claiming:', error);
    throw error;
  }
  
  return data;
}