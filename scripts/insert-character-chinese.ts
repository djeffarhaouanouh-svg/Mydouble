/**
 * Script pour créer un personnage manuellement avec l'image chinese.png
 * Usage: npx tsx scripts/insert-character-chinese.ts
 * (Assurez-vous que DATABASE_URL est défini, ex. dans .env.local)
 */

import { db } from '../lib/db';
import { characters, users } from '../lib/schema';
import { eq } from 'drizzle-orm';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL manquant. Définissez-la dans .env');
    process.exit(1);
  }

  // Récupérer le premier utilisateur (créateur du personnage)
  const [firstUser] = await db
    .select({ id: users.id })
    .from(users)
    .orderBy(users.id)
    .limit(1);

  if (!firstUser) {
    console.error('Aucun utilisateur en base. Créez un compte d’abord.');
    process.exit(1);
  }

  const [newCharacter] = await db
    .insert(characters)
    .values({
      userId: firstUser.id,
      name: 'Chinese',
      photoUrl: '/chinese.png',
      description: "Personnage créé manuellement avec l'image Chinese.",
      systemPrompt:
        "Tu es un personnage amical et accueillant. Tu réponds avec bienveillance.",
      isPublic: true,
      messagesCount: 0,
    })
    .returning();

  console.log('Personnage créé avec succès:');
  console.log({
    id: newCharacter.id,
    name: newCharacter.name,
    photoUrl: newCharacter.photoUrl,
    userId: newCharacter.userId,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
