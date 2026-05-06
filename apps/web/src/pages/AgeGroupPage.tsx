import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type Program = {
  id: string
  name: string
  description: string
  tagline: string
  ageRange: string
  icon: string
  color: string
  story: string
}

const programs: Program[] = [
  { 
    id: 'kinder', 
    name: 'KinderRoot', 
    description: 'Explore the cosmos with your crew!',
    tagline: 'Space Coders: Ready for launch!',
    ageRange: 'Ages 5-10', 
    icon: '🚀', 
    color: '#4CAF50',
    story: 'Pilot the Bit Explorer starship through deep space. Fix navigation, power systems, unlock star sectors with real programming.'
  },
  { 
    id: 'byte', 
    name: 'ByteForge', 
    description: 'Build real systems with your hands.',
    tagline: 'Forge the machine!',
    ageRange: 'Ages 10-14', 
    icon: '🔨', 
    color: '#FF9800',
    story: 'From assembly to C — build actual working programs that control the machine.'
  },
  { 
    id: 'kernel', 
    name: 'KernelCamp', 
    description: 'Real systems programming.',
    tagline: 'Dive into the OS!',
    ageRange: 'Ages 14+', 
    icon: '⚙️', 
    color: '#9C27B0',
    story: 'Operating systems, memory management, and the heart of the machine.'
  },
  { 
    id: 'metal', 
    name: 'BareMetal', 
    description: 'Hack the machine at the hardware level.',
    tagline: 'Direct hardware access!',
    ageRange: 'Adults', 
    icon: '🔧', 
    color: '#F44336',
    story: 'Embedded systems, reverse engineering, and bare-metal programming.'
  },
]

const characters = [
  { name: 'Chip', role: 'CPU Space Probe', icon: '🔴', desc: 'Your cheerful probe buddy with glowing thrusters' },
  { name: 'Bitty & Byte', role: 'Twin Astronauts', icon: '🔵🟣', desc: 'The 1 and 0 team' },
  { name: 'Memo', role: 'Memory Core', icon: '🟦', desc: 'Friendly storage monster with glowing drawers' },
  { name: 'Gate Guardian', role: 'Logic Astronaut', icon: '🟢', desc: 'Opens gates with clean logic' },
]

export default function AgeGroupPage() {
  const [selected, setSelected] = useState('kinder')
  const [showCharacters, setShowCharacters] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('ageGroup', selected)
    localStorage.setItem('program', programs.find(p => p.id === selected)?.name || 'KinderRoot')
    navigate('/')
  }

  const selectedProgram = programs.find(p => p.id === selected)

  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-auto">
      <div className="w-full max-w-4xl">
        {/* Space Background */}
        <div className="relative mb-8 text-center">
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute top-4 left-1/4 w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <div className="absolute top-12 right-1/3 w-1 h-1 bg-white rounded-full"></div>
            <div className="absolute top-20 left-1/2 w-1 h-1 bg-white rounded-full"></div>
            <div className="absolute top-8 right-1/4 w-3 h-3 bg-purple-500 rounded-full opacity-50"></div>
            <div className="absolute top-16 left-1/3 w-2 h-2 bg-blue-400 rounded-full opacity-50"></div>
          </div>
          
          <div className="text-6xl mb-4">🚀</div>
          <h1 className="text-5xl font-extrabold text-white mb-2">RootCode Academy</h1>
          <p className="text-xl text-[#a9b1d6]">Plant the first bit. Grow the entire machine.</p>
        </div>

        {/* Crew Preview */}
        <div className="mb-6">
          <button 
            onClick={() => setShowCharacters(!showCharacters)}
            className="text-sm text-[#7aa2f7] hover:text-[#89b4fa] underline"
          >
            {showCharacters ? '▼ Hide Crew' : '▼ Meet Your Space Crew'}
          </button>
          
          {showCharacters && (
            <div className="grid grid-cols-4 gap-3 mt-3 p-4 rounded-xl" style={{ backgroundColor: '#24283b' }}>
              {characters.map(char => (
                <div key={char.name} className="text-center">
                  <div className="text-2xl mb-1">{char.icon}</div>
                  <div className="text-sm font-bold text-white">{char.name}</div>
                  <div className="text-xs text-[#565f89]">{char.desc}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Program Selector */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {programs.map(program => (
            <button
              key={program.id}
              onClick={() => setSelected(program.id)}
              className={`p-5 rounded-2xl text-left transition-all ${
                selected === program.id
                  ? 'border-4 scale-[1.02]'
                  : 'border-2 border-[#414868] hover:border-[#7aa2f7]'
              }`}
              style={{
                backgroundColor: selected === program.id ? program.color + '15' : '#1a1b26',
                borderColor: selected === program.id ? program.color : '#414868',
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{program.icon}</span>
                <div>
                  <div className="text-lg font-bold text-white">{program.name}</div>
                  <div className="text-xs text-[#565f89]">{program.ageRange}</div>
                </div>
              </div>
              <div className="text-sm text-[#a9b1d6]">{program.description}</div>
              <div className="text-xs text-[#565f89] mt-2 italic">{program.tagline}</div>
            </button>
          ))}
        </div>

        {/* Story Preview */}
        <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: '#24283b', border: '1px solid #414868' }}>
          <div className="text-sm font-bold text-white mb-1">{selectedProgram?.name} Mission:</div>
          <div className="text-sm text-[#a9b1d6]">{selectedProgram?.story}</div>
        </div>

        {/* Start Button */}
        <form onSubmit={handleSubmit} className="text-center">
          <button
            type="submit"
            className="px-12 py-4 text-xl font-bold rounded-xl transition-all hover:scale-105"
            style={{
              backgroundColor: selectedProgram?.color || '#4CAF50',
              color: '#fff',
            }}
          >
            🚀 Launch Mission!
          </button>
        </form>

        <div className="text-center mt-8 text-sm text-[#565f89]">
          No watered-down content. No fake abstractions.<br/>
          Real low-level programming, made fun for every explorer.
        </div>
      </div>
    </div>
  )
}