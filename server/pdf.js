import fs from 'node:fs'
import path from 'node:path'
import PDFDocument from 'pdfkit'
import { STATUS_LABELS } from '../shared/branding.js'
import { formatIsoDate } from '../shared/dates.js'
import { formatMinor } from '../shared/money.js'

const INK = '#191a1c'
const MUTED = '#564E4E'
const HAIR = '#d5d8de'
const BAND = '#E9EFFD'
const regularFont = path.join(import.meta.dirname, 'fonts', 'NotoSans-Regular.ttf')
const boldFont = path.join(import.meta.dirname, 'fonts', 'NotoSans-Bold.ttf')

function renderPdf(draw, info, compress) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      compress,
      bufferPages: true,
      margins: { top: 48, bottom: 56, left: 48, right: 48 },
      info,
    })
    doc.registerFont('Regular', regularFont)
    doc.registerFont('Bold', boldFont)
    const chunks = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
    draw(doc)
    const range = doc.bufferedPageRange()
    for (let index = 0; index < range.count; index += 1) {
      doc.switchToPage(range.start + index)
      const bottom = doc.page.margins.bottom
      doc.page.margins.bottom = 0
      doc.font('Regular').fontSize(8).fillColor(MUTED)
      doc.text(
        `${info.Title} · Page ${index + 1} of ${range.count}`,
        48,
        doc.page.height - 28,
        { width: doc.page.width - 96, align: 'center', lineBreak: false, height: 12 },
      )
      doc.page.margins.bottom = bottom
    }
    doc.end()
  })
}

function paintFrame(doc) {
  doc.save()
  doc.rect(0, 0, doc.page.width, 8).fill(INK)
  doc.restore()
}

function contentLimit(doc) {
  return doc.page.height - 64
}

function textHeight(doc, text, width, font, size) {
  doc.font(font).fontSize(size)
  return doc.heightOfString(text || ' ', { width })
}

function drawText(doc, text, x, y, width, options = {}) {
  const font = options.font || 'Regular'
  const size = options.size || 10
  const color = options.color || INK
  const align = options.align || 'left'
  doc.font(font).fontSize(size).fillColor(color)
  const height = options.height || doc.heightOfString(text || ' ', { width })
  doc.text(text || '', x, y, { width, align, height, lineBreak: true })
  return height
}

function partyLines(party, keys) {
  return keys.map((key) => party?.[key.key]).map((value, index) => (value ? { label: keys[index].label, value } : null)).filter(Boolean)
}

function money(minor, currency) {
  return formatMinor(minor, currency)
}

