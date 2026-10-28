import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { login, logout, requireAuth, session } from './auth.js'
import {
  buildInvoicePdfModel,
  buildReceiptPdfModel,
  cancelInvoice,
  createClient,
  createInvoice,
  createReceipt,
  currentLogo,
  deleteDraft,
  duplicateInvoice,
  getClient,
  getDashboard,
  getInvoice,
  getReceipt,
  getSettings,
  invoiceLogo,
  issueInvoice,
  listClients,
  listInvoices,
  listProjects,
  listReceipts,
  recordPayment,
  reversePayment,
  reviseInvoice,
  updateClient,
  updateInvoice,
  updateSettings,
} from './billing-service.js'
import { ConfigError, openDatabase } from './db.js'
import { HttpError } from './errors.js'
import { renderInvoicePdf, renderReceiptPdf } from './pdf.js'

const UNSAFE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}

// JSON route: runs `fn(req)` and sends its result as JSON with the given status.
function json(fn, status = 200) {
  return asyncRoute(async (req, res) => {
    res.status(status).json(await fn(req))
  })
}

function sendPdf(res, buffer, filename) {
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.send(buffer)
}

function sendImage(res, file) {
  if (!file) {
    res.status(404).json({ error: 'Logo not found', code: 'NOT_FOUND' })
    return
  }
  res.setHeader('Content-Type', file.contentType)
  res.setHeader('Cache-Control', 'private, no-store')
  res.send(file.buffer)
}

// Vercel's Node runtime may already have parsed the body; otherwise read it ourselves.
function jsonBody(parser) {
  return (req, res, next) => {
    if (!UNSAFE_METHODS.includes(req.method)) {
      next()
      return
    }
    let parsed
    try {
      parsed = req.body
    } catch {
      res.status(400).json({ error: 'Invalid request body', code: 'VALIDATION' })
      return
    }
    if (parsed && typeof parsed === 'object' && !Buffer.isBuffer(parsed)) {
      req._body = true
      next()
      return
    }
    parser(req, res, next)
  }
}

// CSRF defence on top of the SameSite=Strict cookie: writes must carry the custom header
// and, when the browser sends an Origin, it must be this site.
function sameOriginWrites(req, res, next) {
  if (!UNSAFE_METHODS.includes(req.method)) {
    next()
    return
  }
  if (req.get('x-billing-request') !== '1') {
    res.status(403).json({ error: 'Missing billing request header', code: 'CSRF' })
    return
  }
  const origin = req.get('origin')
  if (origin) {
    let originHost = ''
    try {
      originHost = new URL(origin).host
    } catch {
      originHost = ''
    }
    const hosts = [req.get('x-forwarded-host'), req.get('host')].filter(Boolean).map((value) => value.split(',')[0].trim())
    if (!originHost || !hosts.includes(originHost)) {
      res.status(403).json({ error: 'Cross-site request blocked', code: 'CSRF' })
      return
    }
  }
  next()
}

