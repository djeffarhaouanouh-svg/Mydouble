# 🚀 Instructions de Démarrage - MyDouble

## ❌ Erreur "next n'est pas reconnu"

Tu as cette erreur car les dépendances ne sont pas installées.

## ✅ Solution - Étapes à suivre :

### 1. Ouvre un terminal dans le dossier du projet

```bash
cd mydouble-site-complet
```

### 2. Installe les dépendances Node.js

```bash
npm install
```

Cette commande va installer :
- Next.js
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Anthropic SDK
- Drizzle ORM
- Neon Database
- Et toutes les autres dépendances

⏱️ **Temps d'installation : 2-3 minutes**

### 3. Configure les variables d'environnement

Ouvre le fichier `.env.local` et remplace les valeurs :

```env
DATABASE_URL="ta_vraie_connection_string_neon"
ANTHROPIC_API_KEY="ta_vraie_cle_anthropic"
ELEVENLABS_API_KEY="ta_vraie_cle_elevenlabs"
```

### 4. Lance le serveur de développement

```bash
npm run dev
```

### 5. Ouvre ton navigateur

Va sur : **http://localhost:3000**

## 📝 Commandes utiles

```bash
# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Build pour production
npm run build

# Lancer en production
npm start

# Sync base de données
npx drizzle-kit push:pg
```

## ⚠️ Prérequis

Assure-toi d'avoir installé :
- **Node.js** version 18 ou supérieure
- **npm** (inclus avec Node.js)

Vérifie avec :
```bash
node --version
npm --version
```

Si tu n'as pas Node.js, télécharge-le ici : https://nodejs.org/

## 🆘 Problèmes courants

### "npm n'est pas reconnu"
→ Installe Node.js

### "Module not found"
→ Lance `npm install` à nouveau

### "Port 3000 déjà utilisé"
→ Change le port : `npm run dev -- -p 3001`

---

Une fois `npm install` terminé, relance `npm run dev` ! 🚀
