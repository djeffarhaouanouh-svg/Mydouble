# Guide de Déploiement MyDouble

## 📋 Prérequis

1. **Compte Neon** (Base de données PostgreSQL)
   - Créer un compte sur https://neon.tech
   - Créer un nouveau projet
   - Copier la connection string

2. **Anthropic API Key**
   - Créer un compte sur https://console.anthropic.com
   - Générer une API key
   - Copier la clé

3. **ElevenLabs API Key**
   - Créer un compte sur https://elevenlabs.io
   - Aller dans le dashboard → API Keys
   - Générer une nouvelle clé
   - Copier la clé

## 🚀 Étapes de Déploiement

### 1. Configuration de la Base de Données Neon

```bash
# Se connecter à Neon via leur dashboard ou CLI
# Exécuter le script SQL d'initialisation
psql $DATABASE_URL -f database/init.sql
```

Ou via le dashboard Neon:
1. Aller dans "SQL Editor"
2. Copier-coller le contenu de `database/init.sql`
3. Exécuter

### 2. Configuration des Variables d'Environnement

Créer un fichier `.env.local` à la racine:

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require"

# Anthropic Claude API
ANTHROPIC_API_KEY="sk-ant-api03-xxxxx"

# ElevenLabs API
ELEVENLABS_API_KEY="xxxxx"

# Next Auth (optionnel)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre_secret_aleatoire"

# App Config
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="MyDouble"
```

### 3. Installation des Dépendances

```bash
npm install
```

### 4. Générer les Types Drizzle

```bash
npm install -g drizzle-kit
drizzle-kit generate:pg
drizzle-kit push:pg
```

### 5. Lancer en Développement

```bash
npm run dev
```

L'application sera disponible sur http://localhost:3000

## 🌐 Déploiement en Production

### Option 1: Vercel (Recommandé)

1. Installer Vercel CLI:
```bash
npm i -g vercel
```

2. Déployer:
```bash
vercel
```

3. Ajouter les variables d'environnement dans le dashboard Vercel

### Option 2: Docker

```bash
# Build
docker build -t mydouble .

# Run
docker run -p 3000:3000 --env-file .env.local mydouble
```

## 📦 Structure de Stockage des Fichiers

Tu auras besoin d'un service de stockage pour:
- Les captures d'écran uploadées
- Les échantillons vocaux
- Les fichiers audio générés

### Options recommandées:

1. **AWS S3**
   ```bash
   npm install @aws-sdk/client-s3
   ```

2. **Cloudinary**
   ```bash
   npm install cloudinary
   ```

3. **Vercel Blob** (si déployé sur Vercel)
   ```bash
   npm install @vercel/blob
   ```

## 🔒 Sécurité

### Ajouter l'authentification

Pour sécuriser l'application, installe NextAuth.js:

```bash
npm install next-auth
```

Puis configure dans `app/api/auth/[...nextauth]/route.ts`

### Rate Limiting

Installe un rate limiter pour protéger les APIs:

```bash
npm install @upstash/ratelimit @upstash/redis
```

## 📊 Monitoring

### Recommandations:

1. **Sentry** pour le tracking des erreurs
```bash
npm install @sentry/nextjs
```

2. **Vercel Analytics** si déployé sur Vercel

3. **PostHog** pour l'analytics utilisateur

## 🧪 Tests

```bash
# Installer les dépendances de test
npm install -D @testing-library/react @testing-library/jest-dom jest

# Lancer les tests
npm test
```

## 📝 Notes Importantes

1. **Limites ElevenLabs**: Vérifie les limites de ton plan (nombre de caractères/mois)
2. **Coûts Anthropic**: Claude facture par token, surveille ta consommation
3. **Neon**: Le plan gratuit a des limites de stockage et de connexions

## 🆘 Résolution de Problèmes

### Erreur de connexion Neon
- Vérifie que ton IP est autorisée dans Neon
- Vérifie le format de DATABASE_URL

### Erreur ElevenLabs API
- Vérifie que ta clé API est valide
- Vérifie que tu as des crédits restants

### Build Next.js échoue
- Supprime `.next` et `node_modules`
- Relance `npm install && npm run build`

## 📞 Support

Pour toute question technique:
- Discord: [lien vers discord]
- Email: support@mydouble.com
