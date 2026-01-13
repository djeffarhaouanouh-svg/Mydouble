-- Script pour corriger le problème de colonne avatar_url
-- Ce script vérifie et corrige différentes variantes possibles

-- 1. Vérifier si avatar_url existe (snake_case)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'avatar_url'
  ) THEN
    RAISE NOTICE '✓ La colonne avatar_url existe déjà';
  ELSE
    -- 2. Vérifier si avatarUrl existe (camelCase)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'avatarUrl'
    ) THEN
      RAISE NOTICE '→ La colonne existe mais sous le nom avatarUrl (camelCase)';
      RAISE NOTICE '→ Renommage en avatar_url (snake_case)...';
      ALTER TABLE users RENAME COLUMN "avatarUrl" TO avatar_url;
      RAISE NOTICE '✓ Colonne renommée avec succès';
    ELSE
      -- 3. Vérifier si avatar existe (sans suffixe)
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'avatar'
      ) THEN
        RAISE NOTICE '→ La colonne existe mais sous le nom avatar';
        RAISE NOTICE '→ Renommage en avatar_url...';
        ALTER TABLE users RENAME COLUMN avatar TO avatar_url;
        RAISE NOTICE '✓ Colonne renommée avec succès';
      ELSE
        -- 4. Si aucune colonne n'existe, la créer
        RAISE NOTICE '→ Aucune colonne avatar trouvée, création de avatar_url...';
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
        RAISE NOTICE '✓ Colonne avatar_url créée avec succès';
      END IF;
    END IF;
  END IF;
END $$;

-- Afficher le résultat final
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'users' AND column_name LIKE '%avatar%';
