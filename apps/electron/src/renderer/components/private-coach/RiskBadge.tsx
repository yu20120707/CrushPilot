import type { PrivateCoachRiskLevel } from '@proma/shared'
import { cn } from '@/lib/utils'

const riskLabels: Record<PrivateCoachRiskLevel, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
  block: '暂停回复',
}

const riskClasses: Record<PrivateCoachRiskLevel, string> = {
  low: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  medium: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  high: 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300',
  block: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
}

export function RiskBadge({ level }: { level: PrivateCoachRiskLevel }): React.ReactElement {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', riskClasses[level])}>
      {riskLabels[level]}
    </span>
  )
}
