import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from './api'

export interface LiveViolation {
  challan_id: string; violation: string; plate: string | null
  fine: number; confidence: number; evidence: string; status: string
}
export interface LiveEmergency {
  id: string; vehicle: string; camera: string; location: string; checkpost: string
}

/** Opens the inference WebSocket for a file upload OR a live stream URL. */
export function useInferenceStream() {
  const [frame, setFrame] = useState<string | null>(null)
  const [violations, setViolations] = useState<LiveViolation[]>([])
  const [emergency, setEmergency] = useState<LiveEmergency | null>(null)
  const [progress, setProgress] = useState(0)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  const open = useCallback((taskId: string) => {
    const ws = new WebSocket(api.wsUrl(taskId))
    wsRef.current = ws
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data)
      if (msg.type === 'frame') setFrame(`data:image/jpeg;base64,${msg.data}`)
      else if (msg.type === 'violation') setViolations((v) => [msg.data, ...v].slice(0, 100))
      else if (msg.type === 'emergency') setEmergency(msg.data)
      else if (msg.type === 'progress') setProgress(msg.data?.pct ?? 0)
      else if (msg.type === 'done') { setProgress(100); setRunning(false); setDone(true); ws.close() }
      else if (msg.type === 'error') { setError(msg.data || 'Inference error'); setRunning(false); ws.close() }
    }
    ws.onerror = () => { setError('Could not reach the inference service. Is the backend running?'); setRunning(false) }
    ws.onclose = () => setRunning(false)
  }, [])

  const start = useCallback(async (file: File, enhance: boolean, stride: number) => {
    setViolations([]); setFrame(null); setProgress(0); setError(null); setDone(false); setRunning(true)
    try {
      const fd = new FormData()
      fd.append('file', file); fd.append('enhance', String(enhance)); fd.append('stride', String(stride))
      const res = await fetch(api.uploadUrl(), { method: 'POST', body: fd })
      if (!res.ok) throw new Error(`upload failed (${res.status})`)
      const { task_id } = await res.json()
      open(task_id)
    } catch (e) {
      setError(`Upload failed — backend unreachable. ${String((e as Error)?.message || '')}`)
      setRunning(false)
    }
  }, [open])

  /** Run live AI detection on a network camera (e.g. phone IP Webcam URL). */
  const startUrl = useCallback(async (url: string, enhance = false) => {
    setViolations([]); setFrame(null); setProgress(0); setError(null); setDone(false); setRunning(true)
    try {
      const { task_id } = await api.streamUrl(url, enhance)
      open(task_id)
    } catch {
      setError('Could not start the stream — check the URL and that the backend is running.')
      setRunning(false)
    }
  }, [open])

  const stop = useCallback(() => { wsRef.current?.close(); setRunning(false) }, [])

  useEffect(() => () => wsRef.current?.close(), [])
  return { frame, violations, emergency, progress, running, error, done, start, startUrl, stop, setEmergency }
}
