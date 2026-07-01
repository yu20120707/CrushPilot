import * as React from 'react'
import { Check, Copy } from 'lucide-react'
import type { PrivateCoachReplyCandidate } from '@proma/shared'
import { Button } from '@/components/ui/button'

export function ReplyCard({ candidate }: { candidate: PrivateCoachReplyCandidate }): React.ReactElement {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(candidate.copyText)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  return (
    <article className="rounded-lg border border-border/60 bg-background/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {candidate.tone}
            </span>
            {candidate.strength && (
              <span className="text-xs text-muted-foreground">推进强度：{candidate.strength}</span>
            )}
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">{candidate.content}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? '已复制' : '复制'}
        </Button>
      </div>
      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
        <p>理由：{candidate.why}</p>
        {candidate.bestFor && <p>适用：{candidate.bestFor}</p>}
        {candidate.riskNote && <p>风险：{candidate.riskNote}</p>}
      </div>
    </article>
  )
}
