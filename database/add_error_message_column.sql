-- Ajouter la colonne error_message à la table voices si elle n'existe pas
ALTER TABLE voices ADD COLUMN IF NOT EXISTS error_message TEXT;
