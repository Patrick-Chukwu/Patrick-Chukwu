import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { after, before, beforeEach, describe, it } from 'node:test'
import { createApp } from './app.js'
import { MAX_FAILURES_GLOBAL, MAX_FAILURES_PER_CLIENT } from './auth.js'

const PASSWORD = 'test-password-not-real'
process.env.BILLING_ADMIN_PASSWORD = PASSWORD
process.env.BILLING_SERVE_STATIC = '0'
delete process.env.VERCEL

let dir
let app
let server
let base

async function call(pathname, { method = 'GET', body, cookie, headers = {}, raw } = {}) {
  const response = await fetch(`${base}${pathname}`, {
    method,
    headers: {
      'X-Billing-Request': '1',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers,
    },
    body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
  })
  const text = await response.text()
  let payload = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = null
  }
  const setCookie = typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : []
  return { status: response.status, payload, text, headers: response.headers, setCookie }
}

function cookiePair(response) {
  return response.setCookie.map((item) => item.split(';')[0]).join('; ')
}

async function signIn(headers = {}) {
  const response = await call('/api/billing/login', { method: 'POST', body: { password: PASSWORD }, headers })
  assert.equal(response.status, 200)
  return { response, cookie: cookiePair(response) }
}

before(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'billing-auth-'))
  app = createApp({ dbPath: path.join(dir, 'billing.sqlite'), serveStatic: false })
  await app.locals.ready()
  server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  base = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve) => server.close(resolve))
  await app.locals.close()
  fs.rmSync(dir, { recursive: true, force: true })
})

beforeEach(async () => {
  process.env.BILLING_ADMIN_PASSWORD = PASSWORD
  delete process.env.VERCEL
  const { db } = await app.locals.ready()
  await db.prepare('DELETE FROM login_attempts').run()
  await db.prepare('DELETE FROM admin_sessions').run()
})

