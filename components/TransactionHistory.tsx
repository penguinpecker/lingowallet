// components/TransactionHistory.tsx
// Transaction History UI Component for Lingo Wallet

'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Clock, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

interface Transaction {
  id: string;
  tx_hash?: string | null;
  type: 'send' | 'receive' | 'swap' | 'bridge' | 'claim';
  status: 'pending' | 'confirmed' | 'failed';
  token_in?: string | null;
  token_out?: string | null;
  amount_in?: string | null;
  amount_out?: string | null;
  counterparty_address?: string | null;
  counterparty_phone?: string | null;
  chain: string;
  description?: string | null;
  created_at: string;
}

interface TransactionHistoryProps {
  walletAddress: string;
  language?: string;
}

// Translations
const translations: Record<string, Record<string, string>> = {
  en: {
    transactionHistory: 'Transaction History',
    noTransactions: 'No transactions yet',
    startByTrying: 'Start by sending crypto or making a swap!',
    pending: 'Pending',
    confirmed: 'Confirmed',
    failed: 'Failed',
    sent: 'Sent',
    received: 'Received',
    swapped: 'Swapped',
    bridged: 'Bridged',
    claimed: 'Claimed',
    to: 'To',
    from: 'From',
    viewOnExplorer: 'View on Explorer',
    loading: 'Loading...',
    refresh: 'Refresh',
  },
  hi: {
    transactionHistory: 'लेन-देन इतिहास',
    noTransactions: 'अभी तक कोई लेन-देन नहीं',
    startByTrying: 'क्रिप्टो भेजकर या स्वैप करके शुरू करें!',
    pending: 'लंबित',
    confirmed: 'पुष्टि हो गई',
    failed: 'असफल',
    sent: 'भेजा गया',
    received: 'प्राप्त हुआ',
    swapped: 'स्वैप किया',
    bridged: 'ब्रिज किया',
    claimed: 'दावा किया',
    to: 'को',
    from: 'से',
    viewOnExplorer: 'एक्सप्लोरर पर देखें',
    loading: 'लोड हो रहा है...',
    refresh: 'रिफ्रेश करें',
  },
  es: {
    transactionHistory: 'Historial de Transacciones',
    noTransactions: 'Sin transacciones todavía',
    startByTrying: '¡Comienza enviando cripto o haciendo un swap!',
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    failed: 'Fallido',
    sent: 'Enviado',
    received: 'Recibido',
    swapped: 'Intercambiado',
    bridged: 'Bridged',
    claimed: 'Reclamado',
    to: 'A',
    from: 'De',
    viewOnExplorer: 'Ver en Explorer',
    loading: 'Cargando...',
    refresh: 'Actualizar',
  },
  fr: {
    transactionHistory: 'Historique des Transactions',
    noTransactions: 'Pas encore de transactions',
    startByTrying: 'Commencez par envoyer des crypto ou faire un échange!',
    pending: 'En attente',
    confirmed: 'Confirmé',
    failed: 'Échoué',
    sent: 'Envoyé',
    received: 'Reçu',
    swapped: 'Échangé',
    bridged: 'Bridged',
    claimed: 'Réclamé',
    to: 'À',
    from: 'De',
    viewOnExplorer: 'Voir sur Explorer',
    loading: 'Chargement...',
    refresh: 'Actualiser',
  },
};

