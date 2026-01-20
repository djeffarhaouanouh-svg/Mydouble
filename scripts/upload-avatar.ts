/**
 * Script pour uploader avatar-1.mp4 sur Vercel Blob
 * Exécuter une seule fois: npx ts-node scripts/upload-avatar.ts
 */

import { put } from '@vercel/blob';
import { readFileSync } from 'fs';
import { join } from 'path';

async function uploadAvatar() {
  const filePath = join(process.cwd(), 'public', 'avatar-1.mp4');

  console.log('Lecture du fichier:', filePath);
  const fileBuffer = readFileSync(filePath);

  console.log('Upload vers Vercel Blob...');
  const blob = await put('avatar-1.mp4', fileBuffer, {
    access: 'public',
    contentType: 'video/mp4',
  });

  console.log('\n✅ Upload réussi !');
  console.log('\nAjoute cette ligne dans .env.local:');
  console.log(`AVATAR_VIDEO_URL=${blob.url}`);
}

uploadAvatar().catch(console.error);
