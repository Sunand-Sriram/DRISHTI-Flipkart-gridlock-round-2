import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, CreditCard, Info, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useChallan } from '@/lib/hooks'
import { api } from '@/lib/api'
import { formatPlate, inr } from '@/lib/utils'

type Tab = 'card' | 'upi' | 'net'

const BANKS = ['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank']

export default function PayNow() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: challan } = useChallan(id)
  const [tab, setTab] = useState<Tab>('upi')
  const [loading, setLoading] = useState(false)
  const [showPrototype, setShowPrototype] = useState(false)

  // card
  const [name, setName] = useState('')
  const [card, setCard] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  // upi
  const [upi, setUpi] = useState('')
  // net
  const [bank, setBank] = useState(BANKS[0])

  if (!challan) return null

  const validCard = name.length >= 2 && card.length === 16 && /^\d{2}\/\d{2}$/.test(expiry) && /^\d{3}$/.test(cvv)
  const validUpi = /^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upi)
  const valid = tab === 'card' ? validCard : tab === 'upi' ? validUpi : !!bank

  async function confirmPay() {
    if (!challan) return
    setLoading(true)
    try {
      await api.citizenPay(challan.challan_id, tab === 'card' ? card : tab)
      navigate(`/citizen/receipt/${challan.challan_id}`)
    } catch {
      setLoading(false)
      setShowPrototype(false)
    }
  }

  const tabs: { key: Tab; label: string; icon: typeof CreditCard }[] = [
    { key: 'upi', label: 'UPI', icon: Smartphone },
    { key: 'card', label: 'Card', icon: CreditCard },
    { key: 'net', label: 'Net Banking', icon: Building2 },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-citizen-ink">Pay Challan</h1>

      <Card citizen>
        <p className="font-mono text-sm">{challan.challan_id}</p>
        <p className="mt-1 text-sm text-citizen-muted">{formatPlate(challan.plate || '')} · {challan.owner.make_model}</p>
        <div className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between"><span>Fine Amount</span><span className="font-mono">{inr(challan.base_fine_inr ?? challan.fine_inr)}</span></div>
          {(challan.repeat_multiplier ?? 1) > 1 && (
            <div className="flex justify-between text-citizen-coral"><span>Repeat-offender ×{challan.repeat_multiplier}</span><span className="font-mono">{inr(challan.fine_inr - (challan.base_fine_inr ?? challan.fine_inr))}</span></div>
          )}
          <div className="flex justify-between text-citizen-muted"><span>Late Fee</span><span className="font-mono">₹0</span></div>
          <div className="flex justify-between border-t border-citizen-border pt-2 font-bold">
            <span>TOTAL</span><span className="font-mono text-citizen-primary">{inr(challan.fine_inr)}</span>
          </div>
        </div>
      </Card>

      {/* payment method tabs */}
      <div className="grid grid-cols-3 gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition-colors ${
              tab === t.key
                ? 'border-citizen-primary bg-citizen-primary/10 text-citizen-primary'
                : 'border-citizen-border text-citizen-muted hover:border-citizen-primary/40'
            }`}
          >
            <t.icon className="h-5 w-5" />
            {t.label}
          </button>
        ))}
      </div>

      <Card citizen>
        {tab === 'card' && (
          <>
            <CardTitle citizen>Credit / Debit Card</CardTitle>
            <div className="mt-4 space-y-4">
              <Input citizen label="Card Holder Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input citizen mono label="Card Number" placeholder="4111 1111 1111 1111" maxLength={16}
                value={card} onChange={(e) => setCard(e.target.value.replace(/\D/g, '').slice(0, 16))} />
              <div className="grid grid-cols-2 gap-4">
                <Input citizen mono label="MM/YY" placeholder="12/28" maxLength={5} value={expiry} onChange={(e) => setExpiry(e.target.value)} />
                <Input citizen mono label="CVV" type="password" maxLength={3} value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))} />
              </div>
            </div>
          </>
        )}

        {tab === 'upi' && (
          <>
            <CardTitle citizen>UPI Payment</CardTitle>
            <div className="mt-4 space-y-4">
              <Input citizen mono label="UPI ID" placeholder="yourname@okhdfcbank" value={upi} onChange={(e) => setUpi(e.target.value)} />
              <div className="flex gap-2">
                {['@oksbi', '@okhdfcbank', '@okaxis', '@ybl'].map((s) => (
                  <button key={s} onClick={() => setUpi((u) => (u.split('@')[0] || 'user') + s)}
                    className="rounded-lg border border-citizen-border px-2.5 py-1 text-xs text-citizen-muted hover:border-citizen-primary/40">{s}</button>
                ))}
              </div>
              <p className="text-xs text-citizen-muted">A collect request would be sent to your UPI app.</p>
            </div>
          </>
        )}

        {tab === 'net' && (
          <>
            <CardTitle citizen>Net Banking</CardTitle>
            <div className="mt-4 space-y-4">
              <Select citizen label="Select Bank" value={bank} onChange={(e) => setBank(e.target.value)}
                options={BANKS.map((b) => ({ value: b, label: b }))} />
              <p className="text-xs text-citizen-muted">You’ll be redirected to {bank}’s secure netbanking page.</p>
            </div>
          </>
        )}

        <div className="mt-5 flex gap-3">
          <Button variant="citizen" size="lg" className="flex-1" disabled={!valid} loading={loading} onClick={() => setShowPrototype(true)}>
            Pay {inr(challan.fine_inr)}
          </Button>
          <Button variant="outline" size="lg" className="border-citizen-border" onClick={() => navigate(`/citizen/challan/${id}`)}>
            Cancel
          </Button>
        </div>
      </Card>

      {/* Prototype interstitial */}
      {showPrototype && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-citizen-coral/15 text-citizen-coral">
              <Info className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-bold text-citizen-ink">Prototype Build</h2>
            <p className="mt-2 text-sm text-citizen-muted">
              This is a demonstration of DRISHTI. <strong>No real payment</strong> is processed and no money is charged.
              We’ll simulate a successful payment and generate your receipt.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Button variant="citizen" loading={loading} onClick={confirmPay}>Simulate Successful Payment</Button>
              <Button variant="outline" className="border-citizen-border" onClick={() => setShowPrototype(false)}>Go Back</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
