import { afterEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { PrivateCoachAnalysisRecord } from '@proma/shared'
import { PrivateCoachStore } from './private-coach-store'

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('PrivateCoachStore', () => {
  test('roundtrips an analysis through JSON index and record files', async () => {
    const { store, rootDir } = createStore()
    await store.savePrivateCoachAnalysis(createRecord())

    const list = await store.listPrivateCoachAnalyses()
    const got = await store.getPrivateCoachAnalysis('analysis_roundtrip')
    const recordFile = readFileSync(join(rootDir, 'analyses', 'analysis_roundtrip.json'), 'utf8')

    expect(list.storageEnabled).toBe(true)
    expect(list.items).toHaveLength(1)
    expect(got.record?.meta.analysisId).toBe('analysis_roundtrip')
    expect(recordFile).not.toContain('周末有空吗')
    expect(recordFile).not.toContain('raw secret')
    expect(got.record?.parsedConversation.messages[0]?.content).toBe('')
  })

  test('deletes a stored analysis and updates index', async () => {
    const { store, rootDir } = createStore()
    await store.savePrivateCoachAnalysis(createRecord())

    const deleted = await store.deletePrivateCoachAnalysis('analysis_roundtrip')
    const list = await store.listPrivateCoachAnalyses()

    expect(deleted.deleted).toBe(true)
    expect(list.items).toHaveLength(0)
    expect(existsSync(join(rootDir, 'analyses', 'analysis_roundtrip.json'))).toBe(false)
  })

  test('exports markdown to the exports directory', async () => {
    const { store, rootDir } = createStore()
    await store.savePrivateCoachAnalysis(createRecord())

    const exported = await store.exportPrivateCoachAnalysisMarkdown('analysis_roundtrip')

    expect(exported.storageEnabled).toBe(true)
    expect(exported.filePath).toBe(join(rootDir, 'exports', 'analysis_roundtrip.md'))
    expect(existsSync(exported.filePath ?? '')).toBe(true)
    expect(exported.markdown).toContain('# CrushPilot 分析 analysis_roundtrip')
  })

  test('preserves raw conversation only when explicitly requested', async () => {
    const { store } = createStore()
    await store.savePrivateCoachAnalysis(createRecord({
      inputSummary: { savedRawConversation: true },
      rawConversation: '我：raw secret',
    }))

    const got = await store.getPrivateCoachAnalysis('analysis_roundtrip')

    expect(got.record?.inputSummary.savedRawConversation).toBe(true)
    expect(got.record?.rawConversation).toBe('我：raw secret')
  })
})

function createStore(): { store: PrivateCoachStore; rootDir: string } {
  const rootDir = mkdtempSync(join(tmpdir(), 'private-coach-store-'))
  tempDirs.push(rootDir)
  return {
    rootDir,
    store: new PrivateCoachStore({ rootDir }),
  }
}

function createRecord(
  patch: {
    inputSummary?: Partial<PrivateCoachAnalysisRecord['inputSummary']>
    rawConversation?: string
  } = {},
): PrivateCoachAnalysisRecord {
  return {
    meta: {
      analysisId: 'analysis_roundtrip',
      createdAt: '2026-01-01T00:00:00.000Z',
      source: 'desktop',
      platform: 'generic',
      scene: '暧昧推进',
      riskLevel: 'medium',
      title: '测试分析',
      messageCount: 2,
    },
    inputSummary: {
      source: 'desktop',
      platform: 'generic',
      sceneHint: '暧昧推进',
      analysisDepth: 'standard',
      messageCount: 2,
      savedRawConversation: false,
      ...patch.inputSummary,
    },
    parsedConversation: {
      platform: 'generic',
      messages: [
        {
          id: 'msg_1',
          speaker: 'me',
          speakerName: '我',
          content: '周末有空吗 raw secret',
          contentType: 'text',
          raw: '我：周末有空吗 raw secret',
        },
        {
          id: 'msg_2',
          speaker: 'other',
          speakerName: '她',
          content: '还不确定',
          contentType: 'text',
          raw: '她：还不确定',
        },
      ],
      messageCount: 2,
      speakers: ['我', '她'],
      textPreview: '周末有空吗 raw secret 还不确定',
    },
    result: {
      analysisId: 'analysis_roundtrip',
      createdAt: '2026-01-01T00:00:00.000Z',
      scene: '暧昧推进',
      relationshipStage: '轻度试探期',
      riskLevel: 'medium',
      otherInterestLevel: 58,
      userPressureLevel: 42,
      relationshipTemperature: 61,
      shouldReplyNow: true,
      situationSummary: 'mock summary',
      signals: [],
      warnings: [],
      dontDo: [],
      replyCandidates: [
        {
          id: 'reply_safe',
          tone: '稳妥',
          content: '先轻松回复。',
          copyText: '先轻松回复。',
          why: '降低压力。',
        },
      ],
      nextStep: '等待对方补充。',
      followUpOptions: [],
      confidence: 0.62,
    },
    rawConversation: patch.rawConversation,
  }
}
