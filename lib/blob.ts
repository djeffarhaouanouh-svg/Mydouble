import { put } from '@vercel/blob';

/**
 * Upload un fichier vers Vercel Blob
 * @param file - Le fichier à uploader
 * @param filename - Le nom du fichier (optionnel, généré si non fourni)
 * @returns L'URL du fichier uploadé
 */
export async function uploadToBlob(file: File | Blob, filename?: string): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN non configuré');
  }

  const name = filename || `${Date.now()}-${crypto.randomUUID()}`;

  const blob = await put(name, file, {
    access: 'public',
    token,
  });

  return blob.url;
}

/**
 * Upload plusieurs fichiers vers Vercel Blob
 * @param files - Les fichiers à uploader
 * @param prefix - Préfixe pour les noms de fichiers
 * @returns Un tableau d'URLs des fichiers uploadés
 */
export async function uploadMultipleToBlob(
  files: (File | Blob)[],
  prefix: string = ''
): Promise<string[]> {
  const uploadPromises = files.map((file, index) => {
    const filename = `${prefix}${Date.now()}-${index}-${crypto.randomUUID()}`;
    return uploadToBlob(file, filename);
  });

  return Promise.all(uploadPromises);
}
