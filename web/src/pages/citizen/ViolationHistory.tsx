import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { History, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { ViolationBadge, StatusBadge } from '@/components/ui/ViolationBadge'
import { api } from '@/lib/api'
import { getCitizenPlate } from '@/lib/store'
import { inr, formatPlate } from '@/lib/utils'
import type { Challan } from '@/lib/types'

export default function ViolationHistory() {
  const navigate = useNavigate()
  const plate = getCitizenPlate()
  // Use the plate-scoped citizen endpoint — /api/challans has no `plate` filter,
  // so the old useChallans({ plate }) returned every citizen's challans.
  const [items, setItems] = useState<Challan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!plate) { setLoading(false); return }
    api.citizenHistory(plate)
      .then((r) => setItems(r.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [plate])

  return (
    <div className="space-y-6">
      <h1 className="text-h1 text-citizen-text">Violation History</h1>
      <p className="text-sm text-citizen-muted">Vehicle: <span className="font-mono">{plate ? formatPlate(plate) : '—'}</span></p>

      {loading ? (
        <p className="text-center py-12 text-citizen-muted">Loading...</p>
      ) : items.length === 0 ? (
        <Card citizen className="text-center py-12">
          <History className="h-10 w-10 text-citizen-faint mx-auto mb-2" />
          <p className="text-citizen-muted">No violations found for this vehicle</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((c, i) => (
            <motion.div
              key={c.challan_id}
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 100, damping: 20 }}
            >
              <Card
                citizen hover
                className="cursor-pointer"
                onClick={() => navigate(`/citizen/challan/${c.challan_id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <ViolationBadge violation={c.violation} />
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-sm text-citizen-muted">{c.challan_id} · {new Date(c.created_at * 1000).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold text-citizen-text">{inr(c.fine_inr)}</span>
                    <ChevronRight className="h-4 w-4 text-citizen-faint" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
