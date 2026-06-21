import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useChallan } from '@/lib/hooks'
import { api } from '@/lib/api'
import { formatPlate, inr, VIOLATION_LABEL } from '@/lib/utils'

export default function Receipt() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const contested = params.get('contested') === '1'
  const { data: challan } = useChallan(id)

  if (!challan) return null

  if (contested) {
    return (
      <div className="space-y-6 text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-citizen-coral" />
        <h1 className="text-2xl font-bold text-citizen-primary">Challenge Submitted</h1>
        <Card citizen className="text-left">
          <p className="font-mono text-sm">Reference: CHG-{challan.challan_id.replace('DRI-', '')}</p>
          <p className="mt-2 text-sm">Your contest for {challan.challan_id} is under officer review.</p>
        </Card>
        <Button variant="citizen" onClick={() => navigate(`/citizen/challan/${id}`)}>Back to My Challan</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-emerald-500" />
        <h1 className="mt-4 text-2xl font-bold text-emerald-600">PAYMENT SUCCESSFUL</h1>
      </div>

      <Card citizen>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-citizen-muted">Receipt #</span><span className="font-mono">RCP-2026062000042</span></div>
          <div className="flex justify-between"><span className="text-citizen-muted">Transaction ID</span><span className="font-mono">TXN-1234567890</span></div>
          <div className="flex justify-between"><span className="text-citizen-muted">Challan ID</span><span className="font-mono">{challan.challan_id}</span></div>
          <div className="flex justify-between"><span className="text-citizen-muted">Vehicle</span><span>{formatPlate(challan.plate || '')}</span></div>
          <div className="flex justify-between"><span className="text-citizen-muted">Violation</span><span>{VIOLATION_LABEL[challan.violation]}</span></div>
          <div className="flex justify-between font-bold"><span>Amount Paid</span><span className="font-mono text-emerald-600">{inr(challan.fine_inr)}</span></div>
          <div className="flex justify-between"><span className="text-citizen-muted">Payment Method</span><span>Debit Card (****1234)</span></div>
          <p className="text-emerald-600 font-medium pt-2">Status: PAID ✓</p>
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <a href={api.receiptPdfUrl(challan.challan_id)} target="_blank" rel="noreferrer">
            <Button variant="citizen" className="w-full">Download PDF Receipt</Button>
          </a>
          <a href={api.challanPdfUrl(challan.challan_id)} target="_blank" rel="noreferrer">
            <Button variant="outline" className="w-full border-citizen-primary text-citizen-primary">Download E-Challan PDF</Button>
          </a>
        </div>
        <div className="mt-4 text-xs text-citizen-muted space-y-1">
          <p>✓ Confirmation sent via SMS</p>
          <p>✓ Receipt emailed to registered email</p>
        </div>
      </Card>

      <div className="text-sm text-citizen-muted space-y-1">
        <p className="font-medium text-slate-700">Next steps:</p>
        <p>• Your challan record is now closed</p>
        <p>• Keep this receipt for your records</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link to="/citizen/history" className="flex-1"><Button variant="outline" className="w-full border-citizen-primary text-citizen-primary">View All My Challans</Button></Link>
        <Button variant="outline" className="flex-1 border-slate-200" onClick={() => navigate('/citizen')}>Close</Button>
      </div>
    </div>
  )
}
