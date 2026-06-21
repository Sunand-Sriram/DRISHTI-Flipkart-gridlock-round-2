import { useState } from 'react'
import { ChevronDown, Mail, MessageCircle, Phone } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const FAQS = [
  { q: 'How do I find my challan?', a: 'Enter your Challan ID (e.g. DRI-00042) and vehicle plate number on the login screen. You can also look up all challans for your vehicle from the Challan History page.' },
  { q: 'What payment methods are supported?', a: 'UPI, Credit/Debit Card and Net Banking. Note: this is a prototype build — no real payment is processed.' },
  { q: 'How do I contest a challan?', a: 'Open the challan, click "Contest", choose a reason, add details and upload supporting photo evidence. An officer reviews contests within 5 business days.' },
  { q: 'When is the payment deadline?', a: 'Challans are payable within 14 days of issue. Late payment may attract additional penalty and escalation.' },
  { q: 'Will I get a receipt?', a: 'Yes — after a successful payment you can download a PDF receipt, and it also appears under Payment History.' },
  { q: 'I think my challan is a mistake. What do I do?', a: 'Use the Contest flow with photo evidence. Every challan carries AI evidence (annotated image, confidence score) that an officer re-verifies on appeal.' },
]

export default function Help() {
  const [open, setOpen] = useState<number | null>(0)
  const [sent, setSent] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-citizen-primary">Help &amp; Support</h1>
        <p className="mt-1 text-sm text-citizen-muted">Answers to common questions, or reach our support team.</p>
      </div>

      {/* contact cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: Phone, label: 'Helpline', value: '1800-123-4567' },
          { icon: Mail, label: 'Email', value: 'support@drishti.local' },
          { icon: MessageCircle, label: 'WhatsApp', value: '+91 98765 43210' },
        ].map((c) => (
          <Card citizen key={c.label} className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-citizen-primary/10 text-citizen-primary">
              <c.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-citizen-faint">{c.label}</p>
              <p className="text-sm font-medium">{c.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* FAQ */}
      <Card citizen padding={false}>
        {FAQS.map((f, i) => (
          <div key={i} className="border-b border-citizen-border/60 last:border-0">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-4 p-4 text-left text-sm font-medium hover:bg-citizen-primary/5"
            >
              {f.q}
              <ChevronDown className={`h-4 w-4 shrink-0 text-citizen-muted transition-transform ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && <p className="px-4 pb-4 text-sm leading-relaxed text-citizen-muted">{f.a}</p>}
          </div>
        ))}
      </Card>

      {/* contact form */}
      <Card citizen>
        <h2 className="font-semibold">Still need help?</h2>
        <p className="mt-1 text-sm text-citizen-muted">Send us a message and we’ll get back within 24 hours.</p>
        {sent ? (
          <p className="mt-4 rounded-xl bg-citizen-mint/10 p-4 text-sm text-citizen-mint">✓ Message sent! Our team will contact you shortly.</p>
        ) : (
          <div className="mt-4 space-y-3">
            <Input citizen label="Your Email" placeholder="you@example.com" />
            <textarea
              rows={4}
              placeholder="Describe your issue..."
              className="w-full rounded-xl border border-citizen-border p-3 text-sm outline-none focus:border-citizen-primary focus:ring-2 focus:ring-citizen-primary/10"
            />
            <Button variant="citizen" onClick={() => setSent(true)}>Send Message</Button>
          </div>
        )}
      </Card>
    </div>
  )
}
