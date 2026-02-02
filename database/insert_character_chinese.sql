-- Insère un personnage manuellement avec l'image chinese.png
-- Utilise le premier utilisateur existant comme créateur (user_id).
-- L'image est dans public/chinese.png, donc l'URL affichée sera /chinese.png

INSERT INTO characters (
  user_id,
  name,
  photo_url,
  description,
  system_prompt,
  is_public,
  messages_count
)
SELECT
  u.id,
  'Chinese',
  '/chinese.png',
  'Personnage créé manuellement avec l''image Chinese.',
  'Tu es un personnage amical et accueillant. Tu réponds avec bienveillance.',
  true,
  0
FROM users u
ORDER BY u.id
LIMIT 1;

-- Vérification : afficher le personnage créé
SELECT id, name, photo_url, user_id, is_public, created_at
FROM characters
WHERE photo_url = '/chinese.png'
ORDER BY id DESC
LIMIT 1;
