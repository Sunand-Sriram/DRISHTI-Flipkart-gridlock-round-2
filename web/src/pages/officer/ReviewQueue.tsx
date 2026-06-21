import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { Check, Eye, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { ViolationBadge } from '@/components/ui/ViolationBadge'
import { api, evidenceUrl } from '@/lib/api'
import type { Challan } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function ReviewQueue() {
  const [items, setItems] = useState<Challan[]>([])
  useEffect(() => {
    api.listChallans({ status: 'PENDING_REVIEW', limit: 200 })
      .then((r) => setItems(r.items)).catch(() => setItems([]))
  }, [])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [evidenceId, setEvidenceId] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<'approve' | 'reject' | null>(null)
  const [sortAsc, setSortAsc] = useState(true)

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) =>
        sortAsc ? (a.confidence ?? 0) - (b.confidence ?? 0) : (b.confidence ?? 0) - (a.confidence ?? 0)
      ),
    [items, sortAsc]
  )

  const critical = items.filter((c) => (c.confidence ?? 1) < 0.7).length

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function removeIds(ids: string[]) {
    setItems((prev) => prev.filter((c) => !ids.includes(c.challan_id)))
    setSelected(new Set())
  }

  function handleApprove(ids: string[]) {
    ids.forEach((id) => api.patchChallan(id, { status: 'ISSUED' }).catch(() => {}))
    removeIds(ids)
    setConfirm(null)
  }

  function handleReject(ids: string[]) {
    ids.forEach((id) => api.patchChallan(id, { status: 'REJECTED' }).catch(() => {}))
    removeIds(ids)
    setConfirm(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-lg font-semibold text-officer-mint">
          📊 Queue: {items.length} pending
        </p>
        <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-sm text-red-400">
          🔴 Low confidence (&lt; 0.70): {critical}
        </span>
      </div>

      {selected.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3"
        >
          <Button variant="success" onClick={() => setConfirm('approve')}>
            <Check className="h-4 w-4" /> Approve ({selected.size})
          </Button>
          <Button variant="danger" onClick={() => setConfirm('reject')}>
            <X className="h-4 w-4" /> Reject ({selected.size})
          </Button>
        </motion.div>
      )}

      <Card padding={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-officer-bg/50">
              <tr className="text-left text-officer-muted">
                <th className="p-4 w-10" />
                <th className="p-4 font-mono">ID</th>
                <th className="p-4">Violation</th>
                <th className="p-4 font-mono">Plate</th>
                <th
                  className="p-4 font-mono cursor-pointer hover:text-white"
                  onClick={() => setSortAsc(!sortAsc)}
                >
                  Conf {sortAsc ? '↑' : '↓'}
                </th>
                <th className="p-4">Camera</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <LayoutGroup>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {sorted.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-officer-mint">
                        No pending reviews — all clear! ✓
                      </td>
                    </tr>
                  ) : (
                    sorted.map((c) => (
                      <motion.tr
                        key={c.challan_id}
                        layout
                        layoutId={c.challan_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95, x: -40 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        className={cn(
                          'border-t border-officer-border hover:bg-white/[0.03]',
                          selected.has(c.challan_id) && 'bg-amber-500/10'
                        )}
                      >
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selected.has(c.challan_id)}
                            onChange={() => toggle(c.challan_id)}
                            className="rounded border-officer-border"
                          />
                        </td>
                        <td className="p-4 font-mono text-amber-300">{c.challan_id}</td>
                        <td className="p-4"><ViolationBadge type={c.violation} /></td>
                        <td className="p-4 font-mono">{c.plate}</td>
                        <td className="p-4">
                          <span
                            className={cn(
                              'font-mono rounded-full px-2 py-0.5 text-xs',
                              (c.confidence ?? 0) < 0.5
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-amber-500/20 text-amber-400'
                            )}
                          >
                            {(c.confidence ?? 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-officer-muted">{c.camera}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => setEvidenceId(c.challan_id)}>
                              <Eye className="h-3 w-3" /> Evidence
                            </Button>
                            <Button size="sm" variant="success" onClick={() => handleApprove([c.challan_id])}>
                              <Check className="h-3 w-3" /> Approve
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => handleReject([c.challan_id])}>
                              <X className="h-3 w-3" /> Reject
                            </Button>
                            <Link to={`/officer/challans/${c.challan_id}`}>
                              <Button size="sm" variant="ghost">Details</Button>
                            </Link>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </LayoutGroup>
          </table>
        </div>
      </Card>

      <Modal open={!!evidenceId} onClose={() => setEvidenceId(null)} title={`Evidence · ${evidenceId ?? ''}`} wide>
        {(() => {
          const c = items.find((x) => x.challan_id === evidenceId)
          if (!c) return null
          return (
            <div className="space-y-3">
              {c.evidence_image ? (
                <img src={evidenceUrl(c.evidence_image)} alt="Evidence"
                     className="w-full rounded-xl border border-officer-border" />
              ) : (
                <div className="aspect-video rounded-xl border border-officer-border bg-officer-bg grid place-items-center text-officer-muted">
                  No evidence image
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-officer-muted">Plate <span className="font-mono text-white">{c.plate}</span> · Conf <span className="font-mono">{(c.confidence ?? 0).toFixed(2)}</span> · {c.camera}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="success" onClick={() => { handleApprove([c.challan_id]); setEvidenceId(null) }}><Check className="h-3 w-3" /> Approve</Button>
                  <Button size="sm" variant="danger" onClick={() => { handleReject([c.challan_id]); setEvidenceId(null) }}><X className="h-3 w-3" /> Reject</Button>
                </div>
              </div>
            </div>
          )
        })()}
      </Modal>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={confirm === 'approve' ? 'Approve challans?' : 'Reject challans?'}>
        <p className="mb-6 text-officer-muted">
          {confirm === 'approve' ? 'Approve' : 'Reject'} {selected.size} selected challan(s)?
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
          <Button
            variant={confirm === 'approve' ? 'success' : 'danger'}
            onClick={() =>
              confirm === 'approve'
                ? handleApprove([...selected])
                : handleReject([...selected])
            }
          >
            Confirm
          </Button>
        </div>
      </Modal>
    </div>
  )
}
