import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { after, before, describe, it } from 'node:test'
import { createHash } from 'node:crypto'
import { createApp } from './app.js'
import { extractPdfText } from './pdf-text.js'

process.env.BILLING_ADMIN_PASSWORD = 'test-password-not-real'
process.env.BILLING_SERVE_STATIC = '0'

let server
let app
let base
let cookie
let dataRoot

function cookieHeader(response) {
  const cookies = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : [response.headers.get('set-cookie')].filter(Boolean)
  return cookies.map((item) => item.split(';')[0]).join('; ')
}

async function login(password = process.env.BILLING_ADMIN_PASSWORD) {
  const response = await fetch(`${base}/api/billing/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Billing-Request': '1' },
    body: JSON.stringify({ password }),
  })
  return { status: response.status, cookie: cookieHeader(response), payload: await response.json() }
}

async function api(pathname, { method = 'GET', body, key, token = cookie } = {}) {
  const response = await fetch(`${base}${pathname}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      'X-Billing-Request': '1',
      ...(key ? { 'Idempotency-Key': key } : {}),
      ...(token ? { Cookie: token } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const text = await response.text()
  let payload = null
  if (text) payload = JSON.parse(text)
  return { status: response.status, payload }
}

async function pdf(pathname) {
  const response = await fetch(`${base}${pathname}${pathname.includes('?') ? '&' : '?'}compress=0`, {
    headers: { Cookie: cookie },
  })
  return { status: response.status, buffer: Buffer.from(await response.arrayBuffer()), type: response.headers.get('content-type') }
}

function invoiceBody(overrides = {}) {
  return {
    currency: 'NGN',
    issueDate: '2026-10-01',
    dueDate: '2026-10-31',
    projectTitle: 'Platform build',
    projectDescription: 'Full-stack delivery',
    client: { businessName: 'Northwind Studio', email: 'accounts@northwind.test', phone: '', billingAddress: '', taxDetails: '' },
    saveClient: true,
    issuer: {
      professionalName: 'Patrick Chukwu',
      businessName: '',
      email: 'chukwupatrickify@gmail.com',
      phone: '',
      address: '',
      paymentInstructions: 'Pay by bank transfer.',
    },
    lines: [{ description: 'Software development', quantity: '1', unitPrice: '1500000.00' }],
    discount: '0',
    taxRate: '0',
    milestoneMode: 'percent',
    milestones: [
      { description: 'Commencement', trigger: 'On commencement', percent: '50' },
      { description: 'Full-stack delivery', trigger: 'On delivery', percent: '30' },
      { description: 'Final review', trigger: 'On final review', percent: '20' },
    ],
    ...overrides,
  }
}

before(async () => {
  dataRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'billing-'))
  app = createApp({ dbPath: path.join(dataRoot, 'billing.sqlite'), dataRoot, serveStatic: false })
  await app.locals.ready()
  server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  base = `http://127.0.0.1:${server.address().port}`
  const signedIn = await login()
  assert.equal(signedIn.status, 200)
  cookie = signedIn.cookie
})

after(() => new Promise((resolve) => {
  server.close(async () => {
    await app.locals.close()
    fs.rmSync(dataRoot, { recursive: true, force: true })
    resolve()
  })
}))

