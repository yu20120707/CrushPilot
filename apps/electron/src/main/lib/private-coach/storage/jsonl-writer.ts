import { mkdir, appendFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { PrivateCoachAnalysisRecord } from '@proma/shared'
import { resolvePrivateCoachStoragePaths } from './path-resolver'

export async function appendAnalysisJsonl(
  record: PrivateCoachAnalysisRecord,
  rootDir?: string,
): Promise<string> {
  const paths = resolvePrivateCoachStoragePaths(rootDir)
  await mkdir(paths.analysesJsonlDir, { recursive: true })

  const month = record.result.createdAt.slice(0, 7)
  const jsonlPath = join(paths.analysesJsonlDir, `${month}.jsonl`)
  await appendFile(jsonlPath, `${JSON.stringify(record)}\n`, 'utf8')
  return jsonlPath
}
