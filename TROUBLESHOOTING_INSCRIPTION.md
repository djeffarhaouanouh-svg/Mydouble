# 🔧 Guide de Dépannage - Problème d'Inscription

Si vous rencontrez une erreur lors de l'inscription, suivez ces étapes :

## ✅ Vérifications de Base

### 1. Vérifier que le serveur est démarré

```bash
npm run dev
```

Le serveur doit être accessible sur `http://localhost:3000`

### 2. Vérifier la configuration de la base de données

Créez un fichier `.env.local` à la racine du projet avec :

```env
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require"
```

**Important** : Remplacez cette valeur par votre vraie connection string Neon.

### 3. Vérifier que la base de données est initialisée

Les tables doivent exister dans votre base de données Neon. Exécutez le script SQL :

**Option A - Via le dashboard Neon :**
1. Allez sur https://console.neon.tech
2. Ouvrez votre projet
3. Allez dans "SQL Editor"
4. Copiez-collez le contenu de `database/init.sql`
5. Exécutez le script

**Option B - Via la ligne de commande :**
```bash
psql $DATABASE_URL -f database/init.sql
```

### 4. Vérifier la connexion à la base de données

Testez la connexion avec Drizzle :

```bash
npx drizzle-kit push:pg
```

Si cette commande échoue, vérifiez votre `DATABASE_URL`.

## 🐛 Messages d'Erreur Courants

### "Erreur de connexion à la base de données"
- ✅ Vérifiez que `DATABASE_URL` est correctement configurée dans `.env.local`
- ✅ Vérifiez que votre base de données Neon est active
- ✅ Vérifiez que la connection string est complète (inclut `?sslmode=require`)

### "Cet email est déjà utilisé"
- ✅ L'email existe déjà dans la base de données
- ✅ Essayez avec un autre email ou connectez-vous

### "Erreur base de données: ..."
- ✅ Vérifiez que les tables existent (voir étape 3)
- ✅ Vérifiez les logs du serveur pour plus de détails
- ✅ Ouvrez la console du navigateur (F12) pour voir les erreurs détaillées

### "Erreur de communication avec le serveur"
- ✅ Vérifiez que le serveur est démarré (`npm run dev`)
- ✅ Vérifiez votre connexion internet
- ✅ Vérifiez la console du navigateur (F12) pour plus de détails

## 🔍 Débogage Avancé

### Vérifier les logs du serveur

Quand vous essayez de vous inscrire, regardez le terminal où `npm run dev` est lancé. Vous devriez voir des messages d'erreur détaillés.

### Vérifier la console du navigateur

1. Ouvrez les outils de développement (F12)
2. Allez dans l'onglet "Console"
3. Essayez de vous inscrire
4. Regardez les erreurs affichées

### Tester la connexion à la base de données

Créez un fichier `test-db.js` :

```javascript
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function test() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`SELECT NOW()`;
    console.log('✅ Connexion réussie:', result);
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
  }
}

test();
```

Exécutez : `node test-db.js`

## 📞 Besoin d'Aide ?

Si le problème persiste :
1. Vérifiez les logs du serveur
2. Vérifiez la console du navigateur
3. Vérifiez que toutes les étapes ci-dessus sont complétées
4. Partagez le message d'erreur exact que vous voyez
