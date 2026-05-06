import { useState, useEffect, useRef } from 'react'

type TerminalProps = {
  initialLines?: string[]
}

export default function Terminal({ initialLines = [] }: TerminalProps) {
  const [lines, setLines] = useState<string[]>(initialLines)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const newLines = [...lines, `cadet@learn $ ${input}`]
    setLines(newLines)
    setHistory([...history, input])
    setInput('')
  }

  const focusTerminal = () => {
    inputRef.current?.focus()
  }

  return (
    <div
      onClick={focusTerminal}
      className="flex-1 bg-[#1a1b26] rounded-lg overflow-hidden font-mono text-sm"
    >
      <div className="bg-[#24283b] px-3 py-1 text-xs text-gray-400 flex gap-1">
        <span className="w-2 h-2 rounded-full bg-[#f9866e]"></span>
        <span className="w-2 h-2 rounded-full bg-[#e0af68]"></span>
        <span className="w-2 h-2 rounded-full bg-[#9ece6a]"></span>
      </div>
      <div className="p-3 h-[calc(100%-24px)] overflow-y-auto">
        {lines.map((line, i) => (
          <div key={i} className="text-gray-300 whitespace-pre-wrap">{line}</div>
        ))}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <span className="text-[#9ece6a]">cadet@learn</span>
          <span className="text-gray-500">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 bg-transparent text-gray-300 outline-none"
            autoFocus
          />
        </form>
      </div>
    </div>
  )
}