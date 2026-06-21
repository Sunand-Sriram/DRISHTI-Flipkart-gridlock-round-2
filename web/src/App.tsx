import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CitizenLayout } from '@/components/layout/CitizenLayout'
import { OfficerLayout } from '@/components/layout/OfficerLayout'
import LandingPage from '@/pages/Landing'
import CitizenLogin from '@/pages/citizen/CitizenLogin'
import ContestChallan from '@/pages/citizen/ContestChallan'
import History from '@/pages/citizen/History'
import MyChallan from '@/pages/citizen/MyChallan'
import PayNow from '@/pages/citizen/PayNow'
import Receipt from '@/pages/citizen/Receipt'
import PaymentHistory from '@/pages/citizen/PaymentHistory'
import Help from '@/pages/citizen/Help'
import Notifications from '@/pages/citizen/Notifications'
import Analytics from '@/pages/officer/Analytics'
import CameraManagement from '@/pages/officer/CameraManagement'
import ChallanDetail from '@/pages/officer/ChallanDetail'
import ChallanList from '@/pages/officer/ChallanList'
import ChatAnalytics from '@/pages/officer/ChatAnalytics'
import ContestedQueue from '@/pages/officer/ContestedQueue'
import Emergencies from '@/pages/officer/Emergencies'
import LiveMap from '@/pages/officer/LiveMap'
import LiveMonitor from '@/pages/officer/LiveMonitor'
import OfficerLogin from '@/pages/officer/OfficerLogin'
import Outbox from '@/pages/officer/Outbox'
import ReviewQueue from '@/pages/officer/ReviewQueue'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/officer" element={<OfficerLogin />} />

        <Route element={<OfficerLayout />}>
          <Route path="/officer/monitor" element={<LiveMonitor />} />
          <Route path="/officer/review" element={<ReviewQueue />} />
          <Route path="/officer/contested" element={<ContestedQueue />} />
          <Route path="/officer/emergencies" element={<Emergencies />} />
          <Route path="/officer/challans" element={<ChallanList />} />
          <Route path="/officer/challans/:id" element={<ChallanDetail />} />
          <Route path="/officer/analytics" element={<Analytics />} />
          <Route path="/officer/chat" element={<ChatAnalytics />} />
          <Route path="/officer/map" element={<LiveMap />} />
          <Route path="/officer/cameras" element={<CameraManagement />} />
          <Route path="/officer/outbox" element={<Outbox />} />
        </Route>

        <Route path="/citizen" element={<CitizenLayout />}>
          <Route index element={<CitizenLogin />} />
          <Route path="challan/:id" element={<MyChallan />} />
          <Route path="pay/:id" element={<PayNow />} />
          <Route path="contest/:id" element={<ContestChallan />} />
          <Route path="receipt/:id" element={<Receipt />} />
          <Route path="history" element={<History />} />
          <Route path="payments" element={<PaymentHistory />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="help" element={<Help />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
