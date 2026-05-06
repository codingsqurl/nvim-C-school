import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

type FileSystem = {
  [key: string]: string | FileSystem
}

type TerminalLine = {
  type: 'input' | 'output' | 'error' | 'success' | 'prompt'
  content: string
  color?: string
}

const virtualFileSystem: FileSystem = {
  'bits': {
    'lesson1.txt': '=== BIT BASICS ===\n\nA bit is the smallest unit of data.\nIt can only be: 0 or 1\n\nThink of a light switch: OFF = 0, ON = 1\n\n// Try: cat bits/flip.txt',
    'flip.txt': '=== BIT FLIPPING ===\n\nTo flip a bit means to change it:\n0 → 1 (flip to 1)\n1 → 0 (flip to 0)\n\n// Run: run flip-exercise',
  },
  'memory': {
    'lesson1.txt': '=== MEMORY BASICS ===\n\nMemory stores bits in cells.\nEach cell has an address.\n\nThink of a street with houses:\n- House number = memory address\n- Person = bit (0 or 1)\n\n// Try: cat memory/cells.txt',
    'cells.txt': '=== MEMORY CELLS ===\n\nA memory cell holds 8 bits = 1 byte\n\nExample: 01000001 = "A" (65)\n                   \nEach position is 2^n (from right):\n2^7=128, 2^6=64, 2^5=32, 2^4=16\n2^3=8, 2^2=4, 2^1=2, 2^0=1\n\n// Run: cat memory/address.txt',
    'address.txt': '=== MEMORY ADDRESSES ===\n\nAddress: Value\n   0x00: 01000001\n   0x01: 01101100\n   0x02: 01101100\n\n// Try: run memory-lab',
  },
  'instructions': {
    'lesson1.txt': '=== CPU INSTRUCTIONS ===\n\nThe CPU reads instructions from memory.\nEach instruction tells the CPU what to do.\n\nExample instructions:\n- LOAD  → get data from memory\n- STORE → save data to memory\n- ADD   → add numbers\n- JUMP  → change where to read next\n\n// Run: cat instructions/opcodes.txt',
    'opcodes.txt': '=== OPCODES ===\n\nOpCode: Action\n  0x00: NOOP (do nothing)\n  0x01: LOAD  (read from address)\n  0x02: STORE (write to address)\n  0x03: ADD   (add A + B)\n  0x04: SUB   (subtract A - B)\n  0x05: JUMP  (goto address)\n\n\n// Run: run cpu-lab',
  },
  'gates': {
    'lesson1.txt': '=== LOGIC GATES ===\n\nLogic gates are tiny circuits that process bits.\n\nThree basic gates:\n- AND:  1+1=1, else 0\n- OR:   0+0=0, else 1\n- NOT:  flip the bit\n\n// Run: cat gates/truth.txt',
    'truth.txt': '=== TRUTH TABLES ===\n\nAND Gate:\n  A | B | OUT\n  --+---+----\n  0 | 0 |  0\n  0 | 1 |  0\n  1 | 0 |  0\n  1 | 1 |  1\n\nOR Gate:\n  A | B | OUT\n  --+---+----\n  0 | 0 |  0\n  0 | 1 |  1\n  1 | 0 |  1\n  1 | 1 |  1\n\nNOT Gate:\n  A | OUT\n  --+------\n  0 |  1\n  1 |  0\n\n// Run: run gate-lab',
  },
  'projects': {
    'calculator.txt': '=== MINI CALCULATOR ===\n\nA simple calculator program.\n\nOperations:\n- add 5 3\n- sub 10 4\n- mul 6 7\n- div 20 4\n\n// Run: run calculator',
  },
  'kinderroot': {
    'stage1': {
      'bit-basics.txt': '=== STAGE 1: BIT BASICS ===\n\nWelcome to KinderRoot!\n\n// Try: ls kinderroot/stage1/\n// Try: cat readme.txt',
      'readme.txt': '=== KINDERROOT STAGE 1 ===\n\nHi explorer! Lets learn about bits!\n\nBits are like light switches.\nOFF (dark) = 0\nON (bright) = 1\n\nType "talk chip" to meet Chip!',
      'chip.txt': '           .\n         /|\\\n        / | \\\n       /  |  \\\n      /___|___\n\n\nCHIP: Hello! Im Chip the CPU!\n    I help your computer think!\n    Type "run bit-flip" to play!\n\n\n(animated ASCII)',
      'bitty.txt': '  _  _\n (_)(_)\n  /\\/\\\n\n\nBITTY: Hi! Im Bitty the 1!\n     I love being ON!\n     Can you turn me on?\n',
      'byte.txt': '    ___\n   / _ \\\n  | / \\\n  |/  \\\n   ____\n\nBYTE: Hi! Im Byte the 0!\n      I like sleeping!\n      ZZZzzz...',
    },
    'stage2': {
      'memory.txt': '=== STAGE 2: MEMORY ===\n\nRemember: Memory is like boxes!\n\n// Run: talk memo',
    },
    'stage3': {
      'gates.txt': '=== STAGE 3: GATES ===\n\n// Run: talk gate',
    },
  },
  'byteforge': {
    'python': {
      'lesson1.txt': '=== BYTEFORGE: PYTHON ===\n\nWelcome to Python programming!\n\n// Try: ls byteforge/python/',
    },
    'c': {
      'lesson1.txt': '=== BYTEFORGE: C ===\n\nWelcome to C programming!\n\n// Try: ls byteforge/c/',
    },
  },
  'core': {
    'assembly': {
      'lesson1.txt': '=== CORE: ASSEMBLY ===\n\n\n// Run: ls core/assembly/',
    },
  },
  'hidden.log': '=== HIDDEN FILE ===\n\nGenesis 1:1\nIn the beginning God created the heavens and the earth.\n\nJohn 1:1\nIn the beginning was the Word, and the Word was with God, and the Word was God.\n\n\n// This file is hidden. Nice find!',
  'progress.txt': `=== YOUR PROGRESS ===\nLast updated: ${new Date().toLocaleString()}\n\n--- KinderRoot ---\n[░░░░░░] Stage 1: Bits\n[░░░░░░] Stage 2: Memory\n[░░░░░░] Stage 3: Gates\n\n--- ByteForge ---\n[░░░░░░] Python Basics\n[░░░░░░] Variables\n[░░░░░░] Functions\n`,
}