describe('billing api', () => {
  it('blocks anonymous access to invoices, clients, and pdf downloads', async () => {
    const invoices = await api('/api/billing/invoices', { token: '' })
    const clients = await api('/api/billing/clients', { token: '' })
    const pdfResponse = await fetch(`${base}/api/billing/invoices/missing/pdf`)
    assert.equal(invoices.status, 401)
    assert.equal(clients.status, 401)
    assert.equal(pdfResponse.status, 401)
    const wrong = await login('not-the-password')
    assert.equal(wrong.status, 401)
    const forged = await api('/api/billing/clients', { token: 'billing_session=forged' })
    assert.equal(forged.status, 401)
  })

  it('rejects writes that omit the billing header', async () => {
    const response = await fetch(`${base}/api/billing/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ businessName: 'Blocked Client' }),
    })
    assert.equal(response.status, 403)
  })

  it('saves and edits drafts with server-side totals', async () => {
    const created = await api('/api/billing/invoices', { method: 'POST', body: invoiceBody({
      client: { businessName: 'Draft Client' },
      lines: [{ description: 'Discovery', quantity: '2.5', unitPrice: '100.00' }],
      discount: '10.00',
      taxRate: '7.5',
      taxLabel: 'VAT',
      milestoneMode: 'none',
      milestones: [],
      issueDate: '2020-01-01',
      dueDate: '2020-01-15',
    }) })
    assert.equal(created.status, 201)
    assert.equal(created.payload.lifecycle, 'draft')
    assert.equal(created.payload.status, 'draft')
    assert.equal(created.payload.overdue, false)
    assert.equal(created.payload.lines[0].lineTotalMinor, 25000)
    assert.equal(created.payload.subtotalMinor, 25000)
    assert.equal(created.payload.discountMinor, 1000)
    assert.equal(created.payload.taxMinor, 1800)
    assert.equal(created.payload.totalMinor, 25800)
    const updated = await api(`/api/billing/invoices/${created.payload.id}`, {
      method: 'PUT',
      body: invoiceBody({
        clientId: created.payload.clientId,
        client: { businessName: 'Draft Client' },
        saveClient: false,
        lines: [{ description: 'Discovery', quantity: '1', unitPrice: '80.00' }],
        milestoneMode: 'none',
        milestones: [],
      }),
    })
    assert.equal(updated.status, 200)
    assert.equal(updated.payload.totalMinor, 8000)
    assert.equal(updated.payload.number, created.payload.number)
  })

  it('assigns unique invoice numbers', async () => {
    const first = await api('/api/billing/invoices', { method: 'POST', body: invoiceBody({ client: { businessName: 'Number A' }, milestoneMode: 'none', milestones: [] }) })
    const second = await api('/api/billing/invoices', { method: 'POST', body: invoiceBody({ client: { businessName: 'Number B' }, milestoneMode: 'none', milestones: [] }) })
    assert.notEqual(first.payload.number, second.payload.number)
    assert.match(first.payload.number, /^INV-\d{4}-\d{4,}$/)
  })

  it('keeps issued snapshots when the client profile changes and calculates 50/30/20', async () => {
    const created = await api('/api/billing/invoices', { method: 'POST', body: invoiceBody({
      client: { businessName: 'Snapshot Studio', email: 'billing@snapshot.test' },
    }) })
    const issued = await api(`/api/billing/invoices/${created.payload.id}/issue`, { method: 'POST' })
    assert.equal(issued.status, 200)
    assert.deepEqual(issued.payload.milestones.map((item) => item.amountMinor), [75000000, 45000000, 30000000])
    assert.equal(issued.payload.milestones.reduce((sum, item) => sum + item.amountMinor, 0), 150000000)
    const renamed = await api(`/api/billing/clients/${issued.payload.clientId}`, {
      method: 'PUT',
      body: { businessName: 'Snapshot Studio Holdings', email: 'new@snapshot.test' },
    })
    assert.equal(renamed.status, 200)
    await api('/api/billing/settings', {
      method: 'PUT',
      body: { professionalName: 'Patrick Chukwu', email: 'changed@example.com', paymentInstructions: 'Changed later' },
    })
    const reread = await api(`/api/billing/invoices/${created.payload.id}`)
    assert.equal(reread.payload.client.businessName, 'Snapshot Studio')
    assert.equal(reread.payload.client.email, 'billing@snapshot.test')
    assert.equal(reread.payload.issuer.email, 'chukwupatrickify@gmail.com')
    assert.equal(reread.payload.issuer.paymentInstructions, 'Pay by bank transfer.')
    const locked = await api(`/api/billing/invoices/${created.payload.id}`, {
      method: 'PUT',
      body: invoiceBody({ lines: [{ description: 'Changed', quantity: '1', unitPrice: '1.00' }] }),
    })
    assert.equal(locked.status, 409)
    const logoBefore = createHash('sha256').update(fs.readFileSync(path.resolve('src/assets/Patrick.png'))).digest('hex')
    const logoAfter = createHash('sha256').update(fs.readFileSync(path.resolve('src/assets/Patrick.png'))).digest('hex')
    assert.equal(logoBefore, logoAfter)
  })

  it('records the 750/450/300 schedule, blocks duplicates, and receipts only real payments', async () => {
    const created = await api('/api/billing/invoices', { method: 'POST', body: invoiceBody({
      client: { businessName: 'Milestone Client' },
      projectTitle: 'Retainer 2026',
    }) })
    const issued = await api(`/api/billing/invoices/${created.payload.id}/issue`, { method: 'POST' })
    assert.equal(issued.status, 200)
    const beforePay = await pdf(`/api/billing/invoices/${created.payload.id}/pdf`)
    assert.equal(beforePay.status, 200)
    assert.equal(beforePay.type, 'application/pdf')
    assert.equal(beforePay.buffer.subarray(0, 5).toString(), '%PDF-')
    const invoiceText = extractPdfText(beforePay.buffer)
    assert.match(invoiceText, /Milestone Client/)
    assert.match(invoiceText, /1,500,000\.00/)
    assert.match(invoiceText, new RegExp(issued.payload.number))
    const untouched = await api(`/api/billing/invoices/${created.payload.id}`)
    assert.equal(untouched.payload.payments.length, 0)
    assert.equal(untouched.payload.paidMinor, 0)

    const steps = [
      ['750000.00', 75000000, 'partially_paid'],
      ['450000.00', 30000000, 'partially_paid'],
      ['300000.00', 0, 'paid'],
    ]
    const receiptNumbers = []
    for (let index = 0; index < steps.length; index += 1) {
      const [amount, outstanding, status] = steps[index]
      const paid = await api(`/api/billing/invoices/${created.payload.id}/payments`, {
        method: 'POST',
        key: `milestone-${created.payload.id}-${index}`,
        body: { amount, receivedOn: `2026-10-0${index + 2}`, method: 'bank_transfer', reference: `REF-${index + 1}` },
      })
      assert.equal(paid.status, 201)
      assert.equal(paid.payload.invoice.outstandingMinor, outstanding)
      assert.equal(paid.payload.invoice.status, status)
      const replay = await api(`/api/billing/invoices/${created.payload.id}/payments`, {
        method: 'POST',
        key: `milestone-${created.payload.id}-${index}`,
        body: { amount, receivedOn: `2026-10-0${index + 2}`, method: 'bank_transfer', reference: `REF-${index + 1}` },
      })
      assert.equal(replay.status, 200)
      assert.equal(replay.payload.replay, true)
      assert.equal(replay.payload.invoice.payments.filter((item) => item.status === 'recorded').length, index + 1)
      const receipt = await api(`/api/billing/payments/${paid.payload.paymentId}/receipt`, { method: 'POST' })
      assert.equal(receipt.status, 201)
      receiptNumbers.push(receipt.payload.number)
      const again = await api(`/api/billing/payments/${paid.payload.paymentId}/receipt`, { method: 'POST' })
      assert.equal(again.payload.number, receipt.payload.number)
      assert.equal(again.payload.snapshot.partial, outstanding > 0)
      if (outstanding > 0) assert.match(again.payload.snapshot.amountWords, /naira only/)
    }
    assert.equal(new Set(receiptNumbers).size, 3)
    const finalInvoice = await api(`/api/billing/invoices/${created.payload.id}`)
    assert.equal(finalInvoice.payload.status, 'paid')
    assert.equal(finalInvoice.payload.outstandingMinor, 0)
    assert.equal(finalInvoice.payload.paidMinor, 150000000)
    const receiptPdf = await pdf(`/api/billing/receipts/${finalInvoice.payload.payments[0].receipt.id}/pdf`)
    assert.equal(receiptPdf.status, 200)
    assert.equal(receiptPdf.buffer.subarray(0, 5).toString(), '%PDF-')
    const receiptText = extractPdfText(receiptPdf.buffer)
    assert.match(receiptText, /does not mean/)
    assert.match(receiptText, new RegExp(finalInvoice.payload.payments[0].receipt.number))

    const dashboard = await api(`/api/billing/dashboard?clientId=${created.payload.clientId}`)
    assert.equal(dashboard.payload.cards.invoicedMinor, 150000000)
    assert.equal(dashboard.payload.cards.paymentsMinor, 150000000)
    assert.equal(dashboard.payload.cards.outstandingMinor, 0)
    assert.equal(dashboard.payload.cards.receiptCount, 3)
    assert.equal(dashboard.payload.cards.invoiceCount, 1)
  })

  it('rejects overpayment unless confirmed and reverses payments without deleting receipts', async () => {
    const created = await api('/api/billing/invoices', { method: 'POST', body: invoiceBody({
      client: { businessName: 'Reversal Client' },
      lines: [{ description: 'Workshop', quantity: '1', unitPrice: '1000.00' }],
      milestoneMode: 'none',
      milestones: [],
    }) })
    await api(`/api/billing/invoices/${created.payload.id}/issue`, { method: 'POST' })
    const key = `reversal-${created.payload.id}`
    const paid = await api(`/api/billing/invoices/${created.payload.id}/payments`, {
      method: 'POST',
      key,
      body: { amount: '400.00', receivedOn: '2026-10-03', method: 'cash' },
    })
    const receipt = await api(`/api/billing/payments/${paid.payload.paymentId}/receipt`, { method: 'POST' })
    const tooMuch = await api(`/api/billing/invoices/${created.payload.id}/payments`, {
      method: 'POST',
      key: `${key}-over`,
      body: { amount: '700.00', receivedOn: '2026-10-04', method: 'card' },
    })
    assert.equal(tooMuch.status, 409)
    assert.equal(tooMuch.payload.code, 'OVERPAYMENT')
    const confirmed = await api(`/api/billing/invoices/${created.payload.id}/payments`, {
      method: 'POST',
      key: `${key}-over-confirmed`,
      body: { amount: '700.00', receivedOn: '2026-10-04', method: 'card', confirmOverpayment: true },
    })
    assert.equal(confirmed.status, 201)
    assert.equal(confirmed.payload.invoice.outstandingMinor, 0)
    assert.equal(confirmed.payload.invoice.overpaidMinor, 10000)
    const reversed = await api(`/api/billing/payments/${paid.payload.paymentId}/reverse`, {
      method: 'POST',
      body: { reason: 'Recorded the wrong amount' },
    })
    assert.equal(reversed.status, 200)
    const kept = reversed.payload.payments.find((item) => item.id === paid.payload.paymentId)
    assert.equal(kept.status, 'reversed')
    assert.equal(kept.receipt.number, receipt.payload.number)
    const missingDelete = await api(`/api/billing/payments/${paid.payload.paymentId}`, { method: 'DELETE' })
    assert.equal(missingDelete.status, 404)
    const cancelled = await api(`/api/billing/invoices/${created.payload.id}/cancel`, {
      method: 'POST',
      body: { reason: 'Engagement ended' },
    })
    assert.equal(cancelled.status, 200)
    assert.equal(cancelled.payload.status, 'cancelled')
    assert.equal(cancelled.payload.outstandingMinor, 0)
    assert.equal(cancelled.payload.payments.length, 2)
    const afterCancel = await api(`/api/billing/invoices/${created.payload.id}/payments`, {
      method: 'POST',
      key: `${key}-after-cancel`,
      body: { amount: '10.00', receivedOn: '2026-10-05', method: 'cash' },
    })
    assert.equal(afterCancel.status, 409)
    const cards = await api(`/api/billing/dashboard?clientId=${created.payload.clientId}`)
    assert.equal(cards.payload.cards.outstandingMinor, 0)
    assert.equal(cards.payload.cards.invoicedMinor, 0)
  })

  it('builds a multi-page invoice pdf from stored lines', async () => {
    const lines = Array.from({ length: 40 }, (_, index) => ({
      description: `Service line ${String(index + 1).padStart(2, '0')} for the retained engagement`,
      quantity: '1',
      unitPrice: '10.00',
    }))
    const created = await api('/api/billing/invoices', { method: 'POST', body: invoiceBody({
      client: { businessName: 'Paged Client' },
      lines,
      milestoneMode: 'none',
      milestones: [],
    }) })
    const issued = await api(`/api/billing/invoices/${created.payload.id}/issue`, { method: 'POST' })
    assert.equal(issued.status, 200)
    const file = await pdf(`/api/billing/invoices/${created.payload.id}/pdf`)
    assert.equal(file.buffer.subarray(0, 5).toString(), '%PDF-')
    const pageObjects = file.buffer.toString('latin1').match(/\/Type \/Page(?!s)/g)
    assert.ok(pageObjects.length >= 2)
    const text = extractPdfText(file.buffer)
    assert.match(text, /Service line 01/)
    assert.match(text, /Service line 40/)
    assert.match(text, new RegExp(issued.payload.number))
  })

  it('does not issue an invalid milestone schedule', async () => {
    const created = await api('/api/billing/invoices', { method: 'POST', body: invoiceBody({
      client: { businessName: 'Bad Schedule' },
      milestones: [
        { description: 'Start', percent: '40' },
        { description: 'End', percent: '40' },
      ],
    }) })
    assert.equal(created.status, 201)
    const issued = await api(`/api/billing/invoices/${created.payload.id}/issue`, { method: 'POST' })
    assert.equal(issued.status, 400)
    assert.equal(issued.payload.code, 'MILESTONE')
    const reread = await api(`/api/billing/invoices/${created.payload.id}`)
    assert.equal(reread.payload.lifecycle, 'draft')
  })
})
