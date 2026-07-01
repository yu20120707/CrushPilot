import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type {
  ParsedConversation,
  ParsedMessage,
  PrivateCoachAnalysisIndexItem,
  PrivateCoachAnalysisRecord,
  PrivateCoachDeleteAnalysisResult,
  PrivateCoachExportMarkdownResult,
  PrivateCoachGetAnalysisResult,
  PrivateCoachListAnalysesResult,
} from '@proma/shared'
import {
  createPrivateCoachTextPreview,
  redactPrivateCoachSpeakerName,
} from '../privacy/redactor'
import { appendAnalysisJsonl } from './jsonl-writer'
import { renderAnalysisMarkdown } from './markdown-exporter'
import {
  assertSafeAnalysisId,
  resolvePrivateCoachStoragePaths,
  type PrivateCoachStoragePaths,
} from './path-resolver'

export interface PrivateCoachStoreOptions {
  rootDir?: string
}

export class PrivateCoachStore {
  private readonly rootDir?: string

  constructor(options: PrivateCoachStoreOptions = {}) {
    this.rootDir = options.rootDir
  }

  async ensurePrivateCoachDirs(): Promise<PrivateCoachStoragePaths> {
    const paths = this.resolvePaths()
    await Promise.all([
      mkdir(paths.analysesDir, { recursive: true }),
      mkdir(paths.analysesJsonlDir, { recursive: true }),
      mkdir(paths.exportsDir, { recursive: true }),
      mkdir(paths.diagnosticsDir, { recursive: true }),
    ])
    return paths
  }

  async savePrivateCoachAnalysis(record: PrivateCoachAnalysisRecord): Promise<PrivateCoachAnalysisRecord> {
    const paths = await this.ensurePrivateCoachDirs()
    const sanitized = sanitizePrivateCoachAnalysisRecord(record)
    const analysisPath = this.getAnalysisPath(sanitized.meta.analysisId)

    await writeJsonFile(analysisPath, sanitized)
    await this.writeIndex(upsertIndexItem(await this.readIndex(), sanitized.meta))
    await appendAnalysisJsonl(sanitized, paths.rootDir)

    return sanitized
  }

  async listPrivateCoachAnalyses(): Promise<PrivateCoachListAnalysesResult> {
    await this.ensurePrivateCoachDirs()
    const items = await this.readIndex()
    return {
      items: items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      storageEnabled: true,
    }
  }

  async getPrivateCoachAnalysis(analysisId: string): Promise<PrivateCoachGetAnalysisResult> {
    await this.ensurePrivateCoachDirs()
    assertSafeAnalysisId(analysisId)

    const record = await this.readRecord(analysisId)
    return {
      record,
      storageEnabled: true,
      message: record ? undefined : 'Analysis not found.',
    }
  }

  async deletePrivateCoachAnalysis(analysisId: string): Promise<PrivateCoachDeleteAnalysisResult> {
    const paths = await this.ensurePrivateCoachDirs()
    assertSafeAnalysisId(analysisId)

    const existingRecord = await this.readRecord(analysisId)
    await rm(this.getAnalysisPath(analysisId), { force: true })
    await rm(join(paths.exportsDir, `${analysisId}.md`), { force: true })
    await this.writeIndex((await this.readIndex()).filter((item) => item.analysisId !== analysisId))

    return {
      deleted: existingRecord !== null,
      storageEnabled: true,
      message: existingRecord ? 'Analysis deleted.' : 'Analysis not found.',
    }
  }

  async exportPrivateCoachAnalysisMarkdown(analysisId: string): Promise<PrivateCoachExportMarkdownResult> {
    const paths = await this.ensurePrivateCoachDirs()
    assertSafeAnalysisId(analysisId)

    const record = await this.readRecord(analysisId)
    if (!record) {
      return {
        markdown: '',
        analysisId,
        storageEnabled: true,
        message: 'Analysis not found.',
      }
    }

    const markdown = renderAnalysisMarkdown(record)
    const filePath = join(paths.exportsDir, `${analysisId}.md`)
    await writeFile(filePath, markdown, 'utf8')

    return {
      markdown,
      analysisId,
      filePath,
      storageEnabled: true,
      message: 'Markdown exported.',
    }
  }

  async appendAnalysisJsonl(record: PrivateCoachAnalysisRecord): Promise<string> {
    const sanitized = sanitizePrivateCoachAnalysisRecord(record)
    return appendAnalysisJsonl(sanitized, this.resolvePaths().rootDir)
  }

  private resolvePaths(): PrivateCoachStoragePaths {
    return resolvePrivateCoachStoragePaths(this.rootDir)
  }

