-- Transaction History Table for Lingo Wallet
-- Run this in Supabase SQL Editor

-- Create the transaction history table
CREATE TABLE transaction_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Transaction identifiers
  tx_hash TEXT,                          -- Blockchain transaction hash (null for pending)
  
  -- Wallet info
  wallet_address TEXT NOT NULL,          -- User's wallet address
  
  -- Transaction details
  type TEXT NOT NULL,                    -- 'send', 'receive', 'swap', 'bridge', 'claim'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
  
  -- Token info
  token_in TEXT,                         -- Token sent (for swaps) or token transferred
  token_out TEXT,                        -- Token received (for swaps only)
  amount_in TEXT,                        -- Amount sent
  amount_out TEXT,                       -- Amount received (for swaps)
  
  -- Recipient/Sender info
  counterparty_address TEXT,             -- Wallet address of other party
  counterparty_phone TEXT,               -- Phone number (if sent via phone)
  
  -- Chain info
  chain TEXT NOT NULL DEFAULT 'base',    -- 'base', 'ethereum', 'arbitrum', etc.
  
  -- Metadata
  description TEXT,                      -- Human-readable description
  language TEXT DEFAULT 'en',            -- Language of original command
  original_command TEXT,                 -- Original user input
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  
  -- Error info (for failed transactions)
  error_message TEXT
);

-- Indexes for faster queries
CREATE INDEX idx_tx_wallet ON transaction_history(wallet_address);
CREATE INDEX idx_tx_status ON transaction_history(status);
CREATE INDEX idx_tx_created ON transaction_history(created_at DESC);
CREATE INDEX idx_tx_type ON transaction_history(type);
CREATE INDEX idx_tx_chain ON transaction_history(chain);

-- Index for finding transactions by hash
CREATE INDEX idx_tx_hash ON transaction_history(tx_hash) WHERE tx_hash IS NOT NULL;

-- Composite index for common queries (wallet + status + time)
CREATE INDEX idx_tx_wallet_status_time ON transaction_history(wallet_address, status, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own transactions
CREATE POLICY "Users can view own transactions" ON transaction_history
  FOR SELECT USING (true);  -- For now, allow all reads (you can restrict later)

CREATE POLICY "Users can insert own transactions" ON transaction_history
  FOR INSERT WITH CHECK (true);  -- Allow inserts

CREATE POLICY "Users can update own transactions" ON transaction_history
  FOR UPDATE USING (true);  -- Allow updates

-- Comment on table
COMMENT ON TABLE transaction_history IS 'Stores all transaction history for Lingo Wallet users';
