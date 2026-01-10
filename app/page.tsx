'use client';
import React, { useState } from 'react';
import { Wallet, Globe, Send, LogOut, CheckCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

interface Transaction {
  id: number;
  type: 'send' | 'buy' | 'balance' | 'chat';
  action: string;
  amount?: string;
  token?: string;
  recipient?: string;
  timestamp: string;
  status: 'success' | 'pending';
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
    <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-8 mb-8 shadow-2xl">
      <div className="text-sm opacity-80 mb-2">Total Balance (Base Chain)</div>
      {loading ? (
        <div className="text-3xl font-bold mb-4">Loading...</div>
      ) : (
        <>
          <div className="text-5xl font-bold mb-4">${totalUSD}</div>
          <div className="flex gap-6">
            <div>
              <div className="text-xs opacity-70">ETH</div>
              <div className="font-semibold">{balances.ETH} ETH</div>
            </div>
            <div>
              <div className="text-xs opacity-70">USDC</div>
              <div className="font-semibold">{balances.USDC} USDC</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function Home() {
  const [userInput, setUserInput] = useState('');
  const [language, setLanguage] = useState('en');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { login, logout, authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  const walletAddress = wallets[0]?.address;

  // Auto-link user's phone number to their wallet
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
        console.log('✅ Phone linked to wallet');
      }).catch(err => {
        console.error('Failed to link phone:', err);
      });
    }
  }, [authenticated, user, walletAddress]);

  const handleCommand = async () => {
    if (!authenticated) {
      alert('Please login first!');
      return;
    }

    if (!userInput.trim()) return;

    setIsProcessing(true);

    try {
      // Step 1: Translate to English if needed
      let commandInEnglish = userInput;
      if (language !== 'en') {
        console.log('🌍 Translating from', language, 'to English...');
        const translateRes = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: userInput,
            targetLang: 'en',
          }),
        });
        const translateData = await translateRes.json();
        commandInEnglish = translateData.translatedText;
        console.log('✅ Translated:', commandInEnglish);
      }

      // Step 2: Parse with Eliza personality
      console.log('🤖 Lingo parsing command...');
      const parseRes = await fetch('/api/parse-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: commandInEnglish,
          language: language,
        }),
      });
      const parsed = await parseRes.json();
      console.log('✅ Parsed:', parsed);

      // Step 3: Show Lingo's friendly response
      if (parsed.response) {
        console.log('💬 Lingo says:', parsed.response);
      }

      // Step 4: Handle different actions
      if (parsed.action === 'send') {
        if (!parsed.recipient) {
          alert(parsed.response || 'Please provide a phone number or wallet address to send to!');
          setIsProcessing(false);
          return;
        }

        // Check if sending to phone number
        if (parsed.recipient.includes('+')) {
          console.log('📱 Sending to phone number...');
          
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
          console.log('📱 Phone send result:', phoneData);

          if (phoneData.hasWallet) {
            alert(`✅ ${parsed.response}\n\n${parsed.recipient} has a Lingo Wallet!\n\nReady to send:\n${parsed.amount} ${parsed.token}\n\nTo: ${phoneData.recipientAddress}\n\n(Real transaction coming next!)`);
          } else {
            alert(`📲 ${parsed.response}\n\n${parsed.recipient} doesn't have a wallet yet.\n\nWe've sent them an SMS with a claim link for:\n${parsed.amount} ${parsed.token}\n\nClaim URL: ${phoneData.claimUrl}`);
          }
        } else {
          alert(`📤 ${parsed.response}\n\nAmount: ${parsed.amount} ${parsed.token}\nTo: ${parsed.recipient}\n\n(Direct wallet transfer!)`);
        }
      } else if (parsed.action === 'buy') {
        alert(`💰 ${parsed.response}\n\nAmount: ${parsed.amount} ${parsed.token}\nWallet: ${walletAddress}\n\n🤖 Powered by Lingo AI\n(DEX integration coming soon!)`);
      } else if (parsed.action === 'swap') {
        alert(`🔄 ${parsed.response}\n\nSwap: ${parsed.amount} ${parsed.fromToken || 'USDC'}\nFor: ${parsed.toToken || 'ETH'}\n\n🤖 Powered by Lingo AI\n(Coming soon!)`);
      } else if (parsed.action === 'balance') {
        alert(`💼 ${parsed.response}`);
      } else if (parsed.action === 'chat') {
        alert(`💬 Lingo says:\n\n${parsed.response}`);
      } else {
        alert(`🤔 ${parsed.response || "I didn't understand that."}\n\nTry:\n- "Send 50 USDC to +1-555-1234"\n- "Buy 0.1 ETH"\n- "Check my balance"\n- Ask me anything!`);
      }

      // Add to transaction history
      const newTransaction: Transaction = {
        id: Date.now(),
        type: parsed.action === 'chat' ? 'chat' : parsed.action,
        action: userInput,
        amount: parsed.amount,
        token: parsed.token,
        recipient: parsed.recipient,
        timestamp: new Date().toLocaleTimeString(),
        status: 'success',
      };

      setTransactions([newTransaction, ...transactions]);
      setUserInput('');

    } catch (error) {
      console.error('❌ Error:', error);
      alert('Oops! Something went wrong. Check the console.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Wallet className="w-24 h-24 text-purple-400 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">Lingo Wallet</h1>
          <p className="text-xl opacity-80 mb-2">Your crypto wallet in any language</p>
          <p className="text-sm opacity-60 mb-8">🤖 Powered by Lingo AI</p>
          <button
            onClick={login}
            className="bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105"
          >
            Connect Wallet
          </button>
          <div className="mt-8 text-sm opacity-60">
            Login with email, phone, or social accounts
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Wallet className="w-10 h-10 text-purple-400" />
            <div>
              <h1 className="text-3xl font-bold">Lingo Wallet 🚀</h1>
              <div className="text-xs opacity-60">🤖 Powered by Lingo AI</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-right">
              <div className="opacity-60">Logged in as</div>
              <div className="font-mono text-xs">{user?.email?.address || user?.phone?.number || 'User'}</div>
            </div>
            <button
              onClick={logout}
              className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 hover:bg-opacity-20 p-2 rounded-lg transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Wallet Address */}
        {walletAddress && (
          <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-lg rounded-xl p-4 mb-6 border border-white border-opacity-20">
            <div className="text-xs opacity-60 mb-1">Your Wallet Address</div>
            <div className="font-mono text-sm break-all">{walletAddress}</div>
          </div>
        )}

        {/* Balance Card */}
        <BalanceCard walletAddress={walletAddress} />

        {/* Command Center */}
        <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white border-opacity-20">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-purple-400" />
            <h2 className="font-semibold">Talk to Lingo 🤖</h2>
          </div>

          <div className="mb-4">
            <label className="text-xs opacity-60 mb-2 block">Select Language</label>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white border-opacity-30 rounded-lg px-4 py-2 text-sm w-full text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code} className="bg-gray-900">
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isProcessing && handleCommand()}
              placeholder={
                language === 'en' ? 'Ask me anything or "Send 50 USDC to +1-555-1234"' :
                language === 'hi' ? 'मुझसे कुछ भी पूछें या "50 USDC भेजें"' :
                language === 'es' ? 'Pregúntame algo o "Enviar 50 USDC"' :
                'Demandez-moi quelque chose...'
              }
              disabled={isProcessing}
              className="flex-1 bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white border-opacity-30 rounded-lg px-4 py-3 text-white placeholder-white placeholder-opacity-60 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-opacity-30"
            />
            <button
              onClick={handleCommand}
              disabled={isProcessing}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all"
            >
              {isProcessing ? '...' : <><Send className="w-5 h-5" /> Send</>}
            </button>
          </div>

          <div className="mt-3 text-xs opacity-60">
            💬 Try: "Send crypto" • "What's my balance?" • "How does this work?"
          </div>
        </div>

        {/* Transaction History */}
        {transactions.length > 0 && (
          <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-lg rounded-2xl p-6 border border-white border-opacity-20">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Recent Activity
            </h2>
            <div className="space-y-3">
              {transactions.slice(0, 5).map((tx) => (
                <div
                  key={tx.id}
                  className="bg-white bg-opacity-10 rounded-lg p-4 border border-white border-opacity-20 hover:bg-opacity-15 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === 'send' ? 'bg-blue-500 bg-opacity-20' :
                        tx.type === 'buy' ? 'bg-green-500 bg-opacity-20' :
                        tx.type === 'chat' ? 'bg-purple-500 bg-opacity-20' :
                        'bg-purple-500 bg-opacity-20'
                      }`}>
                        {tx.type === 'send' ? <ArrowUpRight className="w-5 h-5 text-blue-400" /> :
                         tx.type === 'buy' ? <ArrowDownLeft className="w-5 h-5 text-green-400" /> :
                         <Wallet className="w-5 h-5 text-purple-400" />}
                      </div>
                      <div>
                        <div className="font-semibold capitalize">{tx.type}</div>
                        <div className="text-sm opacity-60">{tx.timestamp}</div>
                      </div>
                    </div>
                    <div className="text-xs bg-green-500 bg-opacity-20 text-green-300 px-3 py-1 rounded-full">
                      ✓ Done
                    </div>
                  </div>
                  <div className="text-sm opacity-80 bg-black bg-opacity-20 rounded p-2 mb-2">
                    "{tx.action}"
                  </div>
                  {tx.amount && (
                    <div className="text-sm">
                      <span className="opacity-60">Amount:</span> <span className="font-semibold">{tx.amount} {tx.token}</span>
                    </div>
                  )}
                  {tx.recipient && (
                    <div className="text-sm">
                      <span className="opacity-60">To:</span> <span className="font-mono text-xs">{tx.recipient}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {transactions.length === 0 && (
          <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl p-8 text-center border-2 border-dashed border-purple-400 border-opacity-30">
            <Globe className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
            <div className="text-lg font-semibold mb-2">Start chatting with Lingo! 🤖</div>
            <div className="text-sm opacity-60">
              Send crypto, check balance, or ask me anything in your language!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}