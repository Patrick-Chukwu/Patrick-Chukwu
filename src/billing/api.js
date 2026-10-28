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

function failureMessage(response, text) {
  const looksLikePage = /<!doctype html|<html/i.test(text || '')
  if (response.status === 405 || looksLikePage) {
    return 'Billing sign-in does not run on the public website. Start the project with npm run dev, open http://localhost:5173/billing, and use the password from BILLING_ADMIN_PASSWORD.'
  }
  if (!response.status) return 'The billing API is not running. Start it with npm run dev.'
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
    throw new ApiError(0, { error: 'The billing API is not running. Start it with npm run dev.', code: 'OFFLINE' })
  }
  if (response.status === 204) return null
  const text = await response.text()
  const payload = parsePayload(text)
  if (!response.ok || (payload === null && text)) {
    throw new ApiError(response.status, {
      error: payload?.error || failureMessage(response, text),
      code: payload?.code || (payload === null && text ? 'UNAVAILABLE' : 'ERROR'),
    })
  }
  return payload
}
