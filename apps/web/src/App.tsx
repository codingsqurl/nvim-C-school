import { useEffect, useRef } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useProfile } from '@/store/profile.ts';
import { router } from '@/router.tsx';
import AudiencePicker from '@/pages/AudiencePicker.tsx';

export default function App() {
  const status = useProfile((s) => s.status);
  const profile = useProfile((s) => s.profile);
  const bootstrap = useProfile((s) => s.bootstrap);
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    if (status !== 'idle') return;
    bootstrappedRef.current = true;
    void bootstrap();
  }, [status, bootstrap]);

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <p className="text-sm text-zinc-400 font-mono">loading…</p>
      </div>
    );
  }

  if (status === 'needs_audience') {
    return <AudiencePicker />;
  }

  if (status === 'ready' && profile) {
    return <RouterProvider router={router} />;
  }

  return null;
}
