# MyDouble - Crée ton Double IA

MyDouble est une plateforme qui permet à chaque utilisateur de créer son propre double IA en 3 étapes simples.

## 🚀 Concept

Le double IA apprend ton style d'écriture, ta personnalité et clone ta voix pour créer une copie virtuelle de toi-même. Le double s'améliore automatiquement à chaque conversation.

## ✨ Fonctionnalités

### 1. Onboarding en 3 étapes
- **Étape 1**: Upload de captures d'écran de conversations pour analyser le style d'écriture
- **Étape 2**: Questionnaire de personnalité (ton, humour, emojis, centres d'intérêt)
- **Étape 3**: Enregistrement vocal pour cloner la voix avec ElevenLabs

### 2. Chat avec ton Double IA
- Discute avec ton double IA en temps réel
- Le double IA utilise Claude de Anthropic pour générer les réponses
- Audio généré automatiquement avec ta voix clonée
- Auto-amélioration continue: plus tu parles, mieux il te comprend

### 3. Profil avec Carte de Personnalité
- Visualise ta carte de personnalité unique
- Suivi de la progression (messages échangés, niveau d'amélioration)
- Gestion des paramètres

## 🛠️ Stack Technique

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes
- **Base de données**: Neon PostgreSQL avec Drizzle ORM
- **IA**: Claude (Anthropic) pour la génération de réponses
- **Voix**: ElevenLabs pour le clonage vocal et TTS
- **Vision**: Claude Vision pour l'analyse des captures d'écran

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.local .env.local
# Remplir les valeurs dans .env.local

# Lancer le serveur de développement
npm run dev
```

## 🔑 Variables d'environnement requises

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://..."

# Anthropic Claude API
ANTHROPIC_API_KEY="sk-ant-..."

# ElevenLabs API
ELEVENLABS_API_KEY="..."

# App Config
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="MyDouble"
```

## 📊 Schéma de Base de Données

### Tables principales:
- `users` - Informations des utilisateurs
- `ai_doubles` - Configuration des doubles IA
- `messages` - Historique des conversations
- `voice_samples` - Échantillons vocaux uploadés
- `screenshots` - Captures d'écran uploadées

## 🔄 Workflow

1. **Inscription** → Créer un compte
2. **Onboarding** → 3 étapes pour configurer le double IA
3. **Chat** → Discuter avec son double IA
4. **Amélioration** → Le double apprend et s'améliore automatiquement

## 📱 Pages

- `/` - Page d'accueil
- `/creer-mon-double-ia` - Page de présentation
- `/onboarding-ia` - Processus de création du double (3 étapes)
- `/mon-double-ia` - Interface de chat avec le double
- `/profil` - Profil utilisateur avec carte de personnalité
- `/settings` - Paramètres

## 🎨 Design

- Thème sombre (noir)
- Couleurs principales: Dégradé rose (#e31fc1 → #ff6b9d → #ffc0cb)
- Animations fluides avec Framer Motion
- Interface responsive

## 🚧 Prochaines étapes

- [ ] Implémenter la vraie connexion à la base de données Neon
- [ ] Ajouter l'authentification (NextAuth.js)
- [ ] Implémenter le stockage de fichiers (S3/Cloudinary)
- [ ] Ajouter plus d'options de personnalisation
- [ ] Système de monétisation (abonnements)
- [ ] API pour intégrer avec Instagram/autres plateformes

## 📄 Licence

Propriétaire - Tous droits réservés
