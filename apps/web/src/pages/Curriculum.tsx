import { useEffect, useState } from 'react';
import type { LoadCourseSuccess } from '@/lib/courses.ts';
import { loadCourseContent } from '@/lib/courses.ts';

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; data: LoadCourseSuccess };

export default function Curriculum() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await loadCourseContent('languages', 2);
      if (cancelled) return;
      if ('error' in result) {
        setState({ kind: 'error', message: result.error });
      } else {
        setState({ kind: 'success', data: result });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === 'loading') {
    return <div className="p-6 text-zinc-400">loading lesson…</div>;
  }

  if (state.kind === 'error') {
    return <div className="p-6 text-red-400">error: {state.message}</div>;
  }

  const { data } = state;

  return (
    <article
      className={
        'max-w-3xl mx-auto p-6 text-zinc-100 ' +
        '[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-4 ' +
        '[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3 ' +
        '[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2 ' +
        '[&_p]:my-3 [&_p]:leading-relaxed ' +
        '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 ' +
        '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 ' +
        '[&_li]:my-1 ' +
        '[&_code]:bg-zinc-800 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono ' +
        '[&_pre]:bg-zinc-900 [&_pre]:border [&_pre]:border-zinc-800 [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:my-4 ' +
        '[&_pre_code]:bg-transparent [&_pre_code]:p-0 ' +
        '[&_a]:text-blue-400 [&_a]:underline ' +
        '[&_blockquote]:border-l-4 [&_blockquote]:border-zinc-700 [&_blockquote]:pl-4 [&_blockquote]:text-zinc-400 [&_blockquote]:my-3'
      }
    >
      <header className="mb-6 border-b border-zinc-800 pb-4">
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
          {data.courseIcon} {data.courseName}
        </p>
        <h1 className="text-3xl font-bold text-zinc-100 mt-2">{data.title}</h1>
        <p className="text-xs font-mono text-zinc-500 mt-1">level: {data.level}</p>
      </header>
      <div dangerouslySetInnerHTML={{ __html: data.html }} />
    </article>
  );
}
