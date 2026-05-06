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

    const newLines = [...lines, `kiddo@codekids $ ${input}`]
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
      className="flex-1 bg-[#2d2844] rounded-2xl overflow-hidden font-mono text-sm border-4 border-[#ff6b6b]"
    >
      <div className="bg-[#ff6b6b] px-4 py-2 text-white font-bold text-center flex justify-center gap-2">
        <span className="w-3 h-3 bg-white rounded-full"></span>
        <span className="w-3 h-3 bg-white rounded-full"></span>
        <span className="w-3 h-3 bg-white rounded-full"></span>
      </div>
      <div className="p-4 h-[calc(100%-48px)] overflow-y-auto">
        <p className="text-[#ffafaf] text-center mb-4">Let's Code!</p>
        {lines.map((line, i) => (
          <div key={i} className="text-[#e8e4dc] whitespace-pre-wrap">{line}</div>
        ))}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
          <span className="text-[#7ddda4]">kiddo@codekids</span>
          <span className="text-[#ffafaf]">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 bg-transparent text-[#e8e4dc] outline-none"
            autoFocus
          />
        </form>
      </div>
    </div>
  )
}