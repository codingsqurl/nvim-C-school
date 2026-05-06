import { Link } from 'react-router-dom'

export default function HomePage() {
  const program = localStorage.getItem('program') || 'KinderRoot'
  
  const programStats = {
    'KinderRoot': { quests: 5, completed: 0, badge: '🌱' },
    'ByteForge': { quests: 12, completed: 0, badge: '🔨' },
    'KernelCamp': { quests: 8, completed: 0, badge: '⚙️' },
    'BareMetal': { quests: 15, completed: 0, badge: '🔧' },
  }
  
  const stats = programStats[program as keyof typeof programStats] || programStats['KinderRoot']

  return (
    <div className="text-center">
      <div className="text-6xl mb-4">{stats.badge}</div>
      <h2 className="text-3xl font-extrabold text-white mb-4">
        Welcome to {program}!
      </h2>
      <p className="text-[#a9b1d6] text-xl mb-8">
        Plant the first bit. Grow the entire machine.
      </p>

      {/* Quick Stats */}
      <div className="flex justify-center gap-8 mb-8">
        <div className="bg-[#1a1b26] p-4 rounded-xl" style={{ border: '2px solid #414868' }}>
          <div className="text-2xl font-bold text-white">{stats.quests}</div>
          <div className="text-sm text-[#565f89]">Total Quests</div>
        </div>
        <div className="bg-[#1a1b26] p-4 rounded-xl" style={{ border: '2px solid #414868' }}>
          <div className="text-2xl font-bold text-[#7ddda4]">{stats.completed}</div>
          <div className="text-sm text-[#565f89]">Completed</div>
        </div>
        <div className="bg-[#1a1b26] p-4 rounded-xl" style={{ border: '2px solid #414868' }}>
          <div className="text-2xl font-bold text-[#ff9e64]">0</div>
          <div className="text-sm text-[#565f89]">Bits Earned</div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
        <Link 
          to={program === 'KinderRoot' ? '/courses' : '/terminal'} 
          className="p-6 rounded-2xl transition-all hover:scale-105"
          style={{ backgroundColor: '#4CAF50', color: '#fff' }}
        >
          <div className="text-4xl mb-2">
            {program === 'KinderRoot' ? '🎯' : '⬛'}
          </div>
          <div className="font-bold">
            {program === 'KinderRoot' ? 'Star Quest' : 'Terminal'}
          </div>
          <div className="text-sm opacity-80">
            {program === 'KinderRoot' ? "Begin your journey" : "Start learning"}
          </div>
        </Link>
        <Link 
          to="/progress" 
          className="p-6 rounded-2xl transition-all hover:scale-105"
          style={{ backgroundColor: '#FF9800', color: '#fff' }}
        >
          <div className="text-4xl mb-2">⭐</div>
          <div className="font-bold">My Badges</div>
          <div className="text-sm opacity-80">See what you've earned</div>
        </Link>
        <Link 
          to="/notes" 
          className="p-6 rounded-2xl transition-all hover:scale-105"
          style={{ backgroundColor: '#9C27B0', color: '#fff' }}
        >
          <div className="text-4xl mb-2">📝</div>
          <div className="font-bold">Notes</div>
          <div className="text-sm opacity-80">Remember what you learn</div>
        </Link>
        <Link 
          to="/search" 
          className="p-6 rounded-2xl transition-all hover:scale-105"
          style={{ backgroundColor: '#7aa2f7', color: '#1a1b26' }}
        >
          <div className="text-4xl mb-2">🔍</div>
          <div className="font-bold">Explore</div>
          <div className="text-sm opacity-80">Find new quests</div>
        </Link>
      </div>

      <div className="mt-8 text-sm text-[#565f89]">
        Your journey starts with a single bit. Every great machine begins with 0 and 1.
      </div>
    </div>
  )
}