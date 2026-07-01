import { afterEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PrivateCoachPromptLoader } from './prompt-loader'
import type { RuleManifestRule } from './rule-types'

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('PrivateCoachPromptLoader', () => {
  test('loads manifest rules and file content', async () => {
    const rootDir = createRulebookRoot([
      createManifestRule({ id: 'cold-rule', relativePath: 'references/cold.md' }),
    ])
    writeText(rootDir, 'references/cold.md', '冷场时先降低压力。')

    const result = await new PrivateCoachPromptLoader({ rootDir }).loadRules()

    expect(result.rules).toHaveLength(1)
    expect(result.rules[0]?.loadStatus).toBe('loaded')
    expect(result.rules[0]?.content).toContain('冷场')
    expect(result.skippedRuleIds).toEqual([])
  })

  test('marks missing rule paths as skipped without crashing', async () => {
    const rootDir = createRulebookRoot([
      createManifestRule({ id: 'missing-rule', relativePath: 'references/missing.md' }),
      createManifestRule({ id: 'present-rule', relativePath: 'references/present.md' }),
    ])
    writeText(rootDir, 'references/present.md', '可加载规则。')

    const result = await new PrivateCoachPromptLoader({ rootDir }).loadRules()

    expect(result.rules.find((rule) => rule.manifest.id === 'missing-rule')?.loadStatus).toBe('skipped')
    expect(result.rules.find((rule) => rule.manifest.id === 'present-rule')?.loadStatus).toBe('loaded')
    expect(result.skippedRuleIds).toContain('missing-rule')
  })

  test('loads readable files from a directory and skips binary or log files', async () => {
    const rootDir = createRulebookRoot([
      createManifestRule({ id: 'directory-rule', relativePath: 'references/dir' }),
    ])
    writeText(rootDir, 'references/dir/a.md', '第一条规则')
    writeText(rootDir, 'references/dir/nested/b.txt', '第二条规则')
    writeText(rootDir, 'references/dir/skip.log', '不应读取的日志')
    writeText(rootDir, 'references/dir/image.png', 'not really an image')

    const result = await new PrivateCoachPromptLoader({ rootDir }).loadRules()
    const rule = result.rules[0]

    expect(rule?.loadStatus).toBe('loaded')
    expect(rule?.content).toContain('第一条规则')
    expect(rule?.content).toContain('第二条规则')
    expect(rule?.content).not.toContain('不应读取的日志')
  })

  test('rejects traversal and third_party paths as skipped rules', async () => {
    const rootDir = createRulebookRoot([
      createManifestRule({ id: 'traversal-rule', relativePath: '../outside.md' }),
      createManifestRule({ id: 'third-party-rule', relativePath: 'references/../third_party/tool.md' }),
    ])

    const result = await new PrivateCoachPromptLoader({ rootDir }).loadRules()

    expect(result.rules).toHaveLength(2)
    expect(result.rules.every((rule) => rule.loadStatus === 'skipped')).toBe(true)
    expect(result.skippedRuleIds).toEqual(['traversal-rule', 'third-party-rule'])
  })

  test('does not execute copied tools while scanning directories', async () => {
    const rootDir = createRulebookRoot([
      createManifestRule({ id: 'tool-reference', relativePath: 'tools/simp' }),
    ])
    writeText(rootDir, 'tools/simp/chat_parser.py', 'raise Exception("should not run")')
    writeText(rootDir, 'tools/simp/README.md', '工具说明只作为文本参考。')

    const result = await new PrivateCoachPromptLoader({ rootDir }).loadRules()
    const rule = result.rules[0]

    expect(rule?.loadStatus).toBe('loaded')
    expect(rule?.loadedFiles.some((file) => file.endsWith('chat_parser.py'))).toBe(false)
    expect(rule?.content).toContain('工具说明')
    expect(rule?.content).not.toContain('should not run')
  })
})

function createRulebookRoot(rules: RuleManifestRule[]): string {
  const rootDir = mkdtempSync(join(tmpdir(), 'private-coach-rulebook-'))
  tempDirs.push(rootDir)
  writeText(rootDir, 'rule-manifest.json', JSON.stringify({ schemaVersion: 1, rules }, null, 2))
  return rootDir
}

function createManifestRule(patch: Partial<RuleManifestRule>): RuleManifestRule {
  return {
    id: 'rule',
    source: 'test',
    sourceRepo: 'https://example.test/repo',
    sourceCommit: 'abc123',
    license: 'MIT',
    relativePath: 'references/rule.md',
    copiedAt: '2026-01-01T00:00:00.000Z',
    modified: false,
    riskLevel: 'medium',
    tags: ['signals'],
    stages: ['phase-2a'],
    ...patch,
  }
}

function writeText(rootDir: string, relativePath: string, content: string): void {
  const filePath = join(rootDir, relativePath)
  mkdirSync(join(filePath, '..'), { recursive: true })
  writeFileSync(filePath, content, 'utf8')
}
