import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function inr(n: number | null | undefined) {
  if (n == null) return '—'
  return '₹' + n.toLocaleString('en-IN')
}

export function formatPlate(plate: string) {
  return plate.replace(/(.{2})(.{2})(.{2})(.*)/, '$1 $2 $3 $4').trim()
}

export function titleCase(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Download an array of row-objects (or [headers, ...rows]) as a CSV file. */
export function downloadCSV(filename: string, rows: Record<string, unknown>[] | (string | number)[][]) {
  if (!rows.length) return
  let csv: string
  if (Array.isArray(rows[0])) {
    csv = (rows as (string | number)[][]).map((r) => r.map(csvCell).join(',')).join('\n')
  } else {
    const objs = rows as Record<string, unknown>[]
    const headers = Object.keys(objs[0])
    csv = [headers.join(','), ...objs.map((o) => headers.map((h) => csvCell(o[h])).join(','))].join('\n')
  }
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export const VIOLATION_TYPES = [
  'no_helmet',
  'phone_use',
  'red_light',
  'seatbelt',
  'triple_riding',
  'overspeed',
  'wrong_side',
  'illegal_parking',
] as const

export const VIOLATION_LABEL: Record<string, string> = {
  no_helmet: 'No Helmet',
  phone_use: 'Phone Use',
  red_light: 'Red Light',
  seatbelt: 'Seatbelt',
  triple_riding: 'Triple Riding',
  overspeed: 'Overspeed',
  wrong_side: 'Wrong Side',
  illegal_parking: 'Illegal Parking',
}

export const VIOLATION_COLOR: Record<string, string> = {
  no_helmet: 'bg-red-500/15 text-red-400 border-red-500/30',
  red_light: 'bg-red-500/15 text-red-400 border-red-500/30',
  triple_riding: 'bg-red-500/15 text-red-400 border-red-500/30',
  phone_use: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  seatbelt: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  overspeed: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30',
  wrong_side: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  illegal_parking: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
}

export const STATUS_COLOR: Record<string, string> = {
  ISSUED: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  PAID: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  PENDING_REVIEW: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  CONTESTED: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  CONTESTED_UPHELD: 'bg-red-500/15 text-red-400 border-red-500/30',
  CONTESTED_DISMISSED: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  ESCALATED: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  REJECTED: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  UNPAID: 'bg-red-500/15 text-red-400 border-red-500/30',
}
