import type { Challan, Emergency } from './types'
import { mockChallans, mockEmergencies } from './mock-data'

let challans = [...mockChallans]
let emergencies = [...mockEmergencies]

export function getChallans() {
  return challans
}

export function setChallans(next: Challan[]) {
  challans = next
}

export function updateChallan(id: string, patch: Partial<Challan>) {
  challans = challans.map((c) => (c.challan_id === id ? { ...c, ...patch } : c))
  return challans.find((c) => c.challan_id === id)
}

export function getEmergencies() {
  return emergencies
}

export function dismissEmergency(id: string) {
  emergencies = emergencies.map((e) =>
    e.id === id ? { ...e, status: 'dismissed' as Emergency['status'] } : e
  )
}

export function getRole(): 'officer' | 'analyst' | null {
  const r = localStorage.getItem('drishti_role')
  return r === 'officer' || r === 'analyst' ? r : null
}

export function setRole(role: 'officer' | 'analyst') {
  localStorage.setItem('drishti_role', role)
}

export function getCitizenToken(): string | null {
  return localStorage.getItem('drishti_citizen_token')
}

export function setCitizenSession(token: string, challanId: string, plate: string) {
  localStorage.setItem('drishti_citizen_token', token)
  localStorage.setItem('drishti_citizen_challan', challanId)
  localStorage.setItem('drishti_citizen_plate', plate)
}

export function getCitizenPlate(): string | null {
  return localStorage.getItem('drishti_citizen_plate')
}

export function getCitizenChallanId(): string | null {
  return localStorage.getItem('drishti_citizen_challan')
}

export function citizenLogout() {
  localStorage.removeItem('drishti_citizen_token')
  localStorage.removeItem('drishti_citizen_challan')
  localStorage.removeItem('drishti_citizen_plate')
}

// ── Officer auth (client-side, demo) ──────────────────────────────────────
export interface OfficerAccount {
  name: string
  badge: string
  email: string
  station: string
  password: string
}

function readOfficers(): OfficerAccount[] {
  try {
    return JSON.parse(localStorage.getItem('drishti_officers') || '[]')
  } catch {
    return []
  }
}

// Seed the demo officer roster so the documented logins work out of the box.
// Mirrors the backend demo_accounts.OFFICERS (shared password for the demo).
const DEMO_OFFICERS: OfficerAccount[] = [
  { name: 'SI Ramesh Kumar', badge: 'KA-1024', email: 'ramesh.kumar@drishti.gov.in', station: 'Indiranagar Traffic PS', password: 'drishti123' },
  { name: 'SI Priya Sharma', badge: 'KA-1098', email: 'priya.sharma@drishti.gov.in', station: 'MG Road Traffic PS', password: 'drishti123' },
  { name: 'ASI Anil Reddy', badge: 'KA-2210', email: 'anil.reddy@drishti.gov.in', station: 'Silk Board Traffic PS', password: 'drishti123' },
  { name: 'PI Meera Nair', badge: 'KA-0471', email: 'meera.nair@drishti.gov.in', station: 'Koramangala Traffic PS', password: 'drishti123' },
  { name: 'HC Suresh Gowda', badge: 'KA-3355', email: 'suresh.gowda@drishti.gov.in', station: 'Hebbal Traffic PS', password: 'drishti123' },
  { name: 'Insp. Vikram Singh', badge: 'KA-0012', email: 'admin@drishti.gov.in', station: 'Traffic HQ, Bengaluru', password: 'drishti123' },
  // legacy convenience account
  { name: 'SI Ramesh Kumar', badge: 'KA-1024', email: 'officer@drishti.gov.in', station: 'Indiranagar Traffic PS', password: 'drishti123' },
]

function seededOfficers(): OfficerAccount[] {
  const list = readOfficers()
  let changed = false
  for (const demo of DEMO_OFFICERS) {
    if (!list.some((o) => o.email.toLowerCase() === demo.email)) {
      list.push(demo)
      changed = true
    }
  }
  if (changed) localStorage.setItem('drishti_officers', JSON.stringify(list))
  return list
}

export function registerOfficer(acc: OfficerAccount): { ok: boolean; error?: string } {
  const list = seededOfficers()
  if (list.some((o) => o.email === acc.email)) {
    return { ok: false, error: 'An account with this email already exists.' }
  }
  list.push(acc)
  localStorage.setItem('drishti_officers', JSON.stringify(list))
  return { ok: true }
}

export function loginOfficer(email: string, password: string): { ok: boolean; error?: string; officer?: OfficerAccount } {
  const list = seededOfficers()
  const match = list.find((o) => o.email.toLowerCase() === email.toLowerCase() && o.password === password)
  if (!match) return { ok: false, error: 'Invalid email or password.' }
  localStorage.setItem('drishti_officer', JSON.stringify(match))
  localStorage.setItem('drishti_role', 'officer')
  return { ok: true, officer: match }
}

export function getOfficer(): OfficerAccount | null {
  try {
    return JSON.parse(localStorage.getItem('drishti_officer') || 'null')
  } catch {
    return null
  }
}

export function officerLogout() {
  localStorage.removeItem('drishti_officer')
  localStorage.removeItem('drishti_role')
}
