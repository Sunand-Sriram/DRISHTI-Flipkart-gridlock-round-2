import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Upload, Send } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useChallan } from '@/lib/hooks'
import { api } from '@/lib/api'
import { inr } from '@/lib/utils'

const REASONS = [
  'Vehicle was not at this location',
  'Not my vehicle / wrong plate',
  'Traffic signal was malfunctioning',
  'Evidence image is unclear',
  'Other (specify below)',
]

export default function ContestForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: c } = useChallan(id)
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const submit = async () => {
    const text = reason === 'Other (specify below)' ? customReason : reason
    if (!text) { setError('Please select a reason'); return }
    setLoading(true); setError('')
    try {
      const fd = new FormData()
      fd.append('reason', text)
      fd.append('details', '')
      if (file) fd.append('photo', file)
      const r = await fetch(api.contestUrl(id!), { method: 'POST', body: fd })
      if (!r.ok) throw new Error(await r.text())
      navigate(`/citizen/challan/${id}`)
    } catch (e) {
      setError((e as Error).message || 'Failed to submit contest')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-citizen-muted hover:text-citizen-text">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 100, damping: 20 }}>
        <h1 className="text-h1 text-citizen-text mb-1">Contest Challan</h1>
        <p className="text-sm text-citizen-muted">Challenging {id} · Fine: {c ? inr(c.fine_inr) : '—'}</p>

        <Card citizen className="mt-6 space-y-4">
          <p className="text-label text-citizen-muted">Reason for Contest</p>
          <div className="space-y-2">
            {REASONS.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm border ${reason === r ? 'bg-citizen-primary/10 border-citizen-primary text-citizen-primary' : 'border-citizen-border text-citizen-text hover:bg-gray-50'}`}
              >
                {r}
              </button>
            ))}
          </div>

          {reason === 'Other (specify below)' && (
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Describe your reason in detail..."
              className="w-full h-24 rounded-xl px-4 py-3 text-sm border border-citizen-border text-citizen-text placeholder:text-citizen-faint outline-none focus:ring-2 focus:ring-citizen-primary/30 resize-none"
            />
          )}

          <p className="text-label text-citizen-muted">Upload Counter-Evidence (optional)</p>
          <input ref={fileRef} type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-8 rounded-xl border-2 border-dashed border-citizen-border hover:border-citizen-primary text-citizen-muted hover:text-citizen-text"
          >
            <Upload className="h-6 w-6 mx-auto mb-1" />
            <span className="text-sm">{file ? file.name : 'Click to upload photo or video'}</span>
          </button>

          {error && <p className="text-sm text-citizen-danger bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <Button variant="citizen" size="lg" className="w-full" loading={loading} onClick={submit}>
            <Send className="h-5 w-5" /> Submit Contest
          </Button>
        </Card>
      </motion.div>
    </div>
  )
}
