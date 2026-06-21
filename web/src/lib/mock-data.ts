import type {
  AuditEntry,
  Camera,
  Challan,
  Checkpost,
  Emergency,
  Hotspot,
  ViolationFeedItem,
} from './types'

const now = Date.now()
const hour = 3600000

export const DASHBOARD_STATS = {
  challansToday: 3241,
  collected: 4860000,
  camerasLive: 12,
}

export const mockChallans: Challan[] = [
  {
    challan_id: 'DRI-00042',
    violation: 'no_helmet',
    confidence: 0.89,
    frame: 1542,
    evidence_image: 'evidence_42.jpg',
    plate: 'MH02XY5630',
    plate_valid: true,
    owner: {
      owner: 'Rajesh Kumar',
      address: '234, MG Nagar, Mumbai, MH 400001',
      phone: '+91-9876543210',
      make_model: 'Hero Splendor 110',
      puc_valid: true,
      puc_expires: '2026-12-31',
      insurance_valid: true,
      insurance_expires: '2026-08-15',
      prior_violations: 1,
    },
    fine_inr: 2000,
    base_fine_inr: 1000,
    repeat_multiplier: 2,
    repeat_offender: true,
    speed_kmh: 52.3,
    speed_limit: 60,
    camera: 'CAM-03',
    location: 'MG Road Junction, Bangalore',
    lat: 12.9716,
    lng: 77.5946,
    status: 'ISSUED',
    citizen_reason: null,
    citizen_evidence: null,
    officer_decision: null,
    created_at: now - hour * 2,
    paid_at: null,
    payment_deadline: '2026-07-04',
    officer_name: 'SI Ramesh Kumar',
  },
  {
    challan_id: 'DRI-00041',
    violation: 'phone_use',
    confidence: 0.58,
    frame: 892,
    evidence_image: 'evidence_41.jpg',
    plate: 'DL3CBJ4521',
    plate_valid: true,
    owner: {
      owner: 'Owner-4521',
      address: '12, Connaught Place, Delhi',
      phone: '+91-9123456789',
      make_model: 'Maruti Swift',
      puc_valid: true,
      insurance_valid: true,
      prior_violations: 0,
    },
    fine_inr: 1000,
    base_fine_inr: 1000,
    repeat_offender: false,
    speed_kmh: 38,
    camera: 'CAM-01',
    location: 'Indiranagar 100ft Road',
    lat: 12.9784,
    lng: 77.6408,
    status: 'PENDING_REVIEW',
    citizen_reason: null,
    citizen_evidence: null,
    officer_decision: null,
    created_at: now - hour * 2.5,
    paid_at: null,
    officer_name: 'SI Priya Sharma',
  },
  {
    challan_id: 'DRI-00040',
    violation: 'seatbelt',
    confidence: 0.71,
    frame: 1203,
    evidence_image: 'evidence_40.jpg',
    plate: 'KA03AL8899',
    plate_valid: true,
    owner: {
      owner: 'Anita Desai',
      make_model: 'Hyundai i20',
      prior_violations: 0,
    },
    fine_inr: 1000,
    base_fine_inr: 1000,
    repeat_offender: false,
    speed_kmh: 45,
    camera: 'CAM-05',
    location: 'Brigade Road',
    lat: 12.9698,
    lng: 77.607,
    status: 'PENDING_REVIEW',
    citizen_reason: null,
    citizen_evidence: null,
    officer_decision: null,
    created_at: now - hour * 3,
    paid_at: null,
    officer_name: 'SI Ramesh Kumar',
  },
  {
    challan_id: 'DRI-00039',
    violation: 'red_light',
    confidence: 0.92,
    frame: 445,
    evidence_image: 'evidence_39.jpg',
    plate: 'TN04AB1122',
    plate_valid: true,
    owner: { owner: 'Vikram S', make_model: 'Honda Activa', prior_violations: 0 },
    fine_inr: 5000,
    base_fine_inr: 5000,
    repeat_offender: false,
    speed_kmh: 28,
    camera: 'CAM-04',
    location: 'Koramangala 5th Block',
    lat: 12.9352,
    lng: 77.6245,
    status: 'PAID',
    citizen_reason: null,
    citizen_evidence: null,
    officer_decision: null,
    created_at: now - hour * 24 * 10,
    paid_at: now - hour * 24 * 8,
    officer_name: 'SI Priya Sharma',
  },
  {
    challan_id: 'DRI-00038',
    violation: 'no_helmet',
    confidence: 0.62,
    frame: 778,
    evidence_image: 'evidence_38.jpg',
    plate: 'MH02XY5630',
    plate_valid: true,
    owner: {
      owner: 'Rajesh Kumar',
      make_model: 'Hero Splendor 110',
      prior_violations: 0,
    },
    fine_inr: 1000,
    base_fine_inr: 1000,
    repeat_offender: false,
    speed_kmh: 40,
    camera: 'CAM-03',
    location: 'MG Road Junction',
    lat: 12.9716,
    lng: 77.5946,
    status: 'CONTESTED',
    citizen_reason: 'I was not riding without helmet, officer error in detection.',
    citizen_evidence: 'helmet_claim.jpg',
    officer_decision: null,
    created_at: now - hour * 5,
    paid_at: null,
    officer_name: 'SI Ramesh Kumar',
  },
  {
    challan_id: 'DRI-00037',
    violation: 'triple_riding',
    confidence: 0.48,
    frame: 331,
    evidence_image: 'evidence_37.jpg',
    plate: 'KA01MN7788',
    plate_valid: true,
    owner: { owner: 'Suresh P', make_model: 'TVS Jupiter' },
    fine_inr: 1000,
    repeat_offender: false,
    speed_kmh: 22,
    camera: 'CAM-02',
    location: 'Whitefield Main Road',
    lat: 12.9698,
    lng: 77.75,
    status: 'PENDING_REVIEW',
    citizen_reason: null,
    citizen_evidence: null,
    officer_decision: null,
    created_at: now - hour * 1,
    paid_at: null,
    officer_name: 'SI Ramesh Kumar',
  },
  {
    challan_id: 'DRI-00036',
    violation: 'red_light',
    confidence: 0.76,
    frame: 556,
    evidence_image: 'evidence_36.jpg',
    plate: 'DL3CBJ4521',
    plate_valid: true,
    owner: { owner: 'Owner-4521', make_model: 'Maruti Swift' },
    fine_inr: 5000,
    repeat_offender: false,
    speed_kmh: 35,
    camera: 'CAM-01',
    location: 'Indiranagar',
    lat: 12.9784,
    lng: 77.6408,
    status: 'PENDING_REVIEW',
    citizen_reason: null,
    citizen_evidence: null,
    officer_decision: null,
    created_at: now - hour * 4,
    paid_at: null,
    officer_name: 'SI Priya Sharma',
  },
]

