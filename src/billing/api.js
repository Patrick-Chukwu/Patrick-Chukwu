export class ApiError extends Error {
  constructor(status, payload) {
    super(payload?.error || 'Request failed')
    this.name = 'ApiError'
    this.status = status
    this.code = payload?.code
    this.payload = payload || {}
  }
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
  const payload = text ? JSON.parse(text) : null
  if (!response.ok) throw new ApiError(response.status, payload || { error: 'Request failed' })
  return payload
}
