import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';
import type { Profile, ProfileV1 } from '@/types/schema.ts';

const DB_NAME = 'nvim-c-school';
const DB_VERSION = 1;
const STORE = 'profile';
const SINGLETON_KEY = 'singleton';
const LEGACY_KEY = 'c-school-profile';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

interface StoredProfile extends Profile {
  id: string;
}

export async function loadProfile(): Promise<Profile | null> {
  const db = await getDB();
  const record = await db.get(STORE, SINGLETON_KEY);
  if (!record) return null;
  const { id: _id, ...profile } = record as StoredProfile & { id: string };
  void _id;
  return profile as Profile;
}

export async function saveProfile(profile: Profile): Promise<void> {
  const db = await getDB();
  await db.put(STORE, { ...profile, id: SINGLETON_KEY });
  fetch('/api/profile/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile }),
  }).catch(() => {});
}

function isLegacyV1(value: unknown): value is ProfileV1 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  if (typeof record.id !== 'string') return false;
  if (typeof record.username !== 'string') return false;
  if (typeof record.stats !== 'object' || record.stats === null) return false;
  if (record.schema_version === 2) return false;
  return true;
}

export function loadLegacyProfile(): ProfileV1 | null {
  const raw = localStorage.getItem(LEGACY_KEY);
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isLegacyV1(parsed)) return null;
  return parsed;
}

export function clearLegacyProfile(): void {
  localStorage.removeItem(LEGACY_KEY);
}
