import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Terminal from './Terminal'

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/courses', label: 'Courses' },
  { path: '/notes', label: 'Notes' },
  { path: '/progress', label: 'Progress' },
  { path: '/search', label: 'Search' },
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
      <aside className="w-56 border border-[var(--color-border)] rounded-lg p-4 flex flex-col">
        <h1 className="text-xl font-bold mb-8 text-[var(--color-text-h)]">Learn</h1>
        <nav className="flex-1 space-y-1">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`block px-3 py-2 rounded text-sm transition-colors ${
                location.pathname === link.path
                  ? 'bg-[var(--color-accent-bg)] text-[var(--color-accent)] border border-[var(--color-accent-border)]'
                  : 'text-[var(--color-text)] hover:bg-[var(--color-social-bg)]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="pt-4 border-t border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-text)] mb-2">{user?.username}</p>
          <button onClick={handleLogout} className="text-sm text-[var(--color-text)] hover:text-[var(--color-text-h)]">
            Sign Out
          </button>
        </div>
      </aside>
      <div className="flex-1 flex gap-4">
        <main className="flex-1 border border-[var(--color-border)] rounded-lg p-8 overflow-auto">
          <Outlet />
        </main>
        <div className="w-[500px] border border-[var(--color-border)] rounded-lg overflow-hidden">
          <Terminal />
        </div>
      </div>
    </div>
  )
}