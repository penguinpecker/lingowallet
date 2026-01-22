// components/TransactionHistory.tsx
// Transaction History UI Component for Lingo Wallet

'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Phone,
  Wallet,
  Copy,
  Check
} from 'lucide-react';

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
  wallet_address?: string | null;
  chain: string;
  description?: string | null;
  original_command?: string | null;
  created_at: string;
  updated_at?: string | null;
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
    transactionDetails: 'Transaction Details',
    type: 'Type',
    status: 'Status',
    amount: 'Amount',
    recipient: 'Recipient',
    sender: 'Sender',
    chain: 'Chain',
    time: 'Time',
    txHash: 'Transaction Hash',
    command: 'Original Command',
    phoneNumber: 'Phone Number',
    walletAddress: 'Wallet Address',
    copied: 'Copied!',
    swapDetails: 'Swap Details',
    youSent: 'You Sent',
    youReceived: 'You Received',
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
    transactionDetails: 'लेन-देन विवरण',
    type: 'प्रकार',
    status: 'स्थिति',
    amount: 'राशि',
    recipient: 'प्राप्तकर्ता',
    sender: 'भेजने वाला',
    chain: 'चेन',
    time: 'समय',
    txHash: 'लेन-देन हैश',
    command: 'मूल आदेश',
    phoneNumber: 'फ़ोन नंबर',
    walletAddress: 'वॉलेट पता',
    copied: 'कॉपी किया!',
    swapDetails: 'स्वैप विवरण',
    youSent: 'आपने भेजा',
    youReceived: 'आपको मिला',
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
    transactionDetails: 'Detalles de Transacción',
    type: 'Tipo',
    status: 'Estado',
    amount: 'Cantidad',
    recipient: 'Destinatario',
    sender: 'Remitente',
    chain: 'Cadena',
    time: 'Hora',
    txHash: 'Hash de Transacción',
    command: 'Comando Original',
    phoneNumber: 'Número de Teléfono',
    walletAddress: 'Dirección de Billetera',
    copied: '¡Copiado!',
    swapDetails: 'Detalles del Swap',
    youSent: 'Enviaste',
    youReceived: 'Recibiste',
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
    transactionDetails: 'Détails de la Transaction',
    type: 'Type',
    status: 'Statut',
    amount: 'Montant',
    recipient: 'Destinataire',
    sender: 'Expéditeur',
    chain: 'Chaîne',
    time: 'Heure',
    txHash: 'Hash de Transaction',
    command: 'Commande Originale',
    phoneNumber: 'Numéro de Téléphone',
    walletAddress: 'Adresse du Portefeuille',
    copied: 'Copié!',
    swapDetails: 'Détails du Swap',
    youSent: 'Vous avez envoyé',
    youReceived: 'Vous avez reçu',
  },
  pt: {
    transactionHistory: 'Histórico de Transações',
    noTransactions: 'Nenhuma transação ainda',
    startByTrying: 'Comece enviando crypto ou fazendo um swap!',
    pending: 'Pendente',
    confirmed: 'Confirmado',
    failed: 'Falhou',
    sent: 'Enviado',
    received: 'Recebido',
    swapped: 'Trocado',
    bridged: 'Bridged',
    claimed: 'Reivindicado',
    to: 'Para',
    from: 'De',
    viewOnExplorer: 'Ver no Explorer',
    loading: 'Carregando...',
    refresh: 'Atualizar',
    transactionDetails: 'Detalhes da Transação',
    type: 'Tipo',
    status: 'Status',
    amount: 'Quantia',
    recipient: 'Destinatário',
    sender: 'Remetente',
    chain: 'Rede',
    time: 'Hora',
    txHash: 'Hash da Transação',
    command: 'Comando Original',
    phoneNumber: 'Número de Telefone',
    walletAddress: 'Endereço da Carteira',
    copied: 'Copiado!',
    swapDetails: 'Detalhes do Swap',
    youSent: 'Você enviou',
    youReceived: 'Você recebeu',
  },
  de: {
    transactionHistory: 'Transaktionsverlauf',
    noTransactions: 'Noch keine Transaktionen',
    startByTrying: 'Beginne mit dem Senden von Crypto oder einem Swap!',
    pending: 'Ausstehend',
    confirmed: 'Bestätigt',
    failed: 'Fehlgeschlagen',
    sent: 'Gesendet',
    received: 'Empfangen',
    swapped: 'Getauscht',
    bridged: 'Bridged',
    claimed: 'Beansprucht',
    to: 'An',
    from: 'Von',
    viewOnExplorer: 'Im Explorer ansehen',
    loading: 'Laden...',
    refresh: 'Aktualisieren',
    transactionDetails: 'Transaktionsdetails',
    type: 'Typ',
    status: 'Status',
    amount: 'Betrag',
    recipient: 'Empfänger',
    sender: 'Absender',
    chain: 'Kette',
    time: 'Zeit',
    txHash: 'Transaktions-Hash',
    command: 'Originalbefehl',
    phoneNumber: 'Telefonnummer',
    walletAddress: 'Wallet-Adresse',
    copied: 'Kopiert!',
    swapDetails: 'Swap-Details',
    youSent: 'Du hast gesendet',
    youReceived: 'Du hast erhalten',
  },
  ja: {
    transactionHistory: '取引履歴',
    noTransactions: 'まだ取引がありません',
    startByTrying: '暗号通貨を送信するかスワップして始めましょう！',
    pending: '保留中',
    confirmed: '確認済み',
    failed: '失敗',
    sent: '送信済み',
    received: '受信済み',
    swapped: 'スワップ済み',
    bridged: 'ブリッジ済み',
    claimed: '請求済み',
    to: '宛先',
    from: '送信元',
    viewOnExplorer: 'エクスプローラーで見る',
    loading: '読み込み中...',
    refresh: '更新',
    transactionDetails: '取引詳細',
    type: 'タイプ',
    status: 'ステータス',
    amount: '金額',
    recipient: '受取人',
    sender: '送信者',
    chain: 'チェーン',
    time: '時間',
    txHash: 'トランザクションハッシュ',
    command: '元のコマンド',
    phoneNumber: '電話番号',
    walletAddress: 'ウォレットアドレス',
    copied: 'コピーしました！',
    swapDetails: 'スワップ詳細',
    youSent: '送信',
    youReceived: '受信',
  },
  zh: {
    transactionHistory: '交易历史',
    noTransactions: '暂无交易',
    startByTrying: '开始发送加密货币或进行兑换！',
    pending: '待处理',
    confirmed: '已确认',
    failed: '失败',
    sent: '已发送',
    received: '已接收',
    swapped: '已兑换',
    bridged: '已桥接',
    claimed: '已领取',
    to: '至',
    from: '从',
    viewOnExplorer: '在浏览器中查看',
    loading: '加载中...',
    refresh: '刷新',
    transactionDetails: '交易详情',
    type: '类型',
    status: '状态',
    amount: '金额',
    recipient: '收款人',
    sender: '发送人',
    chain: '链',
    time: '时间',
    txHash: '交易哈希',
    command: '原始命令',
    phoneNumber: '电话号码',
    walletAddress: '钱包地址',
    copied: '已复制！',
    swapDetails: '兑换详情',
    youSent: '您发送了',
    youReceived: '您收到了',
  },
};

