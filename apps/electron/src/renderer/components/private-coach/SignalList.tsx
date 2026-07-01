import type { PrivateCoachSignal } from '@proma/shared'

interface SignalListProps {
  title: string
  items: Array<string | PrivateCoachSignal>
  emptyText?: string
}

export function SignalList({ title, items, emptyText = '暂无' }: SignalListProps): React.ReactElement {
  return (
    <section className="rounded-lg border border-border/60 bg-background/40 p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item, index) => {
            const isSignal = typeof item !== 'string'
            return (
              <li key={isSignal ? item.id : `${title}-${index}`} className="rounded-md bg-foreground/[0.035] px-3 py-2 text-sm">
                {isSignal ? (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-foreground">{item.label}</span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {Math.round(item.confidence * 100)}%
                      </span>
                    </div>
                    <p className="mt-1 text-muted-foreground">{item.description}</p>
                  </>
                ) : (
                  <span className="text-muted-foreground">{item}</span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
