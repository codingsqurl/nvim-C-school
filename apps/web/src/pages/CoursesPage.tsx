import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const WORLD_SIZE = 2500
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
  unlocked: boolean
  completed: boolean
  parent?: string
}

const levels: Level[] = [
  // World 1 - Basics
  { id: 'l1', name: '🚶 Walk', x: 150, y: 250, world: 1, color: '#4CAF50', icon: '🚶', objective: 'Use keys to move', description: 'Learn to move around', unlocked: true, completed: false },
  { id: 'l2', name: '🏃 Run', x: 150, y: 450, world: 1, color: '#4CAF50', icon: '🏃', objective: 'Move faster!', description: 'Practice keyboard shortcuts', unlocked: false, completed: false },
  { id: 'l3', name: '🔍 Look', x: 150, y: 650, world: 1, color: '#4CAF50', icon: '🔍', objective: 'Use mouse to explore', description: 'Navigate with your mouse', unlocked: false, completed: false },
  
  // World 1-2 Bridge
  { id: 'l4', name: '🐣 First Step', x: 350, y: 550, world: 2, color: '#FF9800', icon: '🐣', objective: 'Click to complete', description: 'Your first challenge!', unlocked: false, completed: false },

  // World 2 - Neovim Introduction
  { id: 'l5', name: '📝 Neovim', x: 550, y: 450, world: 2, color: '#9C27B0', icon: '📝', objective: 'Meet your new friend!', description: 'The best text editor ever', unlocked: false, completed: false, parent: 'l3' },
  
  // World 2-3 Bridge (continuing through Neovim)
  { id: 'l6', name: '⚙️ Install', x: 550, y: 650, world: 2, color: '#2196F3', icon: '⚙️', objective: 'Get Neovim on your computer!', description: 'Download and install Neovim', unlocked: false, completed: false, parent: 'l5' },
  
  // Install sub-levels (from Install node)
  { id: 'l7', name: '💻 Windows', x: 350, y: 750, world: 3, color: '#00BCD4', icon: '🪟', objective: 'Install on Windows', description: 'Winget, Chocolatey, or manual', unlocked: false, completed: false, parent: 'l6' },
  { id: 'l8', name: '🍎 macOS', x: 550, y: 850, world: 3, color: '#607D8B', icon: '🍎', objective: 'Install on Mac', description: 'Homebrew or Download', unlocked: false, completed: false, parent: 'l6' },
  { id: 'l9', name: '🐧 Linux', x: 750, y: 750, world: 3, color: '#FF5722', icon: '🐧', objective: 'Install on Linux', description: 'apt, yum, or snap', unlocked: false, completed: false, parent: 'l6' },
  
  // After Install paths merge back
  { id: 'l10', name: '🎓 Learn', x: 550, y: 950, world: 3, color: '#E91E63', icon: '🎓', objective: 'Start learning Neovim!', description: 'Vim commands and more', unlocked: false, completed: false, parent: 'l6' },
  
  // Learning Neovim levels
  { id: 'l11', name: '⌨️ Commands', x: 350, y: 1050, world: 4, color: '#673AB7', icon: '⌨️', objective: 'Basic vim commands', description: 'h j k l and more', unlocked: false, completed: false, parent: 'l10' },
  { id: 'l12', name: '📝 Insert Mode', x: 550, y: 1150, world: 4, color: '#673AB7', icon: '📝', objective: 'Type text', description: 'i to insert, Esc to exit', unlocked: false, completed: false, parent: 'l10' },
  { id: 'l13', name: '💾 Save & Quit', x: 750, y: 1050, world: 4, color: '#673AB7', icon: '💾', objective: ':w and :q', description: 'Write and quitvim', unlocked: false, completed: false, parent: 'l10' },
  
  // Final celebration
  { id: 'l14', name: '🎉 You Did It!', x: 550, y: 1250, world: 5, color: '#FFD700', icon: '🎉', objective: 'Congratulations!', description: 'You learned Neovim basics!', unlocked: false, completed: false },
]

