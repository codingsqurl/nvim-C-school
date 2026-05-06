import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const WORLD_SIZE = 2000
const PLAYER_SIZE = 48
const SPEED = 8
const VIEWPORT_WIDTH = 600
const VIEWPORT_HEIGHT = 400

type Level = {
  id: string
  name: string
  x: number
  y: number
  world: number
  color: string
  icon: string
  objective: string
  description: string
  code?: string
  unlocked: boolean
  completed: boolean
  parent?: string
}

const byteForgeLevels: Level[] = [
  // World 1 - First Code
  { id: 'bf1', name: '👋 Hello World', x: 200, y: 300, world: 1, color: '#FF9800', icon: '👋', objective: 'Write your first program', description: 'Print "Hello, World!" to the screen', code: 'print("Hello, World!")', unlocked: true, completed: false },
  { id: 'bf2', name: '🧮 Variables', x: 200, y: 500, world: 1, color: '#FF9800', icon: '📦', objective: 'Store data in variables', description: 'Learn about strings and numbers', code: 'name = "Space Coder"\nprint(name)', unlocked: false, completed: false },
  { id: 'bf3', name: '🔢 Math', x: 200, y: 700, world: 1, color: '#FF9800', icon: '➕', objective: 'Do math with code', description: 'Add, subtract, multiply, divide', code: 'result = 5 + 3\nprint(result)', unlocked: false, completed: false },
  
  // World 2 - Making Decisions
  { id: 'bf4', name: '❓ If Statements', x: 450, y: 600, world: 2, color: '#7C4DFF', icon: '❓', objective: 'Code that makes decisions', description: 'If/else conditions', code: 'if score > 10:\n    print("You win!")', unlocked: false, completed: false },
  { id: 'bf5', name: '🔄 Loops', x: 450, y: 800, world: 2, color: '#7C4DFF', icon: '🔄', objective: 'Repeat code automatically', description: 'For and while loops', code: 'for i in range(5):\n    print(i)', unlocked: false, completed: false },
  
  // World 3 - Functions
  { id: 'bf6', name: '📦 Functions', x: 700, y: 700, world: 3, color: '#00BCD4', icon: '📦', objective: 'Build reusable code', description: 'Define and call functions', code: 'def greet():\n    print("Hi!")\ngreet()', unlocked: false, completed: false },
  { id: 'bf7', name: '🎯 Parameters', x: 900, y: 600, world: 3, color: '#00BCD4', icon: '🎯', objective: 'Pass data to functions', description: 'Function arguments', code: 'def hello(name):\n    print(f"Hi {name}!")\nhello("Coder")', unlocked: false, completed: false },
  
  // World 4 - Data Structures
  { id: 'bf8', name: '📝 Lists', x: 700, y: 900, world: 4, color: '#E91E63', icon: '📝', objective: 'Store collections', description: 'Lists and arrays', code: 'fruits = ["apple", "banana"]\nprint(fruits[0])', unlocked: false, completed: false },
  { id: 'bf9', name: '🔑 Dictionaries', x: 900, y: 900, world: 4, color: '#E91E63', icon: '🔑', objective: 'Key-value storage', description: 'Dictionaries', code: 'player = {"name": "Chip", "score": 100}\nprint(player["name"])', unlocked: false, completed: false },
  
  // World 5 - Real Projects
  { id: 'bf10', name: '🎮 Game Project', x: 600, y: 1100, world: 5, color: '#4CAF50', icon: '🎮', objective: 'Build your first game!', description: 'A simple number guessing game', code: 'import random\nsecret = random.randint(1,10)\nguess = int(input("Guess: "))\nif guess == secret:\n    print("Winner!")', unlocked: false, completed: false },
  { id: 'bf11', name: '🌐 Web Scraper', x: 900, y: 1100, world: 5, color: '#4CAF50', icon: '🕷️', objective: 'Fetch data from the web', description: 'Basic HTTP requests', code: 'import urllib.request\npage = urllib.request.urlopen("http://example.com")\nprint(page.read()[:100])', unlocked: false, completed: false },
  
  // World 6 - Capstone
  { id: 'bf12', name: '🚀 Capstone', x: 750, y: 1300, world: 6, color: '#FFD700', icon: '🚀', objective: 'You did it!', description: 'Build something amazing!', unlocked: false, completed: false },
]

