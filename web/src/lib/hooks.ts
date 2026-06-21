/** React data hooks over the FastAPI backend. Each returns { data, loading,
 *  error, reload } so screens get loading/empty states for free. */
import { useCallback, useEffect, useState } from 'react'
import { api, type Page, type Summary } from './api'
import type {
  AuditEntry, Camera, Challan, Checkpost, Emergency, Hotspot,
} from './types'

function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const run = useCallback(() => {
    let alive = true
    setLoading(true)
    fn()
      .then((d) => { if (alive) { setData(d); setError(null) } })
      .catch((e) => { if (alive) setError(String(e?.message || e)) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(run, [run])
  return { data, loading, error, reload: run }
}

export const useChallans = (params: Record<string, string | number | undefined> = {}) =>
  useAsync<Page<Challan>>(() => api.listChallans(params), [JSON.stringify(params)])

export const useChallan = (id: string | undefined) =>
  useAsync<Challan | null>(() => (id ? api.getChallan(id) : Promise.resolve(null)), [id])

export const useSummary = (days = 0) => useAsync<Summary>(() => api.summary(days), [days])
export const useHourly = (days = 0) => useAsync(() => api.hourly(days), [days])
export const useTrend = (days = 7) =>
  useAsync<{ date: string; count: number; amount: number }[]>(() => api.trend(days), [days])
export const useCameras = () => useAsync<Camera[]>(() => api.cameras(), [])
export const useCheckposts = () => useAsync<Checkpost[]>(() => api.checkposts(), [])
export const useAuditLog = (n = 10) => useAsync<AuditEntry[]>(() => api.auditLog(n), [n])
export const useEmergencies = (status = 'active') =>
  useAsync<Emergency[]>(() => api.emergencies(status), [status])
export const useHotspots = (offset = 0) =>
  useAsync<{ hotspots: Hotspot[]; based_on: number; weeks: number }>(
    () => api.hotspots(offset), [offset])
