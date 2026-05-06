import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      const ageGroup = localStorage.getItem('ageGroup')
      navigate(ageGroup ? '/' : '/age-group')
    } catch (err) {
      setError('Oops! Try again!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-accent-bg)]">
      <div className="w-full max-w-md p-8 border-4 border-[var(--color-accent)] rounded-3xl bg-[var(--color-bg)]">
        <h1 className="text-4xl font-extrabold text-center text-[var(--color-accent)] mb-2">CodeKids</h1>
        <p className="text-center text-[var(--color-text)] mb-6">Let's learn to code!</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-[var(--color-accent)] text-sm text-center font-bold">{error}</p>
          )}
          <div>
            <label className="block text-sm text-[var(--color-text)] mb-1 font-bold">Your Name</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-3 border-4 border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] text-[var(--color-text-h)] font-bold"
              placeholder="Kiddo"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--color-text)] mb-1 font-bold">Secret Word</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-4 border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] text-[var(--color-text-h)] font-bold"
              placeholder="******"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[var(--color-accent)] text-white rounded-xl font-bold text-lg hover:opacity-90 disabled:opacity-50"
          >
            {loading ? '⏳ Coming...' : '🎮 Let\'s Go!'}
          </button>
        </form>
      </div>
    </div>
  )
}