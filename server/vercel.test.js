import assert from 'node:assert/strict'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { after, before, describe, it } from 'node:test'

const PASSWORD = 'test-password-not-real'
process.env.BILLING_ADMIN_PASSWORD = PASSWORD
process.env.VERCEL = '1'
delete process.env.BILLING_DATABASE_URL
delete process.env.BILLING_DATABASE_AUTH_TOKEN
delete process.env.TURSO_DATABASE_URL
delete process.env.TURSO_AUTH_TOKEN
delete process.env.BILLING_DATABASE_PATH

const { default: handler } = await import('../api/billing/[...path].js')

let dir
let server
let base

// Mimics Vercel's Node runtime, which hands the function a request whose JSON body is already parsed.
function vercelLike(req, res) {
  const chunks = []
  req.on('data', (chunk) => chunks.push(chunk))
  req.on('end', () => {
    const raw = Buffer.concat(chunks).toString('utf8')
    if (raw && String(req.headers['content-type'] || '').includes('application/json')) {
      try {
        req.body = JSON.parse(raw)
      } catch {
        res.statusCode = 400
        res.end('{"error":"bad body"}')
        return
      }
    }
    handler(req, res)
  })
}

async function call(pathname, { method = 'GET', body, cookie } = {}) {
  const response = await fetch(`${base}${pathname}`, {
    method,
    headers: {
      'X-Billing-Request': '1',
      'x-real-ip': '203.0.113.20',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const text = await response.text()
  return {
    status: response.status,
    payload: text ? JSON.parse(text) : null,
    setCookie: response.headers.getSetCookie(),
  }
}

before(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'billing-vercel-'))
  server = http.createServer(vercelLike)
  server.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  base = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve) => server.close(resolve))
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('vercel function entry', () => {
  it('fails closed with 503 when no durable database is configured, instead of using temporary disk', async () => {
    const login = await call('/api/billing/login', { method: 'POST', body: { password: PASSWORD } })
    assert.equal(login.status, 503)
    assert.equal(login.payload.code, 'NOT_CONFIGURED')
    assert.equal(login.setCookie.length, 0)
    const invoices = await call('/api/billing/invoices')
    assert.equal(invoices.status, 503)
  })

  it('fails closed when a remote database has no auth token', async () => {
    process.env.BILLING_DATABASE_URL = 'libsql://example-db.turso.io'
    const login = await call('/api/billing/login', { method: 'POST', body: { password: PASSWORD } })
    assert.equal(login.status, 503)
    assert.equal(login.payload.code, 'NOT_CONFIGURED')
  })

  it('serves sign-in, protected data, and logout once storage is configured, retrying after earlier failures', async () => {
    process.env.BILLING_DATABASE_URL = `file:${path.join(dir, 'billing.sqlite')}`
    const anonymous = await call('/api/billing/invoices')
    assert.equal(anonymous.status, 401)
    const wrong = await call('/api/billing/login', { method: 'POST', body: { password: 'nope-nope-nope' } })
    assert.equal(wrong.status, 401)
    const login = await call('/api/billing/login', { method: 'POST', body: { password: PASSWORD } })
    assert.equal(login.status, 200)
    assert.match(login.setCookie[0], /^__Host-billing_session=/)
    assert.match(login.setCookie[0], /; Secure/)
    assert.match(login.setCookie[0], /; HttpOnly/)
    assert.match(login.setCookie[0], /; SameSite=Strict/)
    const cookie = login.setCookie[0].split(';')[0]
    const created = await call('/api/billing/clients', { method: 'POST', cookie, body: { businessName: 'Vercel Client' } })
    assert.equal(created.status, 201)
    const listed = await call('/api/billing/clients', { cookie })
    assert.equal(listed.payload.items.length, 1)
    const out = await call('/api/billing/logout', { method: 'POST', cookie })
    assert.equal(out.status, 204)
    const after = await call('/api/billing/clients', { cookie })
    assert.equal(after.status, 401)
  })
})

describe('vercel.json', () => {
  const config = JSON.parse(fs.readFileSync(path.resolve('vercel.json'), 'utf8'))

  it('keeps the single-page-app rewrite away from /api and still serves /billing', () => {
    const rule = config.rewrites.find((item) => item.destination.includes('index.html'))
    const pattern = new RegExp(`^${rule.source}$`)
    assert.equal(pattern.test('/billing'), true)
    assert.equal(pattern.test('/billing/invoices/123'), true)
    assert.equal(pattern.test('/about'), true)
    assert.equal(pattern.test('/api/billing/login'), false)
    assert.equal(pattern.test('/api/billing/session'), false)
  })

  it('bundles the migrations with the billing function', () => {
    const entry = config.functions['api/billing/[...path].js']
    assert.ok(entry)
    assert.match(entry.includeFiles, /server\/migrations/)
    assert.equal(fs.existsSync(path.resolve('api/billing/[...path].js')), true)
  })
})
