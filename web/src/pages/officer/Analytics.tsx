import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Download, MessageSquare, Activity, DollarSign, Users, TrendingUp } from 'lucide-react'
import { KPICard } from '@/components/ui/KPICard'
import { Card } from '@/components/ui/Card'
import { MagneticButton } from '@/components/motion/MagneticButton'
import { BentoGrid } from '@/components/ui/BentoGrid'
import { useSummary, useHourly, useTrend } from '@/lib/hooks'
import { downloadCSV, VIOLATION_LABEL } from '@/lib/utils'

const PERIODS = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: 'All', days: 0 },
]

export default function Analytics() {
  const [days, setDays] = useState(7)
  const { data: summary } = useSummary(days)
  const { data: hourly } = useHourly(days)
  const { data: trend } = useTrend(days)

  const exportReport = () => {
    if (!summary) return
    downloadCSV('analytics_report', [
      ['Metric', 'Value'],
      ['Total Challans', summary.total],
      ['Fines Collected', summary.fines_collected],
      ['Repeat Offenders', summary.repeat_offenders],
      ['Avg Fine', summary.avg_fine],
      ...summary.by_type.map((t) => [`${VIOLATION_LABEL[t.type] || t.type}`, t.count]),
    ])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-h2 text-text-primary">Analytics</h2>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03]">
            {PERIODS.map((p) => (
              <button
                key={p.days}
                onClick={() => setDays(p.days)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${days === p.days ? 'bg-amethyst/15 text-amethyst-light' : 'text-text-muted hover:text-text-primary'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <MagneticButton variant="outline" size="sm" onClick={exportReport} icon={<Download className="h-4 w-4" />}>
            CSV
          </MagneticButton>
          <Link to="/officer/chat">
            <MagneticButton variant="ghost" size="sm" icon={<MessageSquare className="h-4 w-4" />}>
              DrishtiBot
            </MagneticButton>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <BentoGrid cols={4}>
        <KPICard label="Total Challans" value={summary?.total || 0} icon={<Activity className="h-5 w-5" />} />
        <KPICard label="Fines Collected" value={summary?.fines_collected || 0} prefix="₹" icon={<DollarSign className="h-5 w-5" />} />
        <KPICard label="Repeat Offenders" value={summary?.repeat_offenders || 0} icon={<Users className="h-5 w-5" />} />
        <KPICard label="Avg Fine" value={summary?.avg_fine || 0} prefix="₹" icon={<TrendingUp className="h-5 w-5" />} />
      </BentoGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Violations by type */}
        <Card>
          <h3 className="text-h3 text-text-primary mb-4">Violations by Type</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={summary?.by_type.map((t) => ({ name: VIOLATION_LABEL[t.type] || t.type, count: t.count })) || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#14B8A6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Hourly distribution */}
        <Card>
          <h3 className="text-h3 text-text-primary mb-4">Hourly Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={hourly || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} tickFormatter={(h) => `${h}:00`} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#22D3EE" fill="#22D3EE" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Trend line */}
        <Card className="lg:col-span-2">
          <h3 className="text-h3 text-text-primary mb-4">Daily Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="count" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="amount" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line yAxisId="count" type="monotone" dataKey="count" stroke="#14B8A6" strokeWidth={2} dot={false} />
              <Line yAxisId="amount" type="monotone" dataKey="amount" stroke="#34D399" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Camera performance */}
        <Card className="lg:col-span-2">
          <h3 className="text-h3 text-text-primary mb-4">Camera Performance</h3>
          <div className="space-y-3">
            {(summary?.by_camera || []).map((cam) => {
              const pct = summary ? (cam.count / summary.total) * 100 : 0
              return (
                <div key={cam.camera} className="flex items-center gap-4">
                  <span className="text-sm text-text-muted w-20 shrink-0">{cam.camera}</span>
                  <div className="flex-1 h-3 rounded-full bg-white/[0.05] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-amethyst to-cyan" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-mono text-text-secondary w-16 text-right">{cam.count}</span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
