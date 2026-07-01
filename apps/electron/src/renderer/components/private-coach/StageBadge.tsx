export function StageBadge({ stage }: { stage: string }): React.ReactElement {
  return (
    <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
      {stage}
    </span>
  )
}