export function renderInvoicePdf(model, { compress = true } = {}) {
  return renderPdf((doc) => {
    paintFrame(doc)
    const left = 48
    const width = doc.page.width - 96
    const columns = {
      desc: width - 260,
      qty: 50,
      price: 100,
      amount: 110,
    }
    let y = 28

    const drawTableHeader = (top) => {
      doc.save()
      doc.rect(left, top, width, 22).fill(BAND)
      doc.restore()
      drawText(doc, 'Description', left + 6, top + 6, columns.desc - 8, { font: 'Bold', size: 9 })
      drawText(doc, 'Qty', left + columns.desc, top + 6, columns.qty, { font: 'Bold', size: 9, align: 'right' })
      drawText(doc, 'Unit price', left + columns.desc + columns.qty, top + 6, columns.price - 6, { font: 'Bold', size: 9, align: 'right' })
      drawText(doc, 'Amount', left + columns.desc + columns.qty + columns.price, top + 6, columns.amount - 6, { font: 'Bold', size: 9, align: 'right' })
      return top + 26
    }

    const continued = (top) => {
      paintFrame(doc)
      drawText(doc, `${model.number} continued`, left, top, width, { font: 'Bold', size: 11 })
      return drawTableHeader(top + 18)
    }

    if (model.logoPath && fs.existsSync(model.logoPath)) {
      try {
        doc.image(model.logoPath, left, y, { fit: [52, 52] })
      } catch {
        // A missing or unreadable logo should not block the document.
      }
    }
    drawText(doc, model.lifecycle === 'draft' ? 'DRAFT INVOICE' : 'INVOICE', left + 64, y, width - 180, { font: 'Bold', size: 18 })
    drawText(doc, STATUS_LABELS[model.status] || model.status, left + width - 120, y + 4, 120, { font: 'Bold', size: 11, align: 'right' })
    y += 28
    drawText(doc, model.number, left + 64, y, width - 64, { size: 11, color: MUTED })
    y = Math.max(y + 22, 86)

    const issuerLines = [
      model.issuer.professionalName,
      model.issuer.businessName,
      model.issuer.email,
      model.issuer.phone,
      model.issuer.address,
    ].filter(Boolean)
    issuerLines.forEach((line, index) => {
      y += drawText(doc, line, left, y, width / 2 - 8, { font: index === 0 ? 'Bold' : 'Regular', size: 10 }) + 2
    })

    const meta = [
      ['Issue date', formatIsoDate(model.issueDate) || '—'],
      ['Due date', formatIsoDate(model.dueDate) || '—'],
      ['Currency', model.currency],
      model.poReference ? ['PO / reference', model.poReference] : null,
    ].filter(Boolean)
    let metaY = 86
    meta.forEach(([label, value]) => {
      drawText(doc, label, left + width / 2, metaY, 90, { size: 9, color: MUTED })
      metaY += drawText(doc, value, left + width / 2 + 96, metaY, width / 2 - 96, { font: 'Bold', size: 10 }) + 4
    })
    y = Math.max(y, metaY) + 8

    drawText(doc, 'Bill to', left, y, width, { font: 'Bold', size: 9, color: MUTED })
    y += 14
    const clientLines = partyLines(model.client, [
      { key: 'businessName', label: 'Name' },
      { key: 'contactPerson', label: 'Contact' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'billingAddress', label: 'Address' },
      { key: 'taxDetails', label: 'Tax details' },
    ])
    if (clientLines.length === 0) {
      y += drawText(doc, 'Client details not set', left, y, width, { color: MUTED }) + 4
    } else {
      clientLines.forEach((line, index) => {
        y += drawText(doc, index === 0 ? line.value : `${line.label}: ${line.value}`, left, y, width, { font: index === 0 ? 'Bold' : 'Regular', size: 10 }) + 2
      })
    }
    y += 8

    if (model.projectTitle) {
      y += drawText(doc, model.projectTitle, left, y, width, { font: 'Bold', size: 12 }) + 3
    }
    if (model.projectDescription) {
      y += drawText(doc, model.projectDescription, left, y, width, { size: 10 }) + 4
    }
    if (model.lifecycle === 'cancelled') {
      y += drawText(doc, 'This invoice was cancelled and is not collectible. Payment history is retained.', left, y, width, { font: 'Bold', size: 10 }) + 6
    }

    const ensureRow = (needed) => {
      if (y + needed <= contentLimit(doc)) return
      doc.addPage()
      y = continued(28)
    }

    y = drawTableHeader(y)
    model.lines.forEach((line) => {
      const descriptionHeight = textHeight(doc, line.description, columns.desc - 8, 'Regular', 10)
      const rowHeight = Math.max(18, descriptionHeight) + 8
      ensureRow(rowHeight)
      drawText(doc, line.description, left + 6, y + 3, columns.desc - 8, { size: 10, height: descriptionHeight })
      drawText(doc, line.quantity, left + columns.desc, y + 3, columns.qty, { size: 10, align: 'right' })
      drawText(doc, money(line.unitPriceMinor, model.currency), left + columns.desc + columns.qty, y + 3, columns.price - 6, { size: 10, align: 'right' })
      drawText(doc, money(line.lineTotalMinor, model.currency), left + columns.desc + columns.qty + columns.price, y + 3, columns.amount - 6, { size: 10, align: 'right' })
      y += rowHeight
      doc.moveTo(left, y).lineTo(left + width, y).strokeColor(HAIR).lineWidth(0.4).stroke()
    })
    y += 10

    const totalRows = [
      ['Subtotal', money(model.subtotalMinor, model.currency)],
      model.discountMinor > 0 ? [model.discountLabel || 'Discount', `-${money(model.discountMinor, model.currency)}`] : null,
      model.taxMinor > 0 ? [model.taxLabel || 'Tax', money(model.taxMinor, model.currency)] : null,
      ['Invoice total', money(model.totalMinor, model.currency)],
      model.paidMinor > 0 ? ['Paid to date', money(model.paidMinor, model.currency)] : null,
      model.lifecycle === 'cancelled' ? ['Outstanding', 'Not collectible'] : ['Outstanding balance', money(model.outstandingMinor, model.currency)],
    ].filter(Boolean)
    const nextStage = model.milestones.find((item) => item.dueMinor > 0)
    if (nextStage && model.collectible) totalRows.push(['Due at this stage', money(nextStage.dueMinor, model.currency)])
    if (model.overpaidMinor > 0) totalRows.push(['Overpayment', money(model.overpaidMinor, model.currency)])
    if (y + totalRows.length * 18 + 12 > contentLimit(doc)) {
      doc.addPage()
      paintFrame(doc)
      y = 36
    }
    totalRows.forEach(([label, value], index) => {
      const strong = label === 'Invoice total' || label === 'Outstanding balance' || label === 'Due at this stage'
      drawText(doc, label, left + width - 260, y, 140, { font: strong ? 'Bold' : 'Regular', size: 10, align: 'right' })
      drawText(doc, value, left + width - 110, y, 110, { font: 'Bold', size: 10, align: 'right' })
      y += index === totalRows.length - 1 ? 20 : 16
    })

    if (model.milestones.length) {
      const intro = 'Payment schedule. These amounts are portions of the invoice total, not additional charges.'
      const adjustment = model.milestones.some((item) => item.roundingAdjustmentMinor)
      const note = adjustment
        ? `${intro} The last fractional amounts were adjusted so the schedule equals the invoice total.`
        : intro
      const blockHeight = 36 + textHeight(doc, note, width, 'Regular', 9) + model.milestones.length * 28
      if (y + Math.min(blockHeight, 180) > contentLimit(doc)) {
        doc.addPage()
        paintFrame(doc)
        y = 36
      }
      y += 8
      y += drawText(doc, 'Payment schedule', left, y, width, { font: 'Bold', size: 12 }) + 4
      y += drawText(doc, note, left, y, width, { size: 9, color: MUTED }) + 8
      model.milestones.forEach((item, index) => {
        const headline = `${index + 1}. ${item.description}`
        const detail = [
          item.percentBps != null ? `${item.percent}` .includes('%') ? item.percent : `${item.percent}%` : '',
          item.trigger,
          money(item.amountMinor, model.currency),
        ].filter(Boolean).join(' · ')
        const height = textHeight(doc, headline, width, 'Bold', 10) + textHeight(doc, detail, width, 'Regular', 9) + 8
        if (y + height > contentLimit(doc)) {
          doc.addPage()
          paintFrame(doc)
          y = 36
          y += drawText(doc, 'Payment schedule continued', left, y, width, { font: 'Bold', size: 11 }) + 8
        }
        y += drawText(doc, headline, left, y, width, { font: 'Bold', size: 10 }) + 1
        y += drawText(doc, detail, left, y, width, { size: 9, color: MUTED }) + 6
      })
    }

    const sections = [
      model.paymentTerms ? ['Payment terms', model.paymentTerms] : null,
      model.issuer.paymentInstructions ? ['Payment instructions', model.issuer.paymentInstructions] : null,
      model.notes ? ['Notes', model.notes] : null,
      model.terms ? ['Terms', model.terms] : null,
    ].filter(Boolean)
    sections.forEach(([title, body]) => {
      const height = 18 + textHeight(doc, body, width, 'Regular', 10)
      if (y + Math.min(height, 80) > contentLimit(doc)) {
        doc.addPage()
        paintFrame(doc)
        y = 36
      }
      y += 6
      y += drawText(doc, title, left, y, width, { font: 'Bold', size: 11 }) + 3
      y += drawText(doc, body, left, y, width, { size: 10 }) + 4
    })
  }, {
    Title: model.number,
    Author: model.issuer.professionalName || 'Patrick Chukwu',
    Subject: 'Invoice',
  }, compress)
}

