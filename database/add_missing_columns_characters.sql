-- Script pour ajouter les colonnes manquantes à la table characters existante
-- Cette version préserve les données existantes

-- Ajouter les colonnes manquantes si elles n'existent pas déjà
DO $$ 
BEGIN
    -- Ajouter voice_id si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'characters' AND column_name = 'voice_id') THEN
        ALTER TABLE characters ADD COLUMN voice_id INTEGER REFERENCES voices(id) ON DELETE SET NULL;
    END IF;

    -- Ajouter is_public si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'characters' AND column_name = 'is_public') THEN
        ALTER TABLE characters ADD COLUMN is_public BOOLEAN DEFAULT false;
    END IF;

    -- Ajouter messages_count si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'characters' AND column_name = 'messages_count') THEN
        ALTER TABLE characters ADD COLUMN messages_count INTEGER DEFAULT 0;
    END IF;

    -- Ajouter created_at si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'characters' AND column_name = 'created_at') THEN
        ALTER TABLE characters ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    END IF;

    -- Ajouter updated_at si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'characters' AND column_name = 'updated_at') THEN
        ALTER TABLE characters ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

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

DROP TRIGGER IF EXISTS update_characters_updated_at ON characters;
CREATE TRIGGER update_characters_updated_at 
  BEFORE UPDATE ON characters 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
