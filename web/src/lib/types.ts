export interface Owner {
  owner?: string
  address?: string
  phone?: string
  make_model?: string
  puc_valid?: boolean
  puc_expires?: string
  insurance_valid?: boolean
  insurance_expires?: string
  prior_violations?: number
}

export interface Challan {
  challan_id: string
  violation: string
  confidence: number | null
  frame: number | null
  evidence_image: string | null
  plate: string | null
  plate_valid: boolean
  owner: Owner
  fine_inr: number
  base_fine_inr?: number
  repeat_multiplier?: number
  repeat_offender: boolean
  speed_kmh: number | null
  speed_limit?: number
  camera: string
  location: string | null
  lat: number | null
  lng: number | null
  status: string
  citizen_reason: string | null
  citizen_evidence: string | null
  officer_decision: string | null
  officer_decision_reason?: string | null
  created_at: number
  paid_at: number | null
  payment_deadline?: string
  officer_name?: string
}

export interface Camera {
  id: string
  name: string
  location: string
  lat: number
  lng: number
  status: 'live' | 'offline'
  count: number
}

export interface Checkpost {
  id: string
  name: string
  location: string
  lat: number
  lng: number
  officer: string
}

export interface Emergency {
  id: string
  vehicle: string
  camera: string
  location: string
  lat: number
  lng: number
  checkpost: string
  officer: string
  status: 'active' | 'resolved' | 'dismissed'
  created_at: number
  direction?: string
}

export interface Hotspot {
  lat: number
  lng: number
  label: string
  risk: number
  expected: number
  top_violation: string
}

export interface AuditEntry {
  id: number
  action: string
  actor: string
  status: string
  created_at: number
}

export interface ViolationFeedItem {
  id: number
  type: string
  plate: string
  confidence: number
  challan_id?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  chart?: 'bar' | 'line' | null
  chartData?: { key: string; value: number }[]
  timestamp: number
}

export interface Receipt {
  receipt_id: string
  transaction_id: string
  challan_id: string
  amount: number
  payment_method: string
  paid_at: number
  plate: string
  vehicle: string
  violation: string
}
