import { useEffect, useState } from 'react'
import { Mail, Paperclip, RefreshCw, Send } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { api, type OutboxEntry } from '@/lib/api'

function timeAgo(ts: number) {
  const s = Math.floor(Date.now() / 1000 - ts)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function Outbox() {
  const [items, setItems] = useState<OutboxEntry[]>([])
  const [sel, setSel] = useState<OutboxEntry | null>(null)
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    api.outbox().then((r) => {
      setItems(r.items)
      setSel((cur) => cur ?? r.items[0] ?? null)
      setLoading(false)
    }).catch(() => setLoading(false))
  }
  useEffect(load, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2"><Mail className="h-5 w-5 text-officer-primary" /> Email Outbox</h1>
          <p className="text-sm text-officer-muted">Every e-challan delivered to offenders. {items.length} message(s).</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>

      {items.length === 0 ? (
        <Card className="py-16 text-center text-officer-muted">
          <Send className="mx-auto mb-3 h-8 w-8 text-officer-faint" />
          {loading ? 'Loading…' : 'No emails sent yet. Open a challan and click “Email Challan to Owner”.'}
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          {/* list */}
          <Card padding={false} className="max-h-[70vh] overflow-y-auto">
            {items.map((m) => (
              <button
                key={m.name}
                onClick={() => setSel(m)}
                className={`flex w-full flex-col gap-1 border-b border-officer-border/50 px-4 py-3 text-left transition-colors ${
                  sel?.name === m.name ? 'bg-officer-primary/10' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-white">{m.to}</span>
                  <span className="shrink-0 font-mono text-[10px] text-officer-faint">{timeAgo(m.created_at)}</span>
                </div>
                <span className="truncate text-xs text-officer-muted">{m.subject}</span>
                <div className="flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] uppercase ${
                    m.mode === 'smtp' ? 'bg-officer-mint/15 text-officer-mint' : 'bg-officer-primary/15 text-officer-primary-soft'
                  }`}>
                    {m.mode === 'smtp' ? 'sent' : 'preview'}
                  </span>
                  {m.attachment && <span className="flex items-center gap-1 text-[10px] text-officer-faint"><Paperclip className="h-3 w-3" />{m.attachment}</span>}
                </div>
              </button>
            ))}
          </Card>

          {/* preview */}
          <Card padding={false} className="overflow-hidden">
            {sel ? (
              <>
                <div className="flex items-center justify-between gap-3 border-b border-officer-border px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{sel.subject}</p>
                    <p className="truncate text-xs text-officer-muted">To: {sel.to}</p>
                  </div>
                  <a href={api.outboxViewUrl(sel.name)} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm">Open in tab ↗</Button>
                  </a>
                </div>
                <iframe
                  title="email-preview"
                  src={api.outboxViewUrl(sel.name)}
                  className="h-[64vh] w-full bg-white"
                />
              </>
            ) : (
              <div className="grid h-full place-items-center p-12 text-officer-muted">Select an email</div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
