import { describe, expect, test } from 'bun:test'
import { PrivateCoachWorkflowService } from './workflow-service'
import type { PrivateCoachWorkflowInput } from '@proma/shared'

const input: PrivateCoachWorkflowInput = {
  source: 'desktop',
  platform: 'generic',
  sceneHint: '暧昧推进',
  analysisDepth: 'standard',
  conversationText: [
    '我：周末有空吗',
    '她：还不确定，我看看安排',
  ].join('\n'),
}

describe('PrivateCoachWorkflowService', () => {
  test('returns deterministic mock analysis without storage or model calls', async () => {
    const service = new PrivateCoachWorkflowService()
    const first = await service.run(input)
    const second = await service.run(input)

    expect(first).toEqual(second)
    expect(first.scene).toBe('暧昧推进')
    expect(first.replyCandidates).toHaveLength(3)
    expect(first.analysisId).toStartWith('private_coach_mock_')
    expect(JSON.stringify(first)).not.toContain('周末有空吗')
  })

  test('returns safe mock storage results for Phase 1A', async () => {
    const service = new PrivateCoachWorkflowService()

    await expect(service.listAnalyses()).resolves.toMatchObject({
      items: [],
      storageEnabled: false,
    })
    await expect(service.getAnalysis()).resolves.toMatchObject({
      record: null,
      storageEnabled: false,
    })
    await expect(service.deleteAnalysis()).resolves.toMatchObject({
      deleted: false,
      storageEnabled: false,
    })
    await expect(service.exportMarkdown()).resolves.toMatchObject({
      storageEnabled: false,
    })
  })
})
