import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { characters } from '@/lib/schema';
import { eq } from 'drizzle-orm';

/** GET /api/characters/[id] — retourne le personnage (dont systemPrompt) pour consulter le prompt système. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const characterId = parseInt(id, 10);
    if (isNaN(characterId)) {
      return NextResponse.json({ error: 'ID de personnage invalide' }, { status: 400 });
    }
    const [character] = await db
      .select()
      .from(characters)
      .where(eq(characters.id, characterId))
      .limit(1);
    if (!character) {
      return NextResponse.json({ error: 'Personnage non trouvé' }, { status: 404 });
    }
    return NextResponse.json({
      character: {
        id: character.id,
        name: character.name,
        photoUrl: character.photoUrl,
        description: character.description ?? null,
        systemPrompt: character.systemPrompt ?? null,
        voiceId: character.voiceId,
        elevenlabsVoiceId: character.elevenlabsVoiceId ?? null,
        createdAt: character.createdAt ? new Date(character.createdAt).toISOString() : null,
      },
    });
  } catch (error) {
    console.error('Erreur GET character:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération du personnage' }, { status: 500 });
  }
}

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
    const { voiceId, elevenlabsVoiceId, name, description, systemPrompt, photoUrl } = body;

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

    // Mettre à jour le personnage avec tous les champs fournis
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (voiceId !== undefined) {
      updateData.voiceId = voiceId ? parseInt(voiceId, 10) : null;
    }
    if (elevenlabsVoiceId !== undefined) {
      updateData.elevenlabsVoiceId = elevenlabsVoiceId || null;
    }
    if (name !== undefined) {
      updateData.name = name.trim();
    }
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }
    if (systemPrompt !== undefined) {
      updateData.systemPrompt = systemPrompt?.trim() || null;
    }
    if (photoUrl !== undefined) {
      updateData.photoUrl = photoUrl;
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
        systemPrompt: updatedCharacter.systemPrompt,
        voiceId: updatedCharacter.voiceId,
        elevenlabsVoiceId: updatedCharacter.elevenlabsVoiceId,
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