function mount(app) {
  const router = express.Router()
  router.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'no-referrer')
    next()
  })
  router.use(jsonBody(express.json({ limit: '1mb' })))
  router.use(sameOriginWrites)

  router.get('/health', (req, res) => res.json({ ok: true }))
  // Everything below needs the database. It is opened lazily so a cold start or a
  // misconfiguration is reported as a clean 503 instead of crashing the function.
  router.use(asyncRoute(async (req, res, next) => {
    try {
      req.app.locals.ctx = await req.app.locals.ready()
    } catch (error) {
      if (error instanceof ConfigError) throw error
      console.error('billing storage could not be opened', error.name || 'Error', error.code || '')
      throw new HttpError(503, 'Billing storage is unavailable. Try again shortly.', 'UNAVAILABLE')
    }
    next()
  }))
  router.post('/login', asyncRoute(login))
  router.post('/logout', asyncRoute(logout))
  router.get('/session', asyncRoute(session))
  router.use(requireAuth)

  const ctx = (req) => req.app.locals.ctx

  router.get('/settings', json((req) => getSettings(ctx(req).db)))
  router.put('/settings', json((req) => updateSettings(ctx(req).db, ctx(req).dataRoot, req.body)))
  router.get('/settings/logo', asyncRoute(async (req, res) => {
    const { db, dataRoot, portfolioLogo } = ctx(req)
    sendImage(res, await currentLogo(db, dataRoot, portfolioLogo))
  }))

  router.get('/clients', json(async (req) => ({ items: await listClients(ctx(req).db) })))
  router.post('/clients', json((req) => createClient(ctx(req).db, req.body), 201))
  router.get('/clients/:id', json((req) => getClient(ctx(req).db, req.params.id)))
  router.put('/clients/:id', json((req) => updateClient(ctx(req).db, req.params.id, req.body)))

  router.get('/projects', json(async (req) => ({ items: await listProjects(ctx(req).db, req.query.clientId || '') })))

  router.get('/dashboard', json((req) => getDashboard(ctx(req).db, req.query)))
  router.get('/invoices', json((req) => listInvoices(ctx(req).db, req.query)))
  router.post('/invoices', json((req) => createInvoice(ctx(req).db, req.body), 201))
  router.get('/invoices/:id', json((req) => getInvoice(ctx(req).db, req.params.id)))
  router.put('/invoices/:id', json((req) => updateInvoice(ctx(req).db, req.params.id, req.body)))
  router.delete('/invoices/:id', json((req) => deleteDraft(ctx(req).db, req.params.id)))
  router.post('/invoices/:id/issue', json((req) => issueInvoice(ctx(req).db, ctx(req).dataRoot, ctx(req).portfolioLogo, req.params.id)))
  router.post('/invoices/:id/cancel', json((req) => cancelInvoice(ctx(req).db, req.params.id, req.body)))
  router.post('/invoices/:id/duplicate', json((req) => duplicateInvoice(ctx(req).db, req.params.id), 201))
  router.post('/invoices/:id/revise', json((req) => reviseInvoice(ctx(req).db, req.params.id), 201))
  router.get('/invoices/:id/logo', asyncRoute(async (req, res) => {
    const { db, dataRoot, portfolioLogo } = ctx(req)
    sendImage(res, await invoiceLogo(db, dataRoot, portfolioLogo, req.params.id))
  }))
  router.get('/invoices/:id/pdf', asyncRoute(async (req, res) => {
    const { db, dataRoot, portfolioLogo } = ctx(req)
    const model = await buildInvoicePdfModel(db, dataRoot, portfolioLogo, req.params.id)
    const buffer = await renderInvoicePdf(model, { compress: req.query.compress !== '0' })
    sendPdf(res, buffer, `${model.number}.pdf`)
  }))
  router.post('/invoices/:id/payments', asyncRoute(async (req, res) => {
    const result = await recordPayment(ctx(req).db, req.params.id, req.body, req.get('idempotency-key'))
    res.status(result.replay ? 200 : 201).json(result)
  }))

  router.post('/payments/:id/reverse', json((req) => reversePayment(ctx(req).db, req.params.id, req.body)))
  router.post('/payments/:id/receipt', json((req) => createReceipt(ctx(req).db, req.params.id), 201))

  router.get('/receipts', json((req) => listReceipts(ctx(req).db, req.query)))
  router.get('/receipts/:id', json((req) => getReceipt(ctx(req).db, req.params.id)))
  router.get('/receipts/:id/pdf', asyncRoute(async (req, res) => {
    const { db, dataRoot, portfolioLogo } = ctx(req)
    const model = await buildReceiptPdfModel(db, dataRoot, portfolioLogo, req.params.id)
    const buffer = await renderReceiptPdf(model, { compress: req.query.compress !== '0' })
    sendPdf(res, buffer, `${model.number}.pdf`)
  }))

  router.use((req, res) => res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' }))
  router.use((error, req, res, next) => {
    if (res.headersSent) {
      next(error)
      return
    }
    if (error instanceof ConfigError) {
      // Names of the missing variables go to the server log only.
      console.error(`billing storage is not configured: set ${error.variables.join(', ')} for this Vercel environment`)
      res.status(503).json({ error: 'Billing storage is not configured on the server', code: 'NOT_CONFIGURED' })
      return
    }
    if (error.type === 'entity.parse.failed' || error.type === 'entity.too.large') {
      res.status(error.status || 400).json({ error: 'Invalid request body', code: 'VALIDATION' })
      return
    }
    const status = error.status || error.statusCode || 500
    if (status >= 500 && error.code !== 'NOT_CONFIGURED') console.error('billing request failed', error.name || 'Error', error.code || '')
    res.status(status).json({
      error: status >= 500 && error.code !== 'NOT_CONFIGURED' ? 'Something went wrong' : error.message,
      code: error.code || (status >= 500 ? 'INTERNAL' : 'ERROR'),
      ...(error.details ? { details: error.details } : {}),
    })
  })
  app.use('/api/billing', router)
}

export function createApp(options = {}) {
  const rootDir = options.rootDir || path.resolve(import.meta.dirname, '..')
  const portfolioLogo = options.portfolioLogo || fileURLToPath(new URL('../src/assets/Patrick.png', import.meta.url))
  const app = express()
  app.disable('x-powered-by')
  let opening = null
  // Opens storage once per process. A failed attempt is not cached, so the next request retries.
  app.locals.ready = () => {
    if (!opening) {
      const attempt = openDatabase({ url: options.url, authToken: options.authToken, dbPath: options.dbPath }).then((db) => {
        const dataRoot = options.dataRoot || (db.info.local ? path.dirname(db.info.url.slice('file:'.length)) : null)
        return { db, dataRoot, portfolioLogo, rootDir }
      })
      attempt.catch(() => {
        if (opening === attempt) opening = null
      })
      opening = attempt
    }
    return opening
  }
  app.locals.close = async () => {
    const pending = opening
    opening = null
    if (!pending) return
    const ctx = await pending.catch(() => null)
    ctx?.db.close()
  }
  mount(app)
  const serveStatic = options.serveStatic !== false && process.env.BILLING_SERVE_STATIC !== '0'
  const dist = path.join(rootDir, 'dist')
  if (serveStatic && fs.existsSync(dist)) {
    app.use(express.static(dist, { index: false }))
    app.get(/^(?!\/api\/).*/, (req, res, next) => {
      res.sendFile(path.join(dist, 'index.html'), (error) => {
        if (error) next()
      })
    })
  }
  return app
}
