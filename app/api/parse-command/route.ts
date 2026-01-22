import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { command, language } = await request.json();
    const parsed = parseCommandWithElizaPersonality(command, language);
    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error('Parse error:', error);
    return NextResponse.json({ 
      action: 'chat',
      response: 'Sorry, I had trouble understanding that. Try asking me to send crypto or check your balance!',
      confidence: 0.1,
    });
  }
}

function parseCommandWithElizaPersonality(command: string, language?: string) {
  const lower = command.toLowerCase();
  
  // GREETINGS
  if (lower.match(/^(hello|hi|hey|hola|bonjour|नमस्ते|namaste)\b/)) {
    return {
      action: 'chat',
      response: `Hello! 👋 I'm Lingo, your friendly crypto wallet assistant!

I can help you:
- Send crypto to phone numbers or wallet addresses
- Check your balance
- Answer questions about crypto

What would you like to do today? 😊`,
      confidence: 0.95,
    };
  }
  
  // HELP / HOW QUESTIONS
  if (lower.includes('how') || lower.includes('what') || lower.includes('explain') || 
      lower.includes('कैसे') || lower.includes('क्या') || lower.includes('cómo') || 
      lower.includes('qué') || lower.includes('comment') || lower.includes('quoi')) {
    
    // How does this work / how to use
    if (lower.includes('work') || lower.includes('use') || lower.includes('start') ||
        lower.includes('काम') || lower.includes('funciona') || lower.includes('fonctionne')) {
      return {
        action: 'chat',
        response: `Great question! Here's how Lingo Wallet works: 🌍

📱 **Send to Phone Numbers:**
   You can send crypto to anyone using just their phone number!
   - If they have a wallet: instant transfer
   - If they don't: they get an SMS to claim it

💰 **Check Balance:**
   See your ETH and USDC on Base chain

🗣️ **Multi-Language:**
   Talk to me in English, Hindi, Spanish, or French!

Try: "Send 50 USDC to +1-555-1234" or "Check my balance" 🚀`,
        confidence: 0.95,
      };
    }
    
    // Phone number feature
    if (lower.includes('phone') || lower.includes('फोन') || lower.includes('teléfono') || lower.includes('téléphone') || lower.includes('number')) {
      return {
        action: 'chat',
        response: `The phone number feature is my favorite! 📱✨

Here's how it works:
1️⃣ You say: "Send 50 USDC to +1-555-1234"
2️⃣ I check if they have Lingo Wallet
3️⃣ If YES: Send directly to their wallet
4️⃣ If NO: Create a claim link & send SMS
5️⃣ They click, create wallet, claim crypto!

It's crypto made as easy as texting! 🎉

Try it now with a friend's number!`,
        confidence: 0.95,
      };
    }

    // What can you do
    if (lower.includes('can you') || lower.includes('what do') || lower.includes('features') || lower.includes('capabilities')) {
      return {
        action: 'chat',
        response: `I can do lots of things! Here's what I'm best at: 🤖

✅ **Send Crypto to Phone Numbers**
   "Send 50 USDC to +1-555-1234"

✅ **Send to Wallet Addresses**
   "Send 0.01 ETH to 0x..."

✅ **Check Your Balance**
   "What's my balance?" or "Check balance"

✅ **Multi-Language Support**
   Talk to me in Hindi, Spanish, French, or English!

✅ **Answer Questions**
   Ask me anything about crypto or how to use me!

🔜 Coming Soon:
   • Buy crypto
   • Swap tokens
   • Multi-chain support

What would you like to try first? 😊`,
        confidence: 0.95,
      };
    }
  }
  
  // SEND command - check this BEFORE other patterns
  if (lower.includes('send') || lower.includes('transfer') || lower.includes('भेज') || 
      lower.includes('enviar') || lower.includes('envoyer')) {
    
    // Match amount and token - flexible regex that handles spaces
    // Matches: "0.0001 eth", "0.0001eth", "50 usdc", etc.
    const amountMatch = command.match(/(\d+\.?\d*)\s*(usdc|eth|matic|btc|usd)/i);
    
    // Also try matching amount alone if token comes later
    const amountOnlyMatch = command.match(/(\d+\.?\d*)/);
    
    // Detect token from command
    const tokenMatch = lower.match(/\b(usdc|eth|matic|btc)\b/);
    
    // Match phone number OR wallet address
    const phoneMatch = command.match(/\+[\d\s\-()]+/);
    const walletMatch = command.match(/0x[a-fA-F0-9]{40}/);
    
    // Get amount - prefer full match, fallback to amount only
    const amount = amountMatch ? amountMatch[1] : (amountOnlyMatch ? amountOnlyMatch[1] : null);
    
    // Get token - prefer from amount match, then from separate token match, default to ETH
    const token = amountMatch ? amountMatch[2].toUpperCase() : 
                  (tokenMatch ? tokenMatch[1].toUpperCase() : 'ETH');
    
    // Prefer wallet address if found, otherwise phone
    const recipient = walletMatch ? walletMatch[0] : (phoneMatch ? phoneMatch[0].trim() : null);
    
    console.log('Parse result:', { amount, token, recipient, command });
    
    return {
      action: 'send',
      amount,
      token,
      recipient,
      response: recipient 
        ? `I'll help you send ${amount} ${token} to ${recipient.startsWith('0x') ? recipient.slice(0, 10) + '...' : recipient}! 🚀`
        : `I'd love to help you send ${amount || 'some'} ${token}! Just tell me the phone number or wallet address. 😊`,
      confidence: recipient && amount ? 0.9 : 0.6,
    };
  }

  // Handle standalone wallet address (user might send address after being asked)
  const standaloneWallet = command.match(/^(0x[a-fA-F0-9]{40})$/);
  if (standaloneWallet) {
    return {
      action: 'send',
      amount: null,
      token: 'ETH',
      recipient: standaloneWallet[1],
      response: `Got the address! How much would you like to send to ${standaloneWallet[1].slice(0, 10)}...? 💸`,
      confidence: 0.7,
    };
  }
  
  // BUY command
  if (lower.includes('buy') || lower.includes('purchase') || lower.includes('खरीद') || 
      lower.includes('comprar') || lower.includes('acheter')) {
    const amountMatch = command.match(/(\d+\.?\d*)\s*(usdc|eth|matic|btc)/i);
    
    const amount = amountMatch ? amountMatch[1] : null;
    const token = amountMatch ? amountMatch[2].toUpperCase() : 'ETH';
    
    return {
      action: 'buy',
      amount,
      token,
      response: amount
        ? `Great choice! I'll help you buy ${amount} ${token}. 💰 (DEX integration coming soon!)`
        : `I can help you buy crypto! How much ${token} would you like? 🚀`,
      confidence: amount ? 0.9 : 0.7,
    };
  }
  
  // BALANCE command
  if (lower.includes('balance') || lower.includes('बैलेंस') || lower.includes('saldo') || 
      lower.includes('solde') || lower.includes('how much') || lower.includes('check')) {
    return {
      action: 'balance',
      response: "Let me check your wallet balance for you! 💼 Look at the balance card above ✨",
      confidence: 0.95,
    };
  }
  
  // THANKS
  if (lower.includes('thank') || lower.includes('thanks') || lower.includes('धन्यवाद') || 
      lower.includes('gracias') || lower.includes('merci')) {
    return {
      action: 'chat',
      response: `You're very welcome! 😊 I'm always here to help you with your crypto needs! 💰

Need anything else?`,
      confidence: 0.95,
    };
  }

  // WHO ARE YOU / ABOUT
  if (lower.includes('who are you') || lower.includes('what are you') || lower.includes('about')) {
    return {
      action: 'chat',
      response: `Hi! I'm Lingo 🤖, your AI crypto wallet assistant!

I was created to make crypto accessible to everyone, in every language. 🌍

My superpowers:
✨ Send crypto using phone numbers or wallet addresses
✨ Understand multiple languages
✨ Help beginners get started with crypto
✨ Make crypto as easy as texting!

Ask me anything or try sending some crypto! 💰`,
      confidence: 0.95,
    };
  }
  
  // DEFAULT - General chat or didn't understand
  return {
    action: 'chat',
    response: `I'm here to help! 🤖 I understand:

💸 **Send crypto:**
   "Send 50 USDC to +1-555-1234"
   "Send 0.01 ETH to 0x..."

💰 **Check balance:**
   "What's my balance?"

❓ **Ask questions:**
   "How does this work?"
   "What can you do?"

Try any of these, in any language! 🌍`,
    confidence: 0.5,
  };
}