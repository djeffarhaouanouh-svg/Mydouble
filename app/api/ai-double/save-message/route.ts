import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, messages } = body;
    
    if (!userId || !messages) {
      return NextResponse.json(
        { error: 'Données incomplètes' },
        { status: 400 }
      );
    }

    // Sauvegarder les messages dans la base de données Neon
    // const result = await saveMessages(userId, messages);

    // Incrémenter le compteur de messages et le niveau d'amélioration
    // await updateUserProgress(userId);

    return NextResponse.json({
      success: true,
      message: 'Messages sauvegardés',
    });

  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde' },
      { status: 500 }
    );
  }
}
