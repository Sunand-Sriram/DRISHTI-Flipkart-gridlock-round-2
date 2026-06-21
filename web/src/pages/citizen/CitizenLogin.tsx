import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { api } from '@/lib/api'
import { setCitizenSession } from '@/lib/store'

export default function CitizenLogin() {
  const navigate = useNavigate()
  const [challanId, setChallanId] = useState('')
  const [plate, setPlate] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [demo, setDemo] = useState<{ id: string; plate: string } | null>(null)

  // Fetch a real challan so the citizen always has a working example to try.
  useEffect(() => {
    api.listChallans({ limit: 1, status: 'ISSUED' })
      .then((r) => {
        const c = r.items[0]
        if (c) setDemo({ id: c.challan_id, plate: c.plate || '' })
      })
      .catch(() => {})
  }, [])

  async function retrieve(idArg?: string, plateArg?: string) {
    const id = (idArg ?? challanId).trim()
    const pl = (plateArg ?? plate).trim()
    if (!id || !pl) return
    setError('')
    setLoading(true)
    try {
      const res = await api.citizenLogin(id, pl)
      setCitizenSession(res.token, res.challan_id, pl)
      navigate(`/citizen/challan/${res.challan_id}`)
    } catch {
      setError('Challan not found. Check your Challan ID and plate number, or try the demo lookup below.')
      setLoading(false)
    }
  }

  function useDemo() {
    if (!demo) return
    setChallanId(demo.id)
    setPlate(demo.plate)
    retrieve(demo.id, demo.plate)
  }

  const valid = challanId.trim() && plate.trim()

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md space-y-6 py-6">
      <div className="text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-citizen-primary/10 text-citizen-primary">
          <Search className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-citizen-ink">Find Your Challan</h1>
        <p className="mt-2 text-sm text-citizen-muted">Enter your Challan ID and vehicle number to view, pay or contest.</p>
      </div>

      <Card citizen className="space-y-5">
        <Input
          citizen mono
          label="Challan ID"
          placeholder="DRI-00042"
          value={challanId}
          onChange={(e) => setChallanId(e.target.value.toUpperCase())}
        />
        <Input
          citizen mono
          label="Vehicle Number"
          placeholder="KA01AB1234"
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase())}
        />
        {error && <p className="text-sm text-rose-500">{error}</p>}
        <Button variant="citizen" size="lg" className="w-full" disabled={!valid} loading={loading} onClick={() => retrieve()}>
          Retrieve Challan
        </Button>
      </Card>

      {demo && (
        <button
          onClick={useDemo}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-citizen-primary/40 bg-citizen-primary/5 px-4 py-3 text-sm text-citizen-primary hover:bg-citizen-primary/10"
        >
          <Sparkles className="h-4 w-4" />
          Try demo challan · {demo.id} / {demo.plate}
        </button>
      )}

      <p className="text-center text-xs text-citizen-faint">
        No account needed. Lookup is by Challan ID + vehicle number — the same details printed on your e-challan.
      </p>
    </motion.div>
  )
}
