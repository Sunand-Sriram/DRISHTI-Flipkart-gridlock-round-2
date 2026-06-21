/** Typed client for the DRISHTI FastAPI backend (Vite env). */
import type {
  AuditEntry, Camera, Challan, Checkpost, Emergency, Hotspot,
} from './types'

export const API =
  (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000'

export interface Page<T> { items: T[]; total: number; page: number }
export interface Summary {
  total: number
  fines_collected: number
  repeat_offenders: number
  avg_fine: number
  by_type: { type: string; count: number }[]
  by_camera: { camera: string; count: number }[]
}

async function j<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(API + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  if (!r.ok) throw new Error((await r.text()) || r.statusText)
  return r.json()
}

export const evidenceUrl = (name: string) => `${API}/static/evidence/${name}`

const qs = (params: Record<string, string | number | undefined>) =>
  new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '') as [string, string][],
  ).toString()

export const api = {
  // ── officer ──────────────────────────────────────────────────────────────
  listChallans: (params: Record<string, string | number | undefined> = {}) =>
    j<Page<Challan>>('/api/challans?' + qs(params)),
  getChallan: (id: string) => j<Challan>(`/api/challans/${id}`),
  patchChallan: (id: string, body: Record<string, unknown>) =>
    j<Challan>(`/api/challans/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  challanPdfUrl: (id: string) => `${API}/api/challans/${id}/pdf`,
  summary: (days = 0) => j<Summary>(`/api/analytics/summary?days=${days}`),
  hourly: (days = 0) => j<{ hour: number; count: number }[]>(`/api/analytics/hourly?days=${days}`),
  trend: (days = 7) => j<{ date: string; count: number; amount: number }[]>(`/api/analytics/trend?days=${days}`),
  cameras: () => j<Camera[]>('/api/cameras'),
  checkposts: () => j<Checkpost[]>('/api/checkposts'),
  auditLog: (limit = 10) => j<AuditEntry[]>(`/api/audit-log?limit=${limit}`),
  emergencies: (status = 'active') => j<Emergency[]>(`/api/emergencies?status=${status}`),
  dismissEmergency: (id: string) =>
    j(`/api/emergencies/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'dismissed' }) }),
  followUpEmergency: (id: string) =>
    j<{ ok: boolean; checkpost: string; vehicle: string; camera: string }>(
      `/api/emergencies/${id}/followup`, { method: 'POST' }),
  checkpostAlerts: (name: string) =>
    j<{ items: Notification[]; unread: number }>(`/api/checkpost-alerts?name=${encodeURIComponent(name)}`),
  hotspots: (offset = 0) =>
    j<{ hotspots: Hotspot[]; based_on: number; weeks: number }>(`/api/hotspots/predict?time_offset=${offset}`),
  chat: (messages: { role: string; content: string }[]) =>
    j<{ reply: string; data: unknown; chart: 'bar' | 'line' | null }>('/api/chat', {
      method: 'POST', body: JSON.stringify({ messages }),
    }),
  uploadUrl: () => `${API}/api/upload`,
  streamUrl: (url: string, enhance = false) =>
    j<{ task_id: string }>('/api/stream-url', { method: 'POST', body: JSON.stringify({ url, enhance }) }),
  wsUrl: (taskId: string) => `${API.replace(/^http/, 'ws')}/ws/stream/${taskId}`,
  // ── citizen ──────────────────────────────────────────────────────────────
  citizenLogin: (challan_id: string, plate_no: string) =>
    j<{ token: string; challan_id: string }>('/api/citizen/login', {
      method: 'POST', body: JSON.stringify({ challan_id, plate_no }),
    }),
  citizenPay: (id: string, card_number: string) =>
    j<{ success: boolean; transaction_id: string; amount: number }>(`/api/citizen/pay/${id}`, {
      method: 'POST', body: JSON.stringify({ card_number }),
    }),
  citizenHistory: (plate: string) =>
    j<{ items: Challan[]; total_paid: number; count: number }>(
      `/api/citizen/history?plate=${encodeURIComponent(plate)}`,
    ),
  receiptPdfUrl: (id: string) => `${API}/api/citizen/receipt/${id}/pdf`,
  contestUrl: (id: string) => `${API}/api/citizen/challans/${id}/contest`,
  // ── officer auth ───────────────────────────────────────────────────────────
  officerLogin: (email: string, password: string) =>
    j<{ ok: boolean; token: string; officer: OfficerPublic }>('/api/officer/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),
  officerSignup: (body: Record<string, string>) =>
    j<{ ok: boolean; officer: OfficerPublic }>('/api/officer/signup', {
      method: 'POST', body: JSON.stringify(body),
    }),
  officers: () => j<OfficerPublic[]>('/api/officers'),
  // ── notifications ──────────────────────────────────────────────────────────
  notifications: (audience: string) =>
    j<{ items: Notification[]; unread: number }>(`/api/notifications?audience=${encodeURIComponent(audience)}`),
  markNotificationsRead: (audience: string) =>
    j('/api/notifications/read', { method: 'POST', body: JSON.stringify({ audience }) }),
  // ── email ──────────────────────────────────────────────────────────────────
  sendChallanEmail: (id: string) =>
    j<{ sent: boolean; mode: string; to?: string; preview?: string; error?: string }>(
      `/api/challans/${id}/send-email`, { method: 'POST' }),
  outbox: () => j<{ items: OutboxEntry[] }>('/api/outbox'),
  outboxViewUrl: (name: string) => `${API}/api/outbox/${encodeURIComponent(name)}`,
}

export interface OutboxEntry {
  name: string; to: string; subject: string; mode: string
  attachment: string | null; created_at: number
}

export interface OfficerPublic {
  name: string; email: string; badge: string; station: string; rank: string
}
export interface Notification {
  id: number; audience: string; kind: string; title: string; body: string
  link: string; read: number; created_at: number
}
