'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Wallet, Send, LogOut, User, Bot, Sparkles } from 'lucide-react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

interface Message {
  id: number;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function BalanceCard({ walletAddress }: { walletAddress?: string }) {
  const [balances, setBalances] = useState({ ETH: '0.0000', USDC: '0.00' });
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    if (!walletAddress) return;

    const fetchBalances = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/get-balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress }),
        });
        const data = await res.json();
        if (data.balances) {
          setBalances(data.balances);
        }
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, [walletAddress]);

  const totalUSD = (parseFloat(balances.ETH) * 3400 + parseFloat(balances.USDC)).toFixed(2);

  return (
    <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-4 shadow-lg">
      <div className="text-xs opacity-80 mb-1">Balance (Base)</div>
      {loading ? (
        <div className="text-xl font-bold">Loading...</div>
      ) : (
        <>
          <div className="text-2xl font-bold mb-2">${totalUSD}</div>
          <div className="flex gap-3 text-xs">
            <div>
              <span className="opacity-70">ETH:</span> <span className="font-semibold">{balances.ETH}</span>
            </div>
            <div>
              <span className="opacity-70">USDC:</span> <span className="font-semibold">{balances.USDC}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'assistant',
      content: "Hi! 👋 I'm Lingo, your AI crypto assistant.\n\nI can help you:\n• Send crypto to phone numbers 📱\n• Check your balance 💰\n• Answer questions about crypto 🤔\n\nTry: \"Send 50 USDC to +1-555-1234\" or ask me anything!",
      timestamp: new Date(),
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [language, setLanguage] = useState('en');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { login, logout, authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  const walletAddress = wallets[0]?.address;

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-link phone
  React.useEffect(() => {
    if (authenticated && user?.phone?.number && walletAddress) {
      fetch('/api/link-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: user.phone.number,
          walletAddress: walletAddress,
        }),
      }).then(() => {
        console.log('✅ Phone linked');
      }).catch(console.error);
    }
  }, [authenticated, user, walletAddress]);

  const handleSend = async () => {
    if (!authenticated) {
      const loginMsg: Message = {
        id: Date.now(),
        type: 'assistant',
        content: 'Please login first! Click "Connect Wallet" in the top right corner. 🔐',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, loginMsg]);
      return;
    }

    if (!userInput.trim()) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: userInput,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    
    const currentInput = userInput;
    setUserInput('');
    setIsProcessing(true);

    try {
      // Translate if needed
      let commandInEnglish = currentInput;
      if (language !== 'en') {
        const translateRes = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: currentInput,
            targetLang: 'en',
          }),
        });
        const translateData = await translateRes.json();
        commandInEnglish = translateData.translatedText;
      }

      // Parse command
      const parseRes = await fetch('/api/parse-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: commandInEnglish,
          language: language,
        }),
      });
      const parsed = await parseRes.json();

      let assistantResponse = '';

      // Handle send action
      if (parsed.action === 'send') {
        if (!parsed.recipient) {
          assistantResponse = parsed.response || 'Please provide a phone number or wallet address to send to!';
        } else if (parsed.recipient.includes('+')) {
          // Phone number send
          const phoneRes = await fetch('/api/send-to-phone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: parsed.recipient,
              amount: parsed.amount,
              token: parsed.token,
              senderAddress: walletAddress,
            }),
          });
          const phoneData = await phoneRes.json();

          if (phoneData.hasWallet) {
            assistantResponse = `${parsed.response}\n\n✅ Great news! ${parsed.recipient} already has a Lingo Wallet!\n\n📤 Ready to send:\n• Amount: ${parsed.amount} ${parsed.token}\n• To: ${phoneData.recipientAddress}\n\n💡 Real blockchain transaction coming soon!`;
          } else {
            assistantResponse = `${parsed.response}\n\n📲 ${parsed.recipient} doesn't have a wallet yet, but no problem!\n\n✅ I've created a claim link and sent them an SMS!\n• Amount: ${parsed.amount} ${parsed.token}\n• Claim URL: ${phoneData.claimUrl}\n\nThey'll get a text message with instructions to claim it! 🎉`;
          }
        } else {
          assistantResponse = `${parsed.response}\n\n📤 Direct wallet transfer:\n• Amount: ${parsed.amount} ${parsed.token}\n• To: ${parsed.recipient}\n\n💡 Blockchain transaction coming soon!`;
        }
      } else if (parsed.action === 'buy') {
        assistantResponse = `${parsed.response}\n\n💰 Purchase Details:\n• Amount: ${parsed.amount} ${parsed.token}\n• Wallet: ${walletAddress}\n\n🔜 DEX integration coming soon for best prices!`;
      } else if (parsed.action === 'balance') {
        assistantResponse = `${parsed.response}\n\nCheck the balance card above for your current holdings! 👆`;
      } else if (parsed.action === 'chat') {
        assistantResponse = parsed.response;
      } else {
        assistantResponse = parsed.response || "I didn't quite understand that. Try asking me to send crypto, check your balance, or ask a question!";
      }

      // Add assistant response to chat
      const assistantMessage: Message = {
        id: Date.now() + 1,
        type: 'assistant',
        content: assistantResponse,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('❌ Error:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'Oops! Something went wrong. Please try again. 😅',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Wallet className="w-20 h-20 text-purple-400 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-3">Lingo Wallet</h1>
          <p className="text-lg opacity-80 mb-2">Your AI-powered crypto wallet</p>
          <p className="text-sm opacity-60 mb-8">🤖 Chat with Lingo in any language</p>
          <button
            onClick={login}
            className="bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105"
          >
            Connect Wallet
          </button>
          <div className="mt-6 text-sm opacity-60">
            Login with email, phone, or social accounts
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-white border-opacity-10 bg-black bg-opacity-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-7 h-7 text-purple-400" />
            <div>
              <h1 className="text-xl font-bold">Lingo Wallet</h1>
              <p className="text-xs opacity-60">🤖 AI Assistant</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg px-3 py-1.5 text-sm"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code} className="bg-gray-900">
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>

            {/* User Info */}
            <div className="text-xs text-right hidden sm:block">
              <div className="opacity-60">{user?.email?.address || user?.phone?.number || 'User'}</div>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              className="bg-white bg-opacity-10 hover:bg-opacity-20 p-2 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Balance & Info */}
        <div className="hidden md:block w-80 border-r border-white border-opacity-10 bg-black bg-opacity-20 p-4 overflow-y-auto">
          <BalanceCard walletAddress={walletAddress} />
          
          {walletAddress && (
            <div className="mt-4 bg-white bg-opacity-5 rounded-lg p-3">
              <div className="text-xs opacity-60 mb-1">Your Wallet</div>
              <div className="font-mono text-xs break-all opacity-80">{walletAddress}</div>
            </div>
          )}

          <div className="mt-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg p-4 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <div className="text-sm font-semibold">Quick Tips</div>
            </div>
            <div className="text-xs opacity-70 space-y-2">
              <div>💬 Chat naturally with Lingo</div>
              <div>📱 Send to phone numbers</div>
              <div>🌍 Switch languages anytime</div>
              <div>❓ Ask me anything!</div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.type === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.type === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white bg-opacity-10 backdrop-blur-sm'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap break-words">{msg.content}</div>
                    <div className="text-xs opacity-50 mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {msg.type === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </div>
              ))}
              
              {isProcessing && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-white border-opacity-10 bg-black bg-opacity-20 p-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isProcessing && handleSend()}
                  placeholder={
                    language === 'en' ? 'Message Lingo...' :
                    language === 'hi' ? 'Lingo को संदेश दें...' :
                    language === 'es' ? 'Mensaje a Lingo...' :
                    'Message à Lingo...'
                  }
                  disabled={isProcessing}
                  className="flex-1 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl px-4 py-3 text-white placeholder-white placeholder-opacity-40 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={isProcessing || !userInput.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-50 p-3 rounded-xl transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}