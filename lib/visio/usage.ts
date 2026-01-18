import { db } from '@/lib/db';
import { visioUsage, visioSessions } from '@/lib/schema';
import { eq, and, sql } from 'drizzle-orm';
import { VisioUsageInfo } from './types';

// Obtenir le mois courant au format 'YYYY-MM'
export function getCurrentMonthYear(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Obtenir ou créer l'enregistrement d'usage pour un utilisateur ce mois
export async function getOrCreateUsage(userId: number): Promise<VisioUsageInfo> {
  const monthYear = getCurrentMonthYear();

  // Chercher l'enregistrement existant
  const existing = await db
    .select()
    .from(visioUsage)
    .where(and(eq(visioUsage.userId, userId), eq(visioUsage.monthYear, monthYear)))
    .limit(1);

  if (existing.length > 0) {
    const usage = existing[0];
    return {
      usedSeconds: usage.usedSeconds || 0,
      quotaSeconds: usage.quotaSeconds || 600,
      remainingSeconds: Math.max(0, (usage.quotaSeconds || 600) - (usage.usedSeconds || 0)),
      percentUsed: Math.min(100, ((usage.usedSeconds || 0) / (usage.quotaSeconds || 600)) * 100),
      monthYear,
    };
  }

  // Créer un nouvel enregistrement
  const newUsage = await db
    .insert(visioUsage)
    .values({
      userId,
      monthYear,
      usedSeconds: 0,
      quotaSeconds: 600, // 10 minutes par défaut
    })
    .returning();

  return {
    usedSeconds: 0,
    quotaSeconds: 600,
    remainingSeconds: 600,
    percentUsed: 0,
    monthYear,
  };
}

// Vérifier si l'utilisateur a assez de quota
export async function checkQuota(userId: number, requiredSeconds: number = 0): Promise<boolean> {
  const usage = await getOrCreateUsage(userId);
  return usage.remainingSeconds >= requiredSeconds;
}

// Consommer du temps de quota
export async function consumeQuota(userId: number, seconds: number): Promise<VisioUsageInfo> {
  const monthYear = getCurrentMonthYear();

  // D'abord récupérer l'usage actuel
  const current = await getOrCreateUsage(userId);
  const newUsed = (current.usedSeconds || 0) + Math.ceil(seconds);

  // Mettre à jour l'usage
  await db
    .update(visioUsage)
    .set({
      usedSeconds: newUsed,
      updatedAt: new Date(),
    })
    .where(and(eq(visioUsage.userId, userId), eq(visioUsage.monthYear, monthYear)));

  return getOrCreateUsage(userId);
}

// Créer une nouvelle session
export async function createSession(userId: number): Promise<string> {
  const sessionId = `visio_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  await db.insert(visioSessions).values({
    visioSessionId: sessionId,
    userId,
    startedAt: new Date(),
    durationSeconds: 0,
    messagesCount: 0,
  });

  return sessionId;
}

// Mettre à jour une session (ajouter un message)
export async function updateSession(
  sessionId: string,
  durationToAdd: number
): Promise<void> {
  // Récupérer la session actuelle
  const sessions = await db
    .select()
    .from(visioSessions)
    .where(eq(visioSessions.visioSessionId, sessionId))
    .limit(1);

  if (sessions.length === 0) return;

  const session = sessions[0];

  await db
    .update(visioSessions)
    .set({
      durationSeconds: (session.durationSeconds || 0) + Math.ceil(durationToAdd),
      messagesCount: (session.messagesCount || 0) + 1,
    })
    .where(eq(visioSessions.visioSessionId, sessionId));
}

// Terminer une session
export async function endSession(sessionId: string): Promise<void> {
  await db
    .update(visioSessions)
    .set({
      endedAt: new Date(),
    })
    .where(eq(visioSessions.visioSessionId, sessionId));
}

// Formater les secondes en mm:ss
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

// Formater les secondes en format lisible (ex: "5 min 30 sec")
export function formatTimeReadable(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins === 0) return `${secs} sec`;
  if (secs === 0) return `${mins} min`;
  return `${mins} min ${secs} sec`;
}
