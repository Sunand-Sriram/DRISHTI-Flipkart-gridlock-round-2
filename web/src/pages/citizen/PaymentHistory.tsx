import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Receipt as ReceiptIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import { getCitizenPlate } from '@/lib/store'
import { inr, downloadCSV, VIOLATION_LABEL } from '@/lib/utils'
import type { Challan } from '@/lib/types'

export default function PaymentHistory() {
  const plate = getCitizenPlate() || ''
  const [items, setItems] = useState<Challan[]>([])
  useEffect(() => {
    if (plate) api.citizenHistory(plate).then((r) => setItems(r.items.filter((c) => c.status === 'PAID'))).catch(() => setItems([]))
  }, [plate])

  const total = items.reduce((s, c) => s + c.fine_inr, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-citizen-primary">Payment History</h1>
          <p className="mt-1 text-sm text-citizen-muted">Vehicle <span className="font-mono">{plate || '—'}</span> · {items.length} payment(s) · {inr(total)} paid</p>
        </div>
        {items.length > 0 && (
          <Button variant="outline" size="sm" className="border-citizen-primary text-citizen-primary"
            onClick={() => downloadCSV(`payments-${plate}`, items.map((c) => ({
              challan_id: c.challan_id, violation: VIOLATION_LABEL[c.violation] ?? c.violation,
              amount: c.fine_inr, paid_at: c.paid_at ? new Date(c.paid_at).toLocaleString('en-IN') : '',
            })))}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <Card citizen className="py-12 text-center text-citizen-muted">
          <ReceiptIcon className="mx-auto mb-3 h-8 w-8 text-citizen-faint" />
          No payments yet for this vehicle.
        </Card>
      ) : (
        <Card citizen padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-citizen-border text-left text-citizen-muted">
                  <th className="p-4">Paid On</th>
                  <th className="p-4">Challan</th>
                  <th className="p-4">Violation</th>
                  <th className="p-4 font-mono">Amount</th>
                  <th className="p-4" />
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.challan_id} className="border-b border-citizen-border/60 hover:bg-citizen-primary/5">
                    <td className="p-4">{c.paid_at ? new Date(c.paid_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                    <td className="p-4 font-mono">{c.challan_id}</td>
                    <td className="p-4">{VIOLATION_LABEL[c.violation] ?? c.violation}</td>
                    <td className="p-4 font-mono text-citizen-mint">{inr(c.fine_inr)}</td>
                    <td className="p-4">
                      <a href={api.receiptPdfUrl(c.challan_id)} target="_blank" rel="noreferrer" className="text-xs text-citizen-primary hover:underline">Receipt PDF</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Link to="/citizen/history">
        <Button variant="outline" className="border-citizen-primary text-citizen-primary">View all challans →</Button>
      </Link>
    </div>
  )
}
