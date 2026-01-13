# 🔧 Guide de Dépannage - Problème de Connexion

Si vous ne pouvez pas vous connecter avec un compte que vous avez créé, suivez ces étapes :

## ✅ Vérifications de Base

### 1. Vérifier que le serveur est démarré

```bash
npm run dev
```

### 2. Vérifier les logs du serveur

Quand vous essayez de vous connecter, regardez le terminal où `npm run dev` est lancé. Vous devriez voir des messages d'erreur détaillés.

### 3. Vérifier la console du navigateur

1. Ouvrez les outils de développement (F12)
2. Allez dans l'onglet "Console"
3. Essayez de vous connecter
4. Regardez les erreurs affichées

## 🐛 Problèmes Courants

### "Email ou mot de passe incorrect"

**Causes possibles :**
1. **Email incorrect** : Vérifiez que vous utilisez exactement le même email que lors de l'inscription (attention à la casse)
2. **Mot de passe incorrect** : Vérifiez que vous utilisez exactement le même mot de passe
3. **Compte non créé** : Vérifiez que l'inscription s'est bien terminée

**Solution :**
- Essayez de créer un nouveau compte avec un email différent
- Vérifiez dans la base de données Neon que votre compte existe

### "Erreur de connexion à la base de données"

**Cause :** La variable `DATABASE_URL` n'est pas correctement configurée ou la base de données n'est pas accessible.

**Solution :**
1. Vérifiez que le fichier `.env.local` existe et contient `DATABASE_URL`
2. Vérifiez que la connection string est correcte
3. Vérifiez que votre base de données Neon est active

### "Compte invalide. Veuillez réinitialiser votre mot de passe."

**Cause :** Le compte existe mais n'a pas de mot de passe stocké (problème lors de l'inscription).

**Solution :**
- Recréez un compte avec un nouvel email
- Ou supprimez le compte existant dans Neon et recréez-le

## 🔍 Vérification dans la Base de Données

### Vérifier que votre compte existe

Exécutez ce script dans Neon SQL Editor :

```sql
-- Voir tous les utilisateurs
SELECT id, email, name, 
       CASE 
         WHEN password IS NULL THEN 'Pas de mot de passe'
         WHEN password = '' THEN 'Mot de passe vide'
         ELSE 'Mot de passe présent'
       END as password_status,
       created_at
FROM users
ORDER BY created_at DESC;
```

### Vérifier un utilisateur spécifique

```sql
-- Remplacer 'votre@email.com' par votre email
SELECT id, email, name, 
       CASE 
         WHEN password IS NULL THEN 'Pas de mot de passe'
         WHEN password = '' THEN 'Mot de passe vide'
         ELSE 'Mot de passe présent (' || LENGTH(password) || ' caractères)'
       END as password_status,
       created_at
FROM users
WHERE email = 'votre@email.com';
```

## 🧪 Test de Connexion

### Test 1 : Vérifier que l'inscription fonctionne

1. Créez un nouveau compte avec un email de test
2. Vérifiez dans les logs du serveur qu'il n'y a pas d'erreur
3. Vérifiez dans Neon que le compte a été créé avec un mot de passe

### Test 2 : Tester la connexion

1. Essayez de vous connecter avec le compte de test
2. Regardez les logs du serveur pour voir les erreurs exactes
3. Vérifiez la console du navigateur

## 📞 Informations à Fournir

Si le problème persiste, fournissez :
1. Le message d'erreur exact affiché dans l'interface
2. Les logs du serveur (terminal où `npm run dev` est lancé)
3. Les erreurs de la console du navigateur (F12)
4. Le résultat de la requête SQL pour vérifier votre compte
