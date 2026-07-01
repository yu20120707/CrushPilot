import { join } from 'node:path'
import { getConfigDir } from '../../config-paths'

export interface PrivateCoachStoragePaths {
  rootDir: string
  analysesDir: string
  analysesJsonlDir: string
  exportsDir: string
  diagnosticsDir: string
  indexPath: string
}

export function getPrivateCoachRootDir(): string {
  return join(getConfigDir(), 'private-coach')
}

export function resolvePrivateCoachStoragePaths(rootDir = getPrivateCoachRootDir()): PrivateCoachStoragePaths {
  return {
    rootDir,
    analysesDir: join(rootDir, 'analyses'),
    analysesJsonlDir: join(rootDir, 'analyses-jsonl'),
    exportsDir: join(rootDir, 'exports'),
    diagnosticsDir: join(rootDir, 'diagnostics'),
    indexPath: join(rootDir, 'analyses.json'),
  }
}

export function assertSafeAnalysisId(analysisId: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(analysisId)) {
    throw new Error('Invalid private coach analysis id')
  }
}
