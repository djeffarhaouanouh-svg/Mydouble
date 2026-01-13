-- Script pour vérifier les colonnes existantes dans la table users
-- Exécutez ceci dans Neon SQL Editor pour voir toutes les colonnes

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Pour voir aussi la structure exacte
\d users
