import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ShieldQuestion, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { useChallan } from '@/lib/hooks'
import { api } from '@/lib/api'
import { VIOLATION_LABEL, formatPlate } from '@/lib/utils'

const REASONS = [
  { value: 'Not my vehicle', desc: 'The vehicle in the evidence is not registered to me / was misidentified.' },
  { value: 'I was compliant', desc: 'I was actually following the rule (e.g. wearing a helmet / wearing seatbelt).' },
  { value: 'Wrong violation type', desc: 'The violation has been classified incorrectly.' },
  { value: 'Vehicle sold / transferred', desc: 'I had sold or transferred this vehicle before the violation date.' },
  { value: 'Emergency situation', desc: 'I was responding to a genuine medical or safety emergency.' },
  { value: 'Other', desc: 'A different reason — explain in detail below.' },
]

export default function ContestChallan() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: challan } = useChallan(id)
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState(false)

  if (!challan) return null

  const valid = !!reason && details.trim().length >= 20

  async function submit() {
    setTouched(true)
    if (!challan || !valid) return
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('reason', reason)
      fd.append('details', details)
      if (files[0]) fd.append('photo', files[0])
      const res = await fetch(api.contestUrl(challan.challan_id), { method: 'POST', body: fd })
      if (!res.ok) throw new Error()
      navigate(`/citizen/receipt/${challan.challan_id}?contested=1`)
    } catch {
      setLoading(false)
      alert('Could not submit your contest. Please try again.')
    }
  }

  function addFiles(list: FileList | null) {
    if (!list) return
    setFiles((prev) => [...prev, ...Array.from(list)].slice(0, 4))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-citizen-primary/10 text-citizen-primary">
          <ShieldQuestion className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-citizen-ink">Contest This Challan</h1>
          <p className="text-sm text-citizen-muted">Tell us why and add evidence — an officer will review it.</p>
        </div>
      </div>

      {/* challan summary */}
      <Card citizen className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
        <span className="font-mono text-citizen-primary">{challan.challan_id}</span>
        <span><span className="text-citizen-muted">Violation:</span> {VIOLATION_LABEL[challan.violation] ?? challan.violation}</span>
        <span><span className="text-citizen-muted">Vehicle:</span> {formatPlate(challan.plate || '')}</span>
      </Card>

      {/* reason */}
      <Card citizen>
        <CardTitle citizen>1 · Why are you contesting?</CardTitle>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {REASONS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setReason(r.value)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                reason === r.value
                  ? 'border-citizen-primary bg-citizen-primary/10'
                  : 'border-citizen-border hover:border-citizen-primary/40'
              }`}
            >
              <p className="text-sm font-medium text-citizen-ink">{r.value}</p>
              <p className="mt-0.5 text-xs text-citizen-muted">{r.desc}</p>
            </button>
          ))}
        </div>
        {touched && !reason && <p className="mt-2 text-xs text-rose-500">Please select a reason.</p>}
      </Card>

      {/* details */}
      <Card citizen>
        <CardTitle citizen>2 · Explain in your own words</CardTitle>
        <textarea
          placeholder="Describe what actually happened, with any dates, locations or context that supports your case…"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={5}
          className="mt-3 w-full rounded-xl border border-citizen-border p-4 text-sm outline-none focus:border-citizen-primary focus:ring-2 focus:ring-citizen-primary/10"
        />
        <p className={`mt-1 text-xs ${details.length >= 20 ? 'text-citizen-mint' : 'text-citizen-muted'}`}>
          {details.length}/20 characters minimum
        </p>
      </Card>

      {/* evidence */}
      <Card citizen>
        <CardTitle citizen>3 · Upload supporting evidence (optional)</CardTitle>
        <label className="mt-3 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-citizen-border p-8 hover:border-citizen-primary/40">
          <Upload className="h-8 w-8 text-citizen-faint" />
          <span className="text-sm text-citizen-muted">Click to upload photos · JPG/PNG · up to 4 files</span>
          <input type="file" accept=".jpg,.jpeg,.png" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
        </label>
        {files.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {files.map((f, i) => (
              <div key={i} className="relative rounded-lg border border-citizen-border p-2">
                <img src={URL.createObjectURL(f)} alt={f.name} className="h-20 w-full rounded object-cover" />
                <button onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}
                  className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-white">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex items-start gap-2 rounded-xl border border-citizen-primary/20 bg-citizen-primary/5 p-4 text-sm text-citizen-primary">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        Your contest is reviewed by a traffic officer within 5 business days. You’ll be notified of the decision.
      </div>

      <div className="flex gap-3">
        <Button variant="citizen" size="lg" loading={loading} onClick={submit}>Submit Contest</Button>
        <Button variant="outline" size="lg" className="border-citizen-border" onClick={() => navigate(`/citizen/challan/${id}`)}>Cancel</Button>
      </div>
    </div>
  )
}
