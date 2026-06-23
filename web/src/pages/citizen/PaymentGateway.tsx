import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CreditCard, CheckCircle2, Shield, Smartphone } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useChallan } from '@/lib/hooks'
import { api } from '@/lib/api'
import { inr } from '@/lib/utils'

type PayMode = 'upi' | 'card'
type Step = 'method' | 'details' | 'processing' | 'success'

export default function PaymentGateway() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: c } = useChallan(id)
  const [mode, setMode] = useState<PayMode>('upi')
  const [step, setStep] = useState<Step>('method')
  const [upiId, setUpiId] = useState('')
  const [cardNo, setCardNo] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [error, setError] = useState('')

  const pay = async () => {
    setError('')
    if (mode === 'upi' && !upiId) { setError('Enter UPI ID'); return }
    if (mode === 'card' && (!cardNo || !expiry || !cvv)) { setError('Fill all card details'); return }
    setStep('processing')
    try {
      await api.citizenPay(id!, mode === 'upi' ? upiId : cardNo)
      setTimeout(() => setStep('success'), 2000)
    } catch (e) {
      setError((e as Error).message || 'Payment failed'); setStep('details')
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-citizen-muted hover:text-citizen-text">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <AnimatePresence mode="wait">
        {step === 'method' && (
          <motion.div key="method" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <h1 className="text-h1 text-citizen-text mb-1">Payment</h1>
            <p className="text-sm text-citizen-muted mb-6">Challan {id} · Amount: <strong className="text-citizen-danger">{c ? inr(c.fine_inr) : '—'}</strong></p>

            <Card citizen className="space-y-3">
              <p className="text-label text-citizen-muted">Select Payment Method</p>
              <button
                onClick={() => { setMode('upi'); setStep('details') }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-citizen-border hover:border-citizen-primary hover:bg-citizen-primary/5"
              >
                <div className="p-3 rounded-xl bg-emerald-50"><Smartphone className="h-6 w-6 text-emerald-600" /></div>
                <div className="text-left"><p className="font-semibold text-citizen-text">UPI</p><p className="text-xs text-citizen-muted">GPay, PhonePe, Paytm...</p></div>
              </button>
              <button
                onClick={() => { setMode('card'); setStep('details') }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-citizen-border hover:border-citizen-primary hover:bg-citizen-primary/5"
              >
                <div className="p-3 rounded-xl bg-teal-50"><CreditCard className="h-6 w-6 text-teal-600" /></div>
                <div className="text-left"><p className="font-semibold text-citizen-text">Credit/Debit Card</p><p className="text-xs text-citizen-muted">Visa, Mastercard, Rupay</p></div>
              </button>
            </Card>
          </motion.div>
        )}

        {step === 'details' && (
          <motion.div key="details" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <h1 className="text-h1 text-citizen-text mb-1">{mode === 'upi' ? 'UPI Payment' : 'Card Payment'}</h1>
            <p className="text-sm text-citizen-muted mb-6">Amount: <strong className="text-citizen-danger">{c ? inr(c.fine_inr) : '—'}</strong></p>

            <Card citizen className="space-y-4">
              {mode === 'upi' ? (
                <Input citizen label="UPI ID" placeholder="name@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
              ) : (
                <>
                  <Input citizen mono label="Card Number" placeholder="4111 1111 1111 1111" maxLength={19} value={cardNo} onChange={(e) => setCardNo(e.target.value)} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input citizen mono label="Expiry" placeholder="MM/YY" maxLength={5} value={expiry} onChange={(e) => setExpiry(e.target.value)} />
                    <Input citizen mono label="CVV" placeholder="•••" maxLength={4} type="password" value={cvv} onChange={(e) => setCvv(e.target.value)} />
                  </div>
                </>
              )}
              {error && <p className="text-sm text-citizen-danger bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex items-center gap-2 text-xs text-citizen-faint"><Shield className="h-3 w-3" /> 256-bit secure payment</div>
              <Button variant="citizen" size="lg" className="w-full" onClick={pay}>
                Pay {c ? inr(c.fine_inr) : ''}
              </Button>
              <button onClick={() => setStep('method')} className="w-full text-center text-sm text-citizen-muted hover:text-citizen-text py-1">
                ← Change method
              </button>
            </Card>
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div key="processing" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
            <div className="h-16 w-16 rounded-full border-4 border-citizen-primary/20 border-t-citizen-primary animate-spin mx-auto mb-4" />
            <p className="text-lg font-semibold text-citizen-text">Processing Payment...</p>
            <p className="text-sm text-citizen-muted mt-1">Do not close this page</p>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 100, damping: 20 }} className="text-center py-16">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}>
              <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-h1 text-citizen-text mb-2">Payment Successful!</h2>
            <p className="text-citizen-muted mb-6">Your challan {id} has been paid. A receipt will be emailed.</p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="citizen" onClick={() => navigate(`/citizen/receipt/${id}`)}>
                View Receipt
              </Button>
              <Button variant="secondary" className="!bg-white border !border-citizen-border !text-citizen-text" onClick={() => navigate(`/citizen/challan/${id}`)}>
                View Challan
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
