'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Wallet, Gift, CheckCircle, Loader } from 'lucide-react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

export default function ClaimPage() {
  const params = useParams();
  const token = params.token as string;
  const { login, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  
  const [claimData, setClaimData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState('');

  // Fetch claim details
  useEffect(() => {
    const fetchClaim = async () => {
      try {
        const res = await fetch('/api/get-claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ claimToken: token }),
        });

        const data = await res.json();
        
        if (data.success) {
          setClaimData(data.claim);
        } else {
          setError(data.error || 'Claim not found or expired');
        }
      } catch (err) {
        setError('Failed to load claim');
      } finally {
        setLoading(false);
      }
    };

    fetchClaim();
  }, [token]);

  // Handle claim after wallet is connected
  const handleClaim = async () => {
    if (!wallets[0]?.address) {
      alert('Please wait for wallet to be created...');
      return;
    }

    setClaiming(true);

    try {
      const res = await fetch('/api/claim-crypto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimToken: token,
          walletAddress: wallets[0].address,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setClaimed(true);
      } else {
        setError(data.error || 'Failed to claim');
      }
    } catch (err) {
      setError('Claim failed');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-400" />
          <div className="text-xl">Loading claim...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center p-4">
        <div className="bg-white bg-opacity-15 backdrop-blur-lg rounded-2xl p-8 max-w-md text-center border border-white border-opacity-20">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold mb-4">Claim Not Available</h1>
          <p className="opacity-80 mb-6">{error}</p>
          <a 
            href="https://lingowallet.vercel.app"
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold inline-block"
          >
            Go to Lingo Wallet
          </a>
        </div>
      </div>
    );
  }

  if (claimed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center p-4">
        <div className="bg-white bg-opacity-15 backdrop-blur-lg rounded-2xl p-8 max-w-md text-center border border-white border-opacity-20">
          <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Claimed! 🎉</h1>
          <p className="text-xl mb-2">You received:</p>
          <p className="text-4xl font-bold mb-6 text-purple-300">
            {claimData.amount} {claimData.token}
          </p>
          <div className="bg-black bg-opacity-20 rounded-lg p-4 mb-6">
            <div className="text-sm opacity-60 mb-1">Your Wallet</div>
            <div className="font-mono text-sm break-all">{wallets[0]?.address}</div>
          </div>
          <a 
            href="https://lingowallet.vercel.app"
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold inline-block"
          >
            Open Lingo Wallet
          </a>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center p-4">
        <div className="bg-white bg-opacity-15 backdrop-blur-lg rounded-2xl p-8 max-w-md text-center border border-white border-opacity-20">
          <Gift className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">You Got Crypto! 🎉</h1>
          <p className="text-xl mb-2">Someone sent you:</p>
          <p className="text-4xl font-bold mb-6 text-purple-300">
            {claimData.amount} {claimData.token}
          </p>
          <p className="opacity-80 mb-6">
            Create a free wallet to claim it!
          </p>
          <button
            onClick={login}
            className="bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-xl font-semibold text-lg w-full"
          >
            Create Wallet & Claim
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center p-4">
      <div className="bg-white bg-opacity-15 backdrop-blur-lg rounded-2xl p-8 max-w-md text-center border border-white border-opacity-20">
        <Wallet className="w-20 h-20 text-purple-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-4">Ready to Claim! 💰</h1>
        <p className="text-xl mb-2">You're receiving:</p>
        <p className="text-4xl font-bold mb-6 text-purple-300">
          {claimData.amount} {claimData.token}
        </p>
        <div className="bg-black bg-opacity-20 rounded-lg p-4 mb-6">
          <div className="text-sm opacity-60 mb-1">Your Wallet</div>
          <div className="font-mono text-sm break-all">{wallets[0]?.address || 'Creating...'}</div>
        </div>
        <button
          onClick={handleClaim}
          disabled={claiming || !wallets[0]?.address}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-8 py-4 rounded-xl font-semibold text-lg w-full"
        >
          {claiming ? 'Claiming...' : 'Claim Now!'}
        </button>
      </div>
    </div>
  );
}