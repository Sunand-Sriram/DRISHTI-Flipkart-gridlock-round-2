import { useNavigate, useParams } from 'react-router-dom'
import { AccordionItem } from '@/components/ui/Accordion'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/ViolationBadge'
import { useChallan } from '@/lib/hooks'
import { api, evidenceUrl } from '@/lib/api'
import { VIOLATION_LABEL, formatPlate, inr } from '@/lib/utils'
import { useState } from 'react'

export default function MyChallan() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [photoOpen, setPhotoOpen] = useState(false)
  const { data: challan, loading } = useChallan(id)

  if (loading) {
    return <Card citizen className="text-center py-12"><p>Loading…</p></Card>
  }
  if (!challan) {
    return (
      <Card citizen className="text-center py-12">
        <p>Challan not found</p>
        <Button variant="citizen" className="mt-4" onClick={() => navigate('/citizen')}>Back</Button>
      </Card>
    )
  }

  const isPaid = challan.status === 'PAID'
  const isContested = challan.status === 'CONTESTED'

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-citizen-primary">DRISHTI e-Challan</h1>
        <p className="font-mono text-lg mt-1">{challan.challan_id}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <StatusBadge status={isPaid ? 'PAID' : isContested ? 'CONTESTED' : 'UNPAID'} />
          <span className="text-sm text-citizen-muted">
            {new Date(challan.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
          </span>
        </div>
      </div>

      {challan.repeat_offender && (
        <div className="rounded-xl border border-citizen-coral/30 bg-orange-50 p-4 text-sm text-orange-800">
          ⚠️ REPEAT OFFENDER: This is your {(challan.owner.prior_violations || 0) + 1}th violation. Fine amount DOUBLED as per MV Act section 177.
        </div>
      )}

      <Card citizen>
        <CardTitle citizen>Violation Details</CardTitle>
        <p className="text-xl font-bold text-citizen-primary mt-2">{VIOLATION_LABEL[challan.violation]}</p>
        <div className="mt-4 grid gap-2 text-sm text-slate-600">
          <p>Location: {challan.location}</p>
          <p>Camera: {challan.camera}</p>
          <p className="font-mono">Confidence: {challan.confidence?.toFixed(2)} ({Math.round((challan.confidence || 0) * 100)}%)</p>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl bg-slate-900 border border-slate-200">
          {challan.evidence_image ? (
            <img src={evidenceUrl(challan.evidence_image)} alt="Violation evidence" className="w-full object-contain" />
          ) : (
            <div className="aspect-video grid place-items-center text-slate-400">No evidence image</div>
          )}
        </div>
        <button type="button" onClick={() => setPhotoOpen(true)} className="mt-3 text-sm text-citizen-primary underline">
          View Full Photo
        </button>
      </Card>

      <AccordionItem citizen title="Vehicle Details (From VAHAN)">
        <div className="grid gap-3 text-sm">
          <p><span className="text-citizen-muted">Registration:</span> <span className="font-mono">{formatPlate(challan.plate || '')}</span></p>
          <p><span className="text-citizen-muted">Make/Model:</span> {challan.owner.make_model}</p>
          <p><span className="text-citizen-muted">Owner:</span> {challan.owner.owner}</p>
          <p><span className="text-citizen-muted">Address:</span> {challan.owner.address}</p>
          <p><span className="text-citizen-muted">Phone:</span> <span className="font-mono">{challan.owner.phone}</span></p>
          <p>
            <span className={challan.owner.puc_valid !== false ? 'text-emerald-600' : 'text-red-600'}>
              PUC {challan.owner.puc_valid !== false ? 'Valid ✓' : 'Expired ✗'}
            </span>
            {' · '}
            <span className={challan.owner.insurance_valid !== false ? 'text-emerald-600' : 'text-red-600'}>
              Insurance {challan.owner.insurance_valid !== false ? 'Valid ✓' : 'Expired ✗'}
            </span>
          </p>
        </div>
      </AccordionItem>

      <Card citizen>
        <CardTitle citizen>Fine Details</CardTitle>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><span>Base Fine</span><span className="font-mono">{inr(challan.base_fine_inr || challan.fine_inr)}</span></div>
          {challan.repeat_multiplier && challan.repeat_multiplier > 1 && (
            <div className="flex justify-between"><span>Repeat Multiplier</span><span className="font-mono">×{challan.repeat_multiplier}</span></div>
          )}
          <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
            <span className="font-semibold">TOTAL FINE</span>
            <span className="font-mono text-2xl font-bold text-red-600">{inr(challan.fine_inr)}</span>
          </div>
          <p className="text-citizen-muted">Payment Deadline: {challan.payment_deadline}</p>
          <p className="text-citizen-coral text-xs">⚠️ Pay within 14 days to avoid late fees</p>
        </div>
      </Card>

      <div className="sticky bottom-4 flex flex-col gap-3 sm:flex-row">
        <Button
          variant="citizen"
          size="lg"
          className="flex-1"
          disabled={isPaid || isContested}
          onClick={() => navigate(`/citizen/pay/${challan.challan_id}`)}
        >
          Pay Now
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="flex-1 border-citizen-primary text-citizen-primary"
          disabled={isPaid}
          onClick={() => navigate(`/citizen/contest/${challan.challan_id}`)}
        >
          {isContested ? 'View Status' : 'Contest Challan'}
        </Button>
        <a href={api.challanPdfUrl(challan.challan_id)} target="_blank" rel="noreferrer" className="flex-1">
          <Button variant="outline" size="lg" className="w-full border-slate-200">Download PDF</Button>
        </a>
      </div>

      <Modal open={photoOpen} onClose={() => setPhotoOpen(false)} title="Evidence Photo" citizen wide>
        {challan.evidence_image ? (
          <img src={evidenceUrl(challan.evidence_image)} alt="Evidence" className="w-full rounded-xl" />
        ) : (
          <div className="aspect-video rounded-xl bg-slate-100 grid place-items-center">Synthetic record — no photo</div>
        )}
      </Modal>
    </div>
  )
}
