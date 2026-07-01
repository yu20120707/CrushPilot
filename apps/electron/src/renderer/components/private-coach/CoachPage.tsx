import * as React from 'react'
import { HeartHandshake } from 'lucide-react'
import { useAtom } from 'jotai'
import type { PrivateCoachWorkflowInput } from '@proma/shared'
import {
  privateCoachErrorAtom,
  privateCoachFormAtom,
  privateCoachLoadingAtom,
  privateCoachResultAtom,
} from '@/atoms/private-coach-atoms'
import { CoachInputPanel } from './CoachInputPanel'
import { CoachResultPanel } from './CoachResultPanel'

export function CoachPage(): React.ReactElement {
  const [form, setForm] = useAtom(privateCoachFormAtom)
  const [result, setResult] = useAtom(privateCoachResultAtom)
  const [loading, setLoading] = useAtom(privateCoachLoadingAtom)
  const [error, setError] = useAtom(privateCoachErrorAtom)
  const [validationMessage, setValidationMessage] = React.useState<string | null>(null)
  const [exporting, setExporting] = React.useState(false)
  const [exportMessage, setExportMessage] = React.useState<string | null>(null)

  const handleChange = React.useCallback((patch: Partial<typeof form>): void => {
    setForm((prev) => ({ ...prev, ...patch }))
    if ('conversationText' in patch && patch.conversationText?.trim()) {
      setValidationMessage(null)
    }
  }, [setForm])

  const handleSubmit = React.useCallback(async (): Promise<void> => {
    if (!form.conversationText.trim()) {
      setValidationMessage('请先粘贴一段聊天记录。')
      return
    }

    setLoading(true)
    setError(null)
    setValidationMessage(null)
    setExportMessage(null)

    const input: PrivateCoachWorkflowInput = {
      source: 'desktop',
      platform: form.platform,
      sceneHint: form.scene,
      tonePreference: form.tone,
      userGoal: form.userGoal.trim() || undefined,
      conversationText: form.conversationText,
      analysisDepth: form.analysisDepth,
    }

    try {
      const nextResult = await window.electronAPI.privateCoach.analyzeConversation(input)
      setResult(nextResult)
    } catch {
      setError('当前 mock 分析不可用，请稍后重试。')
    } finally {
      setLoading(false)
    }
  }, [form, setError, setLoading, setResult])

  const handleExportMarkdown = React.useCallback(async (): Promise<void> => {
    if (!result) return

    setExporting(true)
    setExportMessage(null)

    try {
      const exported = await window.electronAPI.privateCoach.exportMarkdown(result.analysisId)
      setExportMessage(exported.filePath ? `已导出：${exported.filePath}` : exported.message ?? '已生成 Markdown。')
    } catch {
      setExportMessage('导出失败，请稍后重试。')
    } finally {
      setExporting(false)
    }
  }, [result])

  return (
    <div className="flex h-full min-h-0 flex-col bg-content-area titlebar-no-drag">
      <header className="flex flex-shrink-0 items-center justify-between border-b border-border/60 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HeartHandshake className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">CrushPilot</h1>
            <p className="text-sm text-muted-foreground">Private Coach mock analysis</p>
          </div>
        </div>
        <span className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground">
          Phase 1B
        </span>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto p-6">
        <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
          <CoachInputPanel
            form={form}
            loading={loading}
            validationMessage={validationMessage}
            onChange={handleChange}
            onSubmit={handleSubmit}
          />
          <CoachResultPanel
            result={result}
            loading={loading}
            error={error}
            exporting={exporting}
            exportMessage={exportMessage}
            onExportMarkdown={result ? handleExportMarkdown : undefined}
          />
        </div>
      </main>
    </div>
  )
}
