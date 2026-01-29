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
 * Télécharge un fichier depuis une URL (ex. VModel) et l'upload vers Vercel Blob pour stockage permanent.
 * @param sourceUrl - URL publique du fichier (vidéo, image, etc.)
 * @param filename - Nom du fichier dans Blob (ex: videos/job-xxx.mp4)
 * @returns L'URL Blob permanente, ou null en cas d'erreur
 */
export async function copyUrlToBlob(sourceUrl: string, filename?: string): Promise<string | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.warn('BLOB_READ_WRITE_TOKEN non configuré - vidéo non copiée vers Blob');
    return null;
  }
  try {
    const res = await fetch(sourceUrl, { signal: AbortSignal.timeout(120_000) }); // 2 min max
    if (!res.ok) {
      console.error('copyUrlToBlob: fetch failed', res.status, sourceUrl);
      return null;
    }
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'video/mp4';
    const blob = new Blob([buffer], { type: contentType });
    const name = filename || `videos/${Date.now()}-${crypto.randomUUID()}.mp4`;
    const blobResult = await put(name, blob, { access: 'public', token });
    return blobResult.url;
  } catch (err) {
    console.error('copyUrlToBlob error:', err);
    return null;
  }
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
