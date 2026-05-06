import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const WORLD_SIZE = 2000
const PLAYER_SIZE = 48
const SPEED = 8

export default function CoursesPage() {
  const navigate = useNavigate()
  const [player, setPlayer] = useState({ x: 400, y: 300 })
  const [keys, setKeys] = useState<Set<string>>(new Set())
  const [view, setView] = useState({ x: 0, y: 0 })

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    setKeys(k => new Set([...k, e.key.toLowerCase()]))
  }, [])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    setKeys(k => {
      const newKeys = new Set([...k])
      newKeys.delete(e.key.toLowerCase())
      return newKeys
    })
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  useEffect(() => {
    const interval = setInterval(() => {
      let vx = 0
      let vy = 0

      if (keys.has('w') || keys.has('arrowup') || keys.has('k')) vy -= SPEED
      if (keys.has('s') || keys.has('arrowdown') || keys.has('j')) vy += SPEED
      if (keys.has('a') || keys.has('arrowleft') || keys.has('h')) vx -= SPEED
      if (keys.has('d') || keys.has('arrowright') || keys.has('l')) vx += SPEED

      setPlayer(p => ({
        x: Math.max(0, Math.min(WORLD_SIZE - PLAYER_SIZE, p.x + vx)),
        y: Math.max(0, Math.min(WORLD_SIZE - PLAYER_SIZE, p.y + vy))
      }))

      if (vx !== 0 || vy !== 0) {
        setView({
          x: Math.max(0, Math.min(WORLD_SIZE - 600, player.x - 300)),
          y: Math.max(0, Math.min(WORLD_SIZE - 400, player.y - 200))
        })
      }
    }, 24)

    return () => clearInterval(interval)
  }, [keys, player.x, player.y])

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-extrabold text-[var(--color-accent)]">📚 Learn</h2>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-xl font-bold"
        >
          🏠 Home
        </button>
      </div>
      <div className="flex-1 border-4 border-[var(--color-accent)] rounded-2xl overflow-hidden relative">
        <div
          className="absolute bg-[var(--color-code-bg)]"
          style={{
            width: WORLD_SIZE,
            height: WORLD_SIZE,
            transform: `translate(-${view.x}px, -${view.y}px)`,
          }}
        >
          <div className="absolute inset-0 opacity-20">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute border border-[var(--color-border)]"
                style={{
                  left: i * 100,
                  top: 0,
                  bottom: 0,
                  width: 1,
                }}
              />
            ))}
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute border border-[var(--color-border)]"
                style={{
                  left: 0,
                  top: i * 100,
                  right: 0,
                  height: 1,
                }}
              />
            ))}
          </div>
          <div
            className="absolute text-4xl transition-transform"
            style={{
              left: player.x,
              top: player.y,
              width: PLAYER_SIZE,
              height: PLAYER_SIZE,
              fontSize: PLAYER_SIZE,
            }}
          >
            🧒
          </div>
        </div>
        <div className="absolute bottom-4 left-4 right-4 bg-[var(--color-accent-bg)] rounded-xl p-3">
          <div className="flex flex-wrap gap-2 text-sm font-bold text-[var(--color-text-h)] justify-center">
            <span className="bg-[var(--color-bg)] px-2 py-1 rounded">W/A/S/D</span>
            <span className="bg-[var(--color-bg)] px-2 py-1 rounded">↑←↓→</span>
            <span className="bg-[var(--color-bg)] px-2 py-1 rounded">H/J/K/L</span>
          </div>
        </div>
        <div className="absolute top-4 right-4 bg-[var(--color-accent-bg)] rounded-xl px-3 py-1">
          <span className="font-bold text-[var(--color-text-h)]">
            {player.x}, {player.y}
          </span>
        </div>
      </div>
    </div>
  )
}