import { useState, useEffect } from 'react'
import { Mail, ExternalLink, Paperclip } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { api, type OutboxEntry } from '@/lib/api'

export default function Outbox() {
  const [items, setItems] = useState<OutboxEntry[]>([])
  const [selected, setSelected] = useState<OutboxEntry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.outbox().then((r) => { setItems(r.items); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-h2 text-text-primary">Email Outbox</h2>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Email list */}
        <div className="lg:col-span-2 space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto">
          {loading ? (
            <Card className="text-center py-8"><p className="text-text-muted text-sm">Loading...</p></Card>
          ) : items.length === 0 ? (
            <Card className="text-center py-8">
              <Mail className="h-8 w-8 text-text-faint mx-auto mb-2" />
              <p className="text-text-muted text-sm">No emails sent yet</p>
            </Card>
          ) : items.map((item) => (
            <Card
              key={item.name}
              hover
              className={`cursor-pointer ${selected?.name === item.name ? 'border border-amethyst/30' : ''}`}
              onClick={() => setSelected(item)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-text-primary truncate flex-1">{item.subject}</span>
                <Badge variant={item.mode === 'smtp' ? 'success' : 'info'} className="ml-2 shrink-0">
                  {item.mode}
                </Badge>
              </div>
              <p className="text-xs text-text-muted truncate">To: {item.to}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-text-faint">{new Date(item.created_at * 1000).toLocaleString()}</span>
                {item.attachment && <Paperclip className="h-3 w-3 text-text-faint" />}
              </div>
            </Card>
          ))}
        </div>

        {/* Preview */}
        <div className="lg:col-span-3">
          {selected ? (
            <Card className="h-full">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-glass">
                <div>
                  <h3 className="text-h3 text-text-primary">{selected.subject}</h3>
                  <p className="text-xs text-text-muted mt-1">To: {selected.to}</p>
                </div>
                <a href={api.outboxViewUrl(selected.name)} target="_blank" rel="noreferrer" className="text-text-muted hover:text-amethyst-light">
                  <ExternalLink className="h-5 w-5" />
                </a>
              </div>
              <iframe
                src={api.outboxViewUrl(selected.name)}
                className="w-full h-[calc(100vh-360px)] rounded-xl border border-border-glass bg-white"
                sandbox="allow-same-origin allow-scripts"
                title="Email preview"
              />
              {selected.attachment && (
                <a
                  href={api.challanPdfUrl(selected.attachment.replace(/\.pdf$/i, ''))}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm text-amethyst-light hover:underline"
                >
                  📄 Open PDF Attachment
                </a>
              )}
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center text-center py-20">
              <div>
                <Mail className="h-10 w-10 text-text-faint mx-auto mb-3" />
                <p className="text-text-muted">Select an email to preview</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
