import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BentoCard, BentoGrid } from '@/components/ui/BentoGrid'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useSummary, useHourly, useTrend } from '@/lib/hooks'
import { VIOLATION_LABEL, inr, downloadCSV } from '@/lib/utils'

export default function Analytics() {
  const [range, setRange] = useState('7')
  const days = Number(range)
  const { data: summary } = useSummary(days)
  const { data: hourly } = useHourly(days)
  const { data: finesTrend } = useTrend(days)

  const kpis = [
    { label: 'Total Challans', value: (summary?.total ?? 0).toLocaleString(), change: '+12%' },
    { label: 'Fines Collected', value: inr(summary?.fines_collected ?? 0), change: '+8%' },
    { label: 'Repeat Offenders', value: String(summary?.repeat_offenders ?? 0), change: '-3%' },
    { label: 'Avg Fine / Case', value: inr(summary?.avg_fine ?? 0), change: '+5%' },
  ]
  const violationsByType = (summary?.by_type ?? []).map((v) => ({
    type: VIOLATION_LABEL[v.type] ?? v.type, count: v.count,
  }))
  const hourlyData = hourly ?? []
  const cameraPerf = summary?.by_camera ?? []
  const maxCam = Math.max(1, ...cameraPerf.map((c) => c.count))

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          options={[
            { value: '7', label: 'Last 7 days' },
            { value: '30', label: 'Last 30 days' },
            { value: '90', label: 'Last 90 days' },
          ]}
        />
        <div className="flex gap-2">
          <Link to="/officer/chat"><Button>Ask DrishtiBot</Button></Link>
          <Button
            variant="outline"
            onClick={() => {
              const rows = [
                ['Metric', 'Value'],
                ...kpis.map((k) => [k.label, k.value] as [string, string]),
                ['', ''],
                ['Violation Type', 'Count'],
                ...violationsByType.map((v) => [v.type, v.count] as [string, number]),
                ['', ''],
                ['Camera', 'Violations'],
                ...cameraPerf.map((c) => [c.camera, c.count] as [string, number]),
              ]
              downloadCSV(`drishti-analytics-${new Date().toISOString().slice(0, 10)}`, rows)
            }}
          >
            Export Report
          </Button>
        </div>
      </div>

      <BentoGrid cols={4}>
        {kpis.map((k) => (
          <BentoCard key={k.label}>
            <p className="text-3xl font-bold font-mono text-white">{k.value}</p>
            <p className="mt-1 text-sm text-officer-muted">{k.label}</p>
            <p className="mt-2 text-xs text-officer-mint">{k.change}</p>
          </BentoCard>
        ))}
      </BentoGrid>

      <BentoGrid cols={2}>
        <BentoCard scrollable span={1}>
          <h3 className="mb-4 font-semibold">Violations by Type</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={violationsByType} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1c2740" />
              <XAxis type="number" stroke="#9ca3af" fontSize={11} />
              <YAxis dataKey="type" type="category" width={90} stroke="#9ca3af" fontSize={11} />
              <Tooltip contentStyle={{ background: '#0f1932', border: '1px solid #1c2740' }} />
              <Bar dataKey="count" fill="#ffa733" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </BentoCard>

        <BentoCard scrollable>
          <h3 className="mb-4 font-semibold">Hourly Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c2740" />
              <XAxis dataKey="hour" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} />
              <Tooltip contentStyle={{ background: '#0f1932', border: '1px solid #1c2740' }} />
              <Area type="monotone" dataKey="count" stroke="#ffa733" fill="#ffa733" fillOpacity={0.25} />
            </AreaChart>
          </ResponsiveContainer>
        </BentoCard>

        <BentoCard scrollable>
          <h3 className="mb-4 font-semibold">Camera Performance</h3>
          <div className="space-y-4">
            {cameraPerf.map((cam) => (
              <div key={cam.camera}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-mono">{cam.camera}</span>
                  <span className="font-mono text-amber-300">{cam.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-officer-border">
                  <div
                    className="h-full rounded-full bg-officer-primary"
                    style={{ width: `${(cam.count / maxCam) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </BentoCard>

        <BentoCard scrollable>
          <h3 className="mb-4 font-semibold">Fine Collection Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={finesTrend ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c2740" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={(v) => `₹${v / 100000}L`} />
              <Tooltip contentStyle={{ background: '#0f1932', border: '1px solid #1c2740' }} formatter={(v) => inr(Number(v))} />
              <Line type="monotone" dataKey="amount" stroke="#34d399" strokeWidth={2} dot={{ fill: '#ffa733' }} />
            </LineChart>
          </ResponsiveContainer>
        </BentoCard>
      </BentoGrid>
    </div>
  )
}
