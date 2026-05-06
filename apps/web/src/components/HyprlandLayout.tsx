import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect, useRef } from 'react'

const navLinks = [
  { path: '/', label: '🏠 Home' },
  { path: '/courses', label: '🎯 Quests' },
  { path: '/notes', label: '📝 Notes' },
  { path: '/progress', label: '⭐ Badges' },
  { path: '/search', label: '🔍 Find' },
]

// Virtual file system - typed
type FileEntry = { type: 'dir' | 'file'; contents?: string[]; content?: string }
type VirtualFiles = Record<string, FileEntry>

const virtualFiles: VirtualFiles = {
  '': { type: 'dir', contents: ['crew', 'systems', 'memory', 'missions'] },
  'crew': { type: 'dir', contents: ['chip.sys', 'bitty.dat', 'byte.dat', 'memo.core', 'gate.guard'] },
  'systems': { type: 'dir', contents: ['binary.dat', 'logic.gate', 'cpu.rom'] },
  'memory': { type: 'dir', contents: ['slot0.raw', 'slot1.raw', 'slot2.raw'] },
  'missions': { type: 'dir', contents: ['entry-01.txt', 'entry-02.txt'] },
  'crew/chip.sys': { type: 'file', content: 'CPU_SPACE_PROBE v1.0\nStatus: ONLINE\nThrusters: 100%' },
  'crew/bitty.dat': { type: 'file', content: 'BITTY_USR astronaut\nStatus: ACTIVE\nPosition: Orion sector' },
  'crew/byte.dat': { type: 'file', content: 'BYTE_USR astronaut\nStatus: STANDBY\nPosition: Alpha base' },
  'crew/memo.core': { type: 'file', content: 'MEMORY_CORE v2.0\nCapacity: 256 words\nStatus: READY' },
  'crew/gate.guard': { type: 'file', content: 'LOGIC_GATE keeper\nStatus: GUARDING' },
  'systems/binary.dat': { type: 'file', content: 'BINARY_SYSTEM\nUse: cat binary.dat to see ones and zeros' },
  'systems/logic.gate': { type: 'file', content: 'Logic Gates: AND, OR, NOT, XOR\nUse: run gate-test to practice' },
  'systems/cpu.rom': { type: 'file', content: 'CPU_ROM_FIRMWARE v0.9.4\nInstruction Set Loaded' },
  'memory/slot0.raw': { type: 'file', content: 'MEMORY_SLOT_0: EMPTY' },
  'memory/slot1.raw': { type: 'file', content: 'MEMORY_SLOT_1: EMPTY' },
  'memory/slot2.raw': { type: 'file', content: 'MEMORY_SLOT_2: EMPTY' },
  'missions/entry-01.txt': { type: 'file', content: 'MISSION 01: First Bit Ignition\nStatus: COMPLETED\nStars earned: 10' },
  'missions/entry-02.txt': { type: 'file', content: 'MISSION 02: Binary Count\nStatus: IN PROGRESS\nStars earned: 0' },
}

// Auto-complete suggestions
const commands = ['ls', 'cd', 'cat', 'pwd', 'help', 'talk', 'run', 'clear', 'hint', 'voice']

