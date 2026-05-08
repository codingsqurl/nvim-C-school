import { NavLink, Outlet } from 'react-router-dom';
import type { Audience } from '@/types/schema.ts';
import { useProfile } from '@/store/profile.ts';

interface NavRoute {
  to: string;
  label: string;
  audiences: ReadonlyArray<Audience>;
}

const ROUTES: ReadonlyArray<NavRoute> = [
  { to: '/curriculum', label: 'curriculum', audiences: ['codekids', 'codebuilders'] },
  { to: '/exercises', label: 'exercises', audiences: ['codekids', 'codebuilders'] },
  { to: '/arcade', label: 'arcade', audiences: ['codekids'] },
  { to: '/concepts', label: 'concepts', audiences: ['codekids', 'codebuilders'] },
  { to: '/terminal', label: 'terminal', audiences: ['codebuilders'] },
  { to: '/neovim', label: 'neovim', audiences: ['codebuilders'] },
  { to: '/embedded', label: 'embedded', audiences: ['codekids', 'codebuilders'] },
];

export default function Layout() {
  const profile = useProfile((s) => s.profile);
  const audience: Audience | null = profile?.audience ?? null;

  const visible = ROUTES.filter((r) => audience !== null && r.audiences.includes(audience));

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950">
        <nav className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-6">
          <span className="font-mono text-sm font-semibold text-zinc-100">nvim-c-school</span>
          <ul className="flex items-center gap-4 text-sm font-mono">
            {visible.map((r) => (
              <li key={r.to}>
                <NavLink
                  to={r.to}
                  className={({ isActive }) =>
                    isActive
                      ? 'text-zinc-100 underline underline-offset-4'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }
                >
                  {r.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-zinc-800 bg-zinc-950">
        <div className="max-w-5xl mx-auto px-6 py-2 text-xs font-mono text-zinc-500 flex items-center justify-between">
          <span>{audience ?? 'no audience'}</span>
          <span>{profile?.username ?? 'anonymous'}</span>
        </div>
      </footer>
    </div>
  );
}