function getPathContents(path: string[], fs: FileSystem = virtualFileSystem): string[] {
  if (path.length === 0) return Object.keys(fs).sort()
  
  let current: FileSystem = fs
  for (const part of path) {
    if (typeof current[part] === 'object') {
      current = current[part] as FileSystem
    } else {
      return []
    }
  }
  return Object.keys(current).sort()
}

function getFileContent(path: string[], fs: FileSystem = virtualFileSystem): string | null {
  if (path.length === 0) return null
  
  let current: FileSystem = fs
  for (let i = 0; i < path.length - 1; i++) {
    if (typeof current[path[i]] === 'object') {
      current = current[path[i]] as FileSystem
    } else {
      return null
    }
  }
  const last = path[path.length - 1]
  if (typeof current[last] === 'string') {
    return current[last] as string
  }
  return null
}

function isDirectory(path: string[], fs: FileSystem = virtualFileSystem): boolean {
  if (path.length === 0) return true
  
  let current: FileSystem = fs
  for (const part of path) {
    if (typeof current[part] === 'object') {
      current = current[part] as FileSystem
    } else {
      return false
    }
  }
  return true
}

export default function StarTerm() {
  const [lines, setLines] = useState<TerminalLine[]>([])
  const [input, setInput] = useState('')
  const [cwd, setCwd] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  
  const program = localStorage.getItem('program') || 'KinderRoot'
  const isKinder = program === 'KinderRoot'
  const username = localStorage.getItem('user') || 'rootcoder'
  
  const prompt = `${username}@academy:~${
    cwd.length > 0 ? '/' + cwd.join('/') : ''
  }$`

  useEffect(() => {
    inputRef.current?.focus()
    const bootLines: TerminalLine[] = [
      { type: 'output', content: 'RootCode Academy StarTerm v1.0', color: '#7aa2f7' },
      { type: 'output', content: 'GPU-accelerated terminal emulator', color: '#565f89' },
      { type: 'output', content: '--------------------------------', color: '#414868' },
      { type: 'output', content: isKinder 
        ? 'Welcome to KinderRoot! Type "help" to begin.'
        : 'Welcome to RootCode Academy! Type "help" to begin.', 
        color: '#9ece6a' 
      },
      { type: 'output', content: '', color: '#cdd6f4' },
    ]
    setLines(bootLines)
  }, [])

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [lines])

  const addLines = useCallback((newLines: TerminalLine[]) => {
    setLines(prev => [...prev, ...newLines])
  }, [])

  const executeCommand = useCallback((cmd: string) => {
    const parts = cmd.trim().split(/\s+/)
    const command = parts[0].toLowerCase()
    const args = parts.slice(1)

    const addOutput = (content: string, color = '#cdd6f4') => {
      addLines([{ type: 'output', content, color }])
    }

    const addError = (content: string) => {
      addLines([{ type: 'error', content, color: '#f7768e' }])
    }

    const addSuccess = (content: string) => {
      addLines([{ type: 'success', content, color: '#9ece6a' }])
    }

    switch (command) {
      case 'help':
      case '?':
        addOutput('=== AVAILABLE COMMANDS ===', '#89b4fa')
        addOutput('ls [path]     - List directory contents')
        addOutput('cd <path>    - Change directory')
        addOutput('cat <file>    - Display file contents')
        addOutput('pwd         - Print working directory')
        addOutput('clear       - Clear terminal')
        addOutput('whoami      - Show current user')
        addOutput('date        - Show current date')
        addOutput('echo <msg>  - Print message')
        addOutput('help        - Show this help')
        addOutput('run <prog>  - Run a program')
        addOutput('talk <char> - Talk to a character')
        addOutput('exit        - Logout')
        if (isKinder) {
          addOutput('', '#565f89')
          addOutput('=== KINDERROOT SPECIAL ===', '#ff9e64')
          addOutput('talk chip   - Meet Chip the CPU!')
          addOutput('talk bitty  - Meet Bitty!')
          addOutput('talk byte   - Meet Byte!')
          addOutput('talk memo   - Meet Memo!')
          addOutput('run bit-flip   - Play bit flipping game')
        }
        break

      case 'ls':
        const lsPath = args.length > 0 ? args[0].split('/').filter(Boolean) : cwd
        const contents = getPathContents(lsPath)
        
        if (contents.length === 0) {
          if (isDirectory(lsPath)) {
            addOutput('(empty directory)')
          } else {
            addError(`ls: cannot access '${args[0]}': No such file or directory`)
          }
        } else {
          const dirs: string[] = []
          const files: string[] = []
          
          for (const item of contents) {
            const fullPath = [...lsPath, item]
            if (isDirectory(fullPath)) {
              dirs.push(item)
            } else {
              files.push(item)
            }
          }
          
          if (dirs.length > 0) {
            addOutput(dirs.map(d => `\x1b[34m${d}/\x1b[0m`).join('  '), '#89b4fa')
          }
          if (files.length > 0) {
            addOutput(files.join('  '))
          }
        }
        break

      case 'cd':
        if (args.length === 0 || args[0] === '~') {
          setCwd([])
          addOutput('')
        } else if (args[0] === '..') {
          setCwd(prev => prev.slice(0, -1))
          addOutput('')
        } else if (args[0] === '-') {
          addOutput(`cd: back to home`)
        } else {
          const targetPath = args[0].startsWith('/') 
            ? args[0].split('/').filter(Boolean)
            : [...cwd, ...args[0].split('/').filter(Boolean)]
          
          if (isDirectory(targetPath)) {
            setCwd(targetPath)
            addOutput('')
          } else {
            addError(`cd: ${args[0]}: No such directory`)
          }
        }
        break

      case 'cat':
        if (args.length === 0) {
          addError('cat: missing file operand')
        } else {
          const catPath = args[0].startsWith('/')
            ? args[0].split('/').filter(Boolean)
            : [...cwd, ...args[0].split('/').filter(Boolean)]
          
          const content = getFileContent(catPath)
          if (content) {
            addOutput(content)
          } else if (isDirectory(catPath)) {
            addError(`cat: ${args[0]}: Is a directory`)
          } else {
            addError(`cat: ${args[0]}: No such file`)
          }
        }
        break

      case 'pwd':
        addOutput(cwd.length === 0 ? '/' : '/' + cwd.join('/'))
        break

      case 'clear':
        setLines([])
        break

      case 'whoami':
        addOutput(username)
        break

      case 'date':
        addOutput(new Date().toString())
        break

      case 'echo':
        addOutput(args.join(' '))
        break

      case 'exit':
        localStorage.removeItem('user')
        localStorage.removeItem('program')
        navigate('/login')
        break

      case 'run':
        if (args.length === 0) {
          addError('run: missing program name')
        } else {
          const prog = args[0].toLowerCase()
          switch (prog) {
            case 'flip-exercise':
            case 'bit-flip':
              addSuccess('=== BIT FLIP EXERCISE ===')
              addOutput('Current bit: 0')
              addOutput('Flipping...')
              addOutput('New bit: 1')
              addSuccess('Great job! You flipped a bit!')
              addOutput('')
              addOutput('    *\n   /|\\')
              addOutput('  CHIP: Fantastic!')
              break
            case 'calculator':
              addSuccess('=== CALCULATOR ===')
              addOutput('Usage: add <num> <num>, sub <num> <num>, etc.')
              break
            case 'cpu-lab':
            case 'gate-lab':
            case 'memory-lab':
              addSuccess(`=== Running ${prog} ===`)
              addOutput('Loading simulation...')
              addOutput('(Simulation mode - full interactive coming soon!)')
              break
            default:
              addError(`run: ${prog}: No such program`)
          }
        }
        break

      case 'talk':
        if (args.length === 0) {
          addError('talk: talk to whom?')
        } else {
          const char = args[0].toLowerCase()
          switch (char) {
            case 'chip':
              addOutput('           .   ')
              addOutput('         /|\\  ')
              addOutput('        / | \\ ')
              addOutput('       /  |  \\')
              addOutput('      /___|___\\')
              addOutput('')
              addOutput('CHIP: Beep boop! Hi! Im Chip!', '#ff9e64')
              addOutput('     I CPU! I make computers think!')
              addOutput('     Type "run bit-flip" to play with me!')
              break
            case 'bitty':
              addOutput('  _  _    ')
              addOutput(' (_)(_)   ')
              addOutput('  /\\/\\   ')
              addOutput('')
              addOutput('BITTY: Hiya! Im the 1!', '#7aa2f7')
              addOutput('      I love being ON!')
              break
            case 'byte':
              addOutput('    ___ ')
              addOutput('   / _ \\')
              addOutput('  | / \\')
              addOutput('  |/  \\')
              addOutput('   ____')
              addOutput('')
              addOutput('BYTE: ZZZzzz... Im Byte...', '#bb9af7')
              addOutput('      0 means sleeping...')
              break
            case 'memo':
              addOutput('  ┌─────┐')
              addOutput('  │ □ □ │')
              addOutput('  └─────┘')
              addOutput('')
              addOutput('MEMO: Hello! Im Memo the Memory!', '#7dcfff')
              addOutput('     I remember everything!')
              break
            case 'gate':
              addOutput('  ┌───────┐')
              addOutput('  │  AND  │')
              addOutput('  └───────┘')
              addOutput('')
              addOutput('GATE: I am the Gate Guardian!', '#9ece6a')
              addOutput('     I control the flow!')
              break
            default:
              addOutput(`${char}: (not visiting right now)`)
          }
        }
        break

      case '':
        addOutput('')
        break

      default:
        addError(`${command}: command not found`)
        addOutput('Type "help" for available commands.')
    }
  }, [cwd, addLines, navigate, username, isKinder])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    addLines([{ type: 'prompt', content: prompt + ' ' + input }])
    
    if (input.trim()) {
      executeCommand(input)
    } else {
      addLines([{ type: 'input', content: prompt }])
    }
    
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      setLines([])
    }
  }

  const focusTerminal = () => {
    inputRef.current?.focus()
  }

  const getLineColor = (type: TerminalLine['type'], color?: string) => {
    if (color) return color
    switch (type) {
      case 'error': return '#f7768e'
      case 'success': return '#9ece6a'
      case 'prompt': return '#a6e3a1'
      default: return '#cdd6f4'
    }
  }

  return (
    <div
      onClick={focusTerminal}
      className="h-full flex flex-col font-mono select-none"
      style={{ 
        backgroundColor: '#0d0d12',
        fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", monospace',
        fontSize: '14px',
        lineHeight: '1.5',
      }}
      onKeyDown={handleKeyDown}
    >
      <div 
        className="flex items-center px-3 py-1.5 border-b"
        style={{ backgroundColor: '#16161e', borderColor: '#292e42' }}
      >
        <div className="flex gap-1.5 mr-4">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f7768e' }}></span>
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#e0af68' }}></span>
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#9ece6a' }}></span>
        </div>
        <span className="text-xs" style={{ color: '#565f89' }}>StarTerm — RootCode Academy</span>
      </div>
      
      <div 
        ref={outputRef}
        className="flex-1 p-3 overflow-y-auto"
        style={{ 
          scrollBehavior: 'smooth',
          textShadow: '0 0 2px rgba(0,0,0,0.3)',
        }}
      >
        {lines.map((line, i) => (
          <div 
            key={i} 
            className="whitespace-pre-wrap"
            style={{ color: getLineColor(line.type, line.color) }}
          >
            {line.content}
          </div>
        ))}
        
        <form onSubmit={handleSubmit} className="flex items-center gap-1">
          <span style={{ color: '#a6e3a1' }}>{prompt.replace(`~${cwd.length > 0 ? '/' + cwd.join('/') : ''}`, '')}</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 bg-transparent outline-none"
            style={{ 
              color: '#cdd6f4',
              caretColor: '#7aa2f7',
            }}
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </form>
      </div>
    </div>
  )
}