import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Radio, Zap, AlertTriangle, X, Play, Square } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Switch } from '@/components/ui/Switch'
import { MagneticButton } from '@/components/motion/MagneticButton'
import { ViolationBadge } from '@/components/ui/ViolationBadge'
import { useInferenceStream } from '@/lib/ws'
import { cn, inr } from '@/lib/utils'

export default function LiveMonitor() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'cctv' | 'upload'>('cctv')
  const [enhance, setEnhance] = useState(false)

  const [streamUrl, setStreamUrl] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const { frame, violations, emergency, progress, running, error, done, start, startUrl, stop, setEmergency } = useInferenceStream()

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) start(file, enhance, 1)
  }

  const handleStream = () => { if (streamUrl) startUrl(streamUrl, enhance) }

  return (
    <div className="space-y-6">
      {/* Emergency banner */}
      <AnimatePresence>
        {emergency && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="glass rounded-xl border border-crimson/30 p-4 flex items-center gap-4 animate-border-glow">
              <AlertTriangle className="h-6 w-6 text-crimson animate-dot-pulse shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-crimson">
                  🚨 Emergency Vehicle: {emergency.vehicle.toUpperCase()} detected at {emergency.camera}
                </p>
                <p className="text-xs text-text-muted mt-0.5">Checkpost {emergency.checkpost} alerted · Green corridor initiated</p>
              </div>
              <MagneticButton variant="danger" size="sm" onClick={() => setEmergency(null)}>
                <X className="h-4 w-4" /> Dismiss
              </MagneticButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left: Video feed ── */}
        <div className="lg:col-span-3 space-y-4">
          {/* Mode tabs */}
          <div className="flex gap-2">
            {[
              { key: 'cctv' as const, icon: Radio, label: 'Live CCTV' },
              { key: 'upload' as const, icon: Upload, label: 'Upload File' },
            ].map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium',
                  mode === m.key ? 'glass bg-amethyst/10 text-amethyst-light' : 'text-text-muted hover:text-text-primary hover:bg-white/[0.03]',
                )}
              >
                <m.icon className="h-4 w-4" /> {m.label}
              </button>
            ))}
          </div>

          {/* Feed area */}
          <Card className="relative overflow-hidden aspect-video flex items-center justify-center bg-void/50">
            {frame ? (
              <>
                <img src={frame} alt="Live feed" className="w-full h-full object-contain" />
                {/* HUD overlay */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <Badge variant="danger" dot>LIVE</Badge>
                  {progress > 0 && progress < 100 && (
                    <Badge variant="info">{progress}%</Badge>
                  )}
                </div>
                <div className="absolute top-3 right-3">
                  <Badge variant="default">{violations.length} violations</Badge>
                </div>
              </>
            ) : (
              <div className="text-center p-8">
                {mode === 'cctv' ? (
                  <div className="space-y-4">
                    <Radio className="h-12 w-12 text-text-faint mx-auto" />
                    <p className="text-text-muted">Enter IP Webcam URL or connect CCTV feed</p>
                    <div className="flex gap-2 max-w-md mx-auto">
                      <input
                        value={streamUrl}
                        onChange={(e) => setStreamUrl(e.target.value)}
                        placeholder="http://192.168.1.x:8080/video"
                        className="flex-1 h-10 rounded-xl px-4 text-sm bg-white/[0.03] border border-border-glass text-text-primary placeholder:text-text-faint outline-none focus:ring-2 focus:ring-amethyst/30"
                      />
                      <MagneticButton onClick={handleStream} loading={running} icon={<Play className="h-4 w-4" />}>
                        Connect
                      </MagneticButton>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 text-text-faint mx-auto" />
                    <p className="text-text-muted">Drop a video or image for AI analysis</p>
                    <input ref={fileRef} type="file" accept="video/*,image/*" onChange={handleFile} className="hidden" />
                    <MagneticButton onClick={() => fileRef.current?.click()} loading={running} icon={<Upload className="h-4 w-4" />}>
                      Select File
                    </MagneticButton>
                  </div>
                )}
              </div>
            )}
            {running && (
              <div className="absolute bottom-0 inset-x-0 h-1 bg-white/10">
                <motion.div className="h-full bg-amethyst" animate={{ width: `${progress}%` }} transition={{ type: 'spring', stiffness: 50 }} />
              </div>
            )}
          </Card>

          {/* Controls */}
          <div className="flex items-center gap-4 flex-wrap">
            <Switch checked={enhance} onChange={setEnhance} label="Low-light enhance" />

            {running && (
              <MagneticButton variant="danger" size="sm" onClick={stop} icon={<Square className="h-3 w-3" />}>
                Stop
              </MagneticButton>
            )}
            {done && <Badge variant="success">Analysis Complete ✓</Badge>}
          </div>
          {error && <p className="text-sm text-crimson bg-crimson/10 rounded-xl px-4 py-2">{error}</p>}
        </div>

        {/* ── Right: Violation feed ── */}
        <div className="lg:col-span-2">
          <Card className="h-full max-h-[calc(100vh-220px)] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-h3 text-text-primary">Violation Feed</h3>
              <Badge variant="warning" dot>{violations.length}</Badge>
            </div>

            {violations.length === 0 ? (
              <div className="text-center py-12 text-text-faint">
                <Zap className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Violations will appear here in real-time</p>
              </div>
            ) : (
              <div className="space-y-2">
                {violations.map((v, i) => (
                  <motion.div
                    key={v.challan_id + i}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                    className="glass rounded-xl p-3 cursor-pointer hover:bg-white/[0.04]"
                    onClick={() => navigate(`/officer/challans/${v.challan_id}`)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <ViolationBadge violation={v.violation} />
                      <span className="font-mono text-xs text-text-faint">{v.challan_id}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted font-mono">{v.plate || '—'}</span>
                      <span className="text-text-muted">{(v.confidence * 100).toFixed(0)}% · {inr(v.fine)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
