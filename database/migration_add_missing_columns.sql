-- Migration pour ajouter les colonnes manquantes
-- À exécuter si votre base de données existe déjà

-- Ajouter avatar_url à la table users (si elle n'existe pas)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE users ADD COLUMN avatar_url TEXT;
    RAISE NOTICE 'Colonne avatar_url ajoutée à la table users';
  ELSE
    RAISE NOTICE 'Colonne avatar_url existe déjà dans la table users';
  END IF;
END $$;

-- Ajouter vapi_assistant_id à la table ai_doubles (si elle n'existe pas)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_doubles' AND column_name = 'vapi_assistant_id'
  ) THEN
    ALTER TABLE ai_doubles ADD COLUMN vapi_assistant_id VARCHAR(255);
    RAISE NOTICE 'Colonne vapi_assistant_id ajoutée à la table ai_doubles';
  ELSE
    RAISE NOTICE 'Colonne vapi_assistant_id existe déjà dans la table ai_doubles';
  END IF;
END $$;

-- Ajouter diagnostic à la table ai_doubles (si elle n'existe pas)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_doubles' AND column_name = 'diagnostic'
  ) THEN
    ALTER TABLE ai_doubles ADD COLUMN diagnostic JSONB;
    RAISE NOTICE 'Colonne diagnostic ajoutée à la table ai_doubles';
  ELSE
    RAISE NOTICE 'Colonne diagnostic existe déjà dans la table ai_doubles';
  END IF;
END $$;