const worldNames: Record<number, string> = {
  1: '🌿 Grass World',
  2: '🏖️ Beach World',
  3: '💻 Install World',
  4: '🎓 Learn World',
  5: '⭐ Star World',
}

function generatePathSegments(levels: Level[]): { x: number, y: number, width: number, height: number, color: string, fromParent: boolean }[] {
  const segments: { x: number, y: number, width: number, height: number, color: string, fromParent: boolean }[] = []
  const pathWidth = 80

  // Main path
  for (let i = 0; i < levels.length - 1; i++) {
    const current = levels[i]
    const next = levels.find(l => l.id === levels[i + 1]?.id || l.parent === current.id)
    
    if (!next) continue
    
    // Skip if this is a branching level not reached yet
    if (current.parent && !levels.some(l => l.id === current.parent && levels.find(p => p.id === current.parent)?.completed)) continue
    
    const x = Math.min(current.x, next.x) - pathWidth / 2
    const y = Math.min(current.y, next.y) - pathWidth / 2
    const width = Math.abs(next.x - current.x) + pathWidth
    const height = Math.abs(next.y - current.y) + pathWidth
    
    segments.push({ 
      x, 
      y, 
      width: Math.max(width, pathWidth), 
      height: Math.max(height, pathWidth), 
      color: current.color,
      fromParent: !!current.parent 
    })
  }
  
  // Parent-to-child connections (sublevels branching)
  for (const level of levels) {
    if (!level.parent) continue
    const parent = levels.find(l => l.id === level.parent)
    if (!parent) continue
    
    const x = Math.min(parent.x, level.x) - pathWidth / 2
    const y = Math.min(parent.y, level.y) - pathWidth / 2
    const width = Math.abs(level.x - parent.x) + pathWidth
    const height = Math.abs(level.y - parent.y) + pathWidth
    
    segments.push({
      x,
      y,
      width: Math.max(width, pathWidth),
      height: Math.max(height, pathWidth),
      color: parent.color,
      fromParent: true
    })
  }
  
  return segments
}

const pathSegments = generatePathSegments(levels)

