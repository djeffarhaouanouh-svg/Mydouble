-- Migration : Supprimer la contrainte FK sur messages.character_id
-- Raison : Les personnages statiques (IDs 1-7) sont définis dans le code (static-characters.ts)
-- et n'existent pas dans la table characters. La FK empêche l'insertion de messages.

-- Trouver et supprimer la contrainte FK sur character_id
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
    RAISE NOTICE 'Contrainte FK supprimée : %', fk_name;
  ELSE
    RAISE NOTICE 'Aucune contrainte FK character trouvée sur la table messages';
  END IF;
END $$;

-- Vérifier que la contrainte a été supprimée
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'messages';