export default function TransactionHistory({ walletAddress, language = 'en' }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const t = translations[language] || translations.en;

  // Copy to clipboard
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

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

  // Format full date time
  const formatFullDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString(language === 'en' ? 'en-US' : language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
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

  // Get status icon and color
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="w-4 h-4" />,
          text: t.pending,
          color: 'text-yellow-400 bg-yellow-400/20',
        };
      case 'confirmed':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          text: t.confirmed,
          color: 'text-green-400 bg-green-400/20',
        };
      case 'failed':
        return {
          icon: <XCircle className="w-4 h-4" />,
          text: t.failed,
          color: 'text-red-400 bg-red-400/20',
        };
      default:
        return {
          icon: <Clock className="w-4 h-4" />,
          text: status,
          color: 'text-gray-400 bg-gray-400/20',
        };
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

  // Get chain display name
  const getChainDisplayName = (chain: string) => {
    const names: Record<string, string> = {
      base: 'Base',
      ethereum: 'Ethereum',
      arbitrum: 'Arbitrum',
      optimism: 'Optimism',
      polygon: 'Polygon',
    };
    return names[chain] || chain.charAt(0).toUpperCase() + chain.slice(1);
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
    if (tx.type === 'swap') {
      return `${tx.amount_in} ${tx.token_in} → ${tx.amount_out || '?'} ${tx.token_out}`;
    }
    if (tx.counterparty_phone) {
      return `${tx.type === 'send' ? t.to : t.from} ${tx.counterparty_phone}`;
    }
    if (tx.counterparty_address) {
      return `${tx.type === 'send' ? t.to : t.from} ${tx.counterparty_address.slice(0, 8)}...${tx.counterparty_address.slice(-6)}`;
    }
    return getChainDisplayName(tx.chain);
  };

  // Format amount display
  const getAmountDisplay = (tx: Transaction) => {
    if (tx.type === 'swap') {
      return (
        <div className="text-right">
          <div className="text-red-400 text-sm">-{tx.amount_in} {tx.token_in}</div>
          <div className="text-green-400 text-sm">+{tx.amount_out || '?'} {tx.token_out}</div>
        </div>
      );
    }
    const prefix = tx.type === 'send' ? '-' : '+';
    const color = tx.type === 'send' ? 'text-red-400' : 'text-green-400';
    return <span className={color}>{prefix}{tx.amount_in} {tx.token_in}</span>;
  };

  // Toggle expanded state
  const toggleExpanded = (txId: string) => {
    setExpandedTx(expandedTx === txId ? null : txId);
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
        {transactions.map((tx) => {
          const isExpanded = expandedTx === tx.id;
          const statusDisplay = getStatusDisplay(tx.status);

          return (
            <div
              key={tx.id}
              className="bg-purple-800/30 rounded-xl overflow-hidden transition-all"
            >
              {/* Main row - clickable */}
              <div
                onClick={() => toggleExpanded(tx.id)}
                className="flex items-center gap-3 p-3 hover:bg-purple-800/50 transition-colors cursor-pointer"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-full bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                  {getIcon(tx.type)}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{getTitle(tx)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${statusDisplay.color}`}>
                      {statusDisplay.icon}
                      {statusDisplay.text}
                    </span>
                  </div>
                  <div className="text-sm text-purple-400 truncate">
                    {getSubtitle(tx)}
                  </div>
                </div>

                {/* Amount & Time */}
                <div className="text-right flex-shrink-0">
                  <div className="font-medium">
                    {getAmountDisplay(tx)}
                  </div>
                  <div className="text-xs text-purple-400">
                    {formatTimeAgo(tx.created_at)}
                  </div>
                </div>

                {/* Expand icon */}
                <div className="flex-shrink-0 text-purple-400">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-purple-700/50 space-y-3">
                  {/* Type & Status row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-purple-400 mb-1">{t.type}</div>
                      <div className="flex items-center gap-2">
                        {getIcon(tx.type)}
                        <span className="capitalize">{tx.type === 'swap' ? t.swapped : tx.type === 'send' ? t.sent : t.received}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-purple-400 mb-1">{t.status}</div>
                      <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit ${statusDisplay.color}`}>
                        {statusDisplay.icon}
                        {statusDisplay.text}
                      </span>
                    </div>
                  </div>

                  {/* Amount details for swap */}
                  {tx.type === 'swap' && (
                    <div className="bg-purple-900/40 rounded-lg p-3">
                      <div className="text-xs text-purple-400 mb-2">{t.swapDetails}</div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-purple-400">{t.youSent}</div>
                          <div className="text-red-400 font-medium">{tx.amount_in} {tx.token_in}</div>
                        </div>
                        <RefreshCw className="w-5 h-5 text-purple-400" />
                        <div className="text-right">
                          <div className="text-xs text-purple-400">{t.youReceived}</div>
                          <div className="text-green-400 font-medium">{tx.amount_out || '?'} {tx.token_out}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recipient/Counterparty */}
                  {(tx.counterparty_address || tx.counterparty_phone) && (
                    <div>
                      <div className="text-xs text-purple-400 mb-1">
                        {tx.type === 'send' ? t.recipient : t.sender}
                      </div>
                      
                      {tx.counterparty_phone && (
                        <div className="flex items-center gap-2 bg-purple-900/40 rounded-lg p-2">
                          <Phone className="w-4 h-4 text-purple-400" />
                          <span className="font-mono text-sm">{tx.counterparty_phone}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(tx.counterparty_phone!, `phone-${tx.id}`);
                            }}
                            className="ml-auto p-1 hover:bg-purple-700/50 rounded"
                          >
                            {copiedField === `phone-${tx.id}` ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-purple-400" />
                            )}
                          </button>
                        </div>
                      )}
                      
                      {tx.counterparty_address && (
                        <div className="flex items-center gap-2 bg-purple-900/40 rounded-lg p-2 mt-2">
                          <Wallet className="w-4 h-4 text-purple-400" />
                          <span className="font-mono text-xs break-all">{tx.counterparty_address}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(tx.counterparty_address!, `addr-${tx.id}`);
                            }}
                            className="ml-auto p-1 hover:bg-purple-700/50 rounded flex-shrink-0"
                          >
                            {copiedField === `addr-${tx.id}` ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-purple-400" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Chain & Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-purple-400 mb-1">{t.chain}</div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-xs">
                          {tx.chain.charAt(0).toUpperCase()}
                        </div>
                        <span>{getChainDisplayName(tx.chain)}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-purple-400 mb-1">{t.time}</div>
                      <div className="text-sm">{formatFullDateTime(tx.created_at)}</div>
                    </div>
                  </div>

                  {/* Transaction Hash */}
                  {tx.tx_hash && (
                    <div>
                      <div className="text-xs text-purple-400 mb-1">{t.txHash}</div>
                      <div className="flex items-center gap-2 bg-purple-900/40 rounded-lg p-2">
                        <span className="font-mono text-xs break-all flex-1">
                          {tx.tx_hash}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(tx.tx_hash!, `hash-${tx.id}`);
                          }}
                          className="p-1 hover:bg-purple-700/50 rounded flex-shrink-0"
                        >
                          {copiedField === `hash-${tx.id}` ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-purple-400" />
                          )}
                        </button>
                        <a
                          href={getExplorerUrl(tx.tx_hash, tx.chain)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 hover:bg-purple-700/50 rounded flex-shrink-0"
                        >
                          <ExternalLink className="w-4 h-4 text-purple-400" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Original Command */}
                  {tx.original_command && (
                    <div>
                      <div className="text-xs text-purple-400 mb-1">{t.command}</div>
                      <div className="bg-purple-900/40 rounded-lg p-2 text-sm italic text-purple-300">
                        "{tx.original_command}"
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}