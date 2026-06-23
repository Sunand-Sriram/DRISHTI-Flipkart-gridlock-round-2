import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { MagneticButton } from '@/components/motion/MagneticButton'
import { ViolationBadge, StatusBadge } from '@/components/ui/ViolationBadge'
import { useChallans } from '@/lib/hooks'
import { cn, inr, formatPlate, downloadCSV, VIOLATION_TYPES, VIOLATION_LABEL } from '@/lib/utils'

export default function ChallanList() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [types, setTypes] = useState<string[]>([])
  const [status, setStatus] = useState('')

  const { data } = useChallans({ page, limit: 25, q: search || undefined, types: types.join(',') || undefined, status: status || undefined })
  const items = data?.items || []
  const total = data?.total || 0
  const pages = Math.ceil(total / 25)

  const toggleType = (t: string) => setTypes((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t])

  const exportCSV = () => {
    if (!items.length) return
    downloadCSV('challans', items.map((c) => ({
      id: c.challan_id, violation: c.violation, plate: c.plate || '', fine: c.fine_inr,
      status: c.status, camera: c.camera, confidence: ((c.confidence || 0) * 100).toFixed(0) + '%',
      date: new Date(c.created_at * 1000).toLocaleDateString(),
    })))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-h2 text-text-primary">Challans</h2>
        <MagneticButton variant="outline" size="sm" onClick={exportCSV} icon={<Download className="h-4 w-4" />}>
          Export CSV
        </MagneticButton>
      </div>

      {/* Search and filters */}
      <Card className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by plate or challan ID..."
            className="w-full h-10 pl-10 pr-4 rounded-xl text-sm bg-white/[0.03] border border-border-glass text-text-primary placeholder:text-text-faint outline-none focus:ring-2 focus:ring-amethyst/30"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {VIOLATION_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => { toggleType(t); setPage(1) }}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                types.includes(t) ? 'bg-amethyst/15 border-amethyst/30 text-amethyst-light' : 'border-border-glass text-text-muted hover:bg-white/[0.03]',
              )}
            >
              {VIOLATION_LABEL[t]}
            </button>
          ))}
          <select
            value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            className="h-8 px-3 rounded-lg text-xs bg-white/[0.03] border border-border-glass text-text-primary outline-none"
          >
            <option value="">All Status</option>
            <option value="ISSUED">Issued</option>
            <option value="PAID">Paid</option>
            <option value="PENDING_REVIEW">Pending</option>
            <option value="CONTESTED">Contested</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Challan ID</th><th>Violation</th><th>Plate</th><th>Fine</th><th>Status</th><th>Camera</th><th>Date</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.challan_id} className="cursor-pointer" onClick={() => navigate(`/officer/challans/${c.challan_id}`)}>
                <td className="font-mono text-xs text-amethyst-light">{c.challan_id}</td>
                <td><ViolationBadge violation={c.violation} /></td>
                <td className="font-mono text-xs">{c.plate ? formatPlate(c.plate) : '—'}</td>
                <td className="font-mono">{inr(c.fine_inr)}</td>
                <td><StatusBadge status={c.status} /></td>
                <td className="text-text-muted">{c.camera}</td>
                <td className="text-text-muted text-xs">{new Date(c.created_at * 1000).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <MagneticButton variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </MagneticButton>
          <span className="text-sm text-text-muted px-4">Page {page} of {pages} · {total} total</span>
          <MagneticButton variant="ghost" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </MagneticButton>
        </div>
      )}
    </div>
  )
}
