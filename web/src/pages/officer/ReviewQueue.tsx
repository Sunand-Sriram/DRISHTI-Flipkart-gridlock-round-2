import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, ArrowUpDown } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { MagneticButton } from '@/components/motion/MagneticButton'
import { ViolationBadge } from '@/components/ui/ViolationBadge'
import { useChallans } from '@/lib/hooks'
import { api, evidenceUrl } from '@/lib/api'
import { cn, inr, formatPlate } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'

export default function ReviewQueue() {
  const { data, loading, reload } = useChallans({ status: 'PENDING_REVIEW', limit: 50 })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [preview, setPreview] = useState<string | null>(null)
  const [sortAsc, setSortAsc] = useState(true)
  const toast = useToast()

  const items = data?.items || []
  const sorted = [...items].sort((a, b) => sortAsc ? (a.confidence || 0) - (b.confidence || 0) : (b.confidence || 0) - (a.confidence || 0))

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSelected(selected.size === items.length ? new Set() : new Set(items.map((c) => c.challan_id)))

  const handleBatch = async (status: string) => {
    const ids = Array.from(selected)
    for (const id of ids) await api.patchChallan(id, { status })
    toast.success(`${ids.length} challan(s) ${status === 'ISSUED' ? 'approved' : 'rejected'}`)
    setSelected(new Set())
    reload()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-h2 text-text-primary">Review Queue</h2>
          <p className="text-sm text-text-muted mt-1">Low-confidence detections requiring officer review</p>
        </div>
        <Badge variant="warning" dot>{items.length} pending</Badge>
      </div>

      {items.length === 0 && !loading ? (
        <Card className="text-center py-16">
          <CheckCircle2 className="h-12 w-12 text-emerald mx-auto mb-3" />
          <p className="text-text-muted">All clear — no pending reviews</p>
        </Card>
      ) : (
        <>
          <div className="glass rounded-xl overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th><input type="checkbox" checked={selected.size === items.length && items.length > 0} onChange={toggleAll} className="accent-amethyst" /></th>
                  <th>Challan</th>
                  <th>Evidence</th>
                  <th>Violation</th>
                  <th>Plate</th>
                  <th className="cursor-pointer" onClick={() => setSortAsc(!sortAsc)}>
                    <span className="flex items-center gap-1">Confidence <ArrowUpDown className="h-3 w-3" /></span>
                  </th>
                  <th>Fine</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {sorted.map((c) => (
                    <motion.tr
                      key={c.challan_id}
                      layout
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                    >
                      <td><input type="checkbox" checked={selected.has(c.challan_id)} onChange={() => toggle(c.challan_id)} className="accent-amethyst" /></td>
                      <td><span className="font-mono text-xs text-amethyst-light">{c.challan_id}</span></td>
                      <td>
                        {c.evidence_image && (
                          <button onClick={() => setPreview(c.evidence_image!)}>
                            <img src={evidenceUrl(c.evidence_image)} alt="" className="w-14 h-10 rounded-lg object-cover border border-border-glass hover:border-amethyst/30" />
                          </button>
                        )}
                      </td>
                      <td><ViolationBadge violation={c.violation} /></td>
                      <td className="font-mono text-xs">{c.plate ? formatPlate(c.plate) : '—'}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div className={cn('h-full rounded-full', (c.confidence || 0) > 0.6 ? 'bg-amber' : 'bg-crimson')} style={{ width: `${(c.confidence || 0) * 100}%` }} />
                          </div>
                          <span className="text-xs font-mono">{((c.confidence || 0) * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="font-mono text-sm">{inr(c.fine_inr)}</td>
                      <td>
                        <div className="flex gap-1">
                          <MagneticButton variant="success" size="sm" magnetic={false} onClick={async () => { await api.patchChallan(c.challan_id, { status: 'ISSUED' }); toast.success('Approved'); reload() }}>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </MagneticButton>
                          <MagneticButton variant="danger" size="sm" magnetic={false} onClick={async () => { await api.patchChallan(c.challan_id, { status: 'REJECTED' }); toast.info('Rejected'); reload() }}>
                            <XCircle className="h-3.5 w-3.5" />
                          </MagneticButton>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Batch action bar */}
          <AnimatePresence>
            {selected.size > 0 && (
              <motion.div
                initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-strong rounded-xl px-6 py-3 flex items-center gap-4"
              >
                <span className="text-sm text-text-muted">{selected.size} selected</span>
                <MagneticButton variant="success" size="sm" onClick={() => handleBatch('ISSUED')}>
                  <CheckCircle2 className="h-4 w-4" /> Approve All
                </MagneticButton>
                <MagneticButton variant="danger" size="sm" onClick={() => handleBatch('REJECTED')}>
                  <XCircle className="h-4 w-4" /> Reject All
                </MagneticButton>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Evidence preview modal */}
      <Modal open={!!preview} onClose={() => setPreview(null)} title="Evidence Preview" wide>
        {preview && <img src={evidenceUrl(preview)} alt="Evidence" className="w-full rounded-xl" />}
      </Modal>
    </div>
  )
}
