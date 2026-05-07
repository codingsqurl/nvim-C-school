import { useState } from 'react';
import type { Audience } from '@/types/schema.ts';
import { useProfile } from '@/store/profile.ts';

export default function AudiencePicker() {
  const chooseAudience = useProfile((s) => s.chooseAudience);
  const [username, setUsername] = useState('');
  const [pending, setPending] = useState<Audience | null>(null);

  const select = async (audience: Audience) => {
    if (pending !== null) return;
    setPending(audience);
    try {
      await chooseAudience(audience, username || undefined);
    } catch {
      setPending(null);
    }
  };

  const isPending = pending !== null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center px-6 py-12">
      <h1 className="font-mono text-2xl mb-2">nvim-c-school</h1>
      <p className="text-sm text-zinc-400 mb-10">choose your path</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        <button
          type="button"
          onClick={() => void select('codekids')}
          disabled={isPending}
          className="text-left rounded-lg border border-zinc-800 bg-zinc-900 p-6 hover:border-zinc-600 hover:bg-zinc-800/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <h2 className="font-mono text-xl mb-1 text-zinc-100">CodeKids</h2>
          <p className="text-xs text-zinc-500 mb-3">ages 5–11</p>
          <p className="text-sm text-zinc-300">
            Learn with games, quests, and a magical world map.
          </p>
        </button>

        <button
          type="button"
          onClick={() => void select('codebuilders')}
          disabled={isPending}
          className="text-left rounded-lg border border-zinc-800 bg-zinc-900 p-6 hover:border-zinc-600 hover:bg-zinc-800/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <h2 className="font-mono text-xl mb-1 text-zinc-100">CodeBuilders</h2>
          <p className="text-xs text-zinc-500 mb-3">older learners</p>
          <p className="text-sm text-zinc-300">
            Master systems, languages, and tools through a real terminal and skill tree.
          </p>
        </button>
      </div>

      <div className="mt-8 w-full max-w-md">
        <label className="block text-xs font-mono text-zinc-500 mb-2" htmlFor="username">
          username
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="c-student"
          disabled={isPending}
          className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
        />
      </div>

      {isPending ? (
        <p className="mt-6 text-sm text-zinc-400 font-mono">creating profile…</p>
      ) : null}
    </div>
  );
}
