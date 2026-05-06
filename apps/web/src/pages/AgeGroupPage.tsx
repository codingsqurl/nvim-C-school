import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ageGroups = [
  { id: 'k', label: 'Kindergarten', sublabel: 'Ages 5-6', range: [5, 6] },
  { id: 'elem', label: 'Elementary School', sublabel: 'Grades 1-5', range: [6, 11] },
  { id: 'mid', label: 'Middle School', sublabel: 'Grades 6-8', range: [11, 14] },
  { id: 'high', label: 'High School', sublabel: 'Grades 9-12', range: [14, 18] },
]

export default function AgeGroupPage() {
  const [selected, setSelected] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    localStorage.setItem('ageGroup', selected)
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8 border border-[var(--color-border)] rounded-lg">
        <h1 className="text-2xl font-bold text-center text-[var(--color-text-h)] mb-2">Welcome, Cadet</h1>
        <p className="text-center text-[var(--color-text)] mb-6">Select your grade level</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          {ageGroups.map(group => (
            <button
              key={group.id}
              type="button"
              onClick={() => setSelected(group.id)}
              className={`w-full p-4 border rounded-lg text-left transition-colors ${
                selected === group.id
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-bg)]'
                  : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'
              }`}
            >
              <div className="font-medium text-[var(--color-text-h)]">{group.label}</div>
              <div className="text-sm text-[var(--color-text)]">{group.sublabel}</div>
            </button>
          ))}
          <button
            type="submit"
            disabled={!selected}
            className="w-full py-2 bg-[var(--color-accent)] text-white rounded hover:opacity-90 disabled:opacity-50 mt-4"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  )
}