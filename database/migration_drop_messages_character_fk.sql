-- Migration : Corriger la table messages
-- 1) Supprimer la contrainte FK sur character_id (les personnages statiques IDs 1-7 ne sont pas dans la table characters)
-- 2) Corriger le CHECK constraint sur role ('ai' → 'assistant')
-- 3) Ajouter les colonnes manquantes si nécessaire

-- ============================================
-- 1) Supprimer la FK sur character_id
-- ============================================
DO $$
DECLARE
  fk_name TEXT;
BEGIN
  SELECT constraint_name INTO fk_name
  FROM information_schema.table_constraints
  WHERE table_name = 'messages'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%character%';

  IF fk_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE messages DROP CONSTRAINT ' || fk_name;
    RAISE NOTICE 'FK character supprimée : %', fk_name;
  ELSE
    RAISE NOTICE 'Pas de FK character trouvée';
  END IF;
END $$;

-- ============================================
-- 2) Corriger le CHECK constraint sur role
--    Remplacer ('user', 'ai') par ('user', 'assistant')
-- ============================================
DO $$
DECLARE
  ck_name TEXT;
BEGIN
  -- Trouver le CHECK constraint sur la colonne role
  SELECT con.conname INTO ck_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'messages'
    AND con.contype = 'c';

  IF ck_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE messages DROP CONSTRAINT ' || ck_name;
    RAISE NOTICE 'CHECK constraint supprimé : %', ck_name;
  ELSE
    RAISE NOTICE 'Pas de CHECK constraint trouvé';
  END IF;
END $$;

-- Ajouter le nouveau CHECK constraint avec 'assistant' au lieu de 'ai'
ALTER TABLE messages ADD CONSTRAINT messages_role_check CHECK (role IN ('user', 'assistant'));

-- Mettre à jour les anciens messages qui auraient role='ai' vers 'assistant'
UPDATE messages SET role = 'assistant' WHERE role = 'ai';

-- ============================================
-- 3) Ajouter les colonnes manquantes si elles n'existent pas
-- ============================================
ALTER TABLE messages ADD COLUMN IF NOT EXISTS character_id INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS story_id INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS video_url TEXT;

-- ============================================
-- Vérification finale
-- ============================================
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'messages';
