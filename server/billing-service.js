import { createHash, randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import {
  PAYMENT_METHODS,
  PROFESSIONAL_NAME,
  currencyAllowed,
  methodLabel,
} from '../shared/branding.js'
import { addDaysISO, isIsoDate, todayISO } from '../shared/dates.js'
import {
  bpsToPercentInput,
  computePercentMilestones,
  computeTotals,
  lineTotalMinor,
  milliToInput,
  minorToInput,
  parseMoneyToMinor,
  parsePercentToBps,
  parseQuantityToMilli,
  paymentPosition,
  statusMatches,
} from '../shared/money.js'
import { formatDocumentNumber } from '../shared/numbers.js'
import { amountInWords } from '../shared/words.js'
import { withTransaction } from './db.js'
import { HttpError } from './errors.js'

function nowIso() {
  return new Date().toISOString()
}

function readJson(value, fallback = null) {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function clip(value, max, label, required = false) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (required && !text) throw new HttpError(400, `${label} is required`, 'VALIDATION')
  if (text.length > max) throw new HttpError(400, `${label} must be ${max} characters or fewer`, 'VALIDATION')
  return text
}

function emailOrEmpty(value) {
  const text = clip(value, 200, 'Email')
  if (text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    throw new HttpError(400, 'Enter a valid email address', 'VALIDATION')
  }
  return text
}

function dateOrNull(value, label, required = false) {
  const text = clip(value, 10, label, required)
  if (!text) return null
  if (!isIsoDate(text)) throw new HttpError(400, `${label} must be a real date`, 'VALIDATION')
  return text
}

function currencyOf(value) {
  const code = (typeof value === 'string' && value.trim() ? value.trim() : 'NGN').toUpperCase()
  if (!currencyAllowed(code)) {
    throw new HttpError(400, 'Choose a supported currency. Amounts are not converted.', 'VALIDATION')
  }
  return code
}

function moneyField(value, label) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) return 0
  try {
    const minor = parseMoneyToMinor(text)
    if (minor < 0) throw new Error(`${label} cannot be negative`)
    return minor
  } catch (error) {
    throw new HttpError(400, error.message, 'VALIDATION')
  }
}

function percentField(value) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) return 0
  try {
    return parsePercentToBps(text)
  } catch (error) {
    throw new HttpError(400, error.message, 'VALIDATION')
  }
}

