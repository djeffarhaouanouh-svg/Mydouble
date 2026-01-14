import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages, aiDoubles } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// Fonction helper pour mettre à jour les traits de manière asynchrone
async function updateTraitsAsync(userId: string, doubleId: number) {
  try {
    const { updateTraitsFromMessages } = await import('@/lib/update-traits');
    await updateTraitsFromMessages(userId, doubleId);
  } catch (error) {
    console.error('Erreur lors de la mise à jour des traits:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, messagesList, personality } = body;

    if (!userId || !messagesList || !Array.isArray(messagesList)) {
      return NextResponse.json(
        { error: 'Données incomplètes' },
        { status: 400 }
      );
    }

    // Sauvegarder les messages dans la base de données
    const messagesToInsert = messagesList.map((msg: any) => ({
      userId: parseInt(userId),
      role: msg.role,
      content: msg.content,
      audioUrl: msg.audioUrl || null,
      personality: personality || null, // NULL pour le double IA principal
    }));

    await db.insert(messages).values(messagesToInsert);

    // Incrémenter le compteur de messages
    const aiDouble = await db.select()
      .from(aiDoubles)
      .where(eq(aiDoubles.userId, parseInt(userId)))
      .limit(1);

    if (aiDouble && aiDouble.length > 0) {
      const newMessagesCount = (aiDouble[0].messagesCount || 0) + messagesList.length;
      await db.update(aiDoubles)
        .set({
          messagesCount: newMessagesCount,
          improvementLevel: Math.min(100, (aiDouble[0].improvementLevel || 0) + Math.floor(messagesList.length / 10))
        })
        .where(eq(aiDoubles.id, aiDouble[0].id));

      // Mettre à jour les traits tous les 10 messages (de manière asynchrone, ne pas bloquer)
      if (newMessagesCount > 0 && newMessagesCount % 10 === 0) {
        // Appeler la fonction de mise à jour en arrière-plan
        updateTraitsAsync(userId, aiDouble[0].id).catch(err => 
          console.error('Erreur mise à jour traits:', err)
        );
      }
    }

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
