import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Download, CreditCard, Scale, MapPin, AlertTriangle, Eye } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Accordion } from '@/components/ui/Accordion'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ViolationBadge, StatusBadge } from '@/components/ui/ViolationBadge'
import { useChallan } from '@/lib/hooks'
import { api, evidenceUrl } from '@/lib/api'
import { inr, formatPlate } from '@/lib/utils'
import { useState } from 'react'

export default function MyChallan() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: c, loading } = useChallan(id)
  const [showPhoto, setShowPhoto] = useState(false)

  if (loading) return <div className="text-center py-20 text-citizen-muted">Loading challan...</div>
  if (!c) return <div className="text-center py-20 text-citizen-muted">Challan not found</div>

  const isUpheld = c.status === 'CONTESTED_UPHELD'
  // A challan can be paid when freshly issued, or when a contest was reviewed and upheld.
  const canPay = c.status === 'ISSUED' || isUpheld
  const canContest = c.status === 'ISSUED'
  const CONTEST_STATES = ['CONTESTED', 'CONTESTED_UPHELD', 'CONTESTED_DISMISSED', 'ESCALATED']
  const inContest = CONTEST_STATES.includes(c.status)
  const contestMessage: Record<string, string> = {
    CONTESTED: '⏳ Under review — a traffic officer will respond within 5 business days.',
    CONTESTED_UPHELD: 'The challan stands after review. Please pay the fine below.',
    CONTESTED_DISMISSED: '✓ Your contest was accepted — this challan has been dismissed. No payment is due.',
    ESCALATED: 'Your contest has been escalated for magistrate review. You will be notified of the outcome.',
  }
  const contestTone: Record<string, string> = {
    CONTESTED: 'text-amber-600',
    CONTESTED_UPHELD: 'text-red-600',
    CONTESTED_DISMISSED: 'text-emerald-600',
    ESCALATED: 'text-purple-600',
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 100, damping: 20 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-h1 text-citizen-text font-mono">{c.challan_id}</h1>
            <div className="flex items-center gap-2 mt-2">
              <ViolationBadge violation={c.violation} />
              <StatusBadge status={c.status} />
            </div>
          </div>
        </div>

        {/* Evidence */}
        {c.evidence_image && (
          <Card citizen className="mb-6">
            <button onClick={() => setShowPhoto(true)} className="w-full relative group">
              <img src={evidenceUrl(c.evidence_image)} alt="Evidence" className="w-full rounded-xl" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 rounded-xl transition-opacity">
                <Eye className="h-8 w-8 text-white" />
              </div>
            </button>
          </Card>
        )}

        {/* Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Fine', value: inr(c.fine_inr), highlight: true },
            { label: 'Confidence', value: `${((c.confidence || 0) * 100).toFixed(0)}%` },
            { label: 'Camera', value: c.camera },
            { label: 'Date', value: new Date(c.created_at * 1000).toLocaleDateString() },
          ].map((d) => (
            <Card citizen key={d.label} className="p-4 text-center">
              <p className="text-xs text-citizen-muted mb-1">{d.label}</p>
              <p className={`font-semibold ${d.highlight ? 'text-lg text-citizen-danger' : 'text-sm text-citizen-text'}`}>{d.value}</p>
            </Card>
          ))}
        </div>

        {c.location && (
          <div className="flex items-center gap-2 text-sm text-citizen-muted mb-4">
            <MapPin className="h-4 w-4" /> {c.location}
          </div>
        )}

        {c.repeat_offender && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Repeat Offender</p>
              <p className="text-xs text-amber-600">Fine multiplied {c.repeat_multiplier || 2}× (base: {inr(c.base_fine_inr || 0)})</p>
            </div>
          </div>
        )}

        {/* Contest status + officer decision */}
        {inContest && (
          <Card citizen className="mb-6 space-y-3">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-citizen-primary" />
              <p className="text-sm font-semibold text-citizen-text">Contest Status</p>
              <StatusBadge status={c.status} className="ml-auto" />
            </div>
            {c.citizen_reason && (
              <div>
                <p className="text-xs text-citizen-muted mb-0.5">Your reason</p>
                <p className="text-sm text-citizen-text">{c.citizen_reason}</p>
              </div>
            )}
            {c.officer_decision && (
              <div>
                <p className="text-xs text-citizen-muted mb-0.5">Officer's decision</p>
                <p className="text-sm text-citizen-text">{c.officer_decision}</p>
              </div>
            )}
            <p className={`text-sm font-medium ${contestTone[c.status] || 'text-citizen-muted'}`}>
              {contestMessage[c.status]}
            </p>
          </Card>
        )}

        {/* Vehicle details */}
        {c.owner && (
          <Accordion title="Vehicle Details (VAHAN)" citizen>
            <dl className="space-y-2">
              <div className="flex justify-between"><dt className="text-citizen-muted">Owner</dt><dd>{c.owner.owner || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-citizen-muted">Vehicle</dt><dd>{c.owner.make_model || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-citizen-muted">Plate</dt><dd className="font-mono">{c.plate ? formatPlate(c.plate) : '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-citizen-muted">PUC</dt><dd>{c.owner.puc_valid ? '✅ Valid' : '❌ Expired'}</dd></div>
              <div className="flex justify-between"><dt className="text-citizen-muted">Insurance</dt><dd>{c.owner.insurance_valid ? '✅ Valid' : '❌ Expired'}</dd></div>
            </dl>
          </Accordion>
        )}

        {c.payment_deadline && (
          <p className="text-xs text-citizen-faint mt-4">Payment deadline: {c.payment_deadline}</p>
        )}
      </motion.div>

      {/* Sticky bottom actions */}
      {(canPay || canContest) && (
        <div className="fixed bottom-0 md:bottom-auto md:relative inset-x-0 md:inset-x-auto z-20 bg-white/90 backdrop-blur-xl border-t border-citizen-border md:border-0 p-4 md:p-0 flex gap-3">
          {canPay && (
            <Button variant="citizen" size="lg" className="flex-1" onClick={() => navigate(`/citizen/pay/${c.challan_id}`)}>
              <CreditCard className="h-5 w-5" /> Pay {inr(c.fine_inr)}
            </Button>
          )}
          {canContest && (
            <Button variant="secondary" size="lg" className="flex-1 !bg-white border !border-citizen-border !text-citizen-text" onClick={() => navigate(`/citizen/contest/${c.challan_id}`)}>
              <Scale className="h-5 w-5" /> Contest
            </Button>
          )}
          <Button variant="secondary" size="lg" className="!bg-white border !border-citizen-border !text-citizen-text" onClick={() => window.open(api.challanPdfUrl(c.challan_id))}>
            <Download className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Photo modal */}
      <Modal open={showPhoto} onClose={() => setShowPhoto(false)} title="Evidence Photo" wide citizen>
        {c.evidence_image && <img src={evidenceUrl(c.evidence_image)} alt="Evidence" className="w-full rounded-xl" />}
      </Modal>
    </div>
  )
}
