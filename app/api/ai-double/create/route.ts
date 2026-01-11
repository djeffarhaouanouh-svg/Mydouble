import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, personality, voiceId } = body;
    
    if (!userId || !personality) {
      return NextResponse.json(
        { error: 'Données incomplètes' },
        { status: 400 }
      );
    }

    // Sauvegarder le double IA dans la base de données Neon
    // const result = await createAIDouble(userId, personality, voiceId);

    // Mock pour l'instant
    const mockResult = {
      id: `ai_double_${Date.now()}`,
      userId,
      personality,
      voiceId,
      createdAt: new Date().toISOString(),
      improvementLevel: 0,
      messagesCount: 0,
    };

    return NextResponse.json({
      success: true,
      aiDouble: mockResult,
      message: 'Double IA créé avec succès',
    });

  } catch (error) {
    console.error('Erreur lors de la création:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du double IA' },
      { status: 500 }
    );
  }
}
