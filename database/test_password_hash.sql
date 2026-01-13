-- Script pour tester le hashage d'un mot de passe
-- Ce script ne peut pas tester bcrypt directement dans SQL,
-- mais vous pouvez vérifier si le hash correspond à un format bcrypt valide

-- Vérifier le format du hash
SELECT 
    id,
    email,
    name,
    password,
    CASE 
        WHEN password LIKE '$2a$%' THEN 'Format bcrypt $2a$'
        WHEN password LIKE '$2b$%' THEN 'Format bcrypt $2b$ ✅'
        WHEN password LIKE '$2y$%' THEN 'Format bcrypt $2y$'
        ELSE 'Format inconnu ⚠️'
    END as hash_format,
    LENGTH(password) as hash_length
FROM users
WHERE email = 'lennyhdr1@gmail.com';

-- Le hash devrait commencer par $2b$10$ pour bcrypt avec cost factor 10
