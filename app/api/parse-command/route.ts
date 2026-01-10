import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json();

    const parsed = parseCommand(command);
    
    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error('Parse error:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}

function parseCommand(command: string) {
  const lower = command.toLowerCase();
  
  if (lower.includes('send') || lower.includes('transfer') || lower.includes('enviar')) {
    const amountMatch = command.match(/(\d+\.?\d*)\s*(usdc|eth|matic|btc|usd)/i);
    const phoneMatch = command.match(/\+[\d\s\-()]+/);
    
    return {
      action: 'send',
      amount: amountMatch ? amountMatch[1] : null,
      token: amountMatch ? amountMatch[2].toUpperCase() : 'USDC',
      recipient: phoneMatch ? phoneMatch[0].trim() : 'Unknown recipient',
      confidence: 0.8,
    };
  }
  
  if (lower.includes('buy') || lower.includes('purchase') || lower.includes('खरीदना') || lower.includes('comprar')) {
    const amountMatch = command.match(/(\d+\.?\d*)\s*(usdc|eth|matic|btc)/i);
    
    return {
      action: 'buy',
      amount: amountMatch ? amountMatch[1] : null,
      token: amountMatch ? amountMatch[2].toUpperCase() : 'ETH',
      confidence: 0.8,
    };
  }
  
  if (lower.includes('balance') || lower.includes('how much') || lower.includes('check')) {
    return {
      action: 'balance',
      confidence: 0.9,
    };
  }
  
  return {
    action: 'unknown',
    original: command,
    confidence: 0.1,
  };
}