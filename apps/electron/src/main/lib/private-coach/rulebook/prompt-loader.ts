import { readFile, readdir, stat } from 'node:fs/promises'
import { extname, relative } from 'node:path'
import type {
  LoadedRule,
  RuleManifest,
  RuleManifestRule,
  RulebookLoadResult,
} from './rule-types'
import { RulebookError, RulebookPathError } from './rulebook-errors'
import {
  getDefaultPrivateCoachRulebookRoot,
  resolveRulebookPath,
} from './rulebook-paths'

const MANIFEST_FILE = 'rule-manifest.json'
const DEFAULT_MAX_RULE_CHARS = 12_000
const READABLE_RULE_EXTENSIONS = new Set(['.md', '.txt', '.skill', '.json'])
const SKIPPED_EXTENSIONS = new Set(['.log', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.pdf', '.zip'])

export interface PromptLoaderOptions {
  rootDir?: string
  maxRuleChars?: number
}

export class PrivateCoachPromptLoader {
  private readonly rootDir: string
  private readonly maxRuleChars: number

  constructor(options: PromptLoaderOptions = {}) {
    this.rootDir = options.rootDir ?? getDefaultPrivateCoachRulebookRoot()
    this.maxRuleChars = options.maxRuleChars ?? DEFAULT_MAX_RULE_CHARS
  }

  async loadRules(): Promise<RulebookLoadResult> {
    const manifestPath = resolveRulebookPath(this.rootDir, MANIFEST_FILE)
    const warnings: string[] = []
    const manifest = await this.readManifest(manifestPath)
    const validRules = validateManifestRules(manifest, warnings)
    const rules: LoadedRule[] = []

    for (const rule of validRules) {
      rules.push(await this.loadRule(rule))
    }

    return {
      rootDir: this.rootDir,
      manifestPath,
      rules,
      skippedRuleIds: rules
        .filter((rule) => rule.loadStatus === 'skipped')
        .map((rule) => rule.manifest.id),
      warnings: [
        ...warnings,
        ...rules
          .filter((rule) => rule.loadStatus === 'skipped' && rule.loadError)
          .map((rule) => `${rule.manifest.id}: ${rule.loadError}`),
      ],
    }
  }

  private async readManifest(manifestPath: string): Promise<RuleManifest> {
    try {
      const content = await readFile(manifestPath, 'utf8')
      const parsed = JSON.parse(content) as unknown
      if (!isRuleManifest(parsed)) {
        throw new RulebookError('Invalid rule manifest structure')
      }
      return parsed
    } catch (error) {
      if (error instanceof RulebookError) throw error
      throw new RulebookError('Failed to read rule manifest')
    }
  }

  private async loadRule(manifest: RuleManifestRule): Promise<LoadedRule> {
    let absolutePath: string
    try {
      absolutePath = resolveRulebookPath(this.rootDir, manifest.relativePath)
    } catch (error) {
      return createSkippedRule(manifest, this.rootDir, error)
    }

    try {
      const pathStat = await stat(absolutePath)
      if (pathStat.isDirectory()) {
        return this.loadDirectoryRule(manifest, absolutePath)
      }
      if (!pathStat.isFile()) {
        return createSkippedRule(manifest, absolutePath, 'Unsupported rule path type')
      }
      return this.loadFileRule(manifest, absolutePath)
    } catch (error) {
      return createSkippedRule(manifest, absolutePath, error)
    }
  }

  private async loadDirectoryRule(manifest: RuleManifestRule, absolutePath: string): Promise<LoadedRule> {
    const files = await collectReadableRuleFiles(absolutePath)
    if (files.length === 0) {
      return createSkippedRule(manifest, absolutePath, 'No readable rule reference files found')
    }

    const chunks: string[] = []
    let remainingChars = this.maxRuleChars

    for (const file of files) {
      if (remainingChars <= 0) break
      const raw = await readFile(file, 'utf8')
      const relativeFile = relative(absolutePath, file)
      const header = `\n\n# ${relativeFile}\n\n`
      const available = Math.max(0, remainingChars - header.length)
      if (available <= 0) break
      const chunk = `${header}${raw.slice(0, available)}`
      chunks.push(chunk)
      remainingChars -= chunk.length
    }

    const content = chunks.join('').trim()
    return {
      manifest,
      absolutePath,
      content,
      contentChars: content.length,
      loadStatus: content ? 'loaded' : 'skipped',
      loadError: content ? undefined : 'Readable files were empty',
      loadedFiles: files,
    }
  }

  private async loadFileRule(manifest: RuleManifestRule, absolutePath: string): Promise<LoadedRule> {
    if (!isReadableRuleFile(absolutePath)) {
      return createSkippedRule(manifest, absolutePath, 'File extension is not suitable for rule prompt context')
    }

    const raw = await readFile(absolutePath, 'utf8')
    const content = raw.slice(0, this.maxRuleChars)

    return {
      manifest,
      absolutePath,
      content,
      contentChars: content.length,
      loadStatus: 'loaded',
      loadedFiles: [absolutePath],
    }
  }
}

export async function loadPrivateCoachRules(options: PromptLoaderOptions = {}): Promise<RulebookLoadResult> {
  return new PrivateCoachPromptLoader(options).loadRules()
}

function validateManifestRules(manifest: RuleManifest, warnings: string[]): RuleManifestRule[] {
  const validRules: RuleManifestRule[] = []

  manifest.rules.forEach((rule, index) => {
    if (isRuleManifestRule(rule)) {
      validRules.push(rule)
      return
    }
    warnings.push(`manifest.rules[${index}]: skipped invalid rule entry`)
  })

  return validRules
}

async function collectReadableRuleFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const absolutePath = `${directory}/${entry.name}`
    if (entry.isDirectory()) {
      files.push(...await collectReadableRuleFiles(absolutePath))
    } else if (entry.isFile() && isReadableRuleFile(absolutePath)) {
      files.push(absolutePath)
    }
  }

  return files.sort((a, b) => a.localeCompare(b))
}

