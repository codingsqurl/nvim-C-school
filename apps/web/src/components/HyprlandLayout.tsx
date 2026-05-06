import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Terminal from './Terminal'

const navLinks = [
  { path: '/', label: '🏠Home' },
  { path: '/courses', label: '📚Learn' },
  { path: '/notes', label: '📝My Notes' },
  { path: '/progress', label: '⭐Stars' },
  { path: '/search', label: '🔍Find' },
]

export default function HyprlandLayout() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex gap-4 p-4">
      <aside className="w-64 border-4 border-[var(--color-accent)] rounded-2xl p-4 flex flex-col bg-[var(--color-accent-bg)]">
        <h1 className="text-2xl font-extrabold mb-8 text-[var(--color-accent)] text-center">CodeKids</h1>
        <p className="text-center text-[var(--color-text-h)] mb-4 font-bold">Welcome back!</p>
        <nav className="flex-1 space-y-2">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`block px-4 py-3 rounded-xl text-lg font-bold transition-all ${
                location.pathname === link.path
                  ? 'bg-[var(--color-accent)] text-white shadow-lg scale-105'
                  : 'text-[var(--color-text-h)] hover:bg-[var(--color-social-bg)] hover:scale-102'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="pt-4 border-t-2 border-[var(--color-accent)]">
          <p className="text-center font-bold text-[var(--color-text-h)] mb-2">👤 {user?.username}</p>
          <button onClick={handleLogout} className="w-full text-center text-sm text-[var(--color-text)] hover:text-[var(--color-accent)]">
            👋 Bye Bye!
          </button>
        </div>
      </aside>
      <div className="flex-1 flex gap-4">
        <main className="flex-1 border-4 border-[var(--color-border)] rounded-2xl p-8 overflow-auto bg-[var(--color-bg)]">
          <Outlet />
        </main>
        <div className="w-[400px] border-4 border-[var(--color-accent)] rounded-2xl overflow-hidden">
          <Terminal />
        </div>
      </div>
    </div>
  )
}