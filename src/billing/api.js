export class ApiError extends Error {
  constructor(status, payload) {
    super(payload?.error || 'Request failed')
    this.name = 'ApiError'
    this.status = status
    this.code = payload?.code
    this.payload = payload || {}
  }
}

function parsePayload(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

// Developer-only hint. `import.meta.env.DEV` is false in production builds, so the public site never shows it.
const DEV_HINT = import.meta.env.DEV ? ' In development, start the project with npm run dev.' : ''

export const SIGNED_OUT_EVENT = 'billing:signed-out'

function failureMessage(response, text) {
  const looksLikePage = /<!doctype html|<html/i.test(text || '')
  if (response.status === 405 || response.status === 404 || looksLikePage) {
    return `The billing service is not reachable right now. Try again shortly.${DEV_HINT}`
  }
  return `Billing could not complete that request (HTTP ${response.status}).`
}

export async function api(path, options = {}) {
  const headers = { 'X-Billing-Request': '1' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey
  let response
  try {
    response = await fetch(path, {
      method: options.method || 'GET',
      credentials: 'same-origin',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  } catch {
    throw new ApiError(0, { error: `Could not reach the billing service. Check your connection and try again.${DEV_HINT}`, code: 'OFFLINE' })
  }
  if (response.status === 204) return null
  const text = await response.text()
  const payload = parsePayload(text)
  if (response.status === 401 && payload?.code === 'UNAUTHENTICATED' && !path.endsWith('/login') && typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SIGNED_OUT_EVENT))
  }
  if (!response.ok || (payload === null && text)) {
    throw new ApiError(response.status, {
      error: payload?.error || failureMessage(response, text),
      code: payload?.code || (payload === null && text ? 'UNAVAILABLE' : 'ERROR'),
    })
  }
  return payload
}
