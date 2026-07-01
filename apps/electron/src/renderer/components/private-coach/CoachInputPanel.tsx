import type {
  PrivateCoachDepth,
  PrivateCoachPlatform,
  PrivateCoachScene,
  PrivateCoachTone,
} from '@proma/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { PrivateCoachFormState } from '@/atoms/private-coach-atoms'

const platformOptions: Array<{ value: PrivateCoachPlatform; label: string }> = [
  { value: 'generic', label: '通用聊天' },
  { value: 'wechat', label: '微信' },
  { value: 'qq', label: 'QQ' },
  { value: 'xiaohongshu', label: '小红书' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'soul', label: 'Soul' },
  { value: 'tantan', label: '探探' },
  { value: 'bumble', label: 'Bumble' },
  { value: 'tinder', label: 'Tinder' },
]

const sceneOptions: Array<{ value: PrivateCoachScene; label: string }> = [
  { value: '未指定', label: '未指定' },
  { value: '初次破冰', label: '初次破冰' },
  { value: '冷场挽回', label: '冷场挽回' },
  { value: '暧昧推进', label: '暧昧推进' },
  { value: '邀约推进', label: '邀约推进' },
  { value: '争执修复', label: '争执修复' },
  { value: '相亲开场', label: '相亲开场' },
  { value: '长期关系', label: '长期关系' },
  { value: '复联', label: '复联' },
  { value: '体面收束', label: '体面收束' },
]

const toneOptions: Array<{ value: PrivateCoachTone; label: string }> = [
  { value: '稳妥', label: '稳妥' },
  { value: '轻松', label: '轻松' },
  { value: '真诚', label: '真诚' },
  { value: '克制', label: '克制' },
  { value: '幽默', label: '幽默' },
  { value: '直接', label: '直接' },
  { value: '温柔', label: '温柔' },
  { value: '收束', label: '收束' },
]

const depthOptions: Array<{ value: PrivateCoachDepth; label: string }> = [
  { value: 'fast', label: '快速' },
  { value: 'standard', label: '标准' },
  { value: 'deep', label: '深入' },
]

interface CoachInputPanelProps {
  form: PrivateCoachFormState
  loading: boolean
  validationMessage: string | null
  onChange: (patch: Partial<PrivateCoachFormState>) => void
  onSubmit: () => void
}

export function CoachInputPanel({
  form,
  loading,
  validationMessage,
  onChange,
  onSubmit,
}: CoachInputPanelProps): React.ReactElement {
  const canSubmit = form.conversationText.trim().length > 0 && !loading

  return (
    <section className="rounded-xl border border-border/60 bg-background/45 p-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">聊天分析</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          当前阶段只调用本地 mock workflow，不保存聊天正文。
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="平台">
          <OptionSelect
            value={form.platform}
            options={platformOptions}
            onValueChange={(platform) => onChange({ platform })}
          />
        </Field>
        <Field label="场景">
          <OptionSelect
            value={form.scene}
            options={sceneOptions}
            onValueChange={(scene) => onChange({ scene })}
          />
        </Field>
        <Field label="语气">
          <OptionSelect
            value={form.tone}
            options={toneOptions}
            onValueChange={(tone) => onChange({ tone })}
          />
        </Field>
        <Field label="分析深度">
          <OptionSelect
            value={form.analysisDepth}
            options={depthOptions}
            onValueChange={(analysisDepth) => onChange({ analysisDepth })}
          />
        </Field>
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="private-coach-goal">我的目标</Label>
        <Input
          id="private-coach-goal"
          value={form.userGoal}
          onChange={(event) => onChange({ userGoal: event.target.value })}
          placeholder="例如：想自然邀约、不想显得太急"
        />
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="private-coach-conversation">聊天记录</Label>
        <Textarea
          id="private-coach-conversation"
          value={form.conversationText}
          onChange={(event) => onChange({ conversationText: event.target.value })}
          placeholder={'我：周末有空吗？\n她：还不确定，我看看安排'}
          className="min-h-[260px] resize-none leading-6"
        />
        {validationMessage && (
          <p className="text-sm text-amber-600 dark:text-amber-300">{validationMessage}</p>
        )}
      </div>

      <Button type="button" className="mt-5 w-full" disabled={!canSubmit} onClick={onSubmit}>
        {loading ? '分析中...' : 'Analyze'}
      </Button>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function OptionSelect<T extends string>({
  value,
  options,
  onValueChange,
}: {
  value: T
  options: Array<{ value: T; label: string }>
  onValueChange: (value: T) => void
}): React.ReactElement {
  return (
    <Select value={value} onValueChange={(next) => onValueChange(next as T)}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
