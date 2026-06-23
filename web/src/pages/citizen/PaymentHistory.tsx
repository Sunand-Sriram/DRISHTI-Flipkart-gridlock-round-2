import { useState, useEffect } from 'react'
import { CreditCard } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { api } from '@/lib/api'
import { getCitizenPlate } from '@/lib/store'
import { inr, formatPlate } from '@/lib/utils'
import type { Challan } from '@/lib/types'

export default function PaymentHistory() {
  const [items, setItems] = useState<Challan[]>([])
  const [loading, setLoading] = useState(true)
  const plate = getCitizenPlate()

  useEffect(() => {
    if (!plate) { setLoading(false); return }
    api.citizenHistory(plate).then((r) => {
      setItems((r.items || []).filter((c) => c.status === 'PAID'))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [plate])

  return (
    <div className="space-y-6">
      <h1 className="text-h1 text-citizen-text">Payment History</h1>
      <p className="text-sm text-citizen-muted">Vehicle: <span className="font-mono">{plate ? formatPlate(plate) : '—'}</span></p>

      {loading ? (
        <p className="text-center py-12 text-citizen-muted">Loading...</p>
      ) : items.length === 0 ? (
        <Card citizen className="text-center py-12">
          <CreditCard className="h-10 w-10 text-citizen-faint mx-auto mb-2" />
          <p className="text-citizen-muted">No payment records found</p>
        </Card>
      ) : (
        <div className="glass-citizen rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-citizen-border">
                <th className="px-4 py-3 text-citizen-muted font-medium">Challan</th>
                <th className="px-4 py-3 text-citizen-muted font-medium">Violation</th>
                <th className="px-4 py-3 text-citizen-muted font-medium">Amount</th>
                <th className="px-4 py-3 text-citizen-muted font-medium">Status</th>
                <th className="px-4 py-3 text-citizen-muted font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.challan_id} className="border-b border-citizen-border/50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{c.challan_id}</td>
                  <td className="px-4 py-3 capitalize text-sm">{c.violation.replace('_', ' ')}</td>
                  <td className="px-4 py-3 font-mono font-semibold">{inr(c.fine_inr)}</td>
                  <td className="px-4 py-3">
                    <Badge variant="success">Paid</Badge>
                  </td>
                  <td className="px-4 py-3 text-citizen-muted text-xs">
                    {new Date((c.paid_at || c.created_at) * 1000).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
