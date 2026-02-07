import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIndex = trimmed.indexOf('=');
  if (eqIndex === -1) continue;
  const key = trimmed.slice(0, eqIndex).trim();
  const value = trimmed.slice(eqIndex + 1).trim();
  if (!process.env[key]) process.env[key] = value;
}

async function main() {
  const { db } = await import('../lib/db');
  const { messages } = await import('../lib/schema');

  const deleted = await db.delete(messages).returning({ id: messages.id });
  console.log(`${deleted.length} messages supprimés.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
