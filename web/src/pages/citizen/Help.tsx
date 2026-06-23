import { Phone, Globe, FileText, Shield } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Accordion } from '@/components/ui/Accordion'

const FAQS = [
  { q: 'How does DRISHTI detect violations?', a: 'DRISHTI uses YOLO11m computer vision running on CCTV feeds to automatically detect 8 types of traffic violations in real-time. Each detection includes an AI confidence score.' },
  { q: 'I received a challan. What should I do?', a: 'You can look up your challan using the Challan ID and vehicle number. If the violation is accurate, you can pay online via UPI or Card. If you believe it\'s incorrect, you can submit a contest with evidence.' },
  { q: 'How do I contest a challan?', a: 'Click the "Contest" button on your challan page. Select a reason, optionally upload counter-evidence (photo/video), and submit. A traffic officer will review your case within 48 hours.' },
  { q: 'What payment methods are accepted?', a: 'We accept UPI (GPay, PhonePe, Paytm) and Credit/Debit Cards (Visa, Mastercard, Rupay). All payments are processed through a 256-bit encrypted gateway.' },
  { q: 'What if I don\'t pay within the deadline?', a: 'Late payment may result in additional penalties as per RTO regulations. Repeated non-payment can lead to registration certificate suspension.' },
  { q: 'Is my data private?', a: 'Yes. DRISHTI follows DPDP (Digital Personal Data Protection) compliance. Bystander faces are automatically blurred, and all data is encrypted at rest.' },
  { q: 'What violations does DRISHTI detect?', a: 'No helmet, triple riding, red light running, wrong-way driving, phone use while driving, speeding, no seatbelt, and illegal parking.' },
]

export default function Help() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-h1 text-citizen-text">Help & Support</h1>

      {/* FAQ */}
      <div className="space-y-2">
        {FAQS.map((faq) => (
          <Accordion key={faq.q} title={faq.q} citizen>
            {faq.a}
          </Accordion>
        ))}
      </div>

      {/* Contact */}
      <Card citizen>
        <h2 className="font-display font-semibold text-citizen-text mb-4">Contact Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="tel:+918001234567" className="flex items-center gap-3 p-3 rounded-xl border border-citizen-border hover:bg-gray-50">
            <Phone className="h-5 w-5 text-citizen-primary" />
            <div><p className="text-sm font-medium text-citizen-text">Helpline</p><p className="text-xs text-citizen-muted">1800-123-4567</p></div>
          </a>
          <a href="https://traffic.karnataka.gov.in" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-citizen-border hover:bg-gray-50">
            <Globe className="h-5 w-5 text-citizen-primary" />
            <div><p className="text-sm font-medium text-citizen-text">Website</p><p className="text-xs text-citizen-muted">traffic.karnataka.gov.in</p></div>
          </a>
          <a href="#" className="flex items-center gap-3 p-3 rounded-xl border border-citizen-border hover:bg-gray-50">
            <FileText className="h-5 w-5 text-citizen-primary" />
            <div><p className="text-sm font-medium text-citizen-text">Guidelines</p><p className="text-xs text-citizen-muted">MV Act 2019</p></div>
          </a>
        </div>
      </Card>

      <div className="flex items-center gap-2 text-xs text-citizen-faint">
        <Shield className="h-3.5 w-3.5" /> DRISHTI is DPDP-compliant. Your data is encrypted and secure.
      </div>
    </div>
  )
}
