import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import HyprlandLayout from './components/HyprlandLayout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import AgeGroupPage from './pages/AgeGroupPage'
import HomePage from './pages/HomePage'
import CoursesPage from './pages/CoursesPage'
import NotesPage from './pages/NotesPage'
import ProgressPage from './pages/ProgressPage'
import SearchPage from './pages/SearchPage'
import StarTermPage from './pages/StarTermPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/age-group" element={
            <ProtectedRoute>
              <AgeGroupPage />
            </ProtectedRoute>
          } />
          <Route path="/" element={
            <ProtectedRoute>
              <HyprlandLayout />
            </ProtectedRoute>
          }>
            <Route index element={<HomePage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="terminal" element={<StarTermPage />} />
            <Route path="notes" element={<NotesPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}