import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { ViolationBadge } from '@/components/ui/ViolationBadge'
import { api, evidenceUrl } from '@/lib/api'
import type { Challan } from '@/lib/types'
import { cn } from '@/lib/utils'

type Decision = 'CONTESTED_UPHELD' | 'CONTESTED_DISMISSED' | 'ESCALATED'

export default function ContestedQueue() {
  const [queue, setQueue] = useState<Challan[]>([])
  const [index, setIndex] = useState(0)
  const [decision, setDecision] = useState<Decision | null>(null)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [touched, setTouched] = useState(false)
  const [modal, setModal] = useState<'original' | 'counter' | null>(null)

  useEffect(() => {
    api.listChallans({ status: 'CONTESTED', limit: 200 })
      .then((r) => setQueue(r.items)).catch(() => setQueue([]))
  }, [])

  const current = queue[index]
  const valid = !!decision && reason.trim().length >= 10

  async function submit() {
    setTouched(true)
    if (!current || !valid) return
    setSubmitting(true)
    try {
      await api.patchChallan(current.challan_id, { status: decision!, officer_decision: reason })
    } catch { /* keep UI responsive in demo */ }
    setQueue((q) => q.filter((_, i) => i !== index))
    setDecision(null)
    setReason('')
    setTouched(false)
    setSubmitting(false)
    if (index >= queue.length - 1) setIndex(Math.max(0, index - 1))
  }

  if (!current) {
    return (
      <Card className="py-16 text-center">
        <p className="text-xl text-officer-mint">All contested challenges resolved ✓</p>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="text-officer-mint font-semibold">📋 Queue: {queue.length} open</span>
        <span className="text-officer-muted">🕐 Avg wait: 2h 14m</span>
      </div>

      <motion.div key={current.challan_id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="font-mono text-lg text-amber-300">{current.challan_id}</span>
            <ViolationBadge type={current.violation} />
            <span className="font-mono text-officer-muted">{current.plate}</span>
          </div>

          <div className="space-y-4 rounded-xl border border-officer-border bg-officer-bg/40 p-5">
            <div>
              <p className="mb-2 text-sm font-medium text-officer-muted">Citizen Reason</p>
              <p className="rounded-lg bg-officer-surface p-4 text-sm leading-relaxed">{current.citizen_reason}</p>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-officer-muted">Evidence Comparison</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button onClick={() => setModal('original')} className="text-left">
                  <p className="mb-1 text-xs text-officer-muted">AI Evidence (original)</p>
                  {current.evidence_image ? (
                    <img src={evidenceUrl(current.evidence_image)} alt="original evidence"
                         className="aspect-video w-full rounded-lg border border-officer-border object-cover" />
                  ) : (
                    <div className="aspect-video rounded-lg border border-officer-border bg-officer-bg grid place-items-center text-xs text-officer-muted">none</div>
                  )}
                </button>
                <button onClick={() => setModal('counter')} className="text-left">
                  <p className="mb-1 text-xs text-officer-muted">Citizen Counter-Evidence</p>
                  {current.citizen_evidence ? (
                    <img src={evidenceUrl(current.citizen_evidence)} alt="counter evidence"
                         className="aspect-video w-full rounded-lg border border-officer-border object-cover" />
                  ) : (
                    <div className="aspect-video rounded-lg border border-officer-border bg-officer-bg grid place-items-center text-xs text-officer-muted">no upload</div>
                  )}
                </button>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium">Officer Decision</p>
              {(
                [
                  ['CONTESTED_UPHELD', 'Uphold (fine stands, citizen must pay)'],
                  ['CONTESTED_DISMISSED', 'Dismiss (challan cancelled, refund fine)'],
                  ['ESCALATED', 'Escalate (magistrate review)'],
                ] as const
              ).map(([val, label]) => (
                <label
                  key={val}
                  className={cn(
                    'mb-2 flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors',
                    decision === val
                      ? 'border-officer-primary bg-amber-500/10'
                      : 'border-officer-border hover:border-amber-500/30'
                  )}
                >
                  <input
                    type="radio"
                    name="decision"
                    checked={decision === val}
                    onChange={() => setDecision(val)}
                    className="accent-amber-500"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>

            <textarea
              placeholder="Decision reason (required)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-officer-border bg-officer-surface p-4 text-sm outline-none focus:border-officer-primary"
            />

            {touched && !decision && <p className="text-xs text-rose-400">Select a decision above.</p>}
            {touched && decision && reason.trim().length < 10 && (
              <p className="text-xs text-rose-400">Enter a decision reason (at least 10 characters) for the audit trail.</p>
            )}
            <div className="flex gap-3">
              <Button variant="success" loading={submitting} onClick={submit}>
                Submit Decision
              </Button>
              <Button variant="outline" onClick={() => { setDecision(null); setReason(''); setTouched(false) }}>Reset</Button>
            </div>
          </div>

          <p className="mt-4 text-xs text-officer-muted">Status: Under Officer Review · Submitted 2h ago</p>
        </Card>
      </motion.div>

      {queue.length > 1 && (
        <Button variant="secondary" className="w-full" onClick={() => setIndex((i) => (i + 1) % queue.length)}>
          Next Challan
        </Button>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'original' ? 'AI Evidence (original)' : 'Citizen Counter-Evidence'} wide>
        {(() => {
          const img = modal === 'original' ? current.evidence_image : current.citizen_evidence
          return img ? (
            <img src={evidenceUrl(img)} alt="evidence" className="w-full rounded-xl border border-officer-border" />
          ) : (
            <div className="aspect-video rounded-xl bg-officer-bg grid place-items-center text-officer-muted">No image available</div>
          )
        })()}
      </Modal>
    </div>
  )
}
