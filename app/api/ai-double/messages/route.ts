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

    // Récupérer les messages depuis la base de données
    // const messages = await getMessages(userId);

    // Mock pour l'instant
    const mockMessages = [];

    return NextResponse.json({
      success: true,
      messages: mockMessages,
    });

  } catch (error) {
    console.error('Erreur lors du chargement:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des messages' },
      { status: 500 }
    );
  }
}