const kinderRootLevels: Level[] = [
  // Simplified space world for younger kids
  { id: 'kr1', name: '🌟 First Bit', x: 200, y: 300, world: 1, color: '#4CAF50', icon: '🌟', objective: 'Flip your first bit!', description: 'Make 0 become 1', unlocked: true, completed: false },
  { id: 'kr2', name: '🔢 Counting', x: 200, y: 500, world: 1, color: '#4CAF50', icon: '🔢', objective: 'Count in binary', description: 'Learn numbers 0-7', unlocked: false, completed: false },
  { id: 'kr3', name: '💾 Memory', x: 200, y: 700, world: 1, color: '#2196F3', icon: '💾', objective: 'Store in memory', description: 'Save and load data', unlocked: false, completed: false },
  { id: 'kr4', name: '🧠 CPU', x: 500, y: 600, world: 2, color: '#9C27B0', icon: '🧠', objective: 'Give instructions', description: 'Program the CPU', unlocked: false, completed: false },
  { id: 'kr5', name: '🚪 Gates', x: 500, y: 800, world: 2, color: '#FF5722', icon: '🚪', objective: 'Logic gates', description: 'Open the gate!', unlocked: false, completed: false },
  { id: 'kr6', name: '💻 Computer', x: 750, y: 700, world: 3, color: '#FFD700', icon: '💻', objective: 'Build a computer!', description: 'Put it all together!', unlocked: false, completed: false },
]

// Generate path segments
function generatePathSegments(levels: Level[]): { x: number, y: number, width: number, height: number, color: string }[] {
  const segments: { x: number, y: number, width: number, height: number, color: string }[] = []
  const pathWidth = 70

  for (let i = 0; i < levels.length - 1; i++) {
    const current = levels[i]
    const next = levels[i + 1]
    if (current.world !== next.world) continue
    if (current.parent && next.id !== levels.find(l => l.id === current.parent)?.id) continue
    
    const x = Math.min(current.x, next.x) - pathWidth / 2
    const y = Math.min(current.y, next.y) - pathWidth / 2
    const width = Math.abs(next.x - current.x) + pathWidth
    const height = Math.abs(next.y - current.y) + pathWidth
    
    segments.push({ x, y, width: Math.max(width, pathWidth), height: Math.max(height, pathWidth), color: current.color })
  }
  return segments
}