export const mockCameras: Camera[] = [
  { id: 'cam-03', name: 'CAM-03', location: 'MG Road', lat: 12.9716, lng: 77.5946, status: 'live', count: 234 },
  { id: 'cam-05', name: 'CAM-05', location: 'Brigade Road', lat: 12.9698, lng: 77.607, status: 'live', count: 156 },
  { id: 'cam-01', name: 'CAM-01', location: 'Indiranagar', lat: 12.9784, lng: 77.6408, status: 'offline', count: 145 },
  { id: 'cam-04', name: 'CAM-04', location: 'Koramangala', lat: 12.9352, lng: 77.6245, status: 'live', count: 98 },
  { id: 'cam-02', name: 'CAM-02', location: 'Whitefield', lat: 12.9698, lng: 77.75, status: 'live', count: 67 },
]

export const mockCheckposts: Checkpost[] = [
  { id: 'cp-3', name: 'Checkpost 3', location: 'MG Road', lat: 12.972, lng: 77.595, officer: 'SI Ramesh Kumar' },
  { id: 'cp-7', name: 'Checkpost 7', location: 'Brigade Rd', lat: 12.97, lng: 77.608, officer: 'SI Priya Sharma' },
  { id: 'cp-1', name: 'Checkpost 1', location: 'Indiranagar', lat: 12.979, lng: 77.641, officer: 'Vacant' },
]

export const mockEmergencies: Emergency[] = [
  {
    id: 'em-1',
    vehicle: 'AMBULANCE',
    camera: 'CAM-05',
    location: 'MG Road Junction',
    lat: 12.9716,
    lng: 77.5946,
    checkpost: 'Checkpost 7',
    officer: 'SI Ramesh Kumar',
    status: 'active',
    created_at: now - 45000,
    direction: '→',
  },
  {
    id: 'em-2',
    vehicle: 'FIRE TRUCK',
    camera: 'CAM-02',
    location: 'Brigade Road, Bangalore',
    lat: 12.9698,
    lng: 77.607,
    checkpost: 'Checkpost 3',
    officer: 'SI Priya Sharma',
    status: 'active',
    created_at: now - 432000,
    direction: '↑',
  },
]

export const emergencyHistory = [
  { time: '14:15', type: 'Ambulance', camera: 'CAM-01', status: 'Resolved ✓' },
  { time: '14:05', type: 'Fire Truck', camera: 'CAM-04', status: 'Resolved ✓' },
  { time: '13:52', type: 'Ambulance', camera: 'CAM-03', status: 'Resolved ✓' },
]