export function renderReceiptPdf(receipt, { compress = true } = {}) {
  const model = receipt.snapshot
  return renderPdf((doc) => {
    paintFrame(doc)
    const left = 48
    const width = doc.page.width - 96
    let y = 32
    if (receipt.logoPath && fs.existsSync(receipt.logoPath)) {
      try {
        doc.image(receipt.logoPath, left, y, { fit: [52, 52] })
      } catch {
        // Keep the receipt readable even if the logo file cannot be embedded.
      }
    }
    drawText(doc, 'RECEIPT', left + 64, y, width - 64, { font: 'Bold', size: 18 })
    y += 26
    drawText(doc, model.receiptNumber, left + 64, y, width - 64, { size: 11, color: MUTED })
    y = 100
    const issuer = [model.issuer.professionalName, model.issuer.businessName, model.issuer.email, model.issuer.phone, model.issuer.address].filter(Boolean)
    issuer.forEach((line, index) => {
      y += drawText(doc, line, left, y, width, { font: index === 0 ? 'Bold' : 'Regular', size: 10 }) + 2
    })
    y += 12
    y += drawText(doc, 'Received from', left, y, width, { font: 'Bold', size: 9, color: MUTED }) + 4
    const clientBits = [model.client?.businessName, model.client?.contactPerson, model.client?.email, model.client?.billingAddress].filter(Boolean)
    clientBits.forEach((line, index) => {
      y += drawText(doc, line, left, y, width, { font: index === 0 ? 'Bold' : 'Regular', size: 10 }) + 2
    })
    y += 16
    y += drawText(doc, 'Amount received', left, y, width, { size: 10, color: MUTED }) + 2
    y += drawText(doc, money(model.amountMinor, model.currency), left, y, width, { font: 'Bold', size: 20 }) + 4
    y += drawText(doc, model.amountWords, left, y, width, { size: 11 }) + 12
    if (model.partial) {
      const notice = `This receipt acknowledges only ${money(model.amountMinor, model.currency)} received on ${formatIsoDate(model.receivedOn)}. It does not mean invoice ${model.invoiceNumber} is fully settled. Remaining balance: ${money(model.remainingMinor, model.currency)}.`
      const height = textHeight(doc, notice, width - 16, 'Regular', 10) + 16
      doc.save()
      doc.roundedRect(left, y, width, height, 4).fill(BAND)
      doc.restore()
      drawText(doc, notice, left + 8, y + 8, width - 16, { size: 10, height: height - 16 })
      y += height + 12
    } else {
      y += drawText(doc, `This receipt acknowledges the amount received. Invoice ${model.invoiceNumber} is fully settled.`, left, y, width, { size: 10 }) + 12
    }
    const rows = [
      ['Receipt number', model.receiptNumber],
      ['Payment date', formatIsoDate(model.receivedOn)],
      ['Method', model.methodDetail ? `${model.methodLabel} (${model.methodDetail})` : model.methodLabel],
      model.reference ? ['Transaction reference', model.reference] : null,
      ['Invoice', model.invoiceNumber],
      model.projectTitle ? ['Project', model.projectTitle] : null,
      ['Invoice total', money(model.invoiceTotalMinor, model.currency)],
      ['Paid to date', money(model.paidToDateMinor, model.currency)],
      ['Remaining balance', model.partial ? money(model.remainingMinor, model.currency) : money(0, model.currency)],
    ].filter(Boolean)
    rows.forEach(([label, value]) => {
      const height = Math.max(textHeight(doc, String(value), width - 180, 'Regular', 10), 14)
      if (y + height + 8 > contentLimit(doc)) {
        doc.addPage()
        paintFrame(doc)
        y = 36
      }
      drawText(doc, label, left, y, 160, { size: 10, color: MUTED })
      y += drawText(doc, String(value), left + 170, y, width - 170, { font: 'Bold', size: 10, height }) + 6
    })
    if (receipt.paymentStatus === 'reversed') {
      y += 8
      drawText(doc, 'This payment was later reversed. The receipt number stays the same for the audit trail.', left, y, width, { font: 'Bold', size: 10 })
    }
  }, {
    Title: model.receiptNumber,
    Author: model.issuer?.professionalName || 'Patrick Chukwu',
    Subject: 'Receipt',
  }, compress)
}
