import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'UserId requis' },
        { status: 400 }
      );
    }

    // Récupérer le profil depuis la base de données Neon
    // const profile = await getUserProfile(userId);

    // Mock pour l'instant
    const mockProfile = {
      user: {
        id: userId,
        name: 'Utilisateur',
        email: 'user@example.com',
        avatar_url: null, // TODO: Récupérer depuis la DB
        personality: {
          tone: 'friendly',
          humor: 'light',
          emojis: 'often',
          messageLength: 'medium',
          interests: ['tech', 'creative'],
        },
        voiceId: 'voice_123',
        createdAt: new Date().toISOString(),
        messagesCount: 42,
        improvementLevel: 35,
      }
    };

    return NextResponse.json(mockProfile);

  } catch (error) {
    console.error('Erreur lors du chargement:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement du profil' },
      { status: 500 }
    );
  }
}
