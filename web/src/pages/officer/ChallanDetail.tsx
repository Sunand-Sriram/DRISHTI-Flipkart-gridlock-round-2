import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Mail } from 'lucide-react'
import { AccordionItem } from '@/components/ui/Accordion'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/ViolationBadge'
import { ViolationBadge } from '@/components/ui/ViolationBadge'
import { useChallan } from '@/lib/hooks'
import { api, evidenceUrl } from '@/lib/api'
import { formatPlate, inr } from '@/lib/utils'

export default function ChallanDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: challan, loading } = useChallan(id)
  const [emailMsg, setEmailMsg] = useState('')
  const [emailing, setEmailing] = useState(false)

  async function emailChallan() {
    if (!challan) return
    setEmailing(true)
    setEmailMsg('')
    try {
      const r = await api.sendChallanEmail(challan.challan_id)
      if (r.sent && r.mode === 'smtp') setEmailMsg(`✓ Emailed to ${r.to}`)
      else if (r.sent && r.mode === 'outbox') setEmailMsg(`✓ Rendered for ${r.to} (outbox preview — set SMTP env to send live)`)
      else setEmailMsg(`⚠️ ${r.error || 'Could not send'}`)
    } catch {
      setEmailMsg('⚠️ Email service unavailable')
    }
    setEmailing(false)
  }

  if (loading) {
    return <Card className="py-12 text-center"><p className="text-officer-muted">Loading…</p></Card>
  }
  if (!challan) {
    return (
      <Card className="py-12 text-center">
        <p className="text-officer-muted">Challan not found</p>
        <Button className="mt-4" onClick={() => navigate('/officer/challans')}>Back to list</Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      <button
        type="button"
        onClick={() => navigate('/officer/challans')}
        className="flex items-center gap-2 text-sm text-officer-muted hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Challans
      </button>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <p className="font-mono text-2xl text-amber-300">{challan.challan_id}</p>
          <p className="mt-2 text-sm text-officer-muted">
            Issued: {new Date(challan.created_at).toLocaleString()}
          </p>
          <p className="text-sm text-officer-muted">Camera: {challan.camera}</p>
          <p className="text-sm text-officer-muted">Location: {challan.location}</p>
        </Card>
        <Card>
          <StatusBadge status={challan.status} />
          <p className="mt-3 text-sm">Officer: {challan.officer_name}</p>
        </Card>
      </div>

      <Card>
        <CardTitle>Violation Details</CardTitle>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="text-xs text-officer-muted">Type</p><ViolationBadge type={challan.violation} /></div>
          <div><p className="text-xs text-officer-muted">Confidence</p><p className="font-mono">{challan.confidence?.toFixed(2)}</p></div>
          <div><p className="text-xs text-officer-muted">Frame</p><p className="font-mono">{challan.frame}</p></div>
          <div><p className="text-xs text-officer-muted">Speed</p><p className="font-mono">{challan.speed_kmh} km/h</p></div>
        </div>
        <div className="mt-6 aspect-video max-w-xl overflow-hidden rounded-xl border border-officer-border bg-gradient-to-br from-slate-800 to-slate-900 relative">
          {challan.evidence_image ? (
            <img src={evidenceUrl(challan.evidence_image)} alt="Violation evidence"
                 className="h-full w-full object-cover" />
          ) : (
            <>
              <div className="absolute left-1/3 top-1/3 h-24 w-32 border-2 border-red-500 rounded" />
              <span className="absolute bottom-4 left-4 text-xs text-officer-muted">Evidence (synthetic record)</span>
            </>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          {challan.evidence_image && (
            <a href={evidenceUrl(challan.evidence_image)} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm">View Full Image</Button>
            </a>
          )}
        </div>
      </Card>

      <AccordionItem title="Vehicle & Owner Details (VAHAN Lookup)" badge={<span className={`text-xs ${challan.plate_valid ? 'text-officer-mint' : 'text-amber-400'}`}>{challan.plate_valid ? 'Valid HSRP ✓' : 'HSRP unverified'}</span>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><p className="text-xs text-officer-muted">Plate</p><p className="font-mono text-lg">{formatPlate(challan.plate || '')}</p></div>
          <div><p className="text-xs text-officer-muted">Make/Model</p><p>{challan.owner.make_model}</p></div>
          <div><p className="text-xs text-officer-muted">Owner</p><p>{challan.owner.owner}</p></div>
          <div><p className="text-xs text-officer-muted">Phone</p><p className="font-mono">{challan.owner.phone}</p></div>
          <div className="sm:col-span-2"><p className="text-xs text-officer-muted">Registered Email (VAHAN)</p><p className="font-mono text-officer-primary-soft">{(challan.owner as { email?: string }).email || '—'}</p></div>
          <div className="sm:col-span-2"><p className="text-xs text-officer-muted">Address</p><p>{challan.owner.address}</p></div>
          <div><p className="text-xs text-officer-muted">PUC</p><p className={challan.owner.puc_valid !== false ? 'text-officer-mint' : 'text-red-400'}>{challan.owner.puc_valid !== false ? '✓ Valid' : '✗ Expired'} (Expires: {challan.owner.puc_expires})</p></div>
          <div><p className="text-xs text-officer-muted">Insurance</p><p className={challan.owner.insurance_valid !== false ? 'text-officer-mint' : 'text-red-400'}>{challan.owner.insurance_valid !== false ? '✓ Valid' : '✗ Expired'} (Expires: {challan.owner.insurance_expires})</p></div>
        </div>
        {challan.repeat_offender && (
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-300 text-sm">
            ⚠️ Fine Doubled Due to Repeat Offence ({challan.owner.prior_violations} prior)
          </div>
        )}
      </AccordionItem>

      <Card>
        <CardTitle>Fine Details</CardTitle>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><span>Base Fine</span><span className="font-mono">{inr(challan.base_fine_inr || challan.fine_inr)}</span></div>
          {challan.repeat_multiplier && (
            <div className="flex justify-between"><span>Repeat Multiplier</span><span className="font-mono">×{challan.repeat_multiplier}</span></div>
          )}
          <div className="border-t border-officer-border pt-3 flex justify-between text-lg font-bold">
            <span>Total Fine</span><span className="font-mono text-red-400">{inr(challan.fine_inr)}</span>
          </div>
          <p className="text-officer-muted">Payment Status: {challan.paid_at ? 'PAID' : 'UNPAID'}</p>
          <p className="text-officer-muted">Deadline: {challan.payment_deadline}</p>
        </div>
      </Card>

      <Card>
        <CardTitle>Officer Actions</CardTitle>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a href={api.challanPdfUrl(challan.challan_id)} target="_blank" rel="noreferrer">
            <Button><Download className="h-4 w-4" /> Download PDF</Button>
          </a>
          <Button variant="outline" loading={emailing} onClick={emailChallan}>
            <Mail className="h-4 w-4" /> Email Challan to Owner
          </Button>
          {challan.status === 'CONTESTED' && (
            <Link to={`/officer/contested`}>
              <Button variant="danger">View Contest</Button>
            </Link>
          )}
        </div>
        {emailMsg && <p className="mt-3 text-sm text-officer-mint">{emailMsg}</p>}
        <p className="mt-2 text-xs text-officer-muted">
          The e-challan PDF + branded email are delivered to the owner’s registered email from the VAHAN record.
        </p>
      </Card>
    </div>
  )
}