export default function TransactionHistory({ walletAddress, language = 'en' }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const t = translations[language] || translations.en;

  // Fetch transactions
  const fetchTransactions = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/transactions?wallet=${walletAddress}&limit=20&stats=true`);
      const data = await res.json();
      
      if (data.success) {
        setTransactions(data.transactions || []);
      } else {
        setError(data.error || 'Failed to fetch transactions');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [walletAddress]);

  // Format time ago
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get transaction icon
  const getIcon = (type: string) => {
    switch (type) {
      case 'send':
        return <ArrowUpRight className="w-5 h-5 text-red-400" />;
      case 'receive':
      case 'claim':
        return <ArrowDownLeft className="w-5 h-5 text-green-400" />;
      case 'swap':
        return <RefreshCw className="w-5 h-5 text-blue-400" />;
      default:
        return <RefreshCw className="w-5 h-5 text-purple-400" />;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  // Get explorer URL
  const getExplorerUrl = (txHash: string, chain: string) => {
    const explorers: Record<string, string> = {
      base: 'https://basescan.org/tx/',
      ethereum: 'https://etherscan.io/tx/',
      arbitrum: 'https://arbiscan.io/tx/',
      optimism: 'https://optimistic.etherscan.io/tx/',
      polygon: 'https://polygonscan.com/tx/',
    };
    return `${explorers[chain] || explorers.base}${txHash}`;
  };

  // Format transaction title
  const getTitle = (tx: Transaction) => {
    switch (tx.type) {
      case 'send':
        return `${t.sent} ${tx.token_in}`;
      case 'receive':
        return `${t.received} ${tx.token_in}`;
      case 'swap':
        return `${t.swapped} ${tx.token_in} → ${tx.token_out}`;
      case 'claim':
        return `${t.claimed} ${tx.token_in}`;
      default:
        return tx.description || 'Transaction';
    }
  };

  // Format subtitle
  const getSubtitle = (tx: Transaction) => {
    if (tx.counterparty_phone) {
      return `${tx.type === 'send' ? t.to : t.from} ${tx.counterparty_phone}`;
    }
    if (tx.counterparty_address) {
      return `${tx.type === 'send' ? t.to : t.from} ${tx.counterparty_address.slice(0, 8)}...${tx.counterparty_address.slice(-6)}`;
    }
    return tx.chain.charAt(0).toUpperCase() + tx.chain.slice(1);
  };

  // Format amount
  const getAmount = (tx: Transaction) => {
    if (tx.type === 'swap') {
      return `${tx.amount_in} → ${tx.amount_out || '?'}`;
    }
    const prefix = tx.type === 'send' ? '-' : '+';
    return `${prefix}${tx.amount_in} ${tx.token_in}`;
  };

  if (loading) {
    return (
      <div className="bg-purple-900/30 rounded-2xl p-6 border border-purple-400/20">
        <h3 className="text-lg font-semibold mb-4">{t.transactionHistory}</h3>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
          <span className="ml-2 text-purple-300">{t.loading}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-purple-900/30 rounded-2xl p-6 border border-purple-400/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{t.transactionHistory}</h3>
        <button
          onClick={fetchTransactions}
          className="p-2 hover:bg-purple-800/50 rounded-lg transition-colors"
          title={t.refresh}
        >
          <RefreshCw className="w-4 h-4 text-purple-300" />
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="text-red-400 text-sm mb-4 p-3 bg-red-900/20 rounded-lg">
          {error}
        </div>
      )}

      {/* Empty state */}
      {transactions.length === 0 && !error && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-purple-300">{t.noTransactions}</p>
          <p className="text-purple-400 text-sm mt-1">{t.startByTrying}</p>
        </div>
      )}

      {/* Transaction list */}
      <div className="space-y-3">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center gap-3 p-3 bg-purple-800/30 rounded-xl hover:bg-purple-800/50 transition-colors"
          >
            {/* Icon */}
            <div className="w-10 h-10 rounded-full bg-purple-900/50 flex items-center justify-center">
              {getIcon(tx.type)}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{getTitle(tx)}</span>
                {getStatusIcon(tx.status)}
              </div>
              <div className="text-sm text-purple-400 truncate">
                {getSubtitle(tx)}
              </div>
            </div>

            {/* Amount & Time */}
            <div className="text-right">
              <div className={`font-medium ${tx.type === 'send' ? 'text-red-400' : 'text-green-400'}`}>
                {getAmount(tx)}
              </div>
              <div className="text-xs text-purple-400 flex items-center gap-1 justify-end">
                {formatTimeAgo(tx.created_at)}
                {tx.tx_hash && (
                  <a
                    href={getExplorerUrl(tx.tx_hash, tx.chain)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-purple-200"
                    title={t.viewOnExplorer}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
