'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Wallet, Globe, Send, LogOut, Bot, User } from 'lucide-react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

interface Message {
  id: number;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Translations {
  totalBalance: string;
  yourWallet: string;
  chatWith: string;
  typeMessage: string;
  changeLanguage: string;
  loading: string;
}

const translations: Record<string, Translations> = {
  en: {
    totalBalance: 'Total Balance (Base Chain)',
    yourWallet: 'Your Wallet Address',
    chatWith: 'Chat with Lingo 🤖',
    typeMessage: 'Type your message...',
    changeLanguage: 'Change Language',
    loading: 'Loading...',
  },
  hi: {
    totalBalance: 'कुल बैलेंस (बेस चेन)',
    yourWallet: 'आपका वॉलेट एड्रेस',
    chatWith: 'Lingo से चैट करें 🤖',
    typeMessage: 'अपना संदेश टाइप करें...',
    changeLanguage: 'भाषा बदलें',
    loading: 'लोड हो रहा है...',
  },
  es: {
    totalBalance: 'Balance Total (Base Chain)',
    yourWallet: 'Tu Dirección de Billetera',
    chatWith: 'Chatea con Lingo 🤖',
    typeMessage: 'Escribe tu mensaje...',
    changeLanguage: 'Cambiar Idioma',
    loading: 'Cargando...',
  },
  fr: {
    totalBalance: 'Solde Total (Base Chain)',
    yourWallet: 'Votre Adresse de Portefeuille',
    chatWith: 'Discutez avec Lingo 🤖',
    typeMessage: 'Tapez votre message...',
    changeLanguage: 'Changer de Langue',
    loading: 'Chargement...',
  },
  pt: {
    totalBalance: 'Saldo Total (Base Chain)',
    yourWallet: 'Seu Endereço de Carteira',
    chatWith: 'Converse com Lingo 🤖',
    typeMessage: 'Digite sua mensagem...',
    changeLanguage: 'Mudar Idioma',
    loading: 'Carregando...',
  },
  de: {
    totalBalance: 'Gesamtguthaben (Base Chain)',
    yourWallet: 'Ihre Wallet-Adresse',
    chatWith: 'Chat mit Lingo 🤖',
    typeMessage: 'Nachricht eingeben...',
    changeLanguage: 'Sprache ändern',
    loading: 'Laden...',
  },
  ja: {
    totalBalance: '総残高 (Base Chain)',
    yourWallet: 'あなたのウォレットアドレス',
    chatWith: 'Lingoとチャット 🤖',
    typeMessage: 'メッセージを入力...',
    changeLanguage: '言語を変更',
    loading: '読み込み中...',
  },
  zh: {
    totalBalance: '总余额 (Base Chain)',
    yourWallet: '您的钱包地址',
    chatWith: '与Lingo聊天 🤖',
    typeMessage: '输入消息...',
    changeLanguage: '更改语言',
    loading: '加载中...',
  },
};

function BalanceCard({ walletAddress, language }: { walletAddress?: string; language: string }) {
  const [balances, setBalances] = useState({ ETH: '0.0000', USDC: '0.00' });
  const [loading, setLoading] = useState(true);
  const t = translations[language] || translations.en;

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
    <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-8 mb-6 shadow-2xl">
      <div className="text-sm opacity-80 mb-2">{t.totalBalance}</div>
      {loading ? (
        <div className="text-3xl font-bold mb-4">{t.loading}</div>
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
  const [language, setLanguage] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { login, logout, authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  ];

  const walletAddress = wallets[0]?.address;
  const t = language ? (translations[language] || translations.en) : translations.en;

  // Translate text to selected language
  const translateToUserLanguage = async (text: string): Promise<string> => {
    if (!language || language === 'en') return text;

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          targetLang: language,
        }),
      });
      const data = await res.json();
      return data.translatedText || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  };

  // Add welcome message when language is selected
  const initializeChat = async (selectedLang: string) => {
    setLanguage(selectedLang);
    
    const welcomeText = "Hi! 👋 I'm Lingo, your AI crypto assistant.\n\nI can help you:\n• Send crypto to phone numbers 📱\n• Check your balance 💰\n• Answer questions 🤔\n\nTry: \"Send 50 USDC to +1-555-1234\" or ask me anything!";
    
    // Translate welcome message
    let translatedWelcome = welcomeText;
    if (selectedLang !== 'en') {
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: welcomeText,
            targetLang: selectedLang,
          }),
        });
        const data = await res.json();
        translatedWelcome = data.translatedText || welcomeText;
      } catch (error) {
        console.error('Translation error:', error);
      }
    }

    const welcomeMessage: Message = {
      id: 1,
      type: 'assistant',
      content: translatedWelcome,
      timestamp: new Date(),
    };
    
    setMessages([welcomeMessage]);
  };

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
      }).catch(console.error);
    }
  }, [authenticated, user, walletAddress]);

  const handleSend = async () => {
    if (!authenticated) {
      const loginText = 'Please login first! Click "Connect Wallet" to get started. 🔐';
      const translatedLogin = await translateToUserLanguage(loginText);
      
      const loginMsg: Message = {
        id: Date.now(),
        type: 'assistant',
        content: translatedLogin,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, loginMsg]);
      return;
    }

    if (!userInput.trim()) return;

    // Add user message
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
      // Translate user input to English for processing
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

      // Handle actions
      if (parsed.action === 'send') {
        if (!parsed.recipient) {
          assistantResponse = parsed.response || 'Please provide a phone number or wallet address!';
        } else if (parsed.recipient.includes('+')) {
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
            assistantResponse = `${parsed.response}\n\n✅ ${parsed.recipient} has a Lingo Wallet!\n\n📤 Ready to send:\n• ${parsed.amount} ${parsed.token}\n• To: ${phoneData.recipientAddress}\n\n💡 Real transaction coming soon!`;
          } else {
            assistantResponse = `${parsed.response}\n\n📲 They don't have a wallet yet, but I've sent them an SMS!\n\n✅ Claim created:\n• ${parsed.amount} ${parsed.token}\n• Link: ${phoneData.claimUrl}\n\nThey'll get a text to claim it! 🎉`;
          }
        } else {
          assistantResponse = `${parsed.response}\n\n📤 Direct transfer:\n• ${parsed.amount} ${parsed.token}\n• To: ${parsed.recipient}`;
        }
      } else if (parsed.action === 'buy') {
        assistantResponse = `${parsed.response}\n\n💰 Purchase:\n• ${parsed.amount} ${parsed.token}\n\n🔜 DEX integration coming!`;
      } else if (parsed.action === 'balance') {
        assistantResponse = `${parsed.response}`;
      } else if (parsed.action === 'chat') {
        assistantResponse = parsed.response;
      } else {
        assistantResponse = parsed.response || "I didn't understand that. Try asking me something!";
      }

      // Translate response back to user's language
      const translatedResponse = await translateToUserLanguage(assistantResponse);

      // Add assistant response
      const assistantMessage: Message = {
        id: Date.now() + 1,
        type: 'assistant',
        content: translatedResponse,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error:', error);
      const errorText = 'Oops! Something went wrong. Please try again. 😅';
      const translatedError = await translateToUserLanguage(errorText);
      
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: 'assistant',
        content: translatedError,
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
        <div className="text-center max-w-2xl">
          <Wallet className="w-24 h-24 text-purple-400 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">Lingo Wallet</h1>
          <p className="text-xl opacity-80 mb-2">Your AI-powered crypto wallet</p>
          <p className="text-sm opacity-60 mb-8">🤖 Chat with Lingo in any language</p>
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

  // Language selection screen
  if (!language) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <Globe className="w-20 h-20 text-purple-400 mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-3">Choose Your Language</h1>
            <p className="text-lg opacity-80">Select your preferred language to continue</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => initializeChat(lang.code)}
                className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 border border-purple-400/30 hover:border-purple-400/50 rounded-2xl p-6 transition-all transform hover:scale-105"
              >
                <div className="text-5xl mb-3">{lang.flag}</div>
                <div className="text-xl font-bold mb-1">{lang.nativeName}</div>
                <div className="text-sm opacity-60">{lang.name}</div>
              </button>
            ))}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={logout}
              className="text-sm opacity-60 hover:opacity-100 transition-opacity"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main chat interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-4 flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Wallet className="w-10 h-10 text-purple-400" />
            <div>
              <h1 className="text-3xl font-bold">Lingo Wallet 🚀</h1>
              <div className="text-xs opacity-60">
                🤖 {languages.find(l => l.code === language)?.nativeName}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLanguage(null)}
              className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 border border-purple-400/30 px-4 py-2 rounded-lg text-sm transition-all"
            >
              <Globe className="w-4 h-4 inline mr-2" />
              {t.changeLanguage}
            </button>
            <button
              onClick={logout}
              className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 p-2 rounded-lg transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Wallet Address */}
        {walletAddress && (
          <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-lg rounded-xl p-4 mb-6 border border-purple-400/20">
            <div className="text-xs opacity-60 mb-1">{t.yourWallet}</div>
            <div className="font-mono text-sm break-all">{walletAddress}</div>
          </div>
        )}

        {/* Balance Card */}
        <BalanceCard walletAddress={walletAddress} language={language} />

        {/* Chat Messages - Scrollable */}
        <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-lg rounded-2xl border border-purple-400/20 flex-1 flex flex-col overflow-hidden mb-6">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-purple-400/20">
            <Bot className="w-5 h-5 text-purple-400" />
            <h2 className="font-semibold">{t.chatWith}</h2>
          </div>

          {/* Messages Area - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.type === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-5 h-5" />
                  </div>
                )}
                
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    msg.type === 'user'
                      ? 'bg-purple-600/80'
                      : 'bg-purple-900/40 border border-purple-400/20'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                  <div className="text-xs opacity-50 mt-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {msg.type === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}
            
            {isProcessing && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-purple-900/40 border border-purple-400/20 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="px-6 py-4 border-t border-purple-400/20">
            <div className="flex gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isProcessing && handleSend()}
                placeholder={t.typeMessage}
                disabled={isProcessing}
                className="flex-1 bg-purple-900/40 border border-purple-400/30 rounded-xl px-4 py-3 text-white placeholder-purple-300 placeholder-opacity-40 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={isProcessing || !userInput.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 px-6 py-3 rounded-xl transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}