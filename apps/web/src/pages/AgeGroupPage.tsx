import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AgeGroupPage() {
  const [selected] = useState('k')
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('ageGroup', selected)
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-accent-bg)]">
      <div className="w-full max-w-md p-8 border-4 border-[var(--color-accent)] rounded-3xl bg-[var(--color-bg)]">
        <h1 className="text-3xl font-extrabold text-center text-[var(--color-accent)] mb-2">🌟 Welcome! 🌟</h1>
        <p className="text-center text-[var(--color-text)] mb-6">Pick your grade to start playing!</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <button
            type="submit"
            className="w-full p-6 border-4 border-[var(--color-accent)] rounded-2xl text-center hover:bg-[var(--color-accent-bg)] transition-all"
          >
            <div className="text-2xl font-extrabold text-[var(--color-accent)]">🧒 Kindergarten</div>
            <div className="text-lg text-[var(--color-text)]">Ages 5-6</div>
          </button>
        </form>
        <p className="text-center text-sm text-[var(--color-text)] mt-4">
          More grades coming soon! 🚀
        </p>
      </div>
    </div>
  )
}