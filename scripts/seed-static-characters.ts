/**
 * Script pour insérer tous les personnages statiques en base de données
 * Usage: npx tsx scripts/seed-static-characters.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Charger .env.local AVANT tout import de db
const envPath = resolve(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIndex = trimmed.indexOf('=');
  if (eqIndex === -1) continue;
  const key = trimmed.slice(0, eqIndex).trim();
  const value = trimmed.slice(eqIndex + 1).trim();
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

async function main() {
  // Import dynamique APRÈS le chargement des env vars
  const { db } = await import('../lib/db');
  const { characters, users } = await import('../lib/schema');
  const { eq } = await import('drizzle-orm');
  const { STATIC_AVATARS } = await import('../lib/static-characters');

  // Récupérer le premier utilisateur (créateur des personnages)
  const [firstUser] = await db
    .select({ id: users.id })
    .from(users)
    .orderBy(users.id)
    .limit(1);

  if (!firstUser) {
    console.error('Aucun utilisateur en base. Créez un compte d\'abord.');
    process.exit(1);
  }

  console.log(`Utilisation de l'utilisateur ID ${firstUser.id} comme créateur.`);
  console.log(`${STATIC_AVATARS.length} personnages à insérer...\n`);

  for (const avatar of STATIC_AVATARS) {
    // Vérifier si un personnage avec ce nom existe déjà
    const existing = await db
      .select({ id: characters.id })
      .from(characters)
      .where(eq(characters.name, avatar.name))
      .limit(1);

    if (existing.length > 0) {
      console.log(`"${avatar.name}" existe déjà (ID ${existing[0].id}), ignoré.`);
      continue;
    }

    const [newCharacter] = await db
      .insert(characters)
      .values({
        userId: firstUser.id,
        name: avatar.name,
        photoUrl: avatar.photoUrl,
        description: avatar.description,
        systemPrompt: avatar.systemPrompt,
        elevenlabsVoiceId: avatar.elevenlabsVoiceId,
        isPublic: true,
        messagesCount: avatar.messagesCount,
      })
      .returning();

    console.log(`"${newCharacter.name}" créé (ID ${newCharacter.id})`);
  }

  console.log('\nTerminé !');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
