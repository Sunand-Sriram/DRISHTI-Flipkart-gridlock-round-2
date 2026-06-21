import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Download, Upload, Video } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Switch } from '@/components/ui/Switch'
import { ViolationBadge } from '@/components/ui/ViolationBadge'
import { useChallans } from '@/lib/hooks'
import { useInferenceStream } from '@/lib/ws'
import { evidenceUrl } from '@/lib/api'
import { cn, inr } from '@/lib/utils'

export default function LiveMonitor() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'cctv' | 'upload'>('cctv')
  const [enhance, setEnhance] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [streaming, setStreaming] = useState(true)
  const [fps, setFps] = useState(24.5)
  // Emergency banner only appears when a real emergency is streamed (no popup on load).
  const [alert, setAlert] = useState(false)
  const stream = useInferenceStream()
  const { data: recent } = useChallans({ limit: 12 })
  // phone IP-webcam live feed
  const [liveUrl, setLiveUrl] = useState('')
  const [liveViewOn, setLiveViewOn] = useState(false)
  // CCTV mode: cycle real evidence scenes as the "live feed"
  const [liveIdx, setLiveIdx] = useState(0)
  const recentItems = recent?.items ?? []
  const liveItem = recentItems[liveIdx % Math.max(1, recentItems.length)]
  const estFines = recentItems.reduce((s, c) => s + (c.fine_inr || 0), 0)

  // Unified feed: live stream events in upload mode, recent real challans in CCTV mode.
  const feed =
    mode === 'upload'
      ? stream.violations.map((v, i) => ({
          id: i + 1, type: v.violation, plate: v.plate ?? '—',
          confidence: v.confidence, challan_id: v.challan_id,
        }))
      : (recent?.items ?? []).map((c, i) => ({
          id: i + 1, type: c.violation, plate: c.plate ?? '—',
          confidence: c.confidence ?? 0, challan_id: c.challan_id,
        }))

  useEffect(() => {
    if (!streaming) return
    const t = setInterval(() => setFps(23 + Math.random() * 3), 2000)
    return () => clearInterval(t)
  }, [streaming])

  // rotate the CCTV feed through recent real evidence frames
  useEffect(() => {
    if (!streaming || mode !== 'cctv' || recentItems.length < 2) return
    const t = setInterval(() => setLiveIdx((i) => (i + 1) % recentItems.length), 3500)
    return () => clearInterval(t)
  }, [streaming, mode, recentItems.length])

  useEffect(() => {
    if (!alert) return
    const t = setTimeout(() => setAlert(false), 10000)
    return () => clearTimeout(t)
  }, [alert])

  async function analyse() {
    // stride fixed at 1 (every frame) — detects all violation types in a single pass
    if (mode === 'upload' && file) await stream.start(file, enhance, 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 rounded-xl border border-officer-blue/30 bg-officer-blue/10 p-3 text-xs text-officer-muted">
        <span className="text-base leading-none">ℹ️</span>
        <span>
          <span className="font-semibold text-white">Prototype:</span> live AI inference runs <span className="text-officer-primary-soft">locally on the demo machine (GPU)</span> — this build is not cloud-hosted for inference.
          Real-time detection will be enabled on the server in the final deployment. All other features (challans, analytics, maps, email) run on cloud.
        </span>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <Card padding className="overflow-hidden p-0">
            <div className="relative aspect-video bg-black">
              {stream.frame ? (
                <img src={stream.frame} alt="Live inference frame"
                     className="absolute inset-0 h-full w-full object-contain bg-black" />
              ) : liveViewOn && liveUrl ? (
                <img src={liveUrl} alt="Phone live feed"
                     className="absolute inset-0 h-full w-full object-contain bg-black"
                     onError={() => setLiveViewOn(false)} />
              ) : liveItem?.evidence_image ? (
                <img key={liveItem.challan_id} src={evidenceUrl(liveItem.evidence_image)} alt="Live feed"
                     className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 grid place-items-center bg-gradient-to-b from-officer-bg to-[#0c1424] text-officer-muted">
                  Connect a feed or upload a clip
                </div>
              )}
              <div className="absolute bottom-4 left-4 flex gap-4 rounded-lg bg-black/40 px-3 py-1.5 font-mono text-xs text-white backdrop-blur">
                <span>FPS: {fps.toFixed(1)}</span>
                <span>Violations: {recentItems.length}</span>
                <span>Est. Fines: {inr(estFines)}</span>
              </div>
              <div className="absolute top-4 right-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setStreaming(!streaming)}>
                  {streaming ? 'Stop Stream' : 'Start Stream'}
                </Button>
                <Button size="sm" variant="outline">
                  <Video className="h-4 w-4" /> Record
                </Button>
              </div>
              {streaming && (
                <span className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-red-500/20 px-3 py-1 text-xs text-red-400">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /> LIVE
                </span>
              )}
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Violation Feed</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Load More</Button>
                <Button size="sm" variant="ghost"><Download className="h-4 w-4" /> Export CSV</Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-officer-border text-left text-officer-muted">
                    <th className="pb-3 font-mono">ID</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3 font-mono">Plate</th>
                    <th className="pb-3 font-mono">Conf</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody>
                  {feed.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-officer-muted">
                      {mode === 'upload' ? 'Upload a clip and press Analyse to stream detections' : 'No recent violations'}
                    </td></tr>
                  ) : feed.map((v) => (
                    <tr
                      key={v.challan_id || v.id}
                      className="border-b border-officer-border/50 hover:bg-white/5 cursor-pointer"
                      onClick={() => v.challan_id && navigate(`/officer/challans/${v.challan_id}`)}
                    >
                      <td className="py-3 font-mono text-amber-300">{v.challan_id || v.id}</td>
                      <td className="py-3"><ViolationBadge type={v.type} /></td>
                      <td className="py-3 font-mono">{v.plate}</td>
                      <td className="py-3 font-mono">{v.confidence.toFixed(2)}</td>
                      <td className="py-3 text-officer-primary">→</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <Card className="h-fit space-y-6">
          <div>
            <p className="mb-3 text-sm font-medium text-officer-muted">Source Mode</p>
            <div className="flex gap-2">
              {(['cctv', 'upload'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    'flex-1 rounded-xl border py-3 text-sm font-medium transition-all',
                    mode === m
                      ? 'border-officer-primary bg-amber-500/15 text-amber-200'
                      : 'border-officer-border text-officer-muted hover:border-amber-500/30'
                  )}
                >
                  {m === 'cctv' ? '📹 CCTV Mode' : '📤 Field Upload'}
                </button>
              ))}
            </div>
          </div>

          {mode === 'upload' && (
            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-officer-border p-8 text-center hover:border-amber-500/40">
              <Upload className="h-8 w-8 text-officer-muted" />
              <span className="text-sm text-officer-muted">Drag video or image here</span>
              <input
                type="file"
                accept=".mp4,.mov,.avi,.jpg,.png"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file && (
                <p className="font-mono text-xs text-amber-300">
                  {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              )}
            </label>
          )}

          {mode === 'cctv' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-officer-muted">📱 Phone / CCTV stream URL</label>
              <input
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                placeholder="http://192.168.1.5:8080/video"
                className="w-full rounded-xl border border-officer-border bg-officer-bg px-3 py-2.5 font-mono text-xs text-white outline-none focus:border-officer-primary"
              />
              <p className="text-[11px] text-officer-faint">
                Install the <span className="text-officer-primary-soft">IP Webcam</span> app on your phone (same Wi-Fi),
                start the server, and paste its <span className="font-mono">/video</span> URL.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1"
                  onClick={() => setLiveViewOn((v) => !v)} disabled={!liveUrl}>
                  {liveViewOn ? 'Hide Live View' : 'Live View'}
                </Button>
                {!stream.running ? (
                  <Button size="sm" className="flex-1" disabled={!liveUrl}
                    onClick={() => { setLiveViewOn(false); stream.startUrl(liveUrl, enhance) }}>
                    Run AI Detection
                  </Button>
                ) : (
                  <Button size="sm" variant="danger" className="flex-1" onClick={() => stream.stop()}>
                    Stop Detection
                  </Button>
                )}
              </div>
            </div>
          )}

          <Switch checked={enhance} onChange={setEnhance} label="🎚 Enhance (low-light)" />
          <p className="rounded-xl border border-officer-border bg-officer-bg/40 p-3 text-xs text-officer-muted">
            Detection runs on <span className="text-officer-primary-soft">every frame</span> and flags all
            violation types (helmet, signal, speed, wrong-side, parking…) in a single pass.
          </p>

          {stream.running && (
            <div>
              <div className="mb-2 flex justify-between font-mono text-xs text-officer-muted">
                <span>Processing… {stream.violations.length} violation(s) found</span>
                <span>{stream.progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-officer-border">
                <motion.div
                  className="h-full bg-officer-primary"
                  animate={{ width: `${stream.progress}%` }}
                />
              </div>
            </div>
          )}

          {stream.error && (
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              ⚠️ {stream.error}
            </p>
          )}
          {stream.done && !stream.running && !stream.error && (
            <p className="rounded-xl border border-officer-mint/30 bg-officer-mint/10 p-3 text-xs text-officer-mint">
              ✓ Analysis complete — {stream.violations.length} violation(s) detected. Emails dispatched for issued challans.
            </p>
          )}

          {mode === 'upload' && (
            <Button
              size="lg"
              className="w-full"
              disabled={!file}
              loading={stream.running}
              onClick={analyse}
            >
              Analyse
            </Button>
          )}
        </Card>
      </div>

      <AnimatePresence>
        {(alert || stream.emergency) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 z-50 flex w-[min(92vw,720px)] -translate-x-1/2 items-center gap-4 rounded-xl border border-red-500/30 border-l-4 border-l-red-500 bg-officer-surface px-5 py-4 shadow-2xl"
          >
            <AlertTriangle className="h-5 w-5 text-red-400 animate-pulse shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-red-300">
                {(stream.emergency?.vehicle ?? 'AMBULANCE').toUpperCase()} DETECTED
              </p>
              <p className="text-sm text-officer-muted">
                {stream.emergency
                  ? `${stream.emergency.camera} · ${stream.emergency.location} · Alert sent to ${stream.emergency.checkpost}`
                  : 'CAM-05 · MG Road Junction · Alert sent to Checkpost 7'}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => { setAlert(false); stream.setEmergency(null) }}>Dismiss</Button>
            <Link to="/officer/emergencies">
              <Button size="sm" variant="danger">View</Button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
