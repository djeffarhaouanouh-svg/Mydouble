-- Migration: Ajouter le champ personality à la table messages
-- Ce champ permet de distinguer les messages selon la personnalité utilisée
-- NULL = double IA principal, 'assistant' = Assistant IA, 'coach' = Coach IA, 'confident' = Confident IA

-- Ajouter la colonne personality (nullable pour les anciens messages)
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS personality VARCHAR(50) CHECK (personality IN ('assistant', 'coach', 'confident')) DEFAULT NULL;

-- Créer un index pour améliorer les performances des requêtes filtrées par personnalité
CREATE INDEX IF NOT EXISTS idx_messages_personality ON messages(personality);

-- Optionnel: Mettre à jour les messages existants si nécessaire
-- UPDATE messages SET personality = NULL WHERE personality IS NULL;
