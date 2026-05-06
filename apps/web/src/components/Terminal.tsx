import { useState, useEffect, useRef } from 'react'

type TerminalProps = {
  initialLines?: string[]
}

export default function Terminal({ initialLines = [] }: TerminalProps) {
  const [lines, setLines] = useState<string[]>(initialLines)
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const program = localStorage.getItem('program') || 'KinderRoot'

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const newLines = [...lines, `rootcode@${program.toLowerCase()} $ ${input}`]
    setLines(newLines)
    setInput('')
  }

  const focusTerminal = () => {
    inputRef.current?.focus()
  }

  return (
    <div
      onClick={focusTerminal}
      className="flex flex-col h-full font-mono text-sm"
      style={{ backgroundColor: '#1e1e2e' }}
    >
      <div className="flex items-center px-2 py-1.5 border-b" style={{ backgroundColor: '#262637', borderColor: '#3d3d52' }}>
        <div className="flex gap-1 mr-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f7768e]"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#e0af68]"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#9ece6a]"></span>
        </div>
        <span className="text-xs text-[#6c7680]">Terminal</span>
      </div>
      
      <div className="flex-1 p-2 overflow-y-auto">
        <p className="text-[#89b4fa] mb-2"># {program} Terminal</p>
        {lines.map((line, i) => (
          <div key={i} className="text-[#cdd6f4]">{line}</div>
        ))}
        <form onSubmit={handleSubmit} className="flex items-center gap-1 mt-1">
          <span className="text-[#a6e3a1]">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 bg-transparent text-[#cdd6f4] outline-none text-xs"
            autoFocus
          />
        </form>
      </div>
    </div>
  )
}