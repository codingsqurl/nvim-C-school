import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-extrabold text-[var(--color-accent)] mb-4">🎉 Welcome to CodeKids! 🎉</h2>
      <p className="text-xl text-[var(--color-text)] mb-8">Ready to learn and have fun?</p>
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        <Link to="/courses" className="p-6 border-4 border-[var(--color-accent)] rounded-2xl hover:bg-[var(--color-accent-bg)] transition-all cursor-pointer">
          <div className="text-4xl mb-2">📚</div>
          <div className="font-bold text-[var(--color-text-h)]">Learn</div>
        </Link>
        <Link to="/progress" className="p-6 border-4 border-[var(--color-accent)] rounded-2xl hover:bg-[var(--color-accent-bg)] transition-all cursor-pointer">
          <div className="text-4xl mb-2">⭐</div>
          <div className="font-bold text-[var(--color-text-h)]">Stars</div>
        </Link>
        <Link to="/notes" className="p-6 border-4 border-[var(--color-accent)] rounded-2xl hover:bg-[var(--color-accent-bg)] transition-all cursor-pointer">
          <div className="text-4xl mb-2">📝</div>
          <div className="font-bold text-[var(--color-text-h)]">Notes</div>
        </Link>
        <Link to="/search" className="p-6 border-4 border-[var(--color-accent)] rounded-2xl hover:bg-[var(--color-accent-bg)] transition-all cursor-pointer">
          <div className="text-4xl mb-2">🔍</div>
          <div className="font-bold text-[var(--color-text-h)]">Find</div>
        </Link>
      </div>
    </div>
  )
}