export default function CoursesPage() {
  const navigate = useNavigate()
  const [player, setPlayer] = useState({ x: 150, y: 250 })
  const [zoom, setZoom] = useState(1)
  const [camera, setCamera] = useState({ x: 0, y: 0 })
  const [showControls, setShowControls] = useState(false)
  const [currentLevel, setCurrentLevel] = useState(levels[0])
  const [completedLevels, setCompletedLevels] = useState<string[]>([])
  const keysRef = useRef<Set<string>>(new Set())
  const leftMouseRef = useRef(false)
  const rightMouseRef = useRef(false)
  const lastMouseRef = useRef({ x: 0, y: 0 })
  const cameraRef = useRef({ x: 0, y: 0 })

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
        
        // Unlock connected levels
        const currentIdx = levels.findIndex(l => l.id === closestLevel.id)
        const parentLevel = levels.find(l => l.id === closestLevel.parent)
        
        // Unlock parent path if exists
        if (parentLevel && !parentLevel.unlocked) {
          const parentIdx = levels.findIndex(l => l.id === parentLevel.id)
          levels[parentIdx].unlocked = true
        }
        
        // Unlock next main level
        if (currentIdx + 1 < levels.length) {
          levels[currentIdx + 1].unlocked = true
        }
        
        // Unlock children (sublevels) of this level
        for (const level of levels) {
          if (level.parent === closestLevel.id && !level.unlocked) {
            const idx = levels.findIndex(l => l.id === level.id)
            levels[idx].unlocked = true
          }
        }
        
        // Unlock children of parent
        if (parentLevel) {
          for (const level of levels) {
            if (level.parent === parentLevel.id && !level.unlocked) {
              const idx = levels.findIndex(l => l.id === level.id)
              levels[idx].unlocked = true
            }
          }
        }
      }
    }
  }, [player.x, player.y, currentLevel.id, completedLevels])

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-extrabold text-[var(--color-accent)]">
          {worldNames[currentLevel.world]} - Level {currentLevel.id.replace('l', '')}
        </h2>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-xl font-bold">
          🏠 Home
        </button>
      </div>
      <div id="game-viewport" className="flex-1 border-4 border-[var(--color-accent)] rounded-2xl overflow-hidden relative cursor-crosshair">
        <div
          className="absolute"
          style={{
            width: WORLD_SIZE * zoom,
            height: WORLD_SIZE * zoom,
            transform: `translate(${-camera.x}px, ${-camera.y}px)`,
            background: 'linear-gradient(to bottom, #a8e6cf 0%, #dcedc1 100%)',
          }}
        >
          {pathSegments.map((seg, i) => (
            <div
              key={i}
              className={`absolute rounded-full ${seg.fromParent ? 'border-2 border-dashed border-black opacity-20' : 'opacity-40'}`}
              style={{
                left: seg.x * zoom,
                top: seg.y * zoom,
                width: seg.width * zoom,
                height: seg.height * zoom,
                backgroundColor: seg.color,
              }}
            />
          ))}
          {levels.map(level => level.unlocked && (
            <div
              key={level.id}
              className={`absolute flex flex-col items-center justify-center rounded-full border-4 ${
                completedLevels.includes(level.id) ? 'opacity-50' : ''
              } ${level.parent ? 'w-16 h-16' : 'w-20 h-20'}`}
              style={{
                left: level.x * zoom - (level.parent ? 32 : 40) * zoom,
                top: level.y * zoom - (level.parent ? 32 : 40) * zoom,
                width: (level.parent ? 64 : 80) * zoom,
                height: (level.parent ? 64 : 80) * zoom,
                backgroundColor: level.color,
                borderColor: level.completed ? '#FFD700' : level.color,
              }}
            >
              <span className="text-2xl">{level.icon}</span>
              <span className="text-xs font-bold text-white text-center leading-tight px-1" style={{ fontSize: 9 * zoom }}>
                {level.name}
              </span>
            </div>
          ))}
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
            🧒
          </div>
        </div>
        <div className="absolute bottom-4 left-4">
          <button
            onClick={() => setShowControls(!showControls)}
            className="bg-[var(--color-accent)] text-white px-3 py-2 rounded-lg font-bold text-lg w-12 h-12 flex items-center justify-center shadow-lg"
          >
            {showControls ? '✕' : '☰'}
          </button>
          {showControls && (
            <div className="mt-2 bg-[var(--color-bg)] rounded-xl p-3 border-4 border-[var(--color-accent)] w-72 shadow-xl max-h-48 overflow-y-auto">
              <div className="space-y-2 text-sm overflow-y-auto">
                <div className="text-lg font-bold text-[var(--color-accent)] text-center">
                  🎯 {currentLevel.name}
                </div>
                <div className="text-xs text-center bg-[var(--color-accent-bg)] rounded py-2 px-2 mb-2">
                  {currentLevel.objective}
                </div>
                <div className="text-xs text-gray-500">{currentLevel.description}</div>
                <div className="grid grid-cols-3 gap-1 text-center mt-3">
                  <div className="col-start-2 bg-[var(--color-bg)] w-8 h-8 flex items-center justify-center rounded border-2 border-[var(--color-accent)] font-bold">K</div>
                  <div className="col-start-1 row-start-2 bg-[var(--color-bg)] w-8 h-8 flex items-center justify-center rounded border-2 border-[var(--color-accent)] font-bold">H</div>
                  <div className="row-start-2 bg-[var(--color-bg)] w-8 h-8 flex items-center justify-center rounded border-2 border-[var(--color-accent)] font-bold">J</div>
                  <div className="row-start-2 bg-[var(--color-bg)] w-8 h-8 flex items-center justify-center rounded border-2 border-[var(--color-accent)] font-bold">L</div>
                </div>
                <div className="text-xs mt-2 text-center">
                  Left Drag: Move | Right Drag: Look | Scroll: Zoom
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="absolute top-4 right-4 bg-[var(--color-accent-bg)] rounded-xl px-3 py-1">
          <span className="font-bold text-[var(--color-text-h)]">
            ⭐ {completedLevels.length}/{levels.length}
          </span>
        </div>
      </div>
    </div>
  )
}