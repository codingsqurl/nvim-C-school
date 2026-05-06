export default function HomePage() {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-extrabold text-[var(--color-accent)] mb-4">🎉 Welcome to CodeKids! 🎉</h2>
      <p className="text-xl text-[var(--color-text)] mb-8">Ready to learn and have fun?</p>
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        <div className="p-6 border-4 border-[var(--color-accent)] rounded-2xl hover:bg-[var(--color-accent-bg)] transition-all cursor-pointer">
          <div className="text-4xl mb-2">📚</div>
          <div className="font-bold text-[var(--color-text-h)]">Learn</div>
        </div>
        <div className="p-6 border-4 border-[var(--color-accent)] rounded-2xl hover:bg-[var(--color-accent-bg)] transition-all cursor-pointer">
          <div className="text-4xl mb-2">⭐</div>
          <div className="font-bold text-[var(--color-text-h)]">Stars</div>
        </div>
        <div className="p-6 border-4 border-[var(--color-accent)] rounded-2xl hover:bg-[var(--color-accent-bg)] transition-all cursor-pointer">
          <div className="text-4xl mb-2">📝</div>
          <div className="font-bold text-[var(--color-text-h)]">Notes</div>
        </div>
        <div className="p-6 border-4 border-[var(--color-accent)] rounded-2xl hover:bg-[var(--color-accent-bg)] transition-all cursor-pointer">
          <div className="text-4xl mb-2">🔍</div>
          <div className="font-bold text-[var(--color-text-h)]">Find</div>
        </div>
      </div>
    </div>
  )
}