import { existsSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'
import { RulebookPathError } from './rulebook-errors'

const PRIVATE_COACH_SKILL_SLUG = 'private-communication-coach'

export function getDefaultPrivateCoachRulebookRoot(): string {
  const packagedRoot = getPackagedDefaultSkillsRoot()
  if (packagedRoot) return join(packagedRoot, PRIVATE_COACH_SKILL_SLUG)

  return resolve(process.cwd(), 'apps/electron/default-skills', PRIVATE_COACH_SKILL_SLUG)
}

export function resolveRulebookPath(rootDir: string, relativePath: string): string {
  if (!relativePath || isAbsolute(relativePath)) {
    throw new RulebookPathError()
  }

  const root = resolve(rootDir)
  const candidate = resolve(root, relativePath)
  const relativeToRoot = relative(root, candidate)

  if (relativeToRoot.startsWith('..') || isAbsolute(relativeToRoot)) {
    throw new RulebookPathError()
  }

  if (relativeToRoot.split(/[\\/]/).includes('third_party')) {
    throw new RulebookPathError('Rulebook paths must not point to third_party')
  }

  return candidate
}

function getPackagedDefaultSkillsRoot(): string | undefined {
  try {
    const { app } = require('electron') as { app: { isPackaged: boolean } }
    if (!app.isPackaged) return undefined
    const root = join(process.resourcesPath, 'default-skills')
    return existsSync(root) ? root : undefined
  } catch {
    return undefined
  }
}
