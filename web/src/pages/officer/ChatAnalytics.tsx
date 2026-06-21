import { useRef, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { suggestedQueries } from '@/lib/mock-data'
import { api } from '@/lib/api'
import type { ChatMessage } from '@/lib/types'

export default function ChatAnalytics() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function send(text?: string) {
    const content = (text || input).trim()
    if (!content) return
    setInput('')
    const history = [...messages, { role: 'user' as const, content, timestamp: Date.now() }]
    setMessages(history)
    setLoading(true)
    try {
      const res = await api.chat(history.map((m) => ({ role: m.role, content: m.content })))
      const rows = (res.data as { rows?: { key: string; value: number }[] })?.rows
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: res.reply,
          chart: res.chart,
          chartData: rows,
          timestamp: Date.now(),
        },
      ])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Could not reach analytics service.', timestamp: Date.now() }])
    }
    setLoading(false)
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr] min-h-[calc(100vh-12rem)]">
      <Card className="h-fit space-y-4">
        <p className="text-sm font-medium text-officer-muted">Suggested Queries</p>
        <div className="flex flex-col gap-2">
          {suggestedQueries.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              className="rounded-xl border border-officer-border px-3 py-2.5 text-left text-xs text-officer-muted hover:border-amber-500/40 hover:text-white transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={() => setMessages([])}>
          Clear History
        </Button>
      </Card>

      <Card className="flex flex-col min-h-[560px]">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-[480px]">
          {messages.length === 0 && (
            <p className="text-center text-officer-muted py-12">Ask about violations, trends, officers...</p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-officer-primary text-white'
                    : 'bg-officer-bg border border-officer-border text-officer-muted'
                }`}
              >
                <p className="text-[10px] mb-1 opacity-60">
                  {m.role === 'user' ? 'You' : 'DrishtiBot'} · {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                {m.content}
                {m.chart === 'bar' && m.chartData && m.chartData.length > 0 && (
                  <div className="mt-4 h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={m.chartData.slice(0, 8)}>
                        <XAxis dataKey="key" stroke="#9ca3af" fontSize={9} />
                        <YAxis stroke="#9ca3af" fontSize={9} />
                        <Tooltip contentStyle={{ background: '#0f1932', border: '1px solid #1c2740' }} />
                        <Bar dataKey="value" fill="#34d399" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2 text-officer-muted text-sm">
              <span className="animate-pulse">DrishtiBot is thinking...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="mt-4 flex gap-2 border-t border-officer-border pt-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Ask about violations, trends, officers..."
            disabled={loading}
            className="flex-1 rounded-xl border border-officer-border bg-officer-bg px-4 py-3 text-sm outline-none focus:border-officer-primary disabled:opacity-50"
          />
          <Button onClick={() => send()} loading={loading} disabled={!input.trim()}>
            Send ↵
          </Button>
        </div>
      </Card>
    </div>
  )
}
