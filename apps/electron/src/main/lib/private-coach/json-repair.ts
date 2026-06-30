export interface JsonRepairResult {
  ok: boolean
  value: unknown
  error?: string
}

export function parseJsonSafely(text: string): JsonRepairResult {
  try {
    return {
      ok: true,
      value: JSON.parse(text),
    }
  } catch (error) {
    return {
      ok: false,
      value: null,
      error: error instanceof Error ? error.message : 'Invalid JSON',
    }
  }
}
