import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Scale, ChevronRight, CheckCircle2, XCircle, ArrowUpCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MagneticButton } from '@/components/motion/MagneticButton'
import { ViolationBadge } from '@/components/ui/ViolationBadge'
import { api, evidenceUrl } from '@/lib/api'
import type { Challan } from '@/lib/types'
import { cn, inr, formatPlate } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'

export default function ContestedQueue() {
  const [items, setItems] = useState<Challan[]>([])
  const [idx, setIdx] = useState(0)
  const [decision, setDecision] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    api.listChallans({ status: 'CONTESTED', limit: 50 }).then((r) => { setItems(r.items); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const current = items[idx]

  const submit = async () => {
    if (!current || !decision || reason.length < 10) return
    await api.patchChallan(current.challan_id, { status: decision, officer_decision: reason })
    toast.success(`Challan ${current.challan_id} ${decision.replace('CONTESTED_', '').toLowerCase()}`)
    setItems((p) => p.filter((_, i) => i !== idx))
    setDecision(''); setReason('')
    if (idx >= items.length - 1) setIdx(Math.max(0, idx - 1))
  }

  if (loading) return <div className="text-center py-20 text-text-muted">Loading contested challans...</div>
  if (items.length === 0) return (
    <Card className="text-center py-16">
      <Scale className="h-12 w-12 text-emerald mx-auto mb-3" />
      <p className="text-text-muted">No contested challans to review</p>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-h2 text-text-primary">Contested Challans</h2>
        <Badge variant="warning">{idx + 1} / {items.length}</Badge>
      </div>

      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={current.challan_id}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Left: Challan info */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-sm text-amethyst-light">{current.challan_id}</span>
                <ViolationBadge violation={current.violation} />
              </div>
              {current.evidence_image && (
                <img src={evidenceUrl(current.evidence_image)} alt="AI evidence" className="w-full rounded-xl mb-4 border border-border-glass" />
              )}
              <p className="text-label text-text-muted mb-1">AI Evidence</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-text-muted">Plate:</span> <span className="font-mono">{current.plate ? formatPlate(current.plate) : '—'}</span></div>
                <div><span className="text-text-muted">Fine:</span> <span className="font-mono">{inr(current.fine_inr)}</span></div>
                <div><span className="text-text-muted">Confidence:</span> <span className="font-mono">{((current.confidence || 0) * 100).toFixed(0)}%</span></div>
                <div><span className="text-text-muted">Camera:</span> <span>{current.camera}</span></div>
              </div>
            </Card>

            {/* Right: Citizen's contest + decision */}
            <Card>
              <p className="text-label text-text-muted mb-2">Citizen's Reason</p>
              <div className="glass rounded-xl p-4 mb-4 text-sm text-text-secondary">
                {current.citizen_reason || 'No reason provided'}
              </div>
              {current.citizen_evidence && (
                <>
                  <p className="text-label text-text-muted mb-2">Citizen's Counter-Evidence</p>
                  <img src={evidenceUrl(current.citizen_evidence)} alt="Citizen evidence" className="w-full rounded-xl mb-4 border border-border-glass" />
                </>
              )}

              <p className="text-label text-text-muted mb-2">Your Decision</p>
              <div className="flex gap-2 mb-4">
                {[
                  { value: 'CONTESTED_UPHELD', label: 'Uphold', icon: CheckCircle2, color: 'text-crimson' },
                  { value: 'CONTESTED_DISMISSED', label: 'Dismiss', icon: XCircle, color: 'text-emerald' },
                  { value: 'ESCALATED', label: 'Escalate', icon: ArrowUpCircle, color: 'text-amber' },
                ].map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDecision(d.value)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border',
                      decision === d.value ? 'glass bg-amethyst/10 border-amethyst/30' : 'border-border-glass hover:bg-white/[0.03]',
                    )}
                  >
                    <d.icon className={cn('h-4 w-4', d.color)} /> {d.label}
                  </button>
                ))}
              </div>

              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Write your decision rationale (min 10 chars)..."
                className="w-full h-24 rounded-xl px-4 py-3 text-sm bg-white/[0.03] border border-border-glass text-text-primary placeholder:text-text-faint outline-none focus:ring-2 focus:ring-amethyst/30 resize-none mb-4"
              />

              <div className="flex gap-2">
                <MagneticButton className="flex-1" onClick={submit} disabled={!decision || reason.length < 10}>
                  Submit Decision
                </MagneticButton>
                {idx < items.length - 1 && (
                  <MagneticButton variant="ghost" onClick={() => { setIdx(idx + 1); setDecision(''); setReason('') }}>
                    Skip <ChevronRight className="h-4 w-4" />
                  </MagneticButton>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
