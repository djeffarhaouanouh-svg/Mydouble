-- Script pour ajouter la colonne avatar_url à la table users
-- À exécuter dans votre base de données PostgreSQL

-- Ajouter avatar_url si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE users ADD COLUMN avatar_url TEXT;
    RAISE NOTICE '✓ Colonne avatar_url ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓ Colonne avatar_url existe déjà';
  END IF;
END $$;

-- Ajouter birth_month si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'birth_month'
  ) THEN
    ALTER TABLE users ADD COLUMN birth_month INTEGER;
    RAISE NOTICE '✓ Colonne birth_month ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓ Colonne birth_month existe déjà';
  END IF;
END $$;

-- Ajouter birth_day si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'birth_day'
  ) THEN
    ALTER TABLE users ADD COLUMN birth_day INTEGER;
    RAISE NOTICE '✓ Colonne birth_day ajoutée avec succès';
  ELSE
    RAISE NOTICE '✓ Colonne birth_day existe déjà';
  END IF;
END $$;

-- Vérifier les colonnes de la table users
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
