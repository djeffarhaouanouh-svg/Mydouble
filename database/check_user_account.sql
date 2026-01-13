-- Script pour vérifier un compte utilisateur
-- Remplacez 'VOTRE_EMAIL' par votre email

-- 1. Vérifier si le compte existe
SELECT 
    id,
    email,
    name,
    CASE 
        WHEN password IS NULL THEN '❌ Pas de mot de passe'
        WHEN password = '' THEN '❌ Mot de passe vide'
        WHEN LENGTH(password) < 20 THEN '⚠️ Mot de passe suspect (trop court pour un hash)'
        ELSE '✅ Mot de passe hashé présent (' || LENGTH(password) || ' caractères)'
    END as password_status,
    created_at,
    updated_at
FROM users
WHERE email = 'VOTRE_EMAIL';

-- 2. Voir tous les utilisateurs (pour vérifier que votre compte existe)
SELECT 
    id,
    email,
    name,
    CASE 
        WHEN password IS NULL THEN 'Pas de mot de passe'
        WHEN password = '' THEN 'Mot de passe vide'
        ELSE 'Mot de passe présent (' || LENGTH(password) || ' caractères)'
    END as password_status,
    created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- 3. Compter les utilisateurs avec/sans mot de passe
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN password IS NULL OR password = '' THEN 1 END) as users_without_password,
    COUNT(CASE WHEN password IS NOT NULL AND password != '' THEN 1 END) as users_with_password
FROM users;
