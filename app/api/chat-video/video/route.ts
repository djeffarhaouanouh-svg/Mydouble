import { NextRequest, NextResponse } from 'next/server';
import { getCharacterVideo } from '@/lib/static-characters';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const characterId = searchParams.get('characterId');
  const videoId = searchParams.get('videoId');

  if (!characterId || !videoId) {
    return NextResponse.json(
      { success: false, error: 'characterId et videoId sont requis' },
      { status: 400 }
    );
  }

  const charId = parseInt(characterId, 10);
  const vidId = parseInt(videoId, 10);

  if (isNaN(charId) || isNaN(vidId)) {
    return NextResponse.json(
      { success: false, error: 'characterId et videoId doivent être des nombres' },
      { status: 400 }
    );
  }

  const videoUrl = getCharacterVideo(charId, vidId);

  if (!videoUrl) {
    return NextResponse.json(
      { success: false, error: 'Vidéo non trouvée pour ce personnage' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    videoUrl,
    characterId: charId,
    videoId: vidId,
  });
}
