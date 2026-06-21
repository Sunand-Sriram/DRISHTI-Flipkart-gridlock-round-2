import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { api } from '@/lib/api'
import { useAuditLog } from '@/lib/hooks'
import type { Camera, Checkpost } from '@/lib/types'

export default function CameraManagement() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [checkposts, setCheckposts] = useState<Checkpost[]>([])
  const { data: auditLog } = useAuditLog(10)
  const [modal, setModal] = useState<'camera' | 'checkpost' | null>(null)
  const [editCam, setEditCam] = useState<Partial<Camera>>({})
  const [editCp, setEditCp] = useState<Partial<Checkpost>>({})

  const [alerts, setAlerts] = useState<Record<string, import('@/lib/api').Notification[]>>({})
  const [openCp, setOpenCp] = useState<string | null>(null)

  useEffect(() => {
    api.cameras().then(setCameras).catch(() => setCameras([]))
    api.checkposts().then((cps) => {
      setCheckposts(cps)
      const load = () => cps.forEach((cp) =>
        api.checkpostAlerts(cp.name).then((r) => setAlerts((a) => ({ ...a, [cp.name]: r.items }))).catch(() => {}))
      load()
      const t = setInterval(load, 8000)
      return () => clearInterval(t)
    }).catch(() => setCheckposts([]))
  }, [])

  function saveCamera() {
    if (editCam.id) {
      setCameras((c) => c.map((x) => (x.id === editCam.id ? { ...x, ...editCam } as Camera : x)))
    } else {
      setCameras((c) => [
        ...c,
        {
          id: `cam-${Date.now()}`,
          name: editCam.name || 'CAM-NEW',
          location: editCam.location || '',
          lat: 12.97,
          lng: 77.59,
          status: 'live',
          count: 0,
        },
      ])
    }
    setModal(null)
    setEditCam({})
  }

  function deleteCamera(id: string) {
    if (confirm('Deactivate this camera?')) setCameras((c) => c.filter((x) => x.id !== id))
  }

  function saveCheckpost() {
    if (editCp.id) {
      setCheckposts((c) => c.map((x) => (x.id === editCp.id ? { ...x, ...editCp } as Checkpost : x)))
    } else {
      setCheckposts((c) => [
        ...c,
        {
          id: `cp-${Date.now()}`,
          name: editCp.name || 'Checkpost New',
          location: editCp.location || '',
          lat: 12.97,
          lng: 77.59,
          officer: editCp.officer || 'Vacant',
        },
      ])
    }
    setModal(null)
    setEditCp({})
  }

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">📹 Cameras</h2>
          <Button size="sm" onClick={() => { setEditCam({}); setModal('camera') }}>
            <Plus className="h-4 w-4" /> Add Camera
          </Button>
        </div>
        <Card padding={false}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-officer-border text-left text-officer-muted">
                <th className="p-4">Name</th>
                <th className="p-4">Location</th>
                <th className="p-4">Status</th>
                <th className="p-4 font-mono">Count</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cameras.map((cam) => (
                <tr key={cam.id} className="border-b border-officer-border/50">
                  <td className="p-4 font-mono">{cam.name}</td>
                  <td className="p-4">{cam.location}</td>
                  <td className="p-4">
                    <span className={cam.status === 'live' ? 'text-emerald-400' : 'text-slate-400'}>
                      {cam.status === 'live' ? 'Live ✓' : 'Offline'}
                    </span>
                  </td>
                  <td className="p-4 font-mono">{cam.count}</td>
                  <td className="p-4 flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => { setEditCam(cam); setModal('camera') }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteCamera(cam.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">🚔 Checkposts</h2>
          <Button size="sm" onClick={() => { setEditCp({}); setModal('checkpost') }}>
            <Plus className="h-4 w-4" /> Add Checkpost
          </Button>
        </div>
        <Card padding={false}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-officer-border text-left text-officer-muted">
                <th className="p-4">Name</th>
                <th className="p-4">Location</th>
                <th className="p-4">Officer</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {checkposts.map((cp) => (
                <tr key={cp.id} className="border-b border-officer-border/50">
                  <td className="p-4">{cp.name}</td>
                  <td className="p-4">{cp.location}</td>
                  <td className="p-4">{cp.officer}</td>
                  <td className="p-4 flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => { setEditCp(cp); setModal('checkpost') }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">🚨 Checkpost Alerts</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {checkposts.map((cp) => {
            const list = alerts[cp.name] || []
            const open = openCp === cp.name
            return (
              <Card key={cp.id} padding={false} className="overflow-hidden">
                <button
                  onClick={() => setOpenCp(open ? null : cp.name)}
                  className="flex w-full items-center justify-between p-4 text-left hover:bg-white/5"
                >
                  <div>
                    <p className="text-sm font-semibold">{cp.name}</p>
                    <p className="text-xs text-officer-muted">{cp.officer}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 font-mono text-xs ${list.length ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-officer-border text-officer-muted'}`}>
                    {list.length} alert{list.length === 1 ? '' : 's'}
                  </span>
                </button>
                {open && (
                  <div className="max-h-60 space-y-2 overflow-y-auto border-t border-officer-border p-3">
                    {list.length === 0 ? (
                      <p className="py-4 text-center text-xs text-officer-muted">No alerts dispatched</p>
                    ) : list.map((a) => (
                      <div key={a.id} className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                        <p className="text-sm font-medium text-red-300">{a.title}</p>
                        <p className="text-xs text-officer-muted">{a.body}</p>
                        <p className="mt-1 font-mono text-[10px] text-officer-faint">{new Date(a.created_at * 1000).toLocaleTimeString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">📋 Audit Log</h2>
        <Card padding={false}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-officer-border text-left text-officer-muted">
                <th className="p-4">Time</th>
                <th className="p-4">Action</th>
                <th className="p-4">User</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {(auditLog ?? []).map((a) => (
                <tr key={a.id} className="border-b border-officer-border/50">
                  <td className="p-4 font-mono">{new Date(a.created_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="p-4">{a.action}</td>
                  <td className="p-4">{a.actor}</td>
                  <td className="p-4">{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      <Modal
        open={modal === 'camera'}
        onClose={() => setModal(null)}
        title={editCam.id ? 'Edit Camera' : 'Add Camera'}
      >
        <div className="space-y-4">
          <Input label="Name" value={editCam.name || ''} onChange={(e) => setEditCam({ ...editCam, name: e.target.value })} mono />
          <Input label="Location" value={editCam.location || ''} onChange={(e) => setEditCam({ ...editCam, location: e.target.value })} />
          <div className="flex gap-2">
            <Button onClick={saveCamera}>Save</Button>
            <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'checkpost'} onClose={() => setModal(null)} title="Checkpost">
        <div className="space-y-4">
          <Input label="Name" value={editCp.name || ''} onChange={(e) => setEditCp({ ...editCp, name: e.target.value })} />
          <Input label="Location" value={editCp.location || ''} onChange={(e) => setEditCp({ ...editCp, location: e.target.value })} />
          <Input label="Officer" value={editCp.officer || ''} onChange={(e) => setEditCp({ ...editCp, officer: e.target.value })} />
          <Button onClick={saveCheckpost}>Save</Button>
        </div>
      </Modal>
    </div>
  )
}
