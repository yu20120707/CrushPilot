import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PrivateCoachWorkflowService } from './workflow-service'
import type { PrivateCoachWorkflowInput } from '@proma/shared'
import { PrivateCoachStore } from './storage/private-coach-store'

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

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('PrivateCoachWorkflowService', () => {
  test('returns deterministic mock analysis without storage or model calls', async () => {
    const service = createService()
    const first = await service.run(input)
    const second = await service.run(input)

    expect(first).toEqual(second)
    expect(first.scene).toBe('暧昧推进')
    expect(first.replyCandidates).toHaveLength(3)
    expect(first.analysisId).toStartWith('private_coach_mock_')
    expect(JSON.stringify(first)).not.toContain('周末有空吗')
  })

  test('uses Phase 1C local storage for list/get/delete/export', async () => {
    const service = createService()
    const result = await service.run(input)

    await expect(service.listAnalyses()).resolves.toMatchObject({
      items: [{ analysisId: result.analysisId }],
      storageEnabled: true,
    })
    await expect(service.getAnalysis(result.analysisId)).resolves.toMatchObject({
      record: { meta: { analysisId: result.analysisId } },
      storageEnabled: true,
    })
    await expect(service.exportMarkdown(result.analysisId)).resolves.toMatchObject({
      analysisId: result.analysisId,
      storageEnabled: true,
    })
    await expect(service.deleteAnalysis(result.analysisId)).resolves.toMatchObject({
      deleted: true,
      storageEnabled: true,
    })
  })
})

function createService(): PrivateCoachWorkflowService {
  const rootDir = mkdtempSync(join(tmpdir(), 'private-coach-workflow-'))
  tempDirs.push(rootDir)
  return new PrivateCoachWorkflowService({
    store: new PrivateCoachStore({ rootDir }),
  })
}
