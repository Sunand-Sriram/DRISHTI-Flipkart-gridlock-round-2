import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/ViolationBadge'
import { ViolationBadge } from '@/components/ui/ViolationBadge'
import { useChallans } from '@/lib/hooks'
import { VIOLATION_LABEL, VIOLATION_TYPES, inr, downloadCSV } from '@/lib/utils'

const PAGE_SIZE = 25

export default function ChallanList() {
  const [search, setSearch] = useState('')
  const [types, setTypes] = useState<Set<string>>(new Set())
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const { data, loading } = useChallans({ limit: 1000 })

  const filtered = useMemo(() => {
    let list = data?.items ?? []
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) => c.challan_id.toLowerCase().includes(q) || c.plate?.toLowerCase().includes(q)
      )
    }
    if (types.size) list = list.filter((c) => types.has(c.violation))
    if (status !== 'all') list = list.filter((c) => c.status.toLowerCase() === status)
    return list
  }, [search, types, status, data])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function toggleType(t: string) {
    setTypes((prev) => {
      const n = new Set(prev)
      n.has(t) ? n.delete(t) : n.add(t)
      return n
    })
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-officer-muted" />
        <input
          placeholder="Search by plate or ID..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="h-12 w-full rounded-xl border border-officer-border bg-officer-surface pl-11 pr-4 text-sm outline-none focus:border-officer-primary"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {VIOLATION_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => toggleType(t)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              types.has(t)
                ? 'border-officer-primary bg-amber-500/20 text-amber-200'
                : 'border-officer-border text-officer-muted hover:border-amber-500/30'
            }`}
          >
            {VIOLATION_LABEL[t]}
          </button>
        ))}
        {types.size > 0 && (
          <button type="button" onClick={() => setTypes(new Set())} className="text-xs text-amber-400 underline">
            Clear All Filters
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <Select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'issued', label: 'Issued' },
            { value: 'paid', label: 'Paid' },
            { value: 'contested', label: 'Contested' },
            { value: 'pending_review', label: 'Pending Review' },
          ]}
        />
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadCSV(`challans-${new Date().toISOString().slice(0, 10)}`,
              filtered.map((c) => ({
                challan_id: c.challan_id, plate: c.plate ?? '', violation: VIOLATION_LABEL[c.violation] ?? c.violation,
                fine_inr: c.fine_inr, status: c.status, camera: c.camera,
                owner: c.owner?.owner ?? '', email: (c.owner as { email?: string })?.email ?? '',
                created: new Date(c.created_at).toLocaleString('en-IN'),
              })))}
          >
            Export CSV ({filtered.length})
          </Button>
        </div>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-officer-border text-left text-officer-muted">
                <th className="p-4">ID</th>
                <th className="p-4">Plate</th>
                <th className="p-4">Type</th>
                <th className="p-4 font-mono">Fine</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-12 text-center text-officer-muted">Loading challans…</td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-officer-muted">No challans match your filters</td></tr>
              ) : (
                pageItems.map((c) => (
                  <tr key={c.challan_id} className="border-b border-officer-border/50 hover:bg-white/5">
                    <td className="p-4">
                      <Link to={`/officer/challans/${c.challan_id}`} className="font-mono text-amber-300 hover:underline">
                        {c.challan_id}
                      </Link>
                    </td>
                    <td className="p-4 font-mono">{c.plate}</td>
                    <td className="p-4"><ViolationBadge type={c.violation} /></td>
                    <td className="p-4 font-mono">{inr(c.fine_inr)}</td>
                    <td className="p-4"><StatusBadge status={c.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center justify-between text-sm text-officer-muted">
        <span>Showing {pageItems.length} of {filtered.length}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((p) => (
            <Button key={p} size="sm" variant={p === page ? 'primary' : 'outline'} onClick={() => setPage(p)}>{p}</Button>
          ))}
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      </div>
    </div>
  )
}
