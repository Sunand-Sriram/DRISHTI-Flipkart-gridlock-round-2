import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Mail, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MagneticButton } from '@/components/motion/MagneticButton'
import { Accordion } from '@/components/ui/Accordion'
import { ViolationBadge, StatusBadge } from '@/components/ui/ViolationBadge'
import { useChallan } from '@/lib/hooks'
import { api, evidenceUrl } from '@/lib/api'
import { inr, formatPlate } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'

export default function ChallanDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: c, loading } = useChallan(id)
  const toast = useToast()

  if (loading) return <div className="text-center py-20 text-text-muted">Loading...</div>
  if (!c) return <div className="text-center py-20 text-text-muted">Challan not found</div>

  const sendEmail = async () => {
    const res = await api.sendChallanEmail(c.challan_id)
    if (res.sent || res.mode === 'outbox') toast.success(`Email ${res.mode === 'smtp' ? 'sent' : 'queued'} to ${res.to}`)
    else toast.error('Failed to send email')
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-h2 text-text-primary font-mono">{c.challan_id}</h2>
          <div className="flex items-center gap-3 mt-2">
            <ViolationBadge violation={c.violation} />
            <StatusBadge status={c.status} />
          </div>
        </div>
        <div className="flex gap-2">
          <MagneticButton variant="outline" size="sm" onClick={() => window.open(api.challanPdfUrl(c.challan_id))} icon={<Download className="h-4 w-4" />}>
            PDF
          </MagneticButton>
          <MagneticButton size="sm" onClick={sendEmail} icon={<Mail className="h-4 w-4" />}>
            Email Owner
          </MagneticButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evidence */}
        <Card className="lg:col-span-2">
          {c.evidence_image && (
            <img src={evidenceUrl(c.evidence_image)} alt="Evidence" className="w-full rounded-xl mb-4 border border-border-glass" />
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="glass rounded-xl p-3">
              <span className="text-text-muted text-xs block mb-1">Confidence</span>
              <span className="text-data text-lg">{((c.confidence || 0) * 100).toFixed(1)}%</span>
            </div>
            <div className="glass rounded-xl p-3">
              <span className="text-text-muted text-xs block mb-1">Fine</span>
              <span className="text-data text-lg">{inr(c.fine_inr)}</span>
            </div>
            {c.speed_kmh && (
              <div className="glass rounded-xl p-3">
                <span className="text-text-muted text-xs block mb-1">Speed</span>
                <span className="text-data text-lg">{c.speed_kmh} km/h</span>
              </div>
            )}
            <div className="glass rounded-xl p-3">
              <span className="text-text-muted text-xs block mb-1">Camera</span>
              <span className="text-sm font-medium">{c.camera}</span>
            </div>
          </div>
        </Card>

        {/* Details sidebar */}
        <div className="space-y-4">
          <Card>
            <h4 className="text-label text-text-muted mb-3">Details</h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-text-muted">Plate</dt><dd className="font-mono">{c.plate ? formatPlate(c.plate) : '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">Location</dt><dd>{c.location || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">Date</dt><dd>{new Date(c.created_at * 1000).toLocaleString()}</dd></div>
              {c.officer_name && <div className="flex justify-between"><dt className="text-text-muted">Officer</dt><dd>{c.officer_name}</dd></div>}
              {c.payment_deadline && <div className="flex justify-between"><dt className="text-text-muted">Due</dt><dd>{c.payment_deadline}</dd></div>}
            </dl>
          </Card>

          {c.repeat_offender && (
            <Card className="border border-amber/20">
              <div className="flex items-center gap-2 text-amber mb-2">
                <AlertCircle className="h-5 w-5" />
                <span className="font-display font-semibold text-sm">Repeat Offender</span>
              </div>
              <p className="text-xs text-text-muted">Fine multiplied {c.repeat_multiplier || 2}× (base: {inr(c.base_fine_inr || 0)})</p>
            </Card>
          )}

          {c.owner && (
            <Accordion title="Vehicle / Owner (VAHAN)">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-text-muted">Owner</dt><dd>{c.owner.owner || '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-text-muted">Vehicle</dt><dd>{c.owner.make_model || '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-text-muted">PUC</dt><dd>{c.owner.puc_valid ? <Badge variant="success">Valid</Badge> : <Badge variant="danger">Expired</Badge>}</dd></div>
                <div className="flex justify-between"><dt className="text-text-muted">Insurance</dt><dd>{c.owner.insurance_valid ? <Badge variant="success">Valid</Badge> : <Badge variant="danger">Expired</Badge>}</dd></div>
              </dl>
            </Accordion>
          )}

          {c.citizen_reason && (
            <Accordion title="Contest Details">
              <p className="text-sm text-text-secondary mb-2">{c.citizen_reason}</p>
              {c.officer_decision && <p className="text-sm text-amethyst-light"><strong>Decision:</strong> {c.officer_decision}</p>}
            </Accordion>
          )}
        </div>
      </div>
    </div>
  )
}
