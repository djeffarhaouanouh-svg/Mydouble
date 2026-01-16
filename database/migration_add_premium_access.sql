-- Migration: Ajouter la colonne has_premium_access à la table users
-- Date: 2024

-- Vérifier si la colonne existe déjà
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'has_premium_access'
    ) THEN
        -- Ajouter la colonne has_premium_access
        ALTER TABLE users 
        ADD COLUMN has_premium_access BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE 'Colonne has_premium_access ajoutée avec succès';
    ELSE
        RAISE NOTICE 'La colonne has_premium_access existe déjà';
    END IF;
END $$;
