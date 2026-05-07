import { create } from 'zustand';
import type { Audience, Profile, ProfileV1 } from '@/types/schema.ts';
import {
  clearLegacyProfile,
  loadLegacyProfile,
  loadProfile,
  saveProfile,
} from '@/store/persistence.ts';
import { createFreshProfile, migrateV1ToV2 } from '@/store/migrate.ts';

type Status = 'idle' | 'loading' | 'ready' | 'needs_audience';

interface ProfileStore {
  profile: Profile | null;
  status: Status;
  legacyV1: ProfileV1 | null;
  bootstrap: () => Promise<void>;
  chooseAudience: (audience: Audience, username?: string) => Promise<void>;
  update: (patch: Partial<Profile>) => Promise<void>;
}

export const useProfile = create<ProfileStore>((set, get) => ({
  profile: null,
  status: 'idle',
  legacyV1: null,

  bootstrap: async () => {
    set({ status: 'loading' });
    const existing = await loadProfile();
    if (existing) {
      set({ profile: existing, status: 'ready', legacyV1: null });
      return;
    }
    const legacy = loadLegacyProfile();
    if (legacy) {
      set({ profile: null, legacyV1: legacy, status: 'needs_audience' });
      return;
    }
    set({ profile: null, legacyV1: null, status: 'needs_audience' });
  },

  chooseAudience: async (audience, username) => {
    const { legacyV1 } = get();
    let next: Profile;
    if (legacyV1) {
      next = migrateV1ToV2(legacyV1, audience);
      await saveProfile(next);
      clearLegacyProfile();
    } else {
      next = createFreshProfile(audience, username ?? 'c-student');
      await saveProfile(next);
    }
    set({ profile: next, status: 'ready', legacyV1: null });
  },

  update: async (patch) => {
    const { profile } = get();
    if (!profile) {
      throw new Error('useProfile.update called before profile is ready');
    }
    const next: Profile = { ...profile, ...patch };
    set({ profile: next });
    await saveProfile(next);
  },
}));
