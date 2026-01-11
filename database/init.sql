-- MyDouble Database Schema
-- Pour Neon PostgreSQL

-- Table users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  password VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table ai_doubles
CREATE TABLE IF NOT EXISTS ai_doubles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  personality JSONB NOT NULL,
  style_rules JSONB,
  voice_id VARCHAR(255),
  messages_count INTEGER DEFAULT 0,
  improvement_level INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table messages
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'ai')),
  content TEXT NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table voice_samples
CREATE TABLE IF NOT EXISTS voice_samples (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table screenshots
CREATE TABLE IF NOT EXISTS screenshots (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_ai_doubles_user_id ON ai_doubles(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_voice_samples_user_id ON voice_samples(user_id);
CREATE INDEX IF NOT EXISTS idx_screenshots_user_id ON screenshots(user_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour users
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour ai_doubles
CREATE TRIGGER update_ai_doubles_updated_at BEFORE UPDATE ON ai_doubles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
