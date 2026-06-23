import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileSearch } from 'lucide-react'
import { DrishtiLogo } from '@/components/ui/DrishtiLogo'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import { setCitizenSession } from '@/lib/store'

export default function CitizenLogin() {
  const navigate = useNavigate()
  const [challanId, setChallanId] = useState('')
  const [plate, setPlate] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLookup = async () => {
    if (!challanId || !plate) { setError('Both fields are required'); return }
    setError(''); setLoading(true)
    try {
      const res = await api.citizenLogin(challanId.toUpperCase(), plate.toUpperCase().replace(/\s/g, ''))
      setCitizenSession(res.token, res.challan_id, plate.toUpperCase().replace(/\s/g, ''))
      navigate(`/citizen/challan/${res.challan_id}`)
    } catch (e) {
      setError((e as Error).message || 'Challan not found')
    }
    setLoading(false)
  }

  const loadDemo = () => { setChallanId('DRI-00001'); setPlate('KA01AB1234') }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <DrishtiLogo size="lg" citizen />
          <h1 className="text-h1 text-citizen-text mt-4">Challan Lookup</h1>
          <p className="text-sm text-citizen-muted mt-2">Enter your challan ID and vehicle number to view details</p>
        </div>

        <div className="glass-citizen rounded-2xl p-6 space-y-4">
          <Input
            citizen mono
            label="Challan ID"
            placeholder="DRI-00001"
            value={challanId}
            onChange={(e) => setChallanId(e.target.value)}
          />
          <Input
            citizen mono
            label="Vehicle Number"
            placeholder="KA01AB1234"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
          />

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-citizen-danger bg-red-50 rounded-lg px-3 py-2">
              {error}
            </motion.p>
          )}

          <Button variant="citizen" size="lg" className="w-full" loading={loading} onClick={handleLookup}>
            <FileSearch className="h-5 w-5" /> Look Up Challan
          </Button>

          <button onClick={loadDemo} className="w-full text-center text-xs text-citizen-faint hover:text-citizen-muted py-2">
            Load demo challan (DRI-00001)
          </button>
        </div>

        <p className="text-center text-xs text-citizen-faint mt-6">
          <button onClick={() => navigate('/')} className="hover:text-citizen-muted">← Back to home</button>
        </p>
      </motion.div>
    </div>
  )
}