export const mockHotspots: Hotspot[] = [
  { lat: 12.9716, lng: 77.5946, label: 'MG Road Junction', risk: 8, expected: 12, top_violation: 'no_helmet' },
  { lat: 12.9698, lng: 77.607, label: 'Brigade Road', risk: 5, expected: 7, top_violation: 'red_light' },
  { lat: 12.9784, lng: 77.6408, label: 'Indiranagar', risk: 2, expected: 3, top_violation: 'phone_use' },
]

export const mockAuditLog: AuditEntry[] = [
  { id: 1, action: 'Camera CAM-05 added', actor: 'Admin-001', status: '✓', created_at: now - hour * 0.5 },
  { id: 2, action: 'CAM-01 went offline', actor: 'System', status: '⚠️', created_at: hour * 0.75 },
  { id: 3, action: 'SI Priya assigned to Checkpost 7', actor: 'Admin-001', status: '✓', created_at: now - hour },
]

export const violationFeed: ViolationFeedItem[] = [
  { id: 1042, type: 'no_helmet', plate: 'MH02XY5', confidence: 0.89, challan_id: 'DRI-00042' },
  { id: 1041, type: 'red_light', plate: 'DL3CBJ', confidence: 0.76, challan_id: 'DRI-00036' },
  { id: 1040, type: 'phone_use', plate: 'KA03AL', confidence: 0.92, challan_id: 'DRI-00041' },
  { id: 1039, type: 'seatbelt', plate: 'TN04AB', confidence: 0.84 },
  { id: 1038, type: 'triple_riding', plate: 'KA01MN', confidence: 0.67, challan_id: 'DRI-00037' },
]

export const analyticsSummary = {
  totalChallans: 1234,
  totalFines: 4860000,
  repeatOffenders: 156,
  avgFine: 3945,
}

export const violationsByType = [
  { type: 'No Helmet', count: 456 },
  { type: 'Phone', count: 234 },
  { type: 'Red Light', count: 289 },
  { type: 'Seatbelt', count: 156 },
  { type: 'Others', count: 99 },
]

export const hourlyData = Array.from({ length: 24 }, (_, h) => ({
  hour: h,
  count: Math.round(20 + Math.sin((h - 8) * 0.5) * 35 + Math.random() * 15),
}))

export const finesTrend = [
  { date: 'Jun 15', amount: 620000 },
  { date: 'Jun 16', amount: 710000 },
  { date: 'Jun 17', amount: 580000 },
  { date: 'Jun 18', amount: 840000 },
  { date: 'Jun 19', amount: 690000 },
  { date: 'Jun 20', amount: 920000 },
  { date: 'Jun 21', amount: 780000 },
]

export const suggestedQueries = [
  'Which junction had most violations?',
  'Show repeat offenders this week',
  'Compare helmet vs phone violations',
  'Officer leaderboard',
  'Show traffic flow predictions',
]

export const chatResponses: Record<string, { text: string; chart?: 'bar' | 'line' }> = {
  'Which junction had most violations?': {
    text: 'MG Road Junction leads with 234 violations this week, followed by Brigade Road (156) and Indiranagar (145). Peak hours are 14:00–17:00.',
  },
  'Show repeat offenders this week': {
    text: '156 repeat offenders identified this week. Top plate: MH 02 XY 5630 with 2 violations. Fine multiplier applied on 89 cases.',
  },
  'Compare helmet vs phone violations': {
    text: 'No-helmet: 456 cases (37%). Phone use: 234 cases (19%). Helmet violations peak during morning rush; phone use peaks mid-afternoon.',
    chart: 'bar',
  },
  'Officer leaderboard': {
    text: 'SI Ramesh Kumar: 342 challans. SI Priya Sharma: 298 challans. SI Anil Verma: 245 challans.',
  },
  'Show traffic flow predictions': {
    text: 'Predicted high-traffic zones in next 3 hours: MG Road (risk 8/10), Brigade Road (5/10), Indiranagar (2/10).',
  },
}

export function getChallanById(id: string): Challan | undefined {
  return mockChallans.find((c) => c.challan_id === id || c.challan_id.replace('DRI-000', 'DRI-') === id)
}

export function getReviewQueue(): Challan[] {
  return mockChallans.filter(
    (c) => c.status === 'PENDING_REVIEW' && (c.confidence ?? 1) < 0.75
  )
}

export function getContestedQueue(): Challan[] {
  return mockChallans.filter((c) => c.status === 'CONTESTED')
}

export function getCitizenHistory(plate: string): Challan[] {
  const normalized = plate.replace(/\s/g, '').toUpperCase()
  return mockChallans.filter((c) => c.plate?.replace(/\s/g, '').toUpperCase() === normalized)
}
