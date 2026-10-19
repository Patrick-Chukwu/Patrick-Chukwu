import {
  bpsToPercentInput,
  computePercentMilestones,
  computeTotals,
  formatMinor,
  lineTotalMinor,
  milliToInput,
  parseMoneyToMinor,
  parsePercentToBps,
  parseQuantityToMilli,
  percentOfMinor,
} from '../../shared/money.js'
import { formatIsoDate } from '../../shared/dates.js'
import { STATUS_LABELS } from '../../shared/branding.js'

function completeLines(lines) {
  return lines.filter((line) => line.description.trim() && line.quantity.trim() && line.unitPrice.trim()).map((line) => {
    const quantityMilli = parseQuantityToMilli(line.quantity.trim())
    const unitPriceMinor = parseMoneyToMinor(line.unitPrice.trim())
    if (unitPriceMinor < 0) throw new Error('Unit price cannot be negative')
    const lineTotal = lineTotalMinor(quantityMilli, unitPriceMinor)
    return {
      description: line.description.trim(),
      quantity: milliToInput(quantityMilli),
      unitPriceMinor,
      lineTotalMinor: lineTotal,
    }
  })
}

function scheduleFrom(form, totalMinor) {
  if (form.milestoneMode === 'none' || form.milestones.length === 0) {
    return { milestones: [], message: '' }
  }
  if (form.milestoneMode === 'percent') {
    const parsed = form.milestones.filter((item) => item.description.trim() || item.percent.trim()).map((item) => ({
      description: item.description.trim() || 'Milestone',
      trigger: item.trigger.trim(),
      percentBps: parsePercentToBps(item.percent.trim() || '0'),
      percent: item.percent.trim(),
    }))
    if (parsed.some((item) => item.percentBps <= 0)) {
      return { milestones: parsed.map((item) => ({ ...item, amountMinor: 0, dueMinor: 0, roundingAdjustmentMinor: 0 })), message: 'Each milestone percentage must be greater than zero.' }
    }
    try {
      const milestones = computePercentMilestones(totalMinor, parsed).map((item) => ({
        ...item,
        percent: bpsToPercentInput(item.percentBps),
        dueMinor: item.amountMinor,
      }))
      const adjusted = milestones.some((item) => item.roundingAdjustmentMinor)
      return {
        milestones,
        message: adjusted ? 'The final milestone includes a rounding adjustment so the schedule matches the invoice total.' : '',
      }
    } catch (error) {
      return {
        milestones: parsed.map((item) => ({
          ...item,
          amountMinor: percentOfMinor(totalMinor, item.percentBps),
          dueMinor: percentOfMinor(totalMinor, item.percentBps),
          roundingAdjustmentMinor: 0,
        })),
        message: error.message,
      }
    }
  }
  const milestones = form.milestones.filter((item) => item.description.trim() || item.amount.trim()).map((item) => {
    const amountMinor = parseMoneyToMinor(item.amount.trim() || '0')
    return {
      description: item.description.trim() || 'Milestone',
      trigger: item.trigger.trim(),
      percentBps: null,
      percent: '',
      amountMinor,
      dueMinor: amountMinor,
      roundingAdjustmentMinor: 0,
    }
  })
  const sum = milestones.reduce((total, item) => total + item.amountMinor, 0)
  return {
    milestones,
    message: sum === totalMinor ? '' : 'Milestone amounts must equal the invoice total before issuing.',
  }
}

export function formToPreview(form, { number = 'Draft', logoUrl } = {}) {
  try {
    const lines = completeLines(form.lines)
    const discountMinor = form.discount.trim() ? parseMoneyToMinor(form.discount.trim()) : 0
    const taxRateBps = form.taxRate.trim() ? parsePercentToBps(form.taxRate.trim()) : 0
    const totals = computeTotals({ lines, discountMinor, taxRateBps })
    const schedule = scheduleFrom(form, totals.totalMinor)
    return {
      ok: true,
      model: {
        number,
        status: 'draft',
        statusLabel: STATUS_LABELS.draft,
        currency: form.currency || 'NGN',
        issueDate: formatIsoDate(form.issueDate),
        dueDate: formatIsoDate(form.dueDate),
        issuer: form.issuer,
        client: form.client,
        projectTitle: form.projectTitle,
        projectDescription: form.projectDescription,
        poReference: form.poReference,
        paymentTerms: form.paymentTerms,
        notes: form.notes,
        terms: form.terms,
        lines,
        ...totals,
        discountLabel: form.discountLabel,
        taxLabel: form.taxLabel,
        paidMinor: 0,
        outstandingMinor: totals.totalMinor,
        overpaidMinor: 0,
        cancelled: false,
        milestones: schedule.milestones,
        scheduleMessage: schedule.message,
        logoUrl,
      },
    }
  } catch (error) {
    return { ok: false, message: error.message }
  }
}

export function invoiceToPreview(invoice) {
  let remaining = invoice.paidMinor
  const milestones = invoice.milestones.map((item) => {
    const applied = Math.min(Math.max(item.amountMinor, 0), remaining)
    remaining -= applied
    return { ...item, dueMinor: Math.max(0, item.amountMinor - applied) }
  })
  const adjusted = milestones.some((item) => item.roundingAdjustmentMinor)
  return {
    ok: true,
    model: {
      number: invoice.number,
      status: invoice.status,
      statusLabel: STATUS_LABELS[invoice.status] || invoice.status,
      currency: invoice.currency,
      issueDate: formatIsoDate(invoice.issueDate),
      dueDate: formatIsoDate(invoice.dueDate),
      issuer: invoice.issuer,
      client: invoice.client,
      projectTitle: invoice.projectTitle,
      projectDescription: invoice.projectDescription,
      poReference: invoice.poReference,
      paymentTerms: invoice.paymentTerms,
      notes: invoice.notes,
      terms: invoice.terms,
      lines: invoice.lines,
      subtotalMinor: invoice.subtotalMinor,
      discountMinor: invoice.discountMinor,
      discountLabel: invoice.discountLabel,
      taxMinor: invoice.taxMinor,
      taxLabel: invoice.taxLabel,
      totalMinor: invoice.totalMinor,
      paidMinor: invoice.paidMinor,
      outstandingMinor: invoice.outstandingMinor,
      overpaidMinor: invoice.overpaidMinor,
      cancelled: invoice.lifecycle === 'cancelled',
      milestones,
      scheduleMessage: adjusted ? 'The final milestone includes a rounding adjustment so the schedule matches the invoice total.' : '',
      logoUrl: invoice.logoUrl,
    },
  }
}

export function money(minor, currency) {
  return formatMinor(minor || 0, currency || 'NGN')
}