function isReadableRuleFile(filePath: string): boolean {
  const extension = extname(filePath).toLowerCase()
  if (SKIPPED_EXTENSIONS.has(extension)) return false
  return READABLE_RULE_EXTENSIONS.has(extension)
}

function createSkippedRule(
  manifest: RuleManifestRule,
  absolutePath: string,
  error: unknown,
): LoadedRule {
  return {
    manifest,
    absolutePath,
    content: '',
    contentChars: 0,
    loadStatus: 'skipped',
    loadError: normalizeLoadError(error),
    loadedFiles: [],
  }
}

function normalizeLoadError(error: unknown): string {
  if (error instanceof RulebookPathError) return error.message
  if (error instanceof Error) {
    if ('code' in error && error.code === 'ENOENT') return 'Rule path not found'
    return error.message
  }
  if (typeof error === 'string') return error
  return 'Unknown rule load error'
}

function isRuleManifestRule(value: unknown): value is RuleManifestRule {
  if (!isRecord(value)) return false
  return typeof value.id === 'string'
    && typeof value.source === 'string'
    && typeof value.sourceRepo === 'string'
    && typeof value.sourceCommit === 'string'
    && typeof value.license === 'string'
    && typeof value.relativePath === 'string'
    && typeof value.copiedAt === 'string'
    && typeof value.modified === 'boolean'
    && typeof value.riskLevel === 'string'
    && Array.isArray(value.tags)
    && value.tags.every((tag) => typeof tag === 'string')
    && Array.isArray(value.stages)
    && value.stages.every((stage) => typeof stage === 'string')
}

function isRuleManifest(value: unknown): value is RuleManifest {
  return isRecord(value)
    && typeof value.schemaVersion === 'number'
    && Array.isArray(value.rules)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
