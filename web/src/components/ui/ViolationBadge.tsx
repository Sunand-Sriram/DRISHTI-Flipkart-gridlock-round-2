import { Badge } from './Badge'
import { STATUS_COLOR, VIOLATION_COLOR, VIOLATION_LABEL } from '@/lib/utils'

export function ViolationBadge({ type }: { type: string }) {
  const label = VIOLATION_LABEL[type] || type
  return <Badge className={VIOLATION_COLOR[type] || 'bg-slate-500/15 text-slate-400 border-slate-500/30'}>{label}</Badge>
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={STATUS_COLOR[status] || 'bg-slate-500/15 text-slate-400 border-slate-500/30'}>
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}
