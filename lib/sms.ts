import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

export async function sendClaimSMS(
  toPhone: string,
  amount: string,
  token: string,
  claimUrl: string
) {
  try {
    console.log('📱 Sending SMS to:', toPhone);

    const message = await client.messages.create({
      body: `🎉 You received ${amount} ${token}!\n\nClaim it here:\n${claimUrl}\n\nDownload Lingo Wallet to get started!`,
      from: twilioPhone,
      to: toPhone,
    });

    console.log('✅ SMS sent! Message SID:', message.sid);
    return { success: true, messageSid: message.sid };

  } catch (error: any) {
    console.error('❌ SMS error:', error);
    return { success: false, error: error.message };
  }
}