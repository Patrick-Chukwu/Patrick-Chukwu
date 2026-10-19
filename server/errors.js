export class HttpError extends Error {
  constructor(status, message, code = 'ERROR', details) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
    this.details = details
  }
}
