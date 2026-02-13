-- Migration : Système d'affiliation
-- Date : 2026-02-13

-- Table des affiliés
CREATE TABLE IF NOT EXISTS affiliates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) UNIQUE,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  commission_rate INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_paid INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table des ventes affiliées
CREATE TABLE IF NOT EXISTS referral_sales (
  id SERIAL PRIMARY KEY,
  affiliate_id INTEGER NOT NULL REFERENCES affiliates(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  paypal_order_id VARCHAR(255),
  amount INTEGER NOT NULL,
  commission_amount INTEGER NOT NULL,
  plan VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(code);
CREATE INDEX IF NOT EXISTS idx_referral_sales_affiliate_id ON referral_sales(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_referral_sales_user_id ON referral_sales(user_id);
