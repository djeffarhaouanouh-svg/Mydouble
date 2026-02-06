import { NextRequest, NextResponse } from 'next/server';
import { getCharacterImage } from '@/lib/static-characters';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const characterId = searchParams.get('characterId');
  const imageId = searchParams.get('imageId');

  if (!characterId || !imageId) {
    return NextResponse.json(
      { success: false, error: 'characterId et imageId sont requis' },
      { status: 400 }
    );
  }

  const charId = parseInt(characterId, 10);
  const imgId = parseInt(imageId, 10);

  if (isNaN(charId) || isNaN(imgId)) {
    return NextResponse.json(
      { success: false, error: 'characterId et imageId doivent être des nombres' },
      { status: 400 }
    );
  }

  const imageUrl = getCharacterImage(charId, imgId);

  if (!imageUrl) {
    return NextResponse.json(
      { success: false, error: 'Image non trouvée pour ce personnage' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    imageUrl,
    characterId: charId,
    imageId: imgId,
  });
}
