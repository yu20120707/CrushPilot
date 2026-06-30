import { createHash } from 'node:crypto'
import type {
  ParsedConversation,
  PrivateCoachDeleteAnalysisResult,
  PrivateCoachExportMarkdownResult,
  PrivateCoachGetAnalysisResult,
  PrivateCoachListAnalysesResult,
  PrivateCoachResult,
  PrivateCoachWorkflowInput,
} from '@proma/shared'
import { DesktopPrivateCoachAdapter } from './adapters/desktop-adapter'

const PHASE_1A_STORAGE_MESSAGE = 'Phase 1A mock: storage is not implemented until Phase 1C.'
const MOCK_CREATED_AT = '2026-01-01T00:00:00.000Z'

export class PrivateCoachWorkflowService {
  private readonly desktopAdapter: DesktopPrivateCoachAdapter

  constructor(adapter = new DesktopPrivateCoachAdapter()) {
    this.desktopAdapter = adapter
  }

  async run(input: PrivateCoachWorkflowInput): Promise<PrivateCoachResult> {
    const conversation = this.desktopAdapter.normalizeInput(input)
    return buildMockResult(input, conversation)
  }

  async listAnalyses(): Promise<PrivateCoachListAnalysesResult> {
    return {
      items: [],
      storageEnabled: false,
      message: PHASE_1A_STORAGE_MESSAGE,
    }
  }

  async getAnalysis(): Promise<PrivateCoachGetAnalysisResult> {
    return {
      record: null,
      storageEnabled: false,
      message: PHASE_1A_STORAGE_MESSAGE,
    }
  }

  async deleteAnalysis(): Promise<PrivateCoachDeleteAnalysisResult> {
    return {
      deleted: false,
      storageEnabled: false,
      message: PHASE_1A_STORAGE_MESSAGE,
    }
  }

  async exportMarkdown(): Promise<PrivateCoachExportMarkdownResult> {
    return {
      markdown: [
        '# Private Coach Mock Export',
        '',
        'Phase 1A mock export. Persistent exports arrive in Phase 1C.',
      ].join('\n'),
      storageEnabled: false,
      message: PHASE_1A_STORAGE_MESSAGE,
    }
  }
}

function buildMockResult(
  input: PrivateCoachWorkflowInput,
  conversation: ParsedConversation,
): PrivateCoachResult {
  return {
    analysisId: `private_coach_mock_${hashConversation(input, conversation)}`,
    createdAt: MOCK_CREATED_AT,
    scene: input.sceneHint ?? '未指定',
    relationshipStage: '轻度试探期',
    riskLevel: 'medium',
    otherInterestLevel: 58,
    userPressureLevel: 42,
    relationshipTemperature: 61,
    shouldReplyNow: true,
    situationSummary: '这是 Phase 1A 的 deterministic mock 分析，用于验证后端 IPC 闭环；不代表真实模型判断。',
    signals: [
      {
        id: 'signal_response_rhythm',
        label: '回复节奏可继续',
        description: 'mock 判断：当前对话适合用低压力方式继续推进。',
        confidence: 0.62,
      },
      {
        id: 'signal_pressure_guard',
        label: '压力需要控制',
        description: 'mock 判断：下一条消息应避免追问和连续输出。',
        confidence: 0.6,
      },
    ],
    warnings: [
      '不要连续发送多条长消息。',
      '不要用质问语气要求对方解释。',
    ],
    dontDo: [
      '不要催促对方马上回复。',
      '不要在信息不足时直接表白或摊牌。',
      '不要复制粘贴过度模板化的话术。',
    ],
    replyCandidates: [
      {
        id: 'reply_safe',
        tone: '稳妥',
        content: '我明白，那你先忙。等你方便的时候我们再接着聊。',
        copyText: '我明白，那你先忙。等你方便的时候我们再接着聊。',
        why: '降低对方压力，保留继续交流空间。',
        bestFor: '对方回复慢或状态不明确时。',
        strength: 'low',
      },
      {
        id: 'reply_light',
        tone: '轻松',
        content: '哈哈可以，那我先记下这个点，下次找机会继续听你展开。',
        copyText: '哈哈可以，那我先记下这个点，下次找机会继续听你展开。',
        why: '用轻松方式接住话题，不急着推进关系。',
        bestFor: '对话气氛正常但需要自然延续时。',
        strength: 'medium',
      },
      {
        id: 'reply_close',
        tone: '收束',
        content: '今天先不打扰你啦，晚点你有空我们再聊。',
        copyText: '今天先不打扰你啦，晚点你有空我们再聊。',
        why: '主动收束，减少压迫感。',
        bestFor: '对方明显忙或回复意愿较低时。',
        strength: 'low',
      },
    ],
    nextStep: '先发送一条低压力回复，等待对方主动补充信息。',
    followUpOptions: [
      '如果对方继续展开，围绕她的新信息追问一个轻量问题。',
      '如果对方短回复，先结束本轮聊天，隔一段时间再开启新话题。',
      '如果对方情绪低落，先共情，不急于邀约或推进。',
    ],
    confidence: 0.62,
  }
}

function hashConversation(
  input: PrivateCoachWorkflowInput,
  conversation: ParsedConversation,
): string {
  const normalized = JSON.stringify({
    source: input.source,
    platform: input.platform,
    sceneHint: input.sceneHint ?? '未指定',
    depth: input.analysisDepth,
    messages: conversation.messages.map((message) => ({
      speaker: message.speaker,
      content: message.content,
      timestamp: message.timestamp,
    })),
  })

  return createHash('sha256').update(normalized).digest('hex').slice(0, 12)
}
