import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated) {
    const hasProgram = localStorage.getItem('program')
    navigate(hasProgram ? '/' : '/age-group', { replace: true })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      const hasProgram = localStorage.getItem('program')
      navigate(hasProgram ? '/' : '/age-group')
    } catch (err) {
      setError('Oops! Try again!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1a1b26] to-[#24283b] p-4">
      <div className="w-full max-w-md p-8 border-2 border-[#414868] rounded-3xl bg-[#1a1b26]">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🌱</div>
          <h1 className="text-3xl font-extrabold text-white mb-2">RootCode Academy</h1>
          <p className="text-[#a9b1d6]">Plant the first bit. Grow the entire machine.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-[#f7768e] text-sm text-center font-bold">{error}</p>
          )}
          <div>
            <label className="block text-sm text-[#a9b1d6] mb-1 font-bold">Your Name</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-3 border-2 border-[#414868] rounded-xl bg-[#24283b] text-white font-bold"
              placeholder="Enter your name"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[#a9b1d6] mb-1 font-bold">Secret Word</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-[#414868] rounded-xl bg-[#24283b] text-white font-bold"
              placeholder="******"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#7aa2f7] text-[#1a1b26] rounded-xl font-bold text-lg hover:opacity-90 disabled:opacity-50"
          >
            {loading ? '⏳ Coming...' : '🚀 Start Learning!'}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-[#565f89]">
          No watered-down content. No fake abstractions.<br/>
          Just real low-level programming, made fun.
        </div>
      </div>
    </div>
  )
}