function audit(db, entry) {
  db.prepare(`INSERT INTO audit_events (
    id, entity_type, entity_id, action, summary, metadata_json, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    randomUUID(),
    entry.entityType,
    entry.entityId,
    entry.action,
    entry.summary,
    JSON.stringify(entry.metadata || {}),
    nowIso(),
  )
}

function settingsRow(db) {
  return db.prepare('SELECT * FROM issuer_settings WHERE id = 1').get()
}

export function getSettings(db) {
  const row = settingsRow(db)
  return {
    professionalName: row.professional_name,
    businessName: row.business_name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    paymentInstructions: row.payment_instructions,
    defaultTerms: row.default_terms,
    defaultNotes: row.default_notes,
    hasCustomLogo: Boolean(row.logo_file),
    updatedAt: row.updated_at,
  }
}

function safeDataPath(dataRoot, relative) {
  if (typeof relative !== 'string' || !relative || relative.includes('..')) {
    throw new HttpError(400, 'Invalid file path', 'VALIDATION')
  }
  const root = path.resolve(dataRoot)
  const resolved = path.resolve(root, relative)
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new HttpError(400, 'Invalid file path', 'VALIDATION')
  }
  return resolved
}

function sniffImage(buffer) {
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'png'
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg'
  return ''
}

export function updateSettings(db, dataRoot, body) {
  const current = settingsRow(db)
  const professionalName = clip(body?.professionalName, 200, 'Professional name') || PROFESSIONAL_NAME
  const businessName = clip(body?.businessName, 200, 'Business name')
  const email = emailOrEmpty(body?.email)
  const phone = clip(body?.phone, 40, 'Phone')
  const address = clip(body?.address, 500, 'Address')
  const paymentInstructions = clip(body?.paymentInstructions, 2000, 'Payment instructions')
  const defaultTerms = clip(body?.defaultTerms, 4000, 'Default terms')
  const defaultNotes = clip(body?.defaultNotes, 4000, 'Default notes')
  let logoFile = current.logo_file
  if (body?.clearLogo) {
    if (logoFile) {
      const existing = safeDataPath(dataRoot, logoFile)
      if (fs.existsSync(existing)) fs.unlinkSync(existing)
    }
    logoFile = ''
  }
  if (typeof body?.logoBase64 === 'string' && body.logoBase64) {
    const match = /^data:image\/(?:png|jpeg|jpg);base64,([a-z0-9+/=\s]+)$/i.exec(body.logoBase64.trim())
    if (!match) throw new HttpError(400, 'Upload a PNG or JPEG logo', 'VALIDATION')
    const buffer = Buffer.from(match[1].replace(/\s/g, ''), 'base64')
    if (buffer.length === 0 || buffer.length > 512 * 1024) {
      throw new HttpError(400, 'Logo must be a PNG or JPEG under 512KB', 'VALIDATION')
    }
    const kind = sniffImage(buffer)
    if (!kind) throw new HttpError(400, 'Upload a PNG or JPEG logo', 'VALIDATION')
    const relative = `logos/issuer.${kind === 'jpg' ? 'jpg' : 'png'}`
    const destination = safeDataPath(dataRoot, relative)
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    fs.writeFileSync(destination, buffer)
    if (logoFile && logoFile !== relative) {
      const previous = safeDataPath(dataRoot, logoFile)
      if (fs.existsSync(previous)) fs.unlinkSync(previous)
    }
    logoFile = relative
  }
  db.prepare(`UPDATE issuer_settings SET
    professional_name = ?, business_name = ?, email = ?, phone = ?, address = ?,
    payment_instructions = ?, default_terms = ?, default_notes = ?, logo_file = ?, updated_at = ?
    WHERE id = 1`).run(
    professionalName, businessName, email, phone, address,
    paymentInstructions, defaultTerms, defaultNotes, logoFile, nowIso(),
  )
  audit(db, {
    entityType: 'settings',
    entityId: 'issuer',
    action: 'settings.updated',
    summary: 'Updated invoice settings',
  })
  return getSettings(db)
}

export function currentLogoAbsolute(db, dataRoot, portfolioLogo) {
  const row = settingsRow(db)
  if (row.logo_file) {
    const resolved = safeDataPath(dataRoot, row.logo_file)
    if (fs.existsSync(resolved)) return resolved
  }
  return portfolioLogo
}

export function invoiceLogoAbsolute(db, dataRoot, portfolioLogo, id) {
  const row = mustRow(db, id)
  const issuer = readJson(row.issuer_snapshot_json, {})
  if (row.lifecycle !== 'draft' && issuer.logoFile) {
    const resolved = safeDataPath(dataRoot, issuer.logoFile)
    if (fs.existsSync(resolved)) return resolved
  }
  return currentLogoAbsolute(db, dataRoot, portfolioLogo)
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  return 'image/png'
}

export function readLogoFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null
  return { buffer: fs.readFileSync(filePath), contentType: contentTypeFor(filePath) }
}

function clientFields(source, required = false) {
  return {
    businessName: clip(source?.businessName, 200, 'Client name', required),
    contactPerson: clip(source?.contactPerson, 200, 'Contact person'),
    email: emailOrEmpty(source?.email),
    phone: clip(source?.phone, 40, 'Phone'),
    billingAddress: clip(source?.billingAddress, 500, 'Billing address'),
    taxDetails: clip(source?.taxDetails, 200, 'Tax details'),
  }
}

function mapClient(row) {
  return {
    id: row.id,
    businessName: row.business_name,
    contactPerson: row.contact_person,
    email: row.email,
    phone: row.phone,
    billingAddress: row.billing_address,
    taxDetails: row.tax_details,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function listClients(db) {
  return db.prepare('SELECT * FROM clients ORDER BY business_name COLLATE NOCASE').all().map(mapClient)
}

export function getClient(db, id) {
  const row = db.prepare('SELECT * FROM clients WHERE id = ?').get(id)
  if (!row) throw new HttpError(404, 'Client not found', 'NOT_FOUND')
  return mapClient(row)
}

function writeClient(db, id, fields) {
  db.prepare(`UPDATE clients SET
    business_name = ?, contact_person = ?, email = ?, phone = ?, billing_address = ?, tax_details = ?, updated_at = ?
    WHERE id = ?`).run(
    fields.businessName, fields.contactPerson, fields.email, fields.phone,
    fields.billingAddress, fields.taxDetails, nowIso(), id,
  )
}

export function createClient(db, body) {
  const fields = clientFields(body, true)
  const id = randomUUID()
  const stamp = nowIso()
  db.prepare(`INSERT INTO clients (
    id, business_name, contact_person, email, phone, billing_address, tax_details, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id, fields.businessName, fields.contactPerson, fields.email, fields.phone,
    fields.billingAddress, fields.taxDetails, stamp, stamp,
  )
  audit(db, { entityType: 'client', entityId: id, action: 'client.created', summary: `Saved client ${fields.businessName}`, metadata: { clientId: id } })
  return getClient(db, id)
}

export function updateClient(db, id, body) {
  getClient(db, id)
  const fields = clientFields(body, true)
  writeClient(db, id, fields)
  audit(db, { entityType: 'client', entityId: id, action: 'client.updated', summary: `Updated client ${fields.businessName}`, metadata: { clientId: id } })
  return getClient(db, id)
}

function mapProject(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    title: row.title,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function listProjects(db, clientId) {
  const rows = clientId
    ? db.prepare('SELECT * FROM projects WHERE client_id = ? OR client_id IS NULL ORDER BY title COLLATE NOCASE').all(clientId)
    : db.prepare('SELECT * FROM projects ORDER BY title COLLATE NOCASE').all()
  return rows.map(mapProject)
}

function persistClientChoice(db, clientId, fields, save) {
  if (clientId) {
    const existing = db.prepare('SELECT id FROM clients WHERE id = ?').get(clientId)
    if (!existing) throw new HttpError(400, 'Choose a saved client', 'VALIDATION')
  }
  if (!save) return clientId || null
  if (!fields.businessName) throw new HttpError(400, 'Client name is required to save a client', 'VALIDATION')
  if (clientId) {
    writeClient(db, clientId, fields)
    audit(db, { entityType: 'client', entityId: clientId, action: 'client.updated', summary: `Updated client ${fields.businessName}`, metadata: { clientId } })
    return clientId
  }
  return createClient(db, fields).id
}

function persistProjectChoice(db, projectId, clientId, title, description, save) {
  if (projectId) {
    const existing = db.prepare('SELECT id FROM projects WHERE id = ?').get(projectId)
    if (!existing) throw new HttpError(400, 'Choose a saved project', 'VALIDATION')
  }
  if (!save) return projectId || null
  if (!title) throw new HttpError(400, 'Project title is required to save a project', 'VALIDATION')
  if (projectId) {
    db.prepare('UPDATE projects SET client_id = ?, title = ?, description = ?, updated_at = ? WHERE id = ?')
      .run(clientId, title, description, nowIso(), projectId)
    audit(db, { entityType: 'project', entityId: projectId, action: 'project.updated', summary: `Updated project ${title}`, metadata: { projectId, clientId } })
    return projectId
  }
  const id = randomUUID()
  const stamp = nowIso()
  db.prepare('INSERT INTO projects (id, client_id, title, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, clientId, title, description, stamp, stamp)
  audit(db, { entityType: 'project', entityId: id, action: 'project.created', summary: `Saved project ${title}`, metadata: { projectId: id, clientId } })
  return id
}

function parseLines(lines) {
  if (lines == null) return []
  if (!Array.isArray(lines)) throw new HttpError(400, 'Add line items as a list', 'VALIDATION')
  if (lines.length > 100) throw new HttpError(400, 'An invoice can have at most 100 line items', 'VALIDATION')
  const usable = lines.filter((line) => {
    const description = typeof line?.description === 'string' ? line.description.trim() : ''
    const quantity = typeof line?.quantity === 'string' ? line.quantity.trim() : ''
    const unitPrice = typeof line?.unitPrice === 'string' ? line.unitPrice.trim() : ''
    return description || quantity || unitPrice
  })
  return usable.map((line) => {
    const description = clip(line.description, 500, 'Line description', true)
    let quantityMilli
    let unitPriceMinor
    try {
      quantityMilli = parseQuantityToMilli(String(line.quantity ?? '').trim())
      unitPriceMinor = parseMoneyToMinor(String(line.unitPrice ?? '').trim())
    } catch (error) {
      throw new HttpError(400, error.message, 'VALIDATION')
    }
    if (unitPriceMinor < 0) throw new HttpError(400, 'Unit price cannot be negative', 'VALIDATION')
    return {
      description,
      quantityMilli,
      unitPriceMinor,
      lineTotalMinor: lineTotalMinor(quantityMilli, unitPriceMinor),
    }
  })
}

function parseMilestones(mode, milestones, totalMinor, strict) {
  if (!mode || mode === 'none') return { mode: 'none', milestones: [] }
  if (!['percent', 'amount'].includes(mode)) throw new HttpError(400, 'Choose a percentage or amount schedule', 'VALIDATION')
  if (!Array.isArray(milestones)) throw new HttpError(400, 'Payment schedule must be a list', 'VALIDATION')
  if (milestones.length > 24) throw new HttpError(400, 'Use 24 milestones or fewer', 'VALIDATION')
  const rows = milestones.filter((item) => {
    const description = typeof item?.description === 'string' ? item.description.trim() : ''
    const percent = typeof item?.percent === 'string' ? item.percent.trim() : ''
    const amount = typeof item?.amount === 'string' ? item.amount.trim() : ''
    const trigger = typeof item?.trigger === 'string' ? item.trigger.trim() : ''
    return description || percent || amount || trigger
  })
  if (rows.length === 0) return { mode: 'none', milestones: [] }
  const parsed = rows.map((item) => {
    const description = clip(item.description, 200, 'Milestone description', true)
    const trigger = clip(item.trigger, 200, 'Milestone trigger')
    if (mode === 'percent') {
      const percentBps = percentField(String(item.percent ?? ''))
      if (percentBps <= 0) throw new HttpError(400, 'Each milestone percentage must be greater than zero', 'VALIDATION')
      return { description, trigger, percentBps, amountMinor: 0, roundingAdjustmentMinor: 0 }
    }
    const amountMinor = moneyField(String(item.amount ?? ''), 'Milestone amount')
    if (amountMinor <= 0) throw new HttpError(400, 'Each milestone amount must be greater than zero', 'VALIDATION')
    return { description, trigger, percentBps: null, amountMinor, roundingAdjustmentMinor: 0 }
  })
  if (mode === 'percent') {
    try {
      return { mode, milestones: computePercentMilestones(totalMinor, parsed) }
    } catch (error) {
      if (strict) throw new HttpError(400, error.message, 'MILESTONE')
      return { mode, milestones: parsed }
    }
  }
  const sum = parsed.reduce((total, item) => total + item.amountMinor, 0)
  if (strict && sum !== totalMinor) throw new HttpError(400, 'Milestone amounts must equal the invoice total', 'MILESTONE')
  return { mode, milestones: parsed }
}

function issuerInput(body, settings) {
  const source = body?.issuer || {}
  const professionalName = clip(source.professionalName ?? settings.professional_name, 200, 'Professional name') || PROFESSIONAL_NAME
  return {
    professionalName,
    businessName: clip(source.businessName ?? settings.business_name, 200, 'Business name'),
    email: emailOrEmpty(source.email ?? settings.email),
    phone: clip(source.phone ?? settings.phone, 40, 'Phone'),
    address: clip(source.address ?? settings.address, 500, 'Address'),
    paymentInstructions: clip(source.paymentInstructions ?? settings.payment_instructions, 2000, 'Payment instructions'),
  }
}

function replaceChildren(db, invoiceId, lines, milestones) {
  db.prepare('DELETE FROM invoice_lines WHERE invoice_id = ?').run(invoiceId)
  db.prepare('DELETE FROM invoice_milestones WHERE invoice_id = ?').run(invoiceId)
  const insertLine = db.prepare(`INSERT INTO invoice_lines (
    id, invoice_id, position, description, quantity_milli, unit_price_minor, line_total_minor
  ) VALUES (?, ?, ?, ?, ?, ?, ?)`)
  lines.forEach((line, index) => {
    insertLine.run(randomUUID(), invoiceId, index, line.description, line.quantityMilli, line.unitPriceMinor, line.lineTotalMinor)
  })
  const insertMilestone = db.prepare(`INSERT INTO invoice_milestones (
    id, invoice_id, position, description, trigger_label, percent_bps, amount_minor, rounding_adjustment_minor
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
  milestones.forEach((item, index) => {
    insertMilestone.run(
      randomUUID(), invoiceId, index, item.description, item.trigger,
      item.percentBps, item.amountMinor, item.roundingAdjustmentMinor || 0,
    )
  })
}

function invoiceMetadata(row, extra = {}) {
  return {
    invoiceId: row.id,
    clientId: row.client_id,
    projectId: row.project_id,
    currency: row.currency,
    ...extra,
  }
}

function nextInvoiceNumber(db) {
  const year = new Date().getFullYear()
  const row = db.prepare('SELECT COALESCE(MAX(doc_seq), 0) AS seq FROM invoices WHERE doc_year = ?').get(year)
  const seq = Number(row.seq) + 1
  return { year, seq, number: formatDocumentNumber('INV', year, seq) }
}

function nextReceiptNumber(db) {
  const year = new Date().getFullYear()
  const row = db.prepare('SELECT COALESCE(MAX(doc_seq), 0) AS seq FROM receipts WHERE doc_year = ?').get(year)
  const seq = Number(row.seq) + 1
  return { year, seq, number: formatDocumentNumber('RCT', year, seq) }
}

function collectInvoiceBody(db, body) {
  const settings = settingsRow(db)
  const fields = clientFields(body?.client)
  const lines = parseLines(body?.lines)
  const discountMinor = moneyField(body?.discount, 'Discount')
  const taxRateBps = percentField(typeof body?.taxRate === 'string' ? body.taxRate : '')
  let totals
  try {
    totals = computeTotals({ lines, discountMinor, taxRateBps })
  } catch (error) {
    throw new HttpError(400, error.message, 'VALIDATION')
  }
  const schedule = parseMilestones(body?.milestoneMode || 'none', body?.milestones, totals.totalMinor, false)
  return {
    settings,
    fields,
    lines,
    totals,
    schedule,
    issuer: issuerInput(body, settings),
    currency: currencyOf(body?.currency),
    issueDate: dateOrNull(body?.issueDate, 'Issue date'),
    dueDate: dateOrNull(body?.dueDate, 'Due date'),
    projectTitle: clip(body?.projectTitle, 200, 'Project title'),
    projectDescription: clip(body?.projectDescription, 4000, 'Project description'),
    poReference: clip(body?.poReference, 120, 'PO or reference'),
    paymentTerms: clip(body?.paymentTerms, 500, 'Payment terms'),
    notes: clip(body?.notes ?? settings.default_notes, 4000, 'Notes'),
    terms: clip(body?.terms ?? settings.default_terms, 4000, 'Terms'),
    discountLabel: clip(body?.discountLabel, 80, 'Discount label'),
    taxLabel: clip(body?.taxLabel, 80, 'Tax label'),
    clientId: typeof body?.clientId === 'string' && body.clientId ? body.clientId : null,
    projectId: typeof body?.projectId === 'string' && body.projectId ? body.projectId : null,
    saveClient: Boolean(body?.saveClient),
    saveProject: Boolean(body?.saveProject),
  }
}


const LIST_SQL = `
SELECT
  i.*,
  COALESCE(NULLIF(json_extract(i.client_snapshot_json, '$.businessName'), ''), c.business_name, '') AS client_name,
  COALESCE((
    SELECT SUM(p.amount_minor) FROM payments p
    WHERE p.invoice_id = i.id AND p.status = 'recorded'
  ), 0) AS paid_minor
FROM invoices i
LEFT JOIN clients c ON c.id = i.client_id
`

function toListItem(row, today) {
  const paidMinor = Number(row.paid_minor || 0)
  const position = paymentPosition({
    lifecycle: row.lifecycle,
    totalMinor: row.total_minor,
    paidMinor,
    dueDate: row.due_date,
    today,
  })
  return {
    id: row.id,
    number: row.number,
    lifecycle: row.lifecycle,
    status: position.status,
    partial: position.partial,
    overdue: position.overdue,
    currency: row.currency,
    clientId: row.client_id,
    clientName: row.client_name || '',
    projectId: row.project_id,
    projectTitle: row.project_title,
    projectDescription: row.project_description,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    totalMinor: row.total_minor,
    paidMinor,
    outstandingMinor: position.outstandingMinor,
    overpaidMinor: position.overpaidMinor,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function queryInvoices(db, filters = {}) {
  const today = filters.today || todayISO()
  let items = db.prepare(`${LIST_SQL} ORDER BY i.created_at DESC`).all().map((row) => toListItem(row, today))
  if (filters.clientId) items = items.filter((item) => item.clientId === filters.clientId)
  if (filters.projectId) items = items.filter((item) => item.projectId === filters.projectId)
  if (filters.from) items = items.filter((item) => item.issueDate && item.issueDate >= filters.from)
  if (filters.to) items = items.filter((item) => item.issueDate && item.issueDate <= filters.to)
  if (filters.q) {
    const needle = filters.q.trim().toLowerCase()
    items = items.filter((item) => [item.number, item.clientName, item.projectTitle, item.projectDescription]
      .join(' ')
      .toLowerCase()
      .includes(needle))
  }
  if (filters.status) items = items.filter((item) => statusMatches(item, filters.status))
  return items
}

function sortItems(items, sort = 'issue_date', direction = 'desc') {
  const factor = direction === 'asc' ? 1 : -1
  const keys = {
    number: (item) => item.number,
    issue_date: (item) => item.issueDate || '',
    due_date: (item) => item.dueDate || '',
    total: (item) => item.totalMinor,
    paid: (item) => item.paidMinor,
    outstanding: (item) => item.outstandingMinor,
    client: (item) => item.clientName.toLowerCase(),
    status: (item) => item.status,
    created: (item) => item.createdAt,
  }
  const key = keys[sort] || keys.issue_date
  return [...items].sort((left, right) => {
    const a = key(left)
    const b = key(right)
    if (typeof a === 'number' && typeof b === 'number') return (a - b) * factor
    return String(a).localeCompare(String(b)) * factor
  })
}

export function listInvoices(db, query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(1, Number.parseInt(query.pageSize, 10) || 20))
  const direction = query.dir === 'asc' ? 'asc' : 'desc'
  const items = sortItems(queryInvoices(db, query), query.sort, direction)
  const start = (page - 1) * pageSize
  return { items: items.slice(start, start + pageSize), page, pageSize, total: items.length }
}

function mustRow(db, id) {
  const row = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id)
  if (!row) throw new HttpError(404, 'Invoice not found', 'NOT_FOUND')
  return row
}

function linesOf(db, invoiceId) {
  return db.prepare('SELECT * FROM invoice_lines WHERE invoice_id = ? ORDER BY position').all(invoiceId)
}

function milestonesOf(db, invoiceId) {
  return db.prepare('SELECT * FROM invoice_milestones WHERE invoice_id = ? ORDER BY position').all(invoiceId)
}

function mapLine(row) {
  return {
    id: row.id,
    description: row.description,
    quantityMilli: row.quantity_milli,
    quantity: milliToInput(row.quantity_milli),
    unitPriceMinor: row.unit_price_minor,
    unitPrice: minorToInput(row.unit_price_minor),
    lineTotalMinor: row.line_total_minor,
  }
}

function mapMilestone(row) {
  return {
    id: row.id,
    description: row.description,
    trigger: row.trigger_label,
    percentBps: row.percent_bps,
    percent: row.percent_bps == null ? '' : bpsToPercentInput(row.percent_bps),
    amountMinor: row.amount_minor,
    amount: minorToInput(row.amount_minor),
    roundingAdjustmentMinor: row.rounding_adjustment_minor,
  }
}

function paymentsOf(db, invoiceId) {
  const payments = db.prepare('SELECT * FROM payments WHERE invoice_id = ? ORDER BY received_on, created_at').all(invoiceId)
  const receipts = db.prepare('SELECT id, number, payment_id, amount_minor, created_at FROM receipts WHERE invoice_id = ?').all(invoiceId)
  const byPayment = new Map(receipts.map((receipt) => [receipt.payment_id, receipt]))
  return payments.map((payment) => {
    const receipt = byPayment.get(payment.id)
    return {
      id: payment.id,
      amountMinor: payment.amount_minor,
      receivedOn: payment.received_on,
      method: payment.method,
      methodLabel: methodLabel(payment.method),
      methodDetail: payment.method_detail,
      reference: payment.reference,
      notes: payment.notes,
      status: payment.status,
      overpaymentMinor: payment.overpayment_minor,
      reversedAt: payment.reversed_at,
      reversalReason: payment.reversal_reason,
      createdAt: payment.created_at,
      receipt: receipt ? {
        id: receipt.id,
        number: receipt.number,
        amountMinor: receipt.amount_minor,
        createdAt: receipt.created_at,
      } : null,
    }
  })
}

function presentInvoice(db, id) {
  const row = mustRow(db, id)
  const today = todayISO()
  const payments = paymentsOf(db, id)
  const paidMinor = payments.filter((payment) => payment.status === 'recorded').reduce((sum, payment) => sum + payment.amountMinor, 0)
  const position = paymentPosition({
    lifecycle: row.lifecycle,
    totalMinor: row.total_minor,
    paidMinor,
    dueDate: row.due_date,
    today,
  })
  const client = readJson(row.client_snapshot_json, {
    businessName: '', contactPerson: '', email: '', phone: '', billingAddress: '', taxDetails: '',
  })
  const issuer = readJson(row.issuer_snapshot_json, {})
  return {
    id: row.id,
    number: row.number,
    lifecycle: row.lifecycle,
    status: position.status,
    partial: position.partial,
    overdue: position.overdue,
    collectible: position.collectible,
    currency: row.currency,
    clientId: row.client_id,
    projectId: row.project_id,
    client,
    issuer: {
      professionalName: issuer.professionalName || PROFESSIONAL_NAME,
      businessName: issuer.businessName || '',
      email: issuer.email || '',
      phone: issuer.phone || '',
      address: issuer.address || '',
      paymentInstructions: issuer.paymentInstructions || '',
    },
    issueDate: row.issue_date,
    dueDate: row.due_date,
    projectTitle: row.project_title,
    projectDescription: row.project_description,
    poReference: row.po_reference,
    paymentTerms: row.payment_terms,
    notes: row.notes,
    terms: row.terms,
    discountMinor: row.discount_minor,
    discount: minorToInput(row.discount_minor),
    discountLabel: row.discount_label,
    taxRateBps: row.tax_rate_bps,
    taxRate: bpsToPercentInput(row.tax_rate_bps),
    taxLabel: row.tax_label,
    subtotalMinor: row.subtotal_minor,
    taxMinor: row.tax_minor,
    totalMinor: row.total_minor,
    paidMinor,
    outstandingMinor: position.outstandingMinor,
    overpaidMinor: position.overpaidMinor,
    milestoneMode: row.milestone_mode,
    lines: linesOf(db, id).map(mapLine),
    milestones: milestonesOf(db, id).map(mapMilestone),
    payments,
    revision: row.revision,
    revisions: db.prepare('SELECT revision, reason, created_at FROM document_revisions WHERE invoice_id = ? ORDER BY revision').all(id)
      .map((item) => ({ revision: item.revision, reason: item.reason, createdAt: item.created_at })),
    supersedesInvoiceId: row.supersedes_invoice_id,
    issuedAt: row.issued_at,
    cancelledAt: row.cancelled_at,
    cancelReason: row.cancel_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    logoUrl: `/api/billing/invoices/${row.id}/logo`,
  }
}

export function getInvoice(db, id) {
  return presentInvoice(db, id)
}

function insertInvoice(db, id, number, docYear, docSeq, prepared, clientId, projectId, supersedesInvoiceId = null) {
  const stamp = nowIso()
  db.prepare(`INSERT INTO invoices (
    id, number, doc_year, doc_seq, lifecycle, client_id, project_id, client_snapshot_json, issuer_snapshot_json,
    currency, issue_date, due_date, project_title, project_description, po_reference, payment_terms, notes, terms,
    discount_minor, discount_label, tax_rate_bps, tax_label, subtotal_minor, tax_minor, total_minor, milestone_mode,
    revision, supersedes_invoice_id, issued_at, cancelled_at, cancel_reason, created_at, updated_at
  ) VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, NULL, NULL, '', ?, ?)`).run(
    id, number, docYear, docSeq, clientId, projectId,
    JSON.stringify(prepared.fields), JSON.stringify(prepared.issuer),
    prepared.currency, prepared.issueDate, prepared.dueDate, prepared.projectTitle, prepared.projectDescription,
    prepared.poReference, prepared.paymentTerms, prepared.notes, prepared.terms,
    prepared.totals.discountMinor, prepared.discountLabel, prepared.totals.taxRateBps, prepared.taxLabel,
    prepared.totals.subtotalMinor, prepared.totals.taxMinor, prepared.totals.totalMinor, prepared.schedule.mode,
    supersedesInvoiceId, stamp, stamp,
  )
}

export function createInvoice(db, body) {
  return withTransaction(db, () => {
    const prepared = collectInvoiceBody(db, body)
    if (prepared.dueDate && prepared.issueDate && prepared.dueDate < prepared.issueDate) {
      throw new HttpError(400, 'Due date cannot be before the issue date', 'VALIDATION')
    }
    const clientId = persistClientChoice(db, prepared.clientId, prepared.fields, prepared.saveClient)
    const projectId = persistProjectChoice(db, prepared.projectId, clientId, prepared.projectTitle, prepared.projectDescription, prepared.saveProject)
    const id = randomUUID()
    const allocated = nextInvoiceNumber(db)
    insertInvoice(db, id, allocated.number, allocated.year, allocated.seq, prepared, clientId, projectId)
    replaceChildren(db, id, prepared.lines, prepared.schedule.milestones)
    const row = mustRow(db, id)
    audit(db, { entityType: 'invoice', entityId: id, action: 'invoice.created', summary: `Created draft ${allocated.number}`, metadata: invoiceMetadata(row) })
    return presentInvoice(db, id)
  })
}

export function updateInvoice(db, id, body) {
  return withTransaction(db, () => {
    const existing = mustRow(db, id)
    if (existing.lifecycle !== 'draft') {
      throw new HttpError(409, 'Issued invoices stay unchanged. Cancel this invoice or start a revision.', 'LOCKED')
    }
    const prepared = collectInvoiceBody(db, body)
    if (prepared.dueDate && prepared.issueDate && prepared.dueDate < prepared.issueDate) {
      throw new HttpError(400, 'Due date cannot be before the issue date', 'VALIDATION')
    }
    const clientId = persistClientChoice(db, prepared.clientId, prepared.fields, prepared.saveClient)
    const projectId = persistProjectChoice(db, prepared.projectId, clientId, prepared.projectTitle, prepared.projectDescription, prepared.saveProject)
    db.prepare(`UPDATE invoices SET
      client_id = ?, project_id = ?, client_snapshot_json = ?, issuer_snapshot_json = ?, currency = ?, issue_date = ?, due_date = ?,
      project_title = ?, project_description = ?, po_reference = ?, payment_terms = ?, notes = ?, terms = ?,
      discount_minor = ?, discount_label = ?, tax_rate_bps = ?, tax_label = ?, subtotal_minor = ?, tax_minor = ?, total_minor = ?,
      milestone_mode = ?, updated_at = ?
      WHERE id = ? AND lifecycle = 'draft'`).run(
      clientId, projectId, JSON.stringify(prepared.fields), JSON.stringify(prepared.issuer), prepared.currency,
      prepared.issueDate, prepared.dueDate, prepared.projectTitle, prepared.projectDescription, prepared.poReference,
      prepared.paymentTerms, prepared.notes, prepared.terms, prepared.totals.discountMinor, prepared.discountLabel,
      prepared.totals.taxRateBps, prepared.taxLabel, prepared.totals.subtotalMinor, prepared.totals.taxMinor,
      prepared.totals.totalMinor, prepared.schedule.mode, nowIso(), id,
    )
    replaceChildren(db, id, prepared.lines, prepared.schedule.milestones)
    const row = mustRow(db, id)
    audit(db, { entityType: 'invoice', entityId: id, action: 'invoice.updated', summary: `Updated draft ${row.number}`, metadata: invoiceMetadata(row) })
    return presentInvoice(db, id)
  })
}

function copyLogo(dataRoot, invoiceId, source) {
  if (!source || !fs.existsSync(source)) return ''
  const extension = path.extname(source).toLowerCase()
  const safeExt = extension === '.jpg' || extension === '.jpeg' ? '.jpg' : '.png'
  const relative = `document-assets/${invoiceId}/logo${safeExt}`
  const destination = safeDataPath(dataRoot, relative)
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  fs.copyFileSync(source, destination)
  return relative
}

export function issueInvoice(db, dataRoot, portfolioLogo, id) {
  return withTransaction(db, () => {
    const row = mustRow(db, id)
    if (row.lifecycle !== 'draft') throw new HttpError(409, 'Only drafts can be issued', 'LOCKED')
    const storedLines = linesOf(db, id).map((line) => ({
      description: line.description,
      quantityMilli: line.quantity_milli,
      unitPriceMinor: line.unit_price_minor,
      lineTotalMinor: lineTotalMinor(line.quantity_milli, line.unit_price_minor),
    }))
    if (storedLines.length === 0) throw new HttpError(400, 'Add at least one line item before issuing', 'VALIDATION')
    let totals
    try {
      totals = computeTotals({
        lines: storedLines,
        discountMinor: row.discount_minor,
        taxRateBps: row.tax_rate_bps,
      })
    } catch (error) {
      throw new HttpError(400, error.message, 'VALIDATION')
    }
    if (totals.totalMinor <= 0) throw new HttpError(400, 'Invoice total must be greater than zero before issuing', 'VALIDATION')
    if (!row.issue_date || !row.due_date) throw new HttpError(400, 'Add an issue date and a due date before issuing', 'VALIDATION')
    if (row.due_date < row.issue_date) throw new HttpError(400, 'Due date cannot be before the issue date', 'VALIDATION')
    const client = readJson(row.client_snapshot_json, {})
    if (!client.businessName) throw new HttpError(400, 'Add a client name before issuing', 'VALIDATION')
    const storedMilestones = milestonesOf(db, id)
    let schedule
    if (row.milestone_mode === 'percent') {
      try {
        schedule = computePercentMilestones(totals.totalMinor, storedMilestones.map((item) => ({
          id: item.id,
          percentBps: item.percent_bps,
        })))
      } catch (error) {
        throw new HttpError(400, error.message, 'MILESTONE')
      }
    } else if (row.milestone_mode === 'amount') {
      const sum = storedMilestones.reduce((total, item) => total + item.amount_minor, 0)
      if (storedMilestones.length === 0 || sum !== totals.totalMinor) {
        throw new HttpError(400, 'Milestone amounts must equal the invoice total', 'MILESTONE')
      }
      schedule = storedMilestones.map((item) => ({ id: item.id, amountMinor: item.amount_minor, roundingAdjustmentMinor: 0 }))
    } else if (storedMilestones.length > 0) {
      throw new HttpError(400, 'Remove the payment schedule or choose percentage or amount mode', 'MILESTONE')
    } else {
      schedule = []
    }
    let clientId = row.client_id
    if (!clientId) {
      clientId = createClient(db, client).id
    }
    const issuer = readJson(row.issuer_snapshot_json, {})
    const logoFile = copyLogo(dataRoot, id, currentLogoAbsolute(db, dataRoot, portfolioLogo))
    const frozenIssuer = { ...issuer, logoFile }
    const stamp = nowIso()
    db.prepare(`UPDATE invoices SET
      lifecycle = 'issued', client_id = ?, issuer_snapshot_json = ?, subtotal_minor = ?, tax_minor = ?, total_minor = ?,
      issued_at = ?, updated_at = ?, revision = 1
      WHERE id = ? AND lifecycle = 'draft'`).run(
      clientId, JSON.stringify(frozenIssuer), totals.subtotalMinor, totals.taxMinor, totals.totalMinor, stamp, stamp, id,
    )
    storedLines.forEach((line, index) => {
      const stored = linesOf(db, id)[index]
      db.prepare('UPDATE invoice_lines SET line_total_minor = ? WHERE id = ?').run(line.lineTotalMinor, stored.id)
    })
    schedule.forEach((item) => {
      db.prepare('UPDATE invoice_milestones SET amount_minor = ?, rounding_adjustment_minor = ? WHERE id = ?')
        .run(item.amountMinor, item.roundingAdjustmentMinor || 0, item.id)
    })
    const published = presentInvoice(db, id)
    db.prepare(`INSERT INTO document_revisions (id, invoice_id, revision, reason, snapshot_json, created_at) VALUES (?, ?, 1, ?, ?, ?)`)
      .run(randomUUID(), id, 'Issued', JSON.stringify(published), stamp)
    audit(db, {
      entityType: 'invoice',
      entityId: id,
      action: 'invoice.issued',
      summary: `Issued ${published.number}`,
      metadata: invoiceMetadata(mustRow(db, id), { totalMinor: published.totalMinor }),
    })
    return published
  })
}

export function cancelInvoice(db, id, body) {
  return withTransaction(db, () => {
    const row = mustRow(db, id)
    if (row.lifecycle !== 'issued') throw new HttpError(409, 'Only issued invoices can be cancelled', 'LOCKED')
    const reason = clip(body?.reason, 500, 'Cancellation reason', true)
    const stamp = nowIso()
    const revision = row.revision + 1
    db.prepare(`UPDATE invoices SET lifecycle = 'cancelled', cancelled_at = ?, cancel_reason = ?, revision = ?, updated_at = ? WHERE id = ?`)
      .run(stamp, reason, revision, stamp, id)
    const snapshot = presentInvoice(db, id)
    db.prepare(`INSERT INTO document_revisions (id, invoice_id, revision, reason, snapshot_json, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(randomUUID(), id, revision, reason, JSON.stringify(snapshot), stamp)
    audit(db, { entityType: 'invoice', entityId: id, action: 'invoice.cancelled', summary: `Cancelled ${row.number}`, metadata: invoiceMetadata(row) })
    return snapshot
  })
}

function cloneDraft(db, sourceId, { supersedes }) {
  const source = presentInvoice(db, sourceId)
  const row = mustRow(db, sourceId)
  const id = randomUUID()
  const allocated = nextInvoiceNumber(db)
  const issuer = readJson(row.issuer_snapshot_json, {})
  delete issuer.logoFile
  const prepared = {
    fields: source.client,
    issuer,
    currency: source.currency,
    issueDate: source.issueDate,
    dueDate: source.dueDate,
    projectTitle: source.projectTitle,
    projectDescription: source.projectDescription,
    poReference: source.poReference,
    paymentTerms: source.paymentTerms,
    notes: source.notes,
    terms: source.terms,
    discountLabel: source.discountLabel,
    taxLabel: source.taxLabel,
    totals: {
      discountMinor: source.discountMinor,
      taxRateBps: source.taxRateBps,
      subtotalMinor: source.subtotalMinor,
      taxMinor: source.taxMinor,
      totalMinor: source.totalMinor,
    },
    schedule: { mode: source.milestoneMode },
  }
  insertInvoice(db, id, allocated.number, allocated.year, allocated.seq, prepared, source.clientId, source.projectId, supersedes ? sourceId : null)
  replaceChildren(db, id, source.lines.map((line) => ({
    description: line.description,
    quantityMilli: line.quantityMilli,
    unitPriceMinor: line.unitPriceMinor,
    lineTotalMinor: line.lineTotalMinor,
  })), source.milestones.map((item) => ({
    description: item.description,
    trigger: item.trigger,
    percentBps: item.percentBps,
    amountMinor: item.amountMinor,
    roundingAdjustmentMinor: item.roundingAdjustmentMinor,
  })))
  return { id, number: allocated.number, source }
}

export function duplicateInvoice(db, id) {
  return withTransaction(db, () => {
    const copy = cloneDraft(db, id, { supersedes: false })
    audit(db, { entityType: 'invoice', entityId: copy.id, action: 'invoice.duplicated', summary: `Duplicated ${copy.source.number} as ${copy.number}`, metadata: { invoiceId: copy.id, sourceInvoiceId: id } })
    return presentInvoice(db, copy.id)
  })
}

export function reviseInvoice(db, id) {
  return withTransaction(db, () => {
    const row = mustRow(db, id)
    if (row.lifecycle === 'draft') throw new HttpError(409, 'Edit the draft directly', 'LOCKED')
    const copy = cloneDraft(db, id, { supersedes: true })
    audit(db, { entityType: 'invoice', entityId: copy.id, action: 'invoice.revised', summary: `Started revision ${copy.number} from ${copy.source.number}`, metadata: { invoiceId: copy.id, sourceInvoiceId: id } })
    return presentInvoice(db, copy.id)
  })
}

export function deleteDraft(db, id) {
  return withTransaction(db, () => {
    const row = mustRow(db, id)
    if (row.lifecycle !== 'draft') throw new HttpError(409, 'Issued invoices cannot be deleted', 'LOCKED')
    audit(db, { entityType: 'invoice', entityId: id, action: 'invoice.deleted', summary: `Deleted draft ${row.number}`, metadata: invoiceMetadata(row) })
    db.prepare('DELETE FROM invoices WHERE id = ? AND lifecycle = ?').run(id, 'draft')
    return { ok: true }
  })
}

function paymentInput(body) {
  let amountMinor
  try {
    amountMinor = parseMoneyToMinor(String(body?.amount ?? '').trim())
  } catch (error) {
    throw new HttpError(400, error.message, 'VALIDATION')
  }
  if (amountMinor <= 0) throw new HttpError(400, 'Enter a payment greater than zero', 'VALIDATION')
  const method = clip(body?.method, 40, 'Payment method', true)
  if (!PAYMENT_METHODS.some((item) => item.id === method)) throw new HttpError(400, 'Choose a payment method', 'VALIDATION')
  const methodDetail = clip(body?.methodDetail, 80, 'Payment method detail')
  if (method === 'other' && !methodDetail) throw new HttpError(400, 'Describe the payment method', 'VALIDATION')
  return {
    amountMinor,
    receivedOn: dateOrNull(body?.receivedOn, 'Date received', true),
    method,
    methodDetail,
    reference: clip(body?.reference, 120, 'Transaction reference'),
    notes: clip(body?.notes, 2000, 'Internal notes'),
    confirmOverpayment: Boolean(body?.confirmOverpayment),
  }
}

function paymentHash(input) {
  return createHash('sha256').update(JSON.stringify({
    amountMinor: input.amountMinor,
    receivedOn: input.receivedOn,
    method: input.method,
    methodDetail: input.methodDetail,
    reference: input.reference,
    notes: input.notes,
    confirmOverpayment: input.confirmOverpayment,
  })).digest('hex')
}

function paidSum(db, invoiceId) {
  const row = db.prepare(`SELECT COALESCE(SUM(amount_minor), 0) AS paid FROM payments WHERE invoice_id = ? AND status = 'recorded'`).get(invoiceId)
  return Number(row.paid)
}

export function recordPayment(db, invoiceId, body, idempotencyKey) {
  const key = typeof idempotencyKey === 'string' ? idempotencyKey.trim() : ''
  if (!key || key.length > 200) throw new HttpError(400, 'Idempotency-Key is required', 'IDEMPOTENCY')
  const input = paymentInput(body)
  const hash = paymentHash(input)
  return withTransaction(db, () => {
    const existing = db.prepare('SELECT * FROM payments WHERE idempotency_key = ?').get(key)
    if (existing) {
      if (existing.request_hash !== hash || existing.invoice_id !== invoiceId) {
        throw new HttpError(409, 'This idempotency key was already used for a different payment', 'IDEMPOTENCY_CONFLICT')
      }
      return { invoice: presentInvoice(db, invoiceId), replay: true }
    }
    const invoice = mustRow(db, invoiceId)
    if (invoice.lifecycle === 'draft') throw new HttpError(409, 'Issue the invoice before recording a payment', 'LOCKED')
    if (invoice.lifecycle === 'cancelled') throw new HttpError(409, 'Cancelled invoices cannot accept payments', 'LOCKED')
    const alreadyPaid = paidSum(db, invoiceId)
    const balance = invoice.total_minor - alreadyPaid
    const outstanding = Math.max(0, balance)
    let overpaymentMinor = 0
    if (input.amountMinor > outstanding) {
      if (!input.confirmOverpayment) {
        throw new HttpError(409, 'This payment is more than the outstanding balance', 'OVERPAYMENT', { outstandingMinor: outstanding })
      }
      overpaymentMinor = input.amountMinor - outstanding
    }
    const id = randomUUID()
    db.prepare(`INSERT INTO payments (
      id, invoice_id, amount_minor, received_on, method, method_detail, reference, notes,
      idempotency_key, request_hash, status, overpayment_minor, overpayment_confirmed, reversed_at, reversal_reason, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'recorded', ?, ?, NULL, '', ?)`).run(
      id, invoiceId, input.amountMinor, input.receivedOn, input.method, input.methodDetail, input.reference, input.notes,
      key, hash, overpaymentMinor, input.confirmOverpayment ? 1 : 0, nowIso(),
    )
    audit(db, {
      entityType: 'payment',
      entityId: id,
      action: 'payment.recorded',
      summary: `Recorded a payment on ${invoice.number}`,
      metadata: invoiceMetadata(invoice, { paymentId: id, amountMinor: input.amountMinor }),
    })
    return { invoice: presentInvoice(db, invoiceId), replay: false, paymentId: id }
  })
}

export function reversePayment(db, paymentId, body) {
  const reason = clip(body?.reason, 500, 'Reversal reason', true)
  return withTransaction(db, () => {
    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId)
    if (!payment) throw new HttpError(404, 'Payment not found', 'NOT_FOUND')
    if (payment.status === 'reversed') throw new HttpError(409, 'This payment is already reversed', 'LOCKED')
    const stamp = nowIso()
    db.prepare(`UPDATE payments SET status = 'reversed', reversed_at = ?, reversal_reason = ? WHERE id = ? AND status = 'recorded'`)
      .run(stamp, reason, paymentId)
    const invoice = mustRow(db, payment.invoice_id)
    audit(db, {
      entityType: 'payment',
      entityId: paymentId,
      action: 'payment.reversed',
      summary: `Reversed a payment on ${invoice.number}`,
      metadata: invoiceMetadata(invoice, { paymentId, amountMinor: payment.amount_minor }),
    })
    return presentInvoice(db, payment.invoice_id)
  })
}

export function createReceipt(db, paymentId) {
  return withTransaction(db, () => {
    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId)
    if (!payment) throw new HttpError(404, 'Payment not found', 'NOT_FOUND')
    const existing = db.prepare('SELECT * FROM receipts WHERE payment_id = ?').get(paymentId)
    if (existing) return presentReceipt(db, existing.id)
    if (payment.status !== 'recorded') {
      throw new HttpError(409, 'Receipts are only issued for payments that were successfully recorded', 'LOCKED')
    }
    const invoice = mustRow(db, payment.invoice_id)
    const paidToDateMinor = paidSum(db, invoice.id)
    const remainingMinor = Math.max(0, invoice.total_minor - paidToDateMinor)
    const allocated = nextReceiptNumber(db)
    const client = readJson(invoice.client_snapshot_json, {})
    const issuer = readJson(invoice.issuer_snapshot_json, {})
    const snapshot = {
      receiptNumber: allocated.number,
      currency: invoice.currency,
      amountMinor: payment.amount_minor,
      amountWords: amountInWords(payment.amount_minor, invoice.currency),
      receivedOn: payment.received_on,
      method: payment.method,
      methodLabel: methodLabel(payment.method),
      methodDetail: payment.method_detail,
      reference: payment.reference,
      invoiceNumber: invoice.number,
      invoiceId: invoice.id,
      invoiceTotalMinor: invoice.total_minor,
      paidToDateMinor,
      remainingMinor,
      partial: remainingMinor > 0,
      projectTitle: invoice.project_title,
      issuer: {
        professionalName: issuer.professionalName || PROFESSIONAL_NAME,
        businessName: issuer.businessName || '',
        email: issuer.email || '',
        phone: issuer.phone || '',
        address: issuer.address || '',
      },
      client,
      logoFile: issuer.logoFile || '',
    }
    const id = randomUUID()
    const stamp = nowIso()
    db.prepare(`INSERT INTO receipts (
      id, number, doc_year, doc_seq, payment_id, invoice_id, amount_minor, snapshot_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id, allocated.number, allocated.year, allocated.seq, paymentId, invoice.id, payment.amount_minor, JSON.stringify(snapshot), stamp,
    )
    audit(db, {
      entityType: 'receipt',
      entityId: id,
      action: 'receipt.issued',
      summary: `Issued receipt ${allocated.number} for ${invoice.number}`,
      metadata: invoiceMetadata(invoice, { receiptId: id, paymentId, amountMinor: payment.amount_minor }),
    })
    return presentReceipt(db, id)
  })
}

function presentReceipt(db, id) {
  const row = db.prepare('SELECT * FROM receipts WHERE id = ?').get(id)
  if (!row) throw new HttpError(404, 'Receipt not found', 'NOT_FOUND')
  const payment = db.prepare('SELECT status, reversed_at FROM payments WHERE id = ?').get(row.payment_id)
  const snapshot = readJson(row.snapshot_json, {})
  return {
    id: row.id,
    number: row.number,
    paymentId: row.payment_id,
    invoiceId: row.invoice_id,
    amountMinor: row.amount_minor,
    createdAt: row.created_at,
    paymentStatus: payment?.status || 'recorded',
    reversedAt: payment?.reversed_at || null,
    snapshot,
  }
}

export function getReceipt(db, id) {
  return presentReceipt(db, id)
}

export function listReceipts(db, query) {
  const rows = db.prepare(`SELECT r.*, i.currency, i.client_id, i.project_id
    FROM receipts r JOIN invoices i ON i.id = r.invoice_id
    ORDER BY r.created_at DESC`).all()
  let items = rows.map((row) => {
    const snapshot = readJson(row.snapshot_json, {})
    return {
      id: row.id,
      number: row.number,
      paymentId: row.payment_id,
      invoiceId: row.invoice_id,
      invoiceNumber: snapshot.invoiceNumber || '',
      clientId: row.client_id,
      clientName: snapshot.client?.businessName || '',
      projectId: row.project_id,
      projectTitle: snapshot.projectTitle || '',
      receivedOn: snapshot.receivedOn || '',
      amountMinor: row.amount_minor,
      currency: snapshot.currency || row.currency,
      method: snapshot.method || '',
      methodLabel: snapshot.methodLabel || '',
      reference: snapshot.reference || '',
      partial: Boolean(snapshot.partial),
      createdAt: row.created_at,
    }
  })
  if (query.clientId) items = items.filter((item) => item.clientId === query.clientId)
  if (query.from) items = items.filter((item) => item.receivedOn && item.receivedOn >= query.from)
  if (query.to) items = items.filter((item) => item.receivedOn && item.receivedOn <= query.to)
  if (query.q) {
    const needle = query.q.trim().toLowerCase()
    items = items.filter((item) => [item.number, item.clientName, item.invoiceNumber, item.reference, item.projectTitle]
      .join(' ').toLowerCase().includes(needle))
  }
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(1, Number.parseInt(query.pageSize, 10) || 20))
  const start = (page - 1) * pageSize
  return { items: items.slice(start, start + pageSize), page, pageSize, total: items.length }
}

function mapActivity(row) {
  const metadata = readJson(row.metadata_json, {})
  return {
    id: row.id,
    action: row.action,
    summary: row.summary,
    createdAt: row.created_at,
    invoiceId: metadata.invoiceId || null,
    clientId: metadata.clientId || null,
    projectId: metadata.projectId || null,
    amountMinor: Number.isSafeInteger(metadata.amountMinor) ? metadata.amountMinor : null,
    currency: metadata.currency || null,
  }
}

export function getDashboard(db, filters) {
  const items = queryInvoices(db, filters)
  const issued = items.filter((item) => item.lifecycle === 'issued')
  const totalsByCurrencyMap = new Map()
  issued.forEach((item) => {
    const bucket = totalsByCurrencyMap.get(item.currency) || {
      currency: item.currency, invoicedMinor: 0, paymentsMinor: 0, outstandingMinor: 0,
    }
    bucket.invoicedMinor += item.totalMinor
    bucket.paymentsMinor += item.paidMinor
    bucket.outstandingMinor += item.outstandingMinor
    totalsByCurrencyMap.set(item.currency, bucket)
  })
  const totalsByCurrency = [...totalsByCurrencyMap.values()]
  let receiptCount = 0
  if (issued.length) {
    const placeholders = issued.map(() => '?').join(', ')
    const row = db.prepare(`SELECT COUNT(*) AS count FROM receipts WHERE invoice_id IN (${placeholders})`).get(...issued.map((item) => item.id))
    receiptCount = Number(row.count)
  }
  const today = todayISO()
  const horizon = addDaysISO(today, 14)
  let recent = db.prepare('SELECT * FROM audit_events ORDER BY created_at DESC LIMIT 80').all().map(mapActivity)
  if (filters.clientId) recent = recent.filter((item) => item.clientId === filters.clientId)
  if (filters.projectId) recent = recent.filter((item) => item.projectId === filters.projectId)
  if (filters.from) recent = recent.filter((item) => item.createdAt.slice(0, 10) >= filters.from)
  if (filters.to) recent = recent.filter((item) => item.createdAt.slice(0, 10) <= filters.to)
  return {
    totalsByCurrency,
    cards: {
      invoicedMinor: totalsByCurrency.length === 1 ? totalsByCurrency[0].invoicedMinor : 0,
      paymentsMinor: totalsByCurrency.length === 1 ? totalsByCurrency[0].paymentsMinor : 0,
      outstandingMinor: totalsByCurrency.length === 1 ? totalsByCurrency[0].outstandingMinor : 0,
      currency: totalsByCurrency.length === 1 ? totalsByCurrency[0].currency : (totalsByCurrency.length === 0 ? 'NGN' : null),
      overdueCount: issued.filter((item) => item.overdue).length,
      invoiceCount: issued.length,
      receiptCount,
    },
    recent: recent.slice(0, 12),
    upcoming: items.filter((item) => item.lifecycle === 'issued' && item.outstandingMinor > 0 && item.dueDate && item.dueDate >= today && item.dueDate <= horizon).slice(0, 8),
    overdue: items.filter((item) => item.overdue).slice(0, 8),
  }
}

export function buildInvoicePdfModel(db, dataRoot, portfolioLogo, id) {
  const invoice = presentInvoice(db, id)
  const logoPath = invoiceLogoAbsolute(db, dataRoot, portfolioLogo, id)
  const paidForSchedule = invoice.payments.filter((payment) => payment.status === 'recorded').reduce((sum, payment) => sum + payment.amountMinor, 0)
  let remainingPaid = paidForSchedule
  const milestones = invoice.milestones.map((item) => {
    const applied = Math.min(Math.max(0, item.amountMinor), remainingPaid)
    remainingPaid -= applied
    return { ...item, appliedMinor: applied, dueMinor: Math.max(0, item.amountMinor - applied) }
  })
  return { ...invoice, milestones, logoPath: fs.existsSync(logoPath) ? logoPath : '' }
}

export function buildReceiptPdfModel(db, dataRoot, portfolioLogo, id) {
  const receipt = presentReceipt(db, id)
  const snapshot = receipt.snapshot
  let logoPath = ''
  if (snapshot.logoFile) {
    try {
      const resolved = safeDataPath(dataRoot, snapshot.logoFile)
      if (fs.existsSync(resolved)) logoPath = resolved
    } catch {
      logoPath = ''
    }
  }
  if (!logoPath) logoPath = currentLogoAbsolute(db, dataRoot, portfolioLogo)
  return { ...receipt, logoPath: fs.existsSync(logoPath) ? logoPath : '' }
}