describe('sign in', () => {
  it('accepts the configured password and sets a hardened session cookie', async () => {
    const { response, cookie } = await signIn()
    assert.deepEqual(response.payload, { ok: true })
    const header = response.setCookie[0]
    assert.match(header, /^billing_session=[A-Za-z0-9_-]{43};/)
    assert.match(header, /; HttpOnly/)
    assert.match(header, /; SameSite=Strict/)
    assert.match(header, /; Path=\//)
    assert.match(header, /; Max-Age=43200/)
    const session = await call('/api/billing/session', { cookie })
    assert.deepEqual(session.payload, { authenticated: true })
    const clients = await call('/api/billing/clients', { cookie })
    assert.equal(clients.status, 200)
  })

  it('marks the cookie Secure and __Host- prefixed on the production (Vercel) runtime', async () => {
    process.env.VERCEL = '1'
    const { response, cookie } = await signIn({ 'x-real-ip': '203.0.113.5' })
    const header = response.setCookie[0]
    assert.match(header, /^__Host-billing_session=[A-Za-z0-9_-]{43};/)
    assert.match(header, /; Secure/)
    assert.match(header, /; HttpOnly/)
    assert.match(header, /; SameSite=Strict/)
    assert.match(header, /; Path=\//)
    assert.doesNotMatch(header, /Domain=/i)
    const clients = await call('/api/billing/clients', { cookie })
    assert.equal(clients.status, 200)
  })

  it('marks the cookie Secure when a proxy reports https', async () => {
    const { response } = await signIn({ 'x-forwarded-proto': 'https' })
    assert.match(response.setCookie[0], /; Secure/)
  })

  it('rejects a wrong password with a generic 401', async () => {
    const response = await call('/api/billing/login', { method: 'POST', body: { password: 'definitely-wrong' } })
    assert.equal(response.status, 401)
    assert.equal(response.payload.code, 'UNAUTHENTICATED')
    assert.equal(response.setCookie.length, 0)
    assert.equal(response.text.includes(PASSWORD), false)
  })

  it('rejects missing, empty, non-string, and oversized credentials with 400', async () => {
    const cases = [{}, { password: '' }, { password: 12345678 }, { password: null }, { password: ['a'] }, { password: 'x'.repeat(201) }]
    for (const body of cases) {
      const response = await call('/api/billing/login', { method: 'POST', body })
      assert.equal(response.status, 400, JSON.stringify(body).slice(0, 40))
      assert.equal(response.setCookie.length, 0)
    }
    const noBody = await call('/api/billing/login', { method: 'POST' })
    assert.equal(noBody.status, 400)
    const malformed = await call('/api/billing/login', { method: 'POST', raw: '{not json', headers: { 'Content-Type': 'application/json' } })
    assert.equal(malformed.status, 400)
  })

  it('does not store the cookie token in the database', async () => {
    const { cookie } = await signIn()
    const token = cookie.split('=')[1]
    const { db } = await app.locals.ready()
    const rows = await db.prepare('SELECT id FROM admin_sessions').all()
    assert.equal(rows.length, 1)
    assert.notEqual(rows[0].id, token)
    assert.match(rows[0].id, /^[0-9a-f]{64}$/)
  })
})

describe('fails closed without configuration', () => {
  it('returns 503 when BILLING_ADMIN_PASSWORD is missing, empty, or too short', async () => {
    for (const value of [undefined, '', '   ', 'short']) {
      if (value === undefined) delete process.env.BILLING_ADMIN_PASSWORD
      else process.env.BILLING_ADMIN_PASSWORD = value
      const login = await call('/api/billing/login', { method: 'POST', body: { password: 'anything-at-all' } })
      assert.equal(login.status, 503)
      assert.equal(login.payload.code, 'NOT_CONFIGURED')
      assert.equal(login.setCookie.length, 0)
      const session = await call('/api/billing/session')
      assert.equal(session.status, 503)
      const invoices = await call('/api/billing/invoices')
      assert.equal(invoices.status, 503)
    }
  })

  it('does not accept an old session once the password is removed', async () => {
    const { cookie } = await signIn()
    delete process.env.BILLING_ADMIN_PASSWORD
    const response = await call('/api/billing/clients', { cookie })
    assert.equal(response.status, 503)
  })
})

describe('protected api', () => {
  it('returns 401 for anonymous, forged, and unknown tokens on every method', async () => {
    const targets = [
      ['GET', '/api/billing/invoices'],
      ['GET', '/api/billing/clients'],
      ['GET', '/api/billing/receipts'],
      ['GET', '/api/billing/dashboard'],
      ['GET', '/api/billing/settings'],
      ['GET', '/api/billing/settings/logo'],
      ['GET', '/api/billing/invoices/x/pdf'],
      ['GET', '/api/billing/receipts/x/pdf'],
      ['POST', '/api/billing/invoices'],
      ['PUT', '/api/billing/settings'],
      ['DELETE', '/api/billing/invoices/x'],
      ['POST', '/api/billing/payments/x/reverse'],
    ]
    const bodies = [undefined, 'billing_session=forged', `billing_session=${'A'.repeat(43)}`, `__Host-billing_session=${'A'.repeat(43)}`]
    for (const [method, url] of targets) {
      for (const cookie of bodies) {
        const response = await call(url, { method, cookie, body: method === 'GET' ? undefined : {} })
        assert.equal(response.status, 401, `${method} ${url}`)
        assert.equal(response.payload.code, 'UNAUTHENTICATED')
      }
    }
  })

  it('lets an authenticated administrator perform billing operations', async () => {
    const { cookie } = await signIn()
    const created = await call('/api/billing/clients', { method: 'POST', cookie, body: { businessName: 'Auth Test Client' } })
    assert.equal(created.status, 201)
    const listed = await call('/api/billing/clients', { cookie })
    assert.ok(listed.payload.items.some((item) => item.businessName === 'Auth Test Client'))
    const logo = await fetch(`${base}/api/billing/settings/logo`, { headers: { Cookie: cookie } })
    assert.equal(logo.status, 200)
    assert.equal(logo.headers.get('content-type'), 'image/png')
  })

  it('stores an uploaded logo in the database and serves it back', async () => {
    const { cookie } = await signIn()
    const png = fs.readFileSync(path.resolve('src/assets/Patrick.png'))
    const saved = await call('/api/billing/settings', {
      method: 'PUT',
      cookie,
      body: { professionalName: 'Patrick Chukwu', email: 'chukwupatrickify@gmail.com', logoBase64: `data:image/png;base64,${png.toString('base64')}` },
    })
    assert.equal(saved.status, 200)
    assert.equal(saved.payload.hasCustomLogo, true)
    const logo = await fetch(`${base}/api/billing/settings/logo`, { headers: { Cookie: cookie } })
    assert.deepEqual(Buffer.from(await logo.arrayBuffer()), png)
    const { db } = await app.locals.ready()
    assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM document_assets').get()).n >= 1, true)
    const cleared = await call('/api/billing/settings', { method: 'PUT', cookie, body: { professionalName: 'Patrick Chukwu', clearLogo: true } })
    assert.equal(cleared.payload.hasCustomLogo, false)
  })

  it('rejects expired sessions', async () => {
    const { cookie } = await signIn()
    const { db } = await app.locals.ready()
    await db.prepare('UPDATE admin_sessions SET expires_at = ?').run(Date.now() - 1000)
    const response = await call('/api/billing/clients', { cookie })
    assert.equal(response.status, 401)
    const session = await call('/api/billing/session', { cookie })
    assert.deepEqual(session.payload, { authenticated: false })
  })

  it('signs everyone out when the administrator password is rotated', async () => {
    const { cookie } = await signIn()
    process.env.BILLING_ADMIN_PASSWORD = 'a-brand-new-password'
    const response = await call('/api/billing/clients', { cookie })
    assert.equal(response.status, 401)
  })
})

describe('logout', () => {
  it('invalidates the session on the server and clears the cookie', async () => {
    const { cookie } = await signIn()
    const out = await call('/api/billing/logout', { method: 'POST', cookie })
    assert.equal(out.status, 204)
    assert.match(out.setCookie[0], /^billing_session=;/)
    assert.match(out.setCookie[0], /Max-Age=0/)
    // The old cookie value is replayed on purpose: it must no longer work.
    const replay = await call('/api/billing/clients', { cookie })
    assert.equal(replay.status, 401)
    const { db } = await app.locals.ready()
    assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM admin_sessions').get()).n, 0)
  })

  it('is harmless without a session', async () => {
    const out = await call('/api/billing/logout', { method: 'POST' })
    assert.equal(out.status, 204)
  })
})

describe('request forgery protection', () => {
  it('requires the billing header on writes', async () => {
    const { cookie } = await signIn()
    const response = await fetch(`${base}/api/billing/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ businessName: 'Blocked' }),
    })
    assert.equal(response.status, 403)
  })

  it('rejects writes from another origin and accepts the same origin', async () => {
    const { cookie } = await signIn()
    const cross = await call('/api/billing/clients', { method: 'POST', cookie, body: { businessName: 'Evil' }, headers: { Origin: 'https://evil.example' } })
    assert.equal(cross.status, 403)
    const crossLogin = await call('/api/billing/login', { method: 'POST', body: { password: PASSWORD }, headers: { Origin: 'https://evil.example' } })
    assert.equal(crossLogin.status, 403)
    const same = await call('/api/billing/clients', { method: 'POST', cookie, body: { businessName: 'Same Origin' }, headers: { Origin: base } })
    assert.equal(same.status, 201)
  })
})

describe('login throttling', () => {
  it('locks a client out after repeated failures, even for the right password', async () => {
    process.env.VERCEL = '1'
    const attacker = { 'x-real-ip': '198.51.100.7' }
    for (let attempt = 0; attempt < MAX_FAILURES_PER_CLIENT; attempt += 1) {
      const response = await call('/api/billing/login', { method: 'POST', body: { password: `wrong-guess-${attempt}` }, headers: attacker })
      assert.equal(response.status, 401)
    }
    const blocked = await call('/api/billing/login', { method: 'POST', body: { password: PASSWORD }, headers: attacker })
    assert.equal(blocked.status, 429)
    assert.equal(blocked.payload.code, 'RATE_LIMIT')
    assert.ok(Number(blocked.headers.get('retry-after')) > 0)
    assert.equal(blocked.setCookie.length, 0)
    // A different client is unaffected.
    const other = await call('/api/billing/login', { method: 'POST', body: { password: PASSWORD }, headers: { 'x-real-ip': '198.51.100.8' } })
    assert.equal(other.status, 200)
  })

  it('does not trust client-supplied forwarding headers outside Vercel', async () => {
    for (let attempt = 0; attempt < MAX_FAILURES_PER_CLIENT; attempt += 1) {
      await call('/api/billing/login', { method: 'POST', body: { password: `wrong-guess-${attempt}` }, headers: { 'x-forwarded-for': `10.0.0.${attempt}` } })
    }
    const blocked = await call('/api/billing/login', { method: 'POST', body: { password: PASSWORD }, headers: { 'x-forwarded-for': '10.9.9.9' } })
    assert.equal(blocked.status, 429)
  })

  it('resets the client counter after a successful sign-in', async () => {
    for (let attempt = 0; attempt < MAX_FAILURES_PER_CLIENT - 1; attempt += 1) {
      await call('/api/billing/login', { method: 'POST', body: { password: `wrong-guess-${attempt}` } })
    }
    await signIn()
    const again = await call('/api/billing/login', { method: 'POST', body: { password: 'wrong-again' } })
    assert.equal(again.status, 401)
  })

  it('applies a global ceiling across many addresses', async () => {
    process.env.VERCEL = '1'
    const { db } = await app.locals.ready()
    await db.prepare('INSERT INTO login_attempts (bucket, count, window_start) VALUES (?, ?, ?)').run('global', MAX_FAILURES_GLOBAL, Date.now())
    const blocked = await call('/api/billing/login', { method: 'POST', body: { password: PASSWORD }, headers: { 'x-real-ip': '192.0.2.99' } })
    assert.equal(blocked.status, 429)
  })
})

describe('secret hygiene', () => {
  it('never returns the password in any response', async () => {
    const { cookie } = await signIn()
    const urls = ['/api/billing/session', '/api/billing/settings', '/api/billing/health', '/api/billing/missing']
    for (const url of urls) {
      const response = await call(url, { cookie })
      assert.equal(response.text.includes(PASSWORD), false, url)
    }
  })
})
