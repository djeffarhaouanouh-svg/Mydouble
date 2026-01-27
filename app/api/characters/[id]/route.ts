import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { characters } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const characterId = parseInt(id, 10);
    
    if (isNaN(characterId)) {
      return NextResponse.json(
        { error: 'ID de personnage invalide' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { voiceId } = body;

    // Vérifier que le personnage existe
    const existingCharacter = await db
      .select()
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);

    if (!existingCharacter || existingCharacter.length === 0) {
      return NextResponse.json(
        { error: 'Personnage non trouvé' },
        { status: 404 }
      );
    }

    // Mettre à jour le personnage
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (voiceId !== undefined) {
      updateData.voiceId = voiceId ? parseInt(voiceId, 10) : null;
    }

    const [updatedCharacter] = await db
      .update(characters)
      .set(updateData)
      .where(eq(characters.id, characterId))
      .returning();

    return NextResponse.json({
      success: true,
      character: {
        id: updatedCharacter.id,
        name: updatedCharacter.name,
        photoUrl: updatedCharacter.photoUrl,
        description: updatedCharacter.description,
        voiceId: updatedCharacter.voiceId,
        createdAt: updatedCharacter.createdAt ? new Date(updatedCharacter.createdAt).toISOString() : null,
      },
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du personnage:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du personnage' },
      { status: 500 }
    );
  }
}
