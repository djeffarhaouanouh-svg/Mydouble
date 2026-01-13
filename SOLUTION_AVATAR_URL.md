# 🔧 Solution au Problème avatar_url

## 🐛 Problème
- Neon dit que `avatar_url` existe déjà
- Le site dit que `avatar_url` n'existe pas

## ✅ Solutions (essayez dans cet ordre)

### Solution 1 : Synchroniser le schéma avec Drizzle Kit (RECOMMANDÉ)

Drizzle Kit peut synchroniser automatiquement votre schéma avec la base de données :

```bash
# 1. Assurez-vous que votre .env.local contient DATABASE_URL
# 2. Synchronisez le schéma
npx drizzle-kit push:pg
```

Cette commande va :
- ✅ Vérifier les colonnes existantes
- ✅ Ajouter les colonnes manquantes
- ✅ Mettre à jour le schéma pour correspondre à votre code

### Solution 2 : Vérifier manuellement dans Neon

1. Allez sur https://console.neon.tech
2. Ouvrez votre projet
3. Allez dans "SQL Editor"
4. Exécutez ce script de diagnostic :

```sql
-- Voir toutes les colonnes de la table users
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

5. Si `avatar_url` n'apparaît PAS dans la liste :
   - Exécutez : `ALTER TABLE users ADD COLUMN avatar_url TEXT;`
6. Si `avatar_url` apparaît mais le problème persiste :
   - Vérifiez la casse exacte
   - Essayez Solution 3

### Solution 3 : Script de correction automatique

Exécutez ce script dans Neon SQL Editor (`database/fix_avatar_column.sql`) :

Ce script va :
- ✅ Vérifier si la colonne existe sous différents noms (avatar_url, avatarUrl, avatar)
- ✅ Renommer ou créer la colonne si nécessaire
- ✅ Afficher le résultat

### Solution 4 : Forcer la création de la colonne

Si rien d'autre ne fonctionne, exécutez directement dans Neon :

```sql
-- Forcer la création de avatar_url (ignorera si elle existe déjà)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE users ADD COLUMN avatar_url TEXT;
  END IF;
END $$;
```

## 🔍 Vérification

Après avoir appliqué une solution, testez :

1. Redémarrez votre serveur Next.js :
   ```bash
   npm run dev
   ```

2. Essayez de créer un compte sur http://localhost:3000/inscription

3. Si ça ne fonctionne toujours pas :
   - Ouvrez la console du navigateur (F12)
   - Regardez les erreurs dans le terminal du serveur
   - Partagez le message d'erreur exact

## 🎯 Solution Alternative : Modifier le Code

Si vous ne pouvez pas modifier la base de données, j'ai modifié le code pour qu'il ne tente pas d'insérer `avatar_url` lors de l'inscription (colonne optionnelle).

Mais il est préférable de synchroniser le schéma avec Drizzle Kit (Solution 1).
