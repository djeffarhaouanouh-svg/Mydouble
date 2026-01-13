-- Ajouter les colonnes birth_month et birth_day à la table users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS birth_month INTEGER,
ADD COLUMN IF NOT EXISTS birth_day INTEGER;

-- Commentaires pour documentation
COMMENT ON COLUMN users.birth_month IS 'Mois de naissance (1-12)';
COMMENT ON COLUMN users.birth_day IS 'Jour de naissance (1-31)';
