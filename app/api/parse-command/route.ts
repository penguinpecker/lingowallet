// app/api/parse-command/route.ts
// Parse natural language commands for send, swap, balance, etc.

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { command, language } = await req.json();

    if (!command) {
      return NextResponse.json({ 
        action: 'chat', 
        response: 'Please type a command or question!' 
      });
    }

    const lowerCommand = command.toLowerCase();

    // ========== SWAP DETECTION ==========
    // Patterns: "swap X ETH to USDC", "exchange 0.1 ETH for USDC", "convert ETH to USDC"
    const swapPatterns = [
      /swap\s+(\d+\.?\d*)\s*(\w+)\s+(?:to|for|into)\s+(\w+)/i,
      /exchange\s+(\d+\.?\d*)\s*(\w+)\s+(?:to|for|into)\s+(\w+)/i,
      /convert\s+(\d+\.?\d*)\s*(\w+)\s+(?:to|for|into)\s+(\w+)/i,
      /trade\s+(\d+\.?\d*)\s*(\w+)\s+(?:to|for|into)\s+(\w+)/i,
      /(\d+\.?\d*)\s*(\w+)\s+(?:to|for|into)\s+(\w+)/i,
    ];

    for (const pattern of swapPatterns) {
      const match = lowerCommand.match(pattern);
      if (match) {
        const amount = match[1];
        const fromToken = match[2].toUpperCase();
        const toToken = match[3].toUpperCase();

        // Validate tokens
        const validTokens = ['ETH', 'USDC', 'USDT', 'DAI', 'WETH'];
        if (validTokens.includes(fromToken) && validTokens.includes(toToken)) {
          return NextResponse.json({
            action: 'swap',
            fromToken,
            toToken,
            amount,
            response: `Preparing to swap ${amount} ${fromToken} to ${toToken}...`,
          });
        }
      }
    }

    // Check for swap intent without amount
    if (lowerCommand.includes('swap') || lowerCommand.includes('exchange') || lowerCommand.includes('convert')) {
      // Try to extract tokens
      const tokenMatch = lowerCommand.match(/(\w+)\s+(?:to|for|into)\s+(\w+)/i);
      if (tokenMatch) {
        const fromToken = tokenMatch[1].toUpperCase();
        const toToken = tokenMatch[2].toUpperCase();
        const validTokens = ['ETH', 'USDC', 'USDT', 'DAI', 'WETH'];
        
        if (validTokens.includes(fromToken) && validTokens.includes(toToken)) {
          return NextResponse.json({
            action: 'swap',
            fromToken,
            toToken,
            amount: null,
            response: `How much ${fromToken} would you like to swap to ${toToken}?`,
          });
        }
      }

      return NextResponse.json({
        action: 'chat',
        response: `🔄 To swap tokens, try:\n\n• "Swap 0.01 ETH to USDC"\n• "Exchange 100 USDC for ETH"\n\nSupported tokens: ETH, USDC, USDT, DAI, WETH`,
      });
    }

    // ========== SEND DETECTION ==========
    // Patterns for sending crypto
    const sendPatterns = [
      /send\s+(\d+\.?\d*)\s*(\w+)\s+to\s+(\+[\d\-\s]+|0x[a-fA-F0-9]{40})/i,
      /transfer\s+(\d+\.?\d*)\s*(\w+)\s+to\s+(\+[\d\-\s]+|0x[a-fA-F0-9]{40})/i,
      /pay\s+(\d+\.?\d*)\s*(\w+)\s+to\s+(\+[\d\-\s]+|0x[a-fA-F0-9]{40})/i,
    ];

    for (const pattern of sendPatterns) {
      const match = command.match(pattern);
      if (match) {
        const amount = match[1];
        const token = match[2].toUpperCase();
        const recipient = match[3].replace(/[\s\-]/g, '');

        return NextResponse.json({
          action: 'send',
          amount,
          token,
          recipient,
          response: `Preparing to send ${amount} ${token}...`,
        });
      }
    }

    // Check for send intent without full details
    if (lowerCommand.includes('send') || lowerCommand.includes('transfer') || lowerCommand.includes('pay')) {
      // Try to extract what we can
      const amountMatch = lowerCommand.match(/(\d+\.?\d*)\s*(eth|usdc|usdt|dai)/i);
      const addressMatch = command.match(/(0x[a-fA-F0-9]{40})/);
      const phoneMatch = command.match(/(\+[\d\-\s]{10,})/);

      const amount = amountMatch?.[1] || null;
      const token = amountMatch?.[2]?.toUpperCase() || 'ETH';
      const recipient = addressMatch?.[1] || phoneMatch?.[1]?.replace(/[\s\-]/g, '') || null;

      if (recipient) {
        return NextResponse.json({
          action: 'send',
          amount,
          token,
          recipient,
          response: amount 
            ? `Preparing to send ${amount} ${token}...`
            : `How much ${token} would you like to send?`,
        });
      }

      return NextResponse.json({
        action: 'send',
        amount,
        token,
        recipient: null,
        response: '📤 To send crypto, include a wallet address (0x...) or phone number (+1...).\n\nExample: "Send 10 USDC to +1234567890"',
      });
    }

    // ========== BALANCE CHECK ==========
    if (lowerCommand.includes('balance') || lowerCommand.includes('how much') || lowerCommand.includes('what do i have')) {
      return NextResponse.json({
        action: 'balance',
        response: '💰 Your balance is shown above! I display your ETH and USDC balances on Base chain.',
      });
    }

    // ========== BUY DETECTION ==========
    if (lowerCommand.includes('buy')) {
      const buyMatch = lowerCommand.match(/buy\s+(\d+\.?\d*)?\s*(eth|usdc|usdt|bitcoin|btc)?/i);
      const amount = buyMatch?.[1] || '0.01';
      const token = buyMatch?.[2]?.toUpperCase() || 'ETH';

      return NextResponse.json({
        action: 'buy',
        amount,
        token,
        response: `💡 To buy ${token}, use the swap feature!\n\nTry: "Swap USDC to ${token}"`,
      });
    }

    // ========== HELP ==========
    if (lowerCommand.includes('help') || lowerCommand.includes('what can you do')) {
      return NextResponse.json({
        action: 'chat',
        response: `🤖 I'm Lingo! Here's what I can do:\n\n📤 **Send crypto:**\n"Send 10 USDC to +1234567890"\n"Send 0.01 ETH to 0x..."\n\n🔄 **Swap tokens:**\n"Swap 0.1 ETH to USDC"\n"Exchange 50 USDC for ETH"\n\n💰 **Check balance:**\n"What's my balance?"\n\nSupported tokens: ETH, USDC, USDT, DAI, WETH`,
      });
    }

    // ========== GREETINGS ==========
    if (lowerCommand.match(/^(hi|hello|hey|hola|bonjour|namaste)/i)) {
      return NextResponse.json({
        action: 'chat',
        response: `Hey there! 👋 I'm Lingo, your crypto assistant.\n\nTry:\n• "Swap 0.01 ETH to USDC"\n• "Send 10 USDC to +1234567890"\n• "What's my balance?"`,
      });
    }

    // ========== DEFAULT CHAT ==========
    return NextResponse.json({
      action: 'chat',
      response: `I'm not sure what you mean. Try:\n\n🔄 "Swap 0.1 ETH to USDC"\n📤 "Send 10 USDC to +1234567890"\n💰 "What's my balance?"\n\nOr type "help" for more options!`,
    });

  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json({
      action: 'chat',
      response: 'Sorry, I had trouble understanding that. Please try again!',
    });
  }
}