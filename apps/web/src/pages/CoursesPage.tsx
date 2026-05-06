import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const WORLD_SIZE = 2000
const PLAYER_SIZE = 48
const SPEED = 8
const VIEWPORT_WIDTH = 600
const VIEWPORT_HEIGHT = 400

type GitNode = {
  id: string
  label: string
  x: number
  y: number
  branch: string
  color: string
}

type GitBranch = {
  id: string
  name: string
  color: string
  fromNode: string
  toNode: string
}

const nodes: GitNode[] = [
  { id: 'n1', label: 'Initial Commit', x: 150, y: 150, branch: 'main', color: '#4CAF50' },
  { id: 'n2', label: 'Add README', x: 150, y: 350, branch: 'main', color: '#4CAF50' },
  { id: 'n3', label: 'Fix Bug', x: 150, y: 550, branch: 'main', color: '#4CAF50' },
  { id: 'n4', label: 'Feature A', x: 400, y: 450, branch: 'feature-a', color: '#2196F3' },
  { id: 'n5', label: 'Feature B', x: 400, y: 650, branch: 'feature-b', color: '#FF9800' },
  { id: 'n6', label: 'Merge', x: 150, y: 750, branch: 'main', color: '#4CAF50' },
  { id: 'n7', label: 'Hotfix', x: 650, y: 350, branch: 'hotfix', color: '#F44336' },
  { id: 'n8', label: 'Release v1', x: 150, y: 950, branch: 'main', color: '#4CAF50' },
]

const branches: GitBranch[] = [
  { id: 'b1', name: 'main', color: '#4CAF50', fromNode: 'n1', toNode: 'n2' },
  { id: 'b2', name: 'main', color: '#4CAF50', fromNode: 'n2', toNode: 'n3' },
  { id: 'b3', name: 'feature-a', color: '#2196F3', fromNode: 'n3', toNode: 'n4' },
  { id: 'b4', name: 'feature-b', color: '#FF9800', fromNode: 'n3', toNode: 'n5' },
  { id: 'b5', name: 'main', color: '#4CAF50', fromNode: 'n3', toNode: 'n6' },
  { id: 'b6', name: 'hotfix', color: '#F44336', fromNode: 'n6', toNode: 'n7' },
  { id: 'b7', name: 'main', color: '#4CAF50', fromNode: 'n6', toNode: 'n8' },
]

function getBranchWaypoints(branch: GitBranch): { x: number, y: number }[] {
  const from = nodes.find(n => n.id === branch.fromNode)!
  const to = nodes.find(n => n.id === branch.toNode)!
  const waypoints = [{ x: from.x, y: from.y }]
  
  if (from.y === to.y || Math.abs(from.x - to.x) < 50) {
    waypoints.push({ x: to.x, y: to.y })
  } else {
    const midX = (from.x + to.x) / 2
    waypoints.push({ x: midX, y: from.y })
    waypoints.push({ x: midX, y: to.y })
    waypoints.push({ x: to.x, y: to.y })
  }
  
  return waypoints
}

function generateBranchSegments(): { x: number, y: number, width: number, height: number, color: string }[] {
  const segments: { x: number, y: number, width: number, height: number, color: string }[] = []
  const roadWidth = 60

  for (const branch of branches) {
    const waypoints = getBranchWaypoints(branch)
    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i]
      const end = waypoints[i + 1]
      segments.push({
        x: Math.min(start.x, end.x) - roadWidth / 2,
        y: Math.min(start.y, end.y) - roadWidth / 2,
        width: Math.abs(end.x - start.x) + roadWidth,
        height: Math.abs(end.y - start.y) + roadWidth,
        color: branch.color
      })
    }
  }
  
  return segments
}

const branchSegments = generateBranchSegments()

export default function CoursesPage() {
  const navigate = useNavigate()
  const [player, setPlayer] = useState({ x: 150, y: 150 })
  const [zoom, setZoom] = useState(1)
  const [camera, setCamera] = useState({ x: 0, y: 0 })
  const [showControls, setShowControls] = useState(false)
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
    const scaledWorldW = WORLD_SIZE * zoom
    const scaledWorldH = WORLD_SIZE * zoom
    const camX = (player.x * zoom) - VIEWPORT_WIDTH / 2 + (PLAYER_SIZE * zoom) / 2
    const camY = (player.y * zoom) - VIEWPORT_HEIGHT / 2 + (PLAYER_SIZE * zoom) / 2
    const newCamera = {
      x: Math.max(0, Math.min(scaledWorldW - VIEWPORT_WIDTH, camX)),
      y: Math.max(0, Math.min(scaledWorldH - VIEWPORT_HEIGHT, camY))
    }
    cameraRef.current = newCamera
    setCamera(newCamera)
  }, [player.x, player.y, zoom])

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-extrabold text-[var(--color-accent)]">📚 Git Branches</h2>
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
          {branchSegments.map((seg, i) => (
            <div
              key={i}
              className="absolute opacity-40 rounded-full"
              style={{
                left: seg.x * zoom,
                top: seg.y * zoom,
                width: seg.width * zoom,
                height: seg.height * zoom,
                backgroundColor: seg.color,
              }}
            />
          ))}
          {nodes.map(node => (
            <div
              key={node.id}
              className="absolute flex flex-col items-center justify-center rounded-full border-4"
              style={{
                left: node.x * zoom - 30 * zoom,
                top: node.y * zoom - 30 * zoom,
                width: 60 * zoom,
                height: 60 * zoom,
                backgroundColor: node.color,
                borderColor: node.color,
              }}
            >
              <span className="text-xs font-bold text-white text-center leading-tight" style={{ fontSize: 10 * zoom }}>
                {node.label}
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
            <div className="mt-2 bg-[var(--color-bg)] rounded-xl p-3 border-4 border-[var(--color-accent)] w-72 shadow-xl">
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-xs font-bold text-[var(--color-accent)] mb-2">⌨️ KEYBOARD</div>
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <div className="col-start-2 bg-[var(--color-bg)] w-8 h-8 flex items-center justify-center rounded border-2 border-[var(--color-accent)] font-bold">K</div>
                    <div className="col-start-1 row-start-2 bg-[var(--color-bg)] w-8 h-8 flex items-center justify-center rounded border-2 border-[var(--color-accent)] font-bold">H</div>
                    <div className="row-start-2 bg-[var(--color-bg)] w-8 h-8 flex items-center justify-center rounded border-2 border-[var(--color-accent)] font-bold">J</div>
                    <div className="row-start-2 bg-[var(--color-bg)] w-8 h-8 flex items-center justify-center rounded border-2 border-[var(--color-accent)] font-bold">L</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--color-accent)] mb-2">🖱️ MOUSE</div>
                  <div className="flex flex-col gap-1 text-xs">
                    <div className="bg-[var(--color-bg)] px-2 py-1 rounded">Left Click + Drag: Move</div>
                    <div className="bg-[var(--color-bg)] px-2 py-1 rounded">Right Click + Drag: Explore</div>
                    <div className="bg-[var(--color-bg)] px-2 py-1 rounded">Scroll: Zoom</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--color-accent)] mb-2">🌿 GIT</div>
                  <div className="flex flex-wrap gap-1 text-xs">
                    <span className="bg-[#4CAF50] text-white px-1 rounded">main</span>
                    <span className="bg-[#2196F3] text-white px-1 rounded">feature-a</span>
                    <span className="bg-[#FF9800] text-white px-1 rounded">feature-b</span>
                    <span className="bg-[#F44336] text-white px-1 rounded">hotfix</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="absolute top-4 right-4 bg-[var(--color-accent-bg)] rounded-xl px-3 py-1">
          <span className="font-bold text-[var(--color-text-h)]">
            {Math.round(player.x)}, {Math.round(player.y)} | {zoom.toFixed(1)}x
          </span>
        </div>
      </div>
    </div>
  )
}