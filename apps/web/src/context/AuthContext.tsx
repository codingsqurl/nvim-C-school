import { createContext, useContext, useState, type ReactNode } from 'react'

export type User = {
  username: string
  isAdmin: boolean
}

type AuthContextType = {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const ADMIN_USERS = ['codingsqurl']

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })

  const login = async (username: string, password: string) => {
    if (username && password) {
      const isAdmin = ADMIN_USERS.includes(username)
      const userData = { username, isAdmin }
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
    } else {
      throw new Error('Invalid credentials')
    }
  }

  const logout = () => {
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isAdmin: user?.isAdmin ?? false, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}