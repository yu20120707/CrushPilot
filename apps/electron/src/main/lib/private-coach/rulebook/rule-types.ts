import type {
  ParsedConversation,
  PrivateCoachRiskLevel,
  PrivateCoachScene,
  PrivateCoachWorkflowInput,
} from '@proma/shared'

export interface RuleManifest {
  schemaVersion: number
  generatedAt?: string
  phase?: string
  runtimeUse?: boolean
  rules: RuleManifestRule[]
}

export interface RuleManifestRule {
  id: string
  source: string
  sourceRepo: string
  sourceCommit: string
  license: string
  relativePath: string
  copiedAt: string
  modified: boolean
  riskLevel: PrivateCoachRiskLevel | 'unknown'
  tags: string[]
  stages: string[]
}

export type LoadedRuleStatus = 'loaded' | 'skipped'

export interface LoadedRule {
  manifest: RuleManifestRule
  absolutePath: string
  content: string
  contentChars: number
  loadStatus: LoadedRuleStatus
  loadError?: string
  loadedFiles: string[]
}

export interface RulebookLoadResult {
  rootDir: string
  manifestPath: string
  rules: LoadedRule[]
  skippedRuleIds: string[]
  warnings: string[]
}

export interface RulebookRetrieverInput {
  input: PrivateCoachWorkflowInput
  conversation: ParsedConversation
  stage?: string
  scene?: PrivateCoachScene
  maxChars?: number
  maxRules?: number
}

export interface RulebookRetrievalResult {
  selectedRules: LoadedRule[]
  usedRuleIds: string[]
  skippedRuleIds: string[]
  warnings: string[]
  totalContentChars: number
}

export interface RulebookContext extends RulebookRetrievalResult {
  load: RulebookLoadResult
}