function EditorTerminal() {
  const [lines, setLines] = useState<string[]>([
    '                    ██████╗ ███████╗ █████╗ ██╗',
    '                   ██╔════╝ ██╔════╝██╔══██╗██║',
    '                   ██║  ███╗█████╗  ███████║██║',
    '                   ██║   ██║██╔══╝  ██╔══██║██║',
    '                   ╚██████╔╝ ██║     ██║  ██║',
    '                    ╚═════╝  ╚═╝     ╚═╝  ╚═╝',
    '',
    '                    ██╗    ██╗███████╗',
    '                    ██║    ██║██╔════╝',
    '                    ██║ █╗ ██║█████╗',
    '                    ██║███╗██║██╔══╝',
    '                    ╚███╔███╔╝███████╗',
    '                     ╚══╝╚══╝ ╚══════╝',
    '',
    '═══════════════════════════════════════════════════════════',
    '  🌑 ROOTCODE STARTERM v1.0',
    '  🚀 Deep Space Terminal Interface',
    '═══════════════════════════════════════════════════',
    '',
    '> System initialized...',
    '> Memory modules: ONLINE',
    '> CPU cores: ACTIVE',
    '> Type "help" for available commands',
  ])
  const [input, setInput] = useState('')
  const [currentDir, setCurrentDir] = useState('')
  const [showAutoComplete, setShowAutoComplete] = useState(false)
  const [filteredCommands, setFilteredCommands] = useState<string[]>([])
  const [showCharacter, setShowCharacter] = useState(false)
  const [characterName, setCharacterName] = useState('')
  const [characterMessage, setCharacterMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInput(value)
    if (value.length > 0) {
      const filtered = commands.filter(cmd => cmd.startsWith(value.toLowerCase()))
      setFilteredCommands(filtered.slice(0, 4))
      setShowAutoComplete(filtered.length > 0)
    } else {
      setShowAutoComplete(false)
    }
  }

  const handleAutoComplete = (cmd: string) => {
    setInput(cmd + ' ')
    setShowAutoComplete(false)
    inputRef.current?.focus()
  }

  const handleHint = () => {
    const hints: Record<string, string> = {
      'ls': '💡 Try: ls or cd crew',
      'cd': '💡 Example: cd crew or cd memory',
      'cat': '💡 Example: cat crew/chip.sys',
      'talk': '💡 Try: talk chip or talk byte',
      'run': '💡 Try: run bit-flip or run gate-test',
    }
    const hint = hints[input.split(' ')[0]] || '💡 Try: ls to see files'
    setLines([...lines, `$ hint`, hint])
  }

  const handleVoice = () => {
    setLines([...lines, `$ 🔊 Voice narration enabled`, '🔊 Voice will read outputs aloud!'])
  }

  const executeCommand = (cmd: string) => {
    const parts = cmd.trim().split(' ')
    const command = parts[0].toLowerCase()
    const args = parts.slice(1).join(' ')

    let output = ''

    switch (command) {
      case 'help':
        output = `╔════════════════════════════════════════════╗
║     🌑 ROOTCODE STARTERM COMMAND MANUAL    ║
╠════════════════════════════════════════════╣
║ COMMANDS:                                ║
║   ls [dir]   - List files in directory    ║
║   cd <dir>   - Change working directory    ║
║   cat <file> - View file contents         ║
║   pwd       - Show current directory     ║
║   talk <npc> - Talk to crew member        ║
║   run <test> - Run practice test          ║
║   system   - System info & specs          ║
║   fetch    - FastFetch style system info ║
║   clear    - Clear terminal screen      ║
║   hint     - Get a hint!                ║
║   voice    - Toggle voice narration     ║
╚════════════════════════════════════════════╝`
        setShowCharacter(false)
        break

      case 'system':
        output = `═══════════════════════════════════════════
       ROOTCODE SYSTEM SPECIFICATIONS
═══════════════════════════════════════════
  OS:     RootOS v1.0 "Deep Space"
  Kernel: StarKernel v0.9.4-custom
  Shell:  StarTerm v1.0
  CPU:    Quantum Core @ 4.2GHz
  Memory: 256KB Slots (3 available)
  GPU:    Starfield Renderer v2
  Display: 1920x1080 Cosmic Void
═══════════════════════════════════════════`
        setShowCharacter(false)
        break

      case 'fetch':
        output = `                    ██████╗ ███████╗ █████╗ ██╗
                   ██╔════╝ ██╔════╝██╔══██╗██║
                   ██║  ███╗█████╗  ███████║██║
                   ██║   ██║██╔══╝  ██╔══██║██║
                   ╚██████╔╝ ██║     ██║  ██║
                    ╚═════╝  ╚═╝     ╚═╝  ╚═╝

    ██╗    ██╗███████╗    ROOTCODE v1.0
    ██║    ██║██╔════╝    ─────────────────
    ██║ █╗ ██║█████╗     Host: StarExplorer
    ██║███╗██║██╔══╝     Kernel: StarKernel
    ╚███╔███╔╝███████╗     Uptime: Ready
     ╚══╝╚══╝ ╚═══════     Memory: ███░░░░░

  █████████╗ ██████╗  █████╗ ██╗     ██╗
  ╚══██╔══╝██╔═══██╗██╔══██╗██║     ██║
     ██║   ██║   ██║███████║██║     ██║
     ██║   ██║   ██║██╔══██║██║     ██║
     ██║   ╚██████╔╝██║  ██║███████╗██║
     ╚═╝    ╚═════╝ ╚═╝  ╚═╝ ╚══════╝ ╚═══════════`
        setShowCharacter(false)
        break

      case 'ls':
        const dir = args || currentDir || ''
        const target = virtualFiles[dir]
        if (target?.type === 'dir' && target.contents) {
          output = `📁 ${dir || '/'}\n` + target.contents.map((f: string) => {
            const isDir = virtualFiles[`${dir}/${f}`]?.type === 'dir'
            return isDir ? `📁 ${f}/` : `📄 ${f}`
          }).join('\n')
        } else if (!dir) {
          output = `📁 /\n  📁 crew/\n  📁 systems/\n  📁 memory/\n  📁 missions/`
        } else {
          output = `📁 ${dir}/`
        }
        setShowCharacter(false)
        break

      case 'cd':
        if (!args) {
          setCurrentDir('')
          output = '📂 /'
        } else if (virtualFiles[`${currentDir}/${args}`]?.type === 'dir') {
          const newDir = currentDir ? `${currentDir}/${args}` : args
          setCurrentDir(newDir)
          output = `📂 Changed to /${newDir}`
        } else if (virtualFiles[args]?.type === 'dir') {
          setCurrentDir(args)
          output = `📂 Changed to /${args}`
        } else if (args === '..') {
          const parts = currentDir.split('/').filter(Boolean)
          parts.pop()
          setCurrentDir(parts.join('/'))
          output = `📂 Changed to /${parts.join('/')}`
        } else {
          output = `❌ Directory not found: ${args}`
        }
        setShowCharacter(false)
        break

      case 'cat':
        const filePath = args || parts[1]
        const fullPath = filePath ? (currentDir ? `${currentDir}/${filePath}` : filePath) : ''
        const file = virtualFiles[fullPath]
        if (file?.type === 'file') {
          output = `📄 ${filePath}\n${'-'.repeat(20)}\n${file.content}`
        } else {
          output = `❌ File not found: ${filePath}`
        }
        setShowCharacter(false)
        break

      case 'pwd':
        output = `/${currentDir || '/'}`
        setShowCharacter(false)
        break

      case 'talk':
        const npc = args.toLowerCase()
        if (npc === 'chip') {
          setCharacterName('🔴 Chip')
          setCharacterMessage('🚀 "Hey Space Coder! Ready to explore the cosmos? Let\'s flip some bits!"')
          setShowCharacter(true)
          output = '🔴 Chip appears in the terminal!'
        } else if (npc === 'byte') {
          setCharacterName('🟣 Byte')
          setCharacterMessage('💤 "ZzZ... oh hi! I was in zero-G mode. Let\'s count some binary!"')
          setShowCharacter(true)
          output = '🟣 Byte floats in!'
        } else if (npc === 'memo') {
          setCharacterName('🔵 Memo')
          setCharacterMessage('📦 "I remember everything! Want to store something in my memory slots?"')
          setShowCharacter(true)
          output = '🔵 Memo the memory monster appears!'
        } else if (npc === 'gate') {
          setCharacterName('🟢 Gate Guardian')
          setCharacterMessage('🟢 "Only those who understand logic may pass! AND OR NOT - choose wisely!"')
          setShowCharacter(true)
          output = '🟢 Gate Guardian blocks the way!'
        } else {
          output = `❌ Unknown crew member: ${args}\nTry: talk chip, talk byte, talk memo, or talk gate`
        }
        break

      case 'run':
        const test = args.toLowerCase()
        if (test === 'bit-flip') {
          setCharacterName('🔴 Chip')
          setCharacterMessage('🚀 "Let\'s practice flipping bits! 0 becomes 1, 1 becomes 0!"')
          setShowCharacter(true)
          output = `⚡ RUNNING BIT-FLIP TEST...
━━━━━━━━━━━━━━━━━━━━
Bit 0 → Flip to: 1 ✓
Bit 1 → Flip to: 0 ✓
Bit 0 → Flip to: 1 ✓
━━━━━━━━━━━━━━━━━━━━
⭐ SUCCESS! 3 bits flipped!

💡 Hint: Use "cat memory/slot0.raw" to see stored bits`
        } else if (test === 'gate-test') {
          setCharacterName('🟢 Gate Guardian')
          setCharacterMessage('🟢 "Test your logic! TRUE AND FALSE = ?"')
          setShowCharacter(true)
          output = `⚡ RUNNING LOGIC GATE TEST...
━━━━━━━━━━━━━━━━━━━━
AND: TRUE AND TRUE = TRUE ✓
OR:  FALSE OR TRUE = TRUE ✓
NOT: NOT FALSE = TRUE ✓
━━━━━━━━━━━━━━━━━━━━
⭐ SUCCESS! Logic gates working!
            
💡 Hint: Logic gates output 1 (TRUE) or 0 (FALSE)`
        } else {
          output = `❌ Unknown test: ${args}\nTry: run bit-flip or run gate-test`
        }
        break

      case 'clear':
        setLines([])
        setShowCharacter(false)
        output = ''
        break

      case 'hint':
        handleHint()
        return

      case 'voice':
        handleVoice()
        return

      default:
        output = `❌ Unknown command: ${command}\nType "help" for available commands`
        setShowCharacter(false)
    }

    if (output) {
      setLines([...lines, `$ ${cmd}`, output])
    }
    setInput('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      executeCommand(input)
    }
  }

  return (
    <div className="flex flex-col h-full font-mono text-xs" style={{ backgroundColor: '#1e1e2e' }}>
      <div className="flex items-center px-2 py-1.5 border-b flex-shrink-0" style={{ backgroundColor: '#262637', borderColor: '#3d3d52' }}>
        <div className="flex gap-1 mr-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f7768e]"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#e0af68]"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#9ece6a]"></span>
        </div>
        <span className="text-[10px] text-[#6c7680]">📝 Neovim Editor</span>
        <div className="flex-1"></div>
        <button onClick={handleHint} className="text-[10px] mr-2 px-1.5 py-0.5 rounded bg-[#9ece6a] text-[#1e1e2e]">💡 Hint</button>
        <button onClick={handleVoice} className="text-[10px] px-1.5 py-0.5 rounded bg-[#89b4fa] text-[#1e1e2e]">🔊</button>
      </div>
      
      <div className="flex-1 overflow-hidden p-2 relative">
        {/* Character display area */}
        {showCharacter && (
          <div className="mb-2 p-2 rounded border-2 border-[#89b4fa] bg-[#262637]" style={{ borderColor: '#89b4fa' }}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{characterName.split(' ')[0]}</span>
              <span className="font-bold text-[#89b4fa]">{characterName}</span>
            </div>
            <div className="text-[#cdd6f4] text-[10px]">{characterMessage}</div>
          </div>
        )}
        
        {/* Command output */}
        <div className="overflow-y-auto max-h-full">
          {lines.map((line, i) => (
            <div key={i} className="text-[#cdd6f4] whitespace-pre-wrap">{line}</div>
          ))}
        </div>

        {/* Auto-complete dropdown */}
        {showAutoComplete && filteredCommands.length > 0 && (
          <div className="absolute bottom-10 left-2 right-2 bg-[#262637] rounded border border-[#3d3d52]">
            {filteredCommands.map((cmd, i) => (
              <button
                key={i}
                onClick={() => handleAutoComplete(cmd)}
                className="block w-full text-left px-2 py-1 text-[#cdd6f4] hover:bg-[#3d3d52]"
              >
                📄 {cmd}
              </button>
            ))}
          </div>
        )}
        
        {/* Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-1 mt-1 pt-1 border-t" style={{ borderColor: '#3d3d52' }}>
          <span className="text-[#a6e3a1]">❯</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            className="flex-1 bg-transparent text-[#cdd6f4] outline-none text-xs"
            autoFocus
          />
        </form>
      </div>
    </div>
  )
}

function OutputTerminal() {
  return (
    <div className="flex flex-col h-full font-mono text-xs" style={{ backgroundColor: '#1e1e2e' }}>
      <div className="flex items-center px-2 py-1.5 border-b flex-shrink-0" style={{ backgroundColor: '#262637', borderColor: '#3d3d52' }}>
        <span className="text-[10px] text-[#6c7680]">📤 Compilation Output</span>
      </div>
      
      <div className="flex-1 overflow-hidden p-2">
        <div className="text-[#89b4fa]"># Compilation</div>
        <div className="text-[#6c7680] text-[10px] mb-2">Program output appears here</div>
        <div className="text-[#a6e3a1]">$ Ready...</div>
      </div>
    </div>
  )
}

export default function HyprlandLayout() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const program = localStorage.getItem('program') || 'KinderRoot'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const programColors: Record<string, string> = {
    'KinderRoot': '#4CAF50',
    'ByteForge': '#FF9800',
    'KernelCamp': '#9C27B0',
    'BareMetal': '#F44336',
  }
  
  const accentColor = programColors[program] || '#4CAF50'

  return (
    <div className="h-screen flex p-2 gap-2 overflow-hidden">
      <aside 
        className="w-48 flex flex-col flex-shrink-0"
        style={{ backgroundColor: '#1e1e2e', border: '2px solid #3d3d52' }}
      >
        <div className="p-3 text-center border-b" style={{ borderColor: '#3d3d52' }}>
          <h1 className="text-lg font-extrabold text-white">🌱 RootCode</h1>
          <p className="text-[10px] text-[#89b4fa]">Academy</p>
        </div>
        
        <div 
          className="text-center text-[10px] font-bold py-1.5 px-2 mx-2 mt-2"
          style={{ backgroundColor: accentColor + '20', color: accentColor }}
        >
          {program}
        </div>
        
        <p className="text-center text-[10px] text-[#cdd6f4] mt-2 px-2">
          Welcome, {user?.username}!
        </p>
        
        <nav className="flex-1 py-2 space-y-0.5">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className="block py-2 px-3 text-xs font-bold transition-all"
              style={{
                backgroundColor: location.pathname === link.path ? accentColor : 'transparent',
                color: location.pathname === link.path ? '#1e1e2e' : '#cdd6f4',
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        
        <div className="p-2 border-t text-center" style={{ borderColor: '#3d3d52' }}>
          <p className="text-[10px] text-[#6c7680] mb-1">👤 {user?.username}</p>
          <button 
            onClick={handleLogout} 
            className="text-[10px] text-[#6c7680] hover:text-[#f7768e]"
          >
            👋 Sign out
          </button>
        </div>
      </aside>
      
      <div className="flex-1 flex flex-col gap-2 min-h-0">
        <div className="flex-1 flex gap-2 min-h-0">
          <main 
            className="flex-1 min-w-0 overflow-hidden"
            style={{ backgroundColor: '#1e1e2e', border: '2px solid #3d3d52' }}
          >
            <Outlet />
          </main>
          
          <div 
            className="w-72 flex-shrink-0 overflow-hidden"
            style={{ backgroundColor: '#1e1e2e', border: '2px solid #3d3d52' }}
          >
            <EditorTerminal />
          </div>
        </div>
        
        <div className="h-36 flex gap-2 flex-shrink-0">
          <div className="flex-1 min-w-0"></div>
          <div 
            className="w-72 h-full flex-shrink-0 overflow-hidden"
            style={{ backgroundColor: '#1e1e2e', border: '2px solid #3d3d52' }}
          >
            <OutputTerminal />
          </div>
        </div>
      </div>
    </div>
  )
}