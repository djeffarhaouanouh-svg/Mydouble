-- Script de diagnostic pour le problème avatar_url
-- Exécutez ceci dans Neon SQL Editor pour voir exactement ce qui se passe

-- 1. Lister TOUTES les colonnes de la table users (avec casse exacte)
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 2. Vérifier spécifiquement avatar_url (snake_case)
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'avatar_url'
        ) THEN 'EXISTE (snake_case)'
        ELSE 'N''EXISTE PAS (snake_case)'
    END as status_avatar_url;

-- 3. Vérifier avatarUrl (camelCase - avec guillemets)
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'avatarUrl'
        ) THEN 'EXISTE (camelCase)'
        ELSE 'N''EXISTE PAS (camelCase)'
    END as status_avatarUrl;

-- 4. Rechercher toutes les colonnes contenant "avatar" (insensible à la casse)
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'users' 
  AND LOWER(column_name) LIKE '%avatar%';

-- 5. Afficher la structure complète de la table (nécessite psql)
-- Si vous êtes dans SQL Editor Neon, cette requête fonctionnera :
SELECT 
    'Table: ' || table_name || ', Colonne: ' || column_name || ', Type: ' || data_type as structure
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
