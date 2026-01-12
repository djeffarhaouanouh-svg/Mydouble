# Guide d'installation et de configuration - MyDouble

## 1. Configuration de la base de données Neon

### Étape 1: Exécuter le SQL dans Neon

Connectez-vous à votre console Neon (https://console.neon.tech) et exécutez le SQL suivant dans le SQL Editor :

```sql
-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  password VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des AI Doubles
CREATE TABLE IF NOT EXISTS ai_doubles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  personality JSONB NOT NULL,
  style_rules JSONB,
  voice_id VARCHAR(255),
  messages_count INTEGER DEFAULT 0,
  improvement_level INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des messages
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  role VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table des échantillons vocaux
CREATE TABLE IF NOT EXISTS voice_samples (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  filename VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table des screenshots
CREATE TABLE IF NOT EXISTS screenshots (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  filename VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_ai_doubles_user_id ON ai_doubles(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_samples_user_id ON voice_samples(user_id);
CREATE INDEX IF NOT EXISTS idx_screenshots_user_id ON screenshots(user_id);
```

### Étape 2: Vérifier les variables d'environnement

Votre fichier `.env.local` est déjà configuré avec :
- ✅ `DATABASE_URL` - Connexion à Neon
- ✅ `ANTHROPIC_API_KEY` - API Claude
- ✅ `ELEVENLABS_API_KEY` - Clonage vocal
- ✅ Autres clés API

## 2. Installation des dépendances

```bash
npm install
```

## 3. Lancer le serveur de développement

```bash
npm run dev
```

Le site sera accessible sur `http://localhost:3000`

## 4. APIs disponibles

### Authentification

#### POST `/api/auth/register`
Créer un nouveau compte utilisateur
```json
{
  "email": "user@example.com",
  "name": "Nom Utilisateur",
  "password": "motdepasse"
}
```

#### POST `/api/auth/login`
Se connecter
```json
{
  "email": "user@example.com",
  "password": "motdepasse"
}
```

### Gestion du profil

#### GET `/api/user/profile?userId=1`
Récupérer le profil d'un utilisateur

### Double IA

#### POST `/api/ai-double/create`
Créer un double IA
```json
{
  "userId": 1,
  "personality": {
    "tone": "friendly",
    "humor": "light",
    "emojis": "often",
    "messageLength": "medium",
    "interests": ["tech", "creative"]
  },
  "styleRules": {
    "expressions": ["mdr", "trop cool"],
    "punctuation": "casual with emojis"
  },
  "voiceId": "optional_voice_id"
}
```

#### GET `/api/double-ia/list?userId=1`
Liste tous les doubles IA d'un utilisateur

#### POST `/api/ai-double/chat`
Discuter avec le double IA
```json
{
  "userId": 1,
  "message": "Salut, comment ça va?",
  "conversationHistory": []
}
```

#### GET `/api/ai-double/messages?userId=1`
Récupérer l'historique des messages

#### POST `/api/ai-double/save-message`
Sauvegarder des messages
```json
{
  "userId": 1,
  "messagesList": [
    {
      "role": "user",
      "content": "Message utilisateur"
    },
    {
      "role": "ai",
      "content": "Réponse IA"
    }
  ]
}
```

### Clonage vocal

#### POST `/api/ai-double/clone-voice`
Cloner une voix avec ElevenLabs (multipart/form-data)
- `userId`: ID de l'utilisateur
- `name`: Nom de la voix
- `voice_1`, `voice_2`, `voice_3`, etc.: Fichiers audio (minimum 3)

### Analyse de style

#### POST `/api/ai-double/upload-screenshots`
Analyser le style d'écriture depuis des captures d'écran (multipart/form-data)
- `userId`: ID de l'utilisateur
- `screenshot_1`, `screenshot_2`, etc.: Images des conversations

## 5. Structure de la base de données

### Table `users`
- `id` - ID unique
- `email` - Email (unique)
- `name` - Nom
- `password` - Mot de passe (⚠️ À hasher en production!)
- `created_at` - Date de création
- `updated_at` - Dernière mise à jour

### Table `ai_doubles`
- `id` - ID unique
- `user_id` - Référence à l'utilisateur
- `personality` - Objet JSON avec la personnalité
- `style_rules` - Objet JSON avec les règles de style
- `voice_id` - ID de la voix clonée (ElevenLabs)
- `messages_count` - Nombre de messages échangés
- `improvement_level` - Niveau d'amélioration (0-100)
- `created_at` - Date de création
- `updated_at` - Dernière mise à jour

### Table `messages`
- `id` - ID unique
- `user_id` - Référence à l'utilisateur
- `role` - 'user' ou 'ai'
- `content` - Contenu du message
- `audio_url` - URL de l'audio (optionnel)
- `created_at` - Date de création

### Table `voice_samples`
- `id` - ID unique
- `user_id` - Référence à l'utilisateur
- `filename` - Nom du fichier
- `url` - URL du fichier audio
- `created_at` - Date de création

### Table `screenshots`
- `id` - ID unique
- `user_id` - Référence à l'utilisateur
- `filename` - Nom du fichier
- `url` - URL de l'image
- `created_at` - Date de création

## 6. Fonctionnalités activées

### Vercel Blob Storage
✅ **ACTIF** - Les fichiers sont automatiquement uploadés vers Vercel Blob :
- Échantillons vocaux (dans `/api/ai-double/clone-voice`)
- Screenshots (dans `/api/ai-double/upload-screenshots`)

Les URLs sont sauvegardées dans la base de données dans les tables `voice_samples` et `screenshots`.

### Google Vision API
✅ **ACTIF** - L'analyse d'images est fonctionnelle :
- Extraction automatique du texte des screenshots
- Analyse du style d'écriture avec Claude
- Sauvegarde des règles de style dans la base de données

### ElevenLabs Voice Cloning
✅ **ACTIF** - Le clonage vocal fonctionne :
- Upload de 3+ échantillons vocaux
- Création d'une voix personnalisée
- Sauvegarde du voice_id dans la base de données

### ElevenLabs Speech-to-Text
✅ **ACTIF** - La reconnaissance vocale professionnelle fonctionne :
- Enregistrement audio via MediaRecorder API
- Transcription avec ElevenLabs API (`eleven_multilingual_v2`)
- Qualité supérieure au Web Speech API natif
- Support multilingue (français optimisé)

### VAPI Voice Calling
✅ **ACTIF** - Les appels vocaux avec votre Double IA fonctionnent :
- Bouton téléphone dans le header de `/messages`
- Appels vocaux en temps réel avec votre assistant VAPI
- Indicateur visuel (rouge pulsant) pendant l'appel
- Gestion automatique de la connexion/déconnexion
- Configuration : `NEXT_PUBLIC_VAPI_PUBLIC_KEY` et `NEXT_PUBLIC_VAPI_ASSISTANT_ID`

## 7. Notes importantes

### Sécurité
⚠️ **IMPORTANT**: Les mots de passe sont actuellement stockés en clair. En production, vous DEVEZ :
1. Installer bcrypt: `npm install bcrypt @types/bcrypt`
2. Hasher les mots de passe avant de les sauvegarder
3. Utiliser `bcrypt.compare()` pour vérifier les mots de passe

### Exemple avec bcrypt:
```typescript
import bcrypt from 'bcrypt';

// Lors de l'inscription
const hashedPassword = await bcrypt.hash(password, 10);

// Lors de la connexion
const isValid = await bcrypt.compare(password, user.password);
```

### Prochaines étapes recommandées
1. Implémenter JWT pour l'authentification
2. Ajouter la validation avec Zod
3. Implémenter le stockage de fichiers (Vercel Blob, AWS S3, etc.)
4. Activer l'analyse réelle avec Claude Vision pour les screenshots
5. Ajouter des tests

## 7. Dépannage

### Erreur de connexion à la base de données
- Vérifiez que `DATABASE_URL` est correctement configuré dans `.env.local`
- Assurez-vous que les tables sont créées dans Neon

### Erreur avec les APIs
- Vérifiez que toutes les clés API sont configurées dans `.env.local`
- Consultez les logs dans la console du navigateur et du serveur

### Problèmes avec TypeScript
```bash
npm run build
```
Cela vérifiera les erreurs TypeScript.

## 8. Support

Pour toute question, vérifiez :
1. Les logs du serveur (`npm run dev`)
2. La console du navigateur (F12)
3. Les logs dans Neon Dashboard
