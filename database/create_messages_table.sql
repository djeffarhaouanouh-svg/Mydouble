-- Script pour créer la table messages
-- À exécuter dans votre base de données PostgreSQL

-- Créer la table messages si elle n'existe pas
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  character_id INTEGER REFERENCES characters(id) ON DELETE SET NULL,
  story_id INTEGER REFERENCES stories(id) ON DELETE SET NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  audio_url TEXT,
  video_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_character_id ON messages(character_id);
CREATE INDEX IF NOT EXISTS idx_messages_story_id ON messages(story_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_user_character ON messages(user_id, character_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_story ON messages(user_id, story_id);

-- Vérifier que la table a été créée
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;
