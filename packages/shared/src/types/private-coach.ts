export type PrivateCoachSource =
  | 'desktop'
  | 'wechat_bot'
  | 'wechat_import'
  | 'file_import'
  | 'clipboard'

export type PrivateCoachPlatform =
  | 'wechat'
  | 'qq'
  | 'soul'
  | 'tantan'
  | 'bumble'
  | 'tinder'
  | 'xiaohongshu'
  | 'instagram'
  | 'generic'

export type PrivateCoachScene =
  | '未指定'
  | '初次破冰'
  | '冷场挽回'
  | '暧昧推进'
  | '邀约推进'
  | '争执修复'
  | '相亲开场'
  | '长期关系'
  | '聊天复盘'
  | '复联'
  | '体面收束'

export type PrivateCoachTone =
  | '稳妥'
  | '轻松'
  | '真诚'
  | '克制'
  | '幽默'
  | '直接'
  | '温柔'
  | '收束'

export type PrivateCoachRiskLevel = 'low' | 'medium' | 'high' | 'block'

export type PrivateCoachDepth = 'fast' | 'standard' | 'deep'

export type ParsedMessageSpeaker = 'me' | 'other' | 'system' | 'unknown'

export interface ParsedMessage {
  id: string
  speaker: ParsedMessageSpeaker
  speakerName?: string
  content: string
  contentType: 'text'
  timestamp?: string
  timestampText?: string
  raw?: string
}

export interface ParsedConversation {
  id?: string
  platform: PrivateCoachPlatform
  messages: ParsedMessage[]
  messageCount: number
  speakers: string[]
  textPreview: string
  startTime?: string
  endTime?: string
  sourceMeta?: Record<string, unknown>
}

export interface PrivateCoachWorkflowInput {
  source: PrivateCoachSource
  platform: PrivateCoachPlatform
  sceneHint?: PrivateCoachScene
  profileId?: string
  userGoal?: string
  tonePreference?: PrivateCoachTone
  pushStrength?: 'low' | 'medium' | 'high'
  conversationText?: string
  messages?: ParsedMessage[]
  importedConversationId?: string
  providerId?: string
  analysisDepth: PrivateCoachDepth
  options?: Record<string, unknown>
}

export interface PrivateCoachSignal {
  id: string
  label: string
  description: string
  confidence: number
}

export interface PrivateCoachReplyCandidate {
  id: string
  tone: PrivateCoachTone
  content: string
  copyText: string
  why: string
  bestFor?: string
  riskNote?: string
  strength?: 'low' | 'medium' | 'high'
}

export interface PrivateCoachResult {
  analysisId: string
  createdAt: string
  scene: PrivateCoachScene
  relationshipStage: string
  riskLevel: PrivateCoachRiskLevel
  otherInterestLevel: number
  userPressureLevel: number
  relationshipTemperature: number
  shouldReplyNow: boolean
  situationSummary: string
  signals: PrivateCoachSignal[]
  warnings: string[]
  dontDo: string[]
  replyCandidates: PrivateCoachReplyCandidate[]
  nextStep: string
  followUpOptions: string[]
  confidence: number
}

export interface PrivateCoachAnalysisIndexItem {
  analysisId: string
  createdAt: string
  source: PrivateCoachSource
  platform: PrivateCoachPlatform
  scene: PrivateCoachScene
  riskLevel: PrivateCoachRiskLevel
  title: string
  messageCount: number
}

export interface PrivateCoachAnalysisRecord {
  meta: PrivateCoachAnalysisIndexItem
  inputSummary: {
    source: PrivateCoachSource
    platform: PrivateCoachPlatform
    sceneHint?: PrivateCoachScene
    analysisDepth: PrivateCoachDepth
    messageCount: number
    savedRawConversation: false
  }
  parsedConversation: ParsedConversation
  result: PrivateCoachResult
}

export interface PrivateCoachListAnalysesResult {
  items: PrivateCoachAnalysisIndexItem[]
  storageEnabled: boolean
  message?: string
}

export interface PrivateCoachGetAnalysisResult {
  record: PrivateCoachAnalysisRecord | null
  storageEnabled: boolean
  message?: string
}

export interface PrivateCoachDeleteAnalysisResult {
  deleted: boolean
  storageEnabled: boolean
  message: string
}

export interface PrivateCoachExportMarkdownResult {
  markdown: string
  storageEnabled: boolean
  message?: string
}
