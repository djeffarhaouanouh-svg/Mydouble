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

    // Récupérer les doubles IA de l'utilisateur depuis la base de données
    // const doubles = await getUserDoubles(userId);

    // Mock pour l'instant - retourner un double IA actif
    const mockDoubles = [
      {
        id: 1,
        userId: userId,
        name: 'Mon Double IA',
        status: 'active',
        is_public: false,
        share_slug: `double-${userId}`,
        created_at: new Date().toISOString(),
        personality: {
          tone: 'friendly',
          humor: 'light',
          emojis: 'often',
          messageLength: 'medium',
          interests: ['tech', 'creative'],
        },
        messagesCount: 0,
        improvementLevel: 0,
      },
    ];

    return NextResponse.json({
      success: true,
      doubles: mockDoubles,
    });

  } catch (error) {
    console.error('Erreur lors du chargement:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des doubles IA' },
      { status: 500 }
    );
  }
}
