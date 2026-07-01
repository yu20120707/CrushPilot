export class RulebookError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RulebookError'
  }
}

export class RulebookPathError extends RulebookError {
  constructor(message = 'Invalid rulebook path') {
    super(message)
    this.name = 'RulebookPathError'
  }
}
