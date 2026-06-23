import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useChallan } from '@/lib/hooks'
import { api } from '@/lib/api'
import { inr, formatPlate } from '@/lib/utils'

export default function Receipt() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: c } = useChallan(id)

  if (!c) return <div className="text-center py-20 text-citizen-muted">Loading...</div>

  return (
    <div className="max-w-md mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-citizen-muted hover:text-citizen-text">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <Card citizen className="text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
        <h1 className="text-h1 text-citizen-text mb-1">Payment Receipt</h1>
        <p className="text-sm text-citizen-muted mb-6">Challan {c.challan_id}</p>

        <div className="space-y-3 text-sm text-left">
          <div className="flex justify-between py-2 border-b border-citizen-border">
            <span className="text-citizen-muted">Challan ID</span><span className="font-mono">{c.challan_id}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-citizen-border">
            <span className="text-citizen-muted">Violation</span><span className="capitalize">{c.violation.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-citizen-border">
            <span className="text-citizen-muted">Vehicle</span><span className="font-mono">{c.plate ? formatPlate(c.plate) : '—'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-citizen-border">
            <span className="text-citizen-muted">Amount Paid</span><span className="font-semibold text-emerald-600">{inr(c.fine_inr)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-citizen-border">
            <span className="text-citizen-muted">Status</span><span className="text-emerald-600 font-medium">PAID ✓</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-citizen-muted">Date</span><span>{new Date((c.paid_at || c.created_at) * 1000).toLocaleString()}</span>
          </div>
        </div>

        <Button variant="citizen" className="w-full mt-6" onClick={() => window.open(api.receiptPdfUrl(c.challan_id))}>
          <Download className="h-4 w-4" /> Download Receipt PDF
        </Button>
      </Card>
    </div>
  )
}
