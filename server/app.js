import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import { login, logout, requireAuth, session } from './auth.js'
import {
  buildInvoicePdfModel,
  buildReceiptPdfModel,
  cancelInvoice,
  createClient,
  createInvoice,
  createReceipt,
  currentLogoAbsolute,
  deleteDraft,
  duplicateInvoice,
  getClient,
  getDashboard,
  getInvoice,
  getReceipt,
  getSettings,
  invoiceLogoAbsolute,
  issueInvoice,
  listClients,
  listInvoices,
  listProjects,
  listReceipts,
  readLogoFile,
  recordPayment,
  reversePayment,
  reviseInvoice,
  updateClient,
  updateInvoice,
  updateSettings,
} from './billing-service.js'
import { openDatabase } from './db.js'
import { renderInvoicePdf, renderReceiptPdf } from './pdf.js'

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
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

function mount(app) {
  const router = express.Router()
  router.use(express.json({ limit: '1mb' }))
  router.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'no-referrer')
    next()
  })
  router.use((req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.get('x-billing-request') !== '1') {
      res.status(403).json({ error: 'Missing billing request header', code: 'CSRF' })
      return
    }
    next()
  })

  router.get('/health', (req, res) => res.json({ ok: true }))
  router.post('/login', login)
  router.post('/logout', logout)
  router.get('/session', session)
  router.use(requireAuth)

  const ctx = (req) => req.app.locals.ctx

  router.get('/settings', (req, res) => res.json(getSettings(ctx(req).db)))
  router.put('/settings', (req, res) => res.json(updateSettings(ctx(req).db, ctx(req).dataRoot, req.body)))
  router.get('/settings/logo', (req, res) => {
    const { db, dataRoot, portfolioLogo } = ctx(req)
    sendImage(res, readLogoFile(currentLogoAbsolute(db, dataRoot, portfolioLogo)))
  })

  router.get('/clients', (req, res) => res.json({ items: listClients(ctx(req).db) }))
  router.post('/clients', (req, res) => res.status(201).json(createClient(ctx(req).db, req.body)))
  router.get('/clients/:id', (req, res) => res.json(getClient(ctx(req).db, req.params.id)))
  router.put('/clients/:id', (req, res) => res.json(updateClient(ctx(req).db, req.params.id, req.body)))

  router.get('/projects', (req, res) => res.json({ items: listProjects(ctx(req).db, req.query.clientId || '') }))

  router.get('/dashboard', (req, res) => res.json(getDashboard(ctx(req).db, req.query)))
  router.get('/invoices', (req, res) => res.json(listInvoices(ctx(req).db, req.query)))
  router.post('/invoices', (req, res) => res.status(201).json(createInvoice(ctx(req).db, req.body)))
  router.get('/invoices/:id', (req, res) => res.json(getInvoice(ctx(req).db, req.params.id)))
  router.put('/invoices/:id', (req, res) => res.json(updateInvoice(ctx(req).db, req.params.id, req.body)))
  router.delete('/invoices/:id', (req, res) => res.json(deleteDraft(ctx(req).db, req.params.id)))
  router.post('/invoices/:id/issue', (req, res) => res.json(issueInvoice(ctx(req).db, ctx(req).dataRoot, ctx(req).portfolioLogo, req.params.id)))
  router.post('/invoices/:id/cancel', (req, res) => res.json(cancelInvoice(ctx(req).db, req.params.id, req.body)))
  router.post('/invoices/:id/duplicate', (req, res) => res.status(201).json(duplicateInvoice(ctx(req).db, req.params.id)))
  router.post('/invoices/:id/revise', (req, res) => res.status(201).json(reviseInvoice(ctx(req).db, req.params.id)))
  router.get('/invoices/:id/logo', (req, res) => {
    const { db, dataRoot, portfolioLogo } = ctx(req)
    sendImage(res, readLogoFile(invoiceLogoAbsolute(db, dataRoot, portfolioLogo, req.params.id)))
  })
  router.get('/invoices/:id/pdf', asyncRoute(async (req, res) => {
    const { db, dataRoot, portfolioLogo } = ctx(req)
    const model = buildInvoicePdfModel(db, dataRoot, portfolioLogo, req.params.id)
    const buffer = await renderInvoicePdf(model, { compress: req.query.compress !== '0' })
    sendPdf(res, buffer, `${model.number}.pdf`)
  }))
  router.post('/invoices/:id/payments', (req, res) => {
    const result = recordPayment(ctx(req).db, req.params.id, req.body, req.get('idempotency-key'))
    res.status(result.replay ? 200 : 201).json(result)
  })

  router.post('/payments/:id/reverse', (req, res) => res.json(reversePayment(ctx(req).db, req.params.id, req.body)))
  router.post('/payments/:id/receipt', (req, res) => {
    const receipt = createReceipt(ctx(req).db, req.params.id)
    res.status(201).json(receipt)
  })

  router.get('/receipts', (req, res) => res.json(listReceipts(ctx(req).db, req.query)))
  router.get('/receipts/:id', (req, res) => res.json(getReceipt(ctx(req).db, req.params.id)))
  router.get('/receipts/:id/pdf', asyncRoute(async (req, res) => {
    const { db, dataRoot, portfolioLogo } = ctx(req)
    const model = buildReceiptPdfModel(db, dataRoot, portfolioLogo, req.params.id)
    const buffer = await renderReceiptPdf(model, { compress: req.query.compress !== '0' })
    sendPdf(res, buffer, `${model.number}.pdf`)
  }))

  router.use((req, res) => res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' }))
  router.use((error, req, res, next) => {
    if (res.headersSent) {
      next(error)
      return
    }
    const status = error.status || error.statusCode || 500
    if (status >= 500) console.error('billing request failed', error.name || 'Error')
    res.status(status).json({
      error: status >= 500 ? 'Something went wrong' : error.message,
      code: error.code || (status >= 500 ? 'INTERNAL' : 'ERROR'),
      ...(error.details ? { details: error.details } : {}),
    })
  })
  app.use('/api/billing', router)
}

export function createApp(options = {}) {
  const rootDir = options.rootDir || path.resolve(import.meta.dirname, '..')
  const dbPath = options.dbPath || process.env.BILLING_DATABASE_PATH || path.join(rootDir, 'data', 'billing.sqlite')
  const dataRoot = options.dataRoot || (dbPath === ':memory:' ? rootDir : path.dirname(path.resolve(dbPath)))
  if (dbPath !== ':memory:') fs.mkdirSync(dataRoot, { recursive: true })
  const portfolioLogo = options.portfolioLogo || path.join(rootDir, 'src', 'assets', 'Patrick.png')
  const db = openDatabase(dbPath)
  const app = express()
  app.disable('x-powered-by')
  app.locals.ctx = { db, dataRoot, portfolioLogo, rootDir }
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
