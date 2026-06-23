import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Bot, User, Sparkles } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card } from '@/components/ui/Card'
import { MagneticButton } from '@/components/motion/MagneticButton'
import { api } from '@/lib/api'
import type { ChatMessage } from '@/lib/types'

const SUGGESTIONS = [
  'How many helmet violations this week?',
  'Top 3 cameras by violations',
  'Compare phone use vs red light violations',
  'Total fines collected this month',
  'Which hour has the most violations?',
  'Show repeat offender stats',
]

export default function ChatAnalytics() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight) }, [messages])

  const send = async (text?: string) => {
    const q = text || input
    if (!q.trim()) return
    setInput('')
    const userMsg: ChatMessage = { role: 'user', content: q, timestamp: Date.now() }
    setMessages((m) => [...m, userMsg])
    setLoading(true)

    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }))
      const res = await api.chat(history)
      const botMsg: ChatMessage = {
        role: 'assistant', content: res.reply, timestamp: Date.now(),
        chart: res.chart as ChatMessage['chart'],
        chartData: res.data && typeof res.data === 'object' && 'rows' in (res.data as Record<string, unknown>)
          ? ((res.data as { rows: { key: string; value: number }[] }).rows || []).map((r) => ({ key: r.key, value: r.value }))
          : undefined,
      }
      setMessages((m) => [...m, botMsg])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, I encountered an error. Try again.', timestamp: Date.now() }])
    }
    setLoading(false)
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-160px)]">
      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-4 rounded-2xl bg-amethyst/10 mb-4">
                <Sparkles className="h-8 w-8 text-amethyst" />
              </div>
              <h3 className="text-h3 text-text-primary mb-2">DrishtiBot</h3>
              <p className="text-sm text-text-muted max-w-sm">
                Ask me anything about traffic violations, analytics, and enforcement data.
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}
            >
              {m.role === 'assistant' && (
                <div className="shrink-0 h-8 w-8 rounded-full bg-amethyst/15 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-amethyst" />
                </div>
              )}
              <div className={`max-w-[75%] ${m.role === 'user' ? 'glass bg-amethyst/10 border-amethyst/20' : 'glass'} rounded-2xl px-4 py-3`}>
                <p className="text-sm text-text-primary whitespace-pre-wrap">{m.content}</p>
                {m.chartData && m.chartData.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border-glass">
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={m.chartData}>
                        <XAxis dataKey="key" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#14B8A6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              {m.role === 'user' && (
                <div className="shrink-0 h-8 w-8 rounded-full bg-surface flex items-center justify-center">
                  <User className="h-4 w-4 text-text-muted" />
                </div>
              )}
            </motion.div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-text-muted text-sm">
              <div className="h-2 w-2 rounded-full bg-amethyst animate-dot-pulse" />
              DrishtiBot is thinking...
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2 pt-4 border-t border-border-glass">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask about violations, trends, cameras..."
            className="flex-1 h-11 rounded-xl px-4 text-sm bg-white/[0.03] border border-border-glass text-text-primary placeholder:text-text-faint outline-none focus:ring-2 focus:ring-amethyst/30"
          />
          <MagneticButton onClick={() => send()} loading={loading} icon={<Send className="h-4 w-4" />}>
            Send
          </MagneticButton>
        </div>
      </div>

      {/* Suggestions sidebar */}
      <div className="hidden lg:block w-64 shrink-0">
        <Card>
          <h4 className="text-label text-text-muted mb-3">Suggested Queries</h4>
          <div className="space-y-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-white/[0.04] hover:text-text-primary"
              >
                {s}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
