-- Script pour recréer la table characters avec toutes les colonnes attendues
-- ATTENTION: Ce script supprime la table existante et toutes ses données

-- Supprimer la table si elle existe (cela supprimera toutes les données)
DROP TABLE IF EXISTS characters CASCADE;

-- Recréer la table characters avec toutes les colonnes
CREATE TABLE characters (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  photo_url TEXT NOT NULL,
  description TEXT,
  voice_id INTEGER REFERENCES voices(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT false,
  messages_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_voice_id ON characters(voice_id);
CREATE INDEX IF NOT EXISTS idx_characters_is_public ON characters(is_public);
CREATE INDEX IF NOT EXISTS idx_characters_created_at ON characters(created_at);

-- Créer un trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_characters_updated_at 
  BEFORE UPDATE ON characters 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Commentaires pour documenter la table
COMMENT ON TABLE characters IS 'Table des personnages créés par les utilisateurs';
COMMENT ON COLUMN characters.user_id IS 'ID de l''utilisateur créateur du personnage';
COMMENT ON COLUMN characters.voice_id IS 'ID de la voix associée au personnage (optionnel)';
COMMENT ON COLUMN characters.is_public IS 'Indique si le personnage est public ou privé';
COMMENT ON COLUMN characters.messages_count IS 'Nombre de messages échangés avec ce personnage';
