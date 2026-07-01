import { AlertTriangle, Loader2 } from 'lucide-react'
import type { PrivateCoachResult } from '@proma/shared'
import { ReplyCard } from './ReplyCard'
import { RiskBadge } from './RiskBadge'
import { SignalList } from './SignalList'
import { StageBadge } from './StageBadge'

interface CoachResultPanelProps {
  result: PrivateCoachResult | null
  loading: boolean
  error: string | null
}

export function CoachResultPanel({ result, loading, error }: CoachResultPanelProps): React.ReactElement {
  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-border/60 bg-background/35">
        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span>正在生成 mock 分析...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        <div className="flex items-center gap-2 font-medium">
          <AlertTriangle className="size-4" />
          分析失败
        </div>
        <p className="mt-2">{error}</p>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-dashed border-border/70 bg-background/25 p-8 text-center">
        <div>
          <h2 className="text-base font-semibold text-foreground">等待分析</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            粘贴一段聊天记录后点击 Analyze，这里会展示 Phase 1A mock workflow 返回的分析结果。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border/60 bg-background/45 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <StageBadge stage={result.relationshipStage} />
          <RiskBadge level={result.riskLevel} />
          <span className="rounded-full border border-border/60 px-2 py-0.5 text-xs text-muted-foreground">
            场景：{result.scene}
          </span>
          <span className="rounded-full border border-border/60 px-2 py-0.5 text-xs text-muted-foreground">
            置信度：{Math.round(result.confidence * 100)}%
          </span>
        </div>
        <p className="mt-4 text-sm leading-6 text-foreground">{result.situationSummary}</p>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <Metric label="对方兴趣" value={result.otherInterestLevel} />
        <Metric label="我的压力" value={result.userPressureLevel} />
        <Metric label="关系温度" value={result.relationshipTemperature} />
        <div className="rounded-lg border border-border/60 bg-background/40 p-4">
          <div className="text-xs text-muted-foreground">现在是否回复</div>
          <div className="mt-2 text-lg font-semibold text-foreground">
            {result.shouldReplyNow ? '可以回复' : '先等等'}
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <SignalList title="信号" items={result.signals} />
        <SignalList title="提醒" items={result.warnings} />
        <SignalList title="不要做" items={result.dontDo} />
        <SignalList title="后续选项" items={result.followUpOptions} />
      </div>

      <section className="rounded-xl border border-border/60 bg-background/35 p-5">
        <h3 className="text-sm font-semibold text-foreground">回复候选</h3>
        <div className="mt-4 grid gap-3">
          {result.replyCandidates.map((candidate) => (
            <ReplyCard key={candidate.id} candidate={candidate} />
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <h3 className="text-sm font-semibold text-foreground">下一步</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{result.nextStep}</p>
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }): React.ReactElement {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-4">
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">{value}/100</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-foreground/10">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  )
}