export default function CoursesPage() {
  const navigate = useNavigate()
  const program = localStorage.getItem('program') || 'KinderRoot'
  const isByteForge = program === 'ByteForge'
  const levels = isByteForge ? byteForgeLevels : kinderRootLevels
  const pathSegments = generatePathSegments(levels)
  
  const [player, setPlayer] = useState({ x: 200, y: 300 })
  const [zoom, setZoom] = useState(1)
  const [camera, setCamera] = useState({ x: 0, y: 0 })
  const [showControls, setShowControls] = useState(false)
  const [currentLevel, setCurrentLevel] = useState(levels[0])
  const [completedLevels, setCompletedLevels] = useState<string[]>([])
  const [showCode, setShowCode] = useState(false)
  const keysRef = useRef<Set<string>>(new Set())
  const leftMouseRef = useRef(false)
  const rightMouseRef = useRef(false)
  const lastMouseRef = useRef({ x: 0, y: 0 })
  const cameraRef = useRef({ x: 0, y: 0 })

  const worldNames: Record<number, string> = isByteForge ? {
    1: '📝 First Code',
    2: '❓ Decisions', 
    3: '📦 Functions',
    4: '🔑 Data',
    5: '🎮 Projects',
    6: '🚀 Capstone'
  } : {
    1: '🌟 Bit Basics',
    2: '🧠 CPU World',
    3: '💻 Computer'
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current = new Set([...keysRef.current, e.key.toLowerCase()])
  }, [])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const newKeys = new Set([...keysRef.current])
    newKeys.delete(e.key.toLowerCase())
    keysRef.current = newKeys
  }, [])

  const handleMouseDown = useCallback((e: MouseEvent) => {
    e.preventDefault()
    if (e.button === 0) leftMouseRef.current = true
    else if (e.button === 2) rightMouseRef.current = true
    lastMouseRef.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (e.button === 0) leftMouseRef.current = false
    else if (e.button === 2) rightMouseRef.current = false
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const dx = e.clientX - lastMouseRef.current.x
    const dy = e.clientY - lastMouseRef.current.y
    lastMouseRef.current = { x: e.clientX, y: e.clientY }

    if (leftMouseRef.current) {
      setPlayer(p => ({
        x: Math.max(0, Math.min(WORLD_SIZE - PLAYER_SIZE, p.x + dx)),
        y: Math.max(0, Math.min(WORLD_SIZE - PLAYER_SIZE, p.y + dy))
      }))
    } else if (rightMouseRef.current) {
      const scaledW = WORLD_SIZE * zoom
      const scaledH = WORLD_SIZE * zoom
      cameraRef.current = {
        x: Math.max(0, Math.min(scaledW - VIEWPORT_WIDTH, cameraRef.current.x - dx)),
        y: Math.max(0, Math.min(scaledH - VIEWPORT_HEIGHT, cameraRef.current.y - dy))
      }
      setCamera(cameraRef.current)
    }
  }, [zoom])

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom(z => Math.max(0.5, Math.min(2, z + delta)))
  }, [])

  const handleContextMenu = useCallback((e: MouseEvent) => e.preventDefault(), [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  useEffect(() => {
    const viewport = document.getElementById('game-viewport')
    if (viewport) {
      viewport.addEventListener('mousedown', handleMouseDown)
      viewport.addEventListener('mouseup', handleMouseUp)
      viewport.addEventListener('mousemove', handleMouseMove)
      viewport.addEventListener('wheel', handleWheel, { passive: false })
      viewport.addEventListener('contextmenu', handleContextMenu)
      return () => {
        viewport.removeEventListener('mousedown', handleMouseDown)
        viewport.removeEventListener('mouseup', handleMouseUp)
        viewport.removeEventListener('mousemove', handleMouseMove)
        viewport.removeEventListener('wheel', handleWheel)
        viewport.removeEventListener('contextmenu', handleContextMenu)
      }
    }
  }, [handleMouseDown, handleMouseUp, handleMouseMove, handleWheel, handleContextMenu])

  useEffect(() => {
    const loop = () => {
      const keys = keysRef.current
      let vx = 0, vy = 0
      if (keys.has('k')) vy -= SPEED
      if (keys.has('j')) vy += SPEED
      if (keys.has('h')) vx -= SPEED
      if (keys.has('l')) vx += SPEED

      if (vx !== 0 || vy !== 0) {
        setPlayer(p => ({
          x: Math.max(0, Math.min(WORLD_SIZE - PLAYER_SIZE, p.x + vx)),
          y: Math.max(0, Math.min(WORLD_SIZE - PLAYER_SIZE, p.y + vy))
        }))
      }
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
  }, [])

  useEffect(() => {
    const camX = (player.x * zoom) - VIEWPORT_WIDTH / 2 + (PLAYER_SIZE * zoom) / 2
    const camY = (player.y * zoom) - VIEWPORT_HEIGHT / 2 + (PLAYER_SIZE * zoom) / 2
    const scaledWorldW = WORLD_SIZE * zoom
    const scaledWorldH = WORLD_SIZE * zoom
    cameraRef.current = {
      x: Math.max(0, Math.min(scaledWorldW - VIEWPORT_WIDTH, camX)),
      y: Math.max(0, Math.min(scaledWorldH - VIEWPORT_HEIGHT, camY))
    }
    setCamera(cameraRef.current)
  }, [player.x, player.y, zoom])

  useEffect(() => {
    let closestLevel = currentLevel
    let closestDist = Infinity
    
    for (const level of levels) {
      if (!level.unlocked) continue
      const dx = player.x - level.x
      const dy = player.y - level.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < closestDist && dist < 60) {
        closestDist = dist
        closestLevel = level
      }
    }
    
    if (closestLevel.id !== currentLevel.id) {
      setCurrentLevel(closestLevel)
      if (!completedLevels.includes(closestLevel.id)) {
        setCompletedLevels(prev => [...prev, closestLevel.id])
        
        const currentIdx = levels.findIndex(l => l.id === closestLevel.id)
        if (currentIdx + 1 < levels.length) {
          levels[currentIdx + 1].unlocked = true
        }
        if (closestLevel.parent) {
          const parentIdx = levels.findIndex(l => l.id === closestLevel.parent)
          if (parentIdx >= 0) levels[parentIdx].unlocked = true
        }
      }
    }
  }, [player.x, player.y, currentLevel.id, completedLevels, levels])

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-extrabold text-white">
          {worldNames[currentLevel.world]} - Quest {currentLevel.id.replace(/[a-z]/g, '')}
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowCode(!showCode)}
            className="px-4 py-2 rounded-lg font-bold text-sm"
            style={{ backgroundColor: '#7C4DFF', color: '#fff' }}
          >
            {showCode ? '👀 Hide Code' : '💻 Show Code'}
          </button>
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-[#414868] text-white rounded-lg font-bold">
            🏠 Home
          </button>
        </div>
      </div>
      
      <div id="game-viewport" className="flex-1 border-2 rounded-2xl overflow-hidden relative cursor-crosshair" style={{ borderColor: '#414868' }}>
        <div
          className="absolute"
          style={{
            width: WORLD_SIZE * zoom,
            height: WORLD_SIZE * zoom,
            transform: `translate(${-camera.x}px, ${-camera.y}px)`,
            background: 'radial-gradient(ellipse at center, #1a1b26 0%, #0d0d12 100%)',
          }}
        >
          {/* Stars */}
          <div className="absolute inset-0">
            {[...Array(50)].map((_, i) => (
              <div 
                key={i}
                className="absolute bg-white rounded-full animate-pulse"
                style={{
                  left: Math.random() * WORLD_SIZE * zoom,
                  top: Math.random() * WORLD_SIZE * zoom,
                  width: (Math.random() * 2 + 1) * zoom,
                  height: (Math.random() * 2 + 1) * zoom,
                  opacity: Math.random() * 0.7 + 0.3,
                  animationDuration: `${Math.random() * 2 + 1}s`,
                }}
              />
            ))}
          </div>
          
          {/* Path segments */}
          {pathSegments.map((seg, i) => (
            <div
              key={i}
              className="absolute opacity-30 rounded-full"
              style={{
                left: seg.x * zoom,
                top: seg.y * zoom,
                width: seg.width * zoom,
                height: seg.height * zoom,
                backgroundColor: seg.color,
              }}
            />
          ))}
          
          {/* Levels */}
          {levels.map(level => level.unlocked && (
            <div
              key={level.id}
              className={`absolute flex flex-col items-center justify-center rounded-full border-2 ${
                completedLevels.includes(level.id) ? 'opacity-60' : ''
              }`}
              style={{
                left: level.x * zoom - 30 * zoom,
                top: level.y * zoom - 30 * zoom,
                width: 60 * zoom,
                height: 60 * zoom,
                backgroundColor: level.color + '30',
                borderColor: completedLevels.includes(level.id) ? '#FFD700' : level.color,
              }}
            >
              <span className="text-xl">{level.icon}</span>
              <span className="text-xs font-bold text-white" style={{ fontSize: 8 * zoom }}>
                {level.name}
              </span>
            </div>
          ))}
          
          {/* Player */}
          <div
            className="absolute"
            style={{
              left: player.x * zoom,
              top: player.y * zoom,
              width: PLAYER_SIZE * zoom,
              height: PLAYER_SIZE * zoom,
              fontSize: PLAYER_SIZE * zoom,
            }}
          >
            🚀
          </div>
        </div>
        
        {/* Code Panel */}
        {showCode && currentLevel.code && (
          <div className="absolute bottom-4 left-4 right-4 bg-[#1a1b26] rounded-xl p-4 border-2 border-[#7C4DFF]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-[#7C4DFF]">💻 {currentLevel.name} Code:</span>
              <button onClick={() => setShowCode(false)} className="text-[#565f89]">✕</button>
            </div>
            <pre className="text-sm text-[#c0caf5] font-mono bg-[#0d0d12] p-3 rounded-lg overflow-x-auto">
              {currentLevel.code}
            </pre>
          </div>
        )}
        
        {/* Controls */}
        <div className="absolute bottom-4 left-4">
          <button
            onClick={() => setShowControls(!showControls)}
            className="bg-[#414868] text-white px-3 py-2 rounded-lg font-bold text-lg w-12 h-12 flex items-center justify-center"
          >
            {showControls ? '✕' : '☰'}
          </button>
          {showControls && (
            <div className="mt-2 bg-[#1a1b26] rounded-xl p-3 border-2 border-[#414868] w-64">
              <div className="text-lg font-bold text-white mb-2">🎯 {currentLevel.name}</div>
              <div className="text-sm text-[#a9b1d6] mb-3">{currentLevel.objective}</div>
              <div className="text-xs text-[#565f89] mb-3">{currentLevel.description}</div>
              <div className="grid grid-cols-3 gap-1 text-center">
                <div className="bg-[#24283b] w-8 h-8 flex items-center justify-center rounded border border-[#414868] font-bold text-white">K</div>
                <div className="bg-[#24283b] w-8 h-8 flex items-center justify-center rounded border border-[#414868] font-bold text-white">J</div>
                <div className="bg-[#24283b] w-8 h-8 flex items-center justify-center rounded border border-[#414868] font-bold text-white">H</div>
                <div className="bg-[#24283b] w-8 h-8 flex items-center justify-center rounded border border-[#414868] font-bold text-white col-span-3">L</div>
              </div>
              <div className="text-xs mt-2 text-center text-[#565f89]">
                Left Drag: Move | Right Drag: Look | Scroll: Zoom
              </div>
            </div>
          )}
        </div>
        
        {/* Stats */}
        <div className="absolute top-4 right-4 bg-[#1a1b26] rounded-xl px-3 py-2 border border-[#414868]">
          <span className="font-bold text-white">⭐ {completedLevels.length}/{levels.filter(l => l.unlocked).length}</span>
        </div>
      </div>
    </div>
  )
}