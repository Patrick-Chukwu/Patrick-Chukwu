import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { after, before, describe, it } from 'node:test'
import { createApp } from './app.js'

process.env.BILLING_ADMIN_PASSWORD = 'test-password-not-real'
delete process.env.BILLING_SERVE_STATIC
delete process.env.VERCEL

let dir
let app
let server
let base

before(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'billing-static-'))
  fs.mkdirSync(path.join(dir, 'dist', 'assets'), { recursive: true })
  fs.writeFileSync(path.join(dir, 'dist', 'index.html'), '<!doctype html><html><body>portfolio</body></html>')
  fs.writeFileSync(path.join(dir, 'dist', 'assets', 'app.js'), 'console.log(1)')
  app = createApp({ rootDir: dir, dbPath: path.join(dir, 'billing.sqlite') })
  server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  base = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve) => server.close(resolve))
  await app.locals.close()
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('single-process production server (npm start)', () => {
  it('serves the portfolio and the /billing page without authentication', async () => {
    for (const url of ['/', '/billing', '/billing/invoices/abc', '/about']) {
      const response = await fetch(`${base}${url}`)
      assert.equal(response.status, 200, url)
      assert.match(await response.text(), /portfolio/)
    }
    const asset = await fetch(`${base}/assets/app.js`)
    assert.equal(asset.status, 200)
  })

  it('answers billing api paths with json, never with the html shell', async () => {
    const response = await fetch(`${base}/api/billing/invoices`)
    assert.equal(response.status, 401)
    assert.match(response.headers.get('content-type'), /application\/json/)
    const missing = await fetch(`${base}/api/does-not-exist`)
    assert.equal(missing.status, 404)
    assert.doesNotMatch(await missing.text(), /portfolio/)
  })
})