  private getAnalysisPath(analysisId: string): string {
    assertSafeAnalysisId(analysisId)
    return join(this.resolvePaths().analysesDir, `${analysisId}.json`)
  }

  private async readRecord(analysisId: string): Promise<PrivateCoachAnalysisRecord | null> {
    try {
      const content = await readFile(this.getAnalysisPath(analysisId), 'utf8')
      return JSON.parse(content) as PrivateCoachAnalysisRecord
    } catch (error) {
      if (isNodeError(error) && error.code === 'ENOENT') return null
      throw error
    }
  }

  private async readIndex(): Promise<PrivateCoachAnalysisIndexItem[]> {
    try {
      const content = await readFile(this.resolvePaths().indexPath, 'utf8')
      return JSON.parse(content) as PrivateCoachAnalysisIndexItem[]
    } catch (error) {
      if (isNodeError(error) && error.code === 'ENOENT') return []
      throw error
    }
  }

  private async writeIndex(items: PrivateCoachAnalysisIndexItem[]): Promise<void> {
    await writeJsonFile(this.resolvePaths().indexPath, items)
  }
}

export async function ensurePrivateCoachDirs(rootDir?: string): Promise<PrivateCoachStoragePaths> {
  return new PrivateCoachStore({ rootDir }).ensurePrivateCoachDirs()
}

export async function savePrivateCoachAnalysis(
  record: PrivateCoachAnalysisRecord,
  rootDir?: string,
): Promise<PrivateCoachAnalysisRecord> {
  return new PrivateCoachStore({ rootDir }).savePrivateCoachAnalysis(record)
}

export async function listPrivateCoachAnalyses(rootDir?: string): Promise<PrivateCoachListAnalysesResult> {
  return new PrivateCoachStore({ rootDir }).listPrivateCoachAnalyses()
}

export async function getPrivateCoachAnalysis(
  analysisId: string,
  rootDir?: string,
): Promise<PrivateCoachGetAnalysisResult> {
  return new PrivateCoachStore({ rootDir }).getPrivateCoachAnalysis(analysisId)
}

export async function deletePrivateCoachAnalysis(
  analysisId: string,
  rootDir?: string,
): Promise<PrivateCoachDeleteAnalysisResult> {
  return new PrivateCoachStore({ rootDir }).deletePrivateCoachAnalysis(analysisId)
}

export async function exportPrivateCoachAnalysisMarkdown(
  analysisId: string,
  rootDir?: string,
): Promise<PrivateCoachExportMarkdownResult> {
  return new PrivateCoachStore({ rootDir }).exportPrivateCoachAnalysisMarkdown(analysisId)
}

export { appendAnalysisJsonl, renderAnalysisMarkdown }

function sanitizePrivateCoachAnalysisRecord(record: PrivateCoachAnalysisRecord): PrivateCoachAnalysisRecord {
  const savedRawConversation = record.inputSummary.savedRawConversation === true
  const parsedConversation = sanitizeParsedConversation(record.parsedConversation, savedRawConversation)

  return {
    ...record,
    meta: {
      ...record.meta,
      messageCount: parsedConversation.messageCount,
    },
    inputSummary: {
      ...record.inputSummary,
      messageCount: parsedConversation.messageCount,
      savedRawConversation,
    },
    parsedConversation,
    rawConversation: savedRawConversation ? record.rawConversation : undefined,
  }
}

function sanitizeParsedConversation(
  conversation: ParsedConversation,
  savedRawConversation: boolean,
): ParsedConversation {
  const messages = conversation.messages.map(sanitizeParsedMessage)

  return {
    ...conversation,
    messages,
    messageCount: messages.length,
    speakers: Array.from(new Set(messages.map((message) => message.speakerName ?? message.speaker))),
    textPreview: savedRawConversation ? createPrivateCoachTextPreview(conversation.textPreview) : '',
  }
}

function sanitizeParsedMessage(message: ParsedMessage): ParsedMessage {
  const fallback = message.speaker === 'me'
    ? '我'
    : message.speaker === 'other'
      ? '对方'
      : message.speaker

  return {
    ...message,
    speakerName: redactPrivateCoachSpeakerName(message.speakerName, fallback),
    content: '',
    raw: undefined,
  }
}

function upsertIndexItem(
  items: PrivateCoachAnalysisIndexItem[],
  nextItem: PrivateCoachAnalysisIndexItem,
): PrivateCoachAnalysisIndexItem[] {
  const remaining = items.filter((item) => item.analysisId !== nextItem.analysisId)
  return [nextItem, ...remaining]
}

async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  const tempPath = `${filePath}.tmp`
  await writeFile(tempPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  await rename(tempPath, filePath)
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}
