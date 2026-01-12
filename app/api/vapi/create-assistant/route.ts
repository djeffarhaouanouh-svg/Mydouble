import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiDoubles } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId requis' },
        { status: 400 }
      );
    }

    // Récupérer le double IA avec le voiceId
    const aiDouble = await db.select()
      .from(aiDoubles)
      .where(eq(aiDoubles.userId, parseInt(userId)))
      .limit(1);

    if (!aiDouble || aiDouble.length === 0) {
      return NextResponse.json(
        { error: 'Double IA non trouvé' },
        { status: 404 }
      );
    }

    const voiceId = aiDouble[0].voiceId;

    if (!voiceId) {
      return NextResponse.json(
        { error: 'Aucune voix clonée trouvée. Veuillez d\'abord créer votre voix.' },
        { status: 400 }
      );
    }

    // Clé API VAPI (secrète, côté serveur)
    const vapiApiKey = process.env.VAPI_API_KEY;

    if (!vapiApiKey) {
      return NextResponse.json(
        { error: 'VAPI API Key non configurée' },
        { status: 500 }
      );
    }

    // Créer ou mettre à jour l'assistant VAPI avec le voiceId
    // VAPI utilise ElevenLabs comme provider de voix
    const assistantData = {
      name: `Double IA - User ${userId}`,
      model: {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: `Tu es le double IA de l'utilisateur. Réponds de manière naturelle et conversationnelle.`,
          },
        ],
      },
      voice: {
        provider: 'elevenlabs',
        voiceId: voiceId,
      },
      firstMessage: 'Salut ! Je suis ton double IA. Comment ça va ?',
      serverUrl: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/ai-double/chat` : undefined,
    };

    // Vérifier si un assistant existe déjà pour cet utilisateur
    // Si oui, on le met à jour, sinon on en crée un nouveau
    const assistantId = aiDouble[0].vapiAssistantId;

    let vapiResponse;
    if (assistantId) {
      // Mettre à jour l'assistant existant
      vapiResponse = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${vapiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assistantData),
      });
    } else {
      // Créer un nouvel assistant
      vapiResponse = await fetch('https://api.vapi.ai/assistant', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${vapiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assistantData),
      });
    }

    if (!vapiResponse.ok) {
      const errorText = await vapiResponse.text();
      console.error('Erreur VAPI:', errorText);
      return NextResponse.json(
        { error: 'Erreur lors de la création/mise à jour de l\'assistant VAPI' },
        { status: 500 }
      );
    }

    const vapiResult = await vapiResponse.json();
    const newAssistantId = vapiResult.id || assistantId;

    // Sauvegarder l'assistantId dans la base de données
    await db.update(aiDoubles)
      .set({ vapiAssistantId: newAssistantId })
      .where(eq(aiDoubles.id, aiDouble[0].id));

    return NextResponse.json({
      success: true,
      assistantId: newAssistantId,
      message: 'Assistant VAPI créé/mis à jour avec succès',
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'assistant VAPI:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'assistant VAPI' },
      { status: 500 }
    );
  }
}
