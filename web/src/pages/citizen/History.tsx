import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/ViolationBadge'
import { ViolationBadge } from '@/components/ui/ViolationBadge'
import { getCitizenPlate } from '@/lib/store'
import { api } from '@/lib/api'
import { inr } from '@/lib/utils'
import { useEffect, useState } from 'react'
import type { Challan } from '@/lib/types'

export default function History() {
  const plate = getCitizenPlate() || ''
  const [items, setItems] = useState<Challan[]>([])
  useEffect(() => {
    if (plate) api.citizenHistory(plate).then((r) => setItems(r.items)).catch(() => setItems([]))
  }, [plate])
  const totalPaid = items.filter((c) => c.status === 'PAID').reduce((s, c) => s + c.fine_inr, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-citizen-primary">MY CHALLAN HISTORY</h1>
        <p className="mt-2 text-sm text-citizen-muted">Vehicle: <span className="font-mono">{plate}</span></p>
        <p className="mt-1 text-sm">
          Total Challans: <strong>{items.length}</strong> · Total Paid: <strong className="font-mono">{inr(totalPaid)}</strong>
        </p>
      </div>

      {items.length === 0 ? (
        <Card citizen className="py-12 text-center text-citizen-muted">No challans for this vehicle</Card>
      ) : (
        <Card citizen padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-citizen-muted">
                  <th className="p-4">Date</th>
                  <th className="p-4">ID</th>
                  <th className="p-4">Type</th>
                  <th className="p-4 font-mono">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4" />
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.challan_id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="p-4">{new Date(c.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</td>
                    <td className="p-4 font-mono">{c.challan_id}</td>
                    <td className="p-4"><ViolationBadge type={c.violation} /></td>
                    <td className="p-4 font-mono">{inr(c.fine_inr)}</td>
                    <td className="p-4"><StatusBadge status={c.status} /></td>
                    <td className="p-4">
                      <Link to={`/citizen/challan/${c.challan_id}`} className="text-citizen-primary text-xs hover:underline">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Link to={`/citizen/challan/${items[0]?.challan_id || 'DRI-00042'}`}>
        <Button variant="outline" className="border-citizen-primary text-citizen-primary">Back to My Challan</Button>
      </Link>
    </div>
  )
}
