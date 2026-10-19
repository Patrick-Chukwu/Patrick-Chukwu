import { DEFAULT_CURRENCY } from './branding.js'

function assertSafeInteger(value, label) {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${label} is out of range`)
  }
}

export function parseMoneyToMinor(value) {
  if (typeof value !== 'string') throw new Error('Enter an amount like 1500000.00')
  let raw = value.trim().replace(/,/g, '').replace(/\s/g, '')
  raw = raw.replace(/^[₦$£€]/, '')
  if (/^[A-Z]{3}/.test(raw)) raw = raw.slice(3)
  const negative = raw.startsWith('-')
  const body = negative ? raw.slice(1) : raw
  if (!/^\d+(\.\d{1,2})?$/.test(body)) throw new Error('Enter an amount like 1500000.00')
  const [whole, frac = ''] = body.split('.')
  const minor = BigInt(whole) * 100n + BigInt(frac.padEnd(2, '0'))
  if (minor > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Amount is too large')
  return negative ? -Number(minor) : Number(minor)
}

export function parseQuantityToMilli(value) {
  if (typeof value !== 'string') throw new Error('Enter a quantity')
  const raw = value.trim().replace(/,/g, '')
  if (!/^\d+(\.\d{1,3})?$/.test(raw)) throw new Error('Enter a quantity with up to 3 decimal places')
  const [whole, frac = ''] = raw.split('.')
  const milli = BigInt(whole) * 1000n + BigInt(frac.padEnd(3, '0'))
  if (milli <= 0n) throw new Error('Quantity must be greater than zero')
  if (milli > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Quantity is too large')
  return Number(milli)
}

export function parsePercentToBps(value) {
  if (typeof value !== 'string') throw new Error('Enter a percentage')
  const raw = value.trim().replace(/%/g, '').replace(/,/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) throw new Error('Enter a percentage with up to 2 decimal places')
  const [whole, frac = ''] = raw.split('.')
  const bps = Number(BigInt(whole) * 100n + BigInt(frac.padEnd(2, '0')))
  if (bps > 10000) throw new Error('Percentage cannot exceed 100')
  return bps
}

export function minorToInput(minor) {
  assertSafeInteger(minor, 'Amount')
  const negative = minor < 0
  const abs = Math.abs(minor)
  const text = `${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, '0')}`
  return negative ? `-${text}` : text
}

export function milliToInput(milli) {
  assertSafeInteger(milli, 'Quantity')
  const whole = Math.trunc(milli / 1000)
  const frac = milli % 1000
  if (frac === 0) return String(whole)
  return `${whole}.${String(frac).padStart(3, '0').replace(/0+$/, '')}`
}

export function bpsToPercentInput(bps) {
  assertSafeInteger(bps, 'Percentage')
  const whole = Math.trunc(bps / 100)
  const frac = bps % 100
  if (frac === 0) return String(whole)
  return `${whole}.${String(frac).padStart(2, '0').replace(/0+$/, '')}`
}

export function lineTotalMinor(quantityMilli, unitPriceMinor) {
  assertSafeInteger(quantityMilli, 'Quantity')
  assertSafeInteger(unitPriceMinor, 'Unit price')
  const product = BigInt(quantityMilli) * BigInt(unitPriceMinor)
  const sign = product < 0n ? -1n : 1n
  const abs = product < 0n ? -product : product
  return Number(sign * ((abs + 500n) / 1000n))
}

export function percentOfMinor(baseMinor, rateBps) {
  assertSafeInteger(baseMinor, 'Amount')
  assertSafeInteger(rateBps, 'Rate')
  if (baseMinor < 0) throw new Error('Amount cannot be negative')
  const product = BigInt(baseMinor) * BigInt(rateBps)
  return Number((product + 5000n) / 10000n)
}

export function computeTotals({ lines, discountMinor = 0, taxRateBps = 0 }) {
  const subtotalMinor = lines.reduce((sum, line) => sum + line.lineTotalMinor, 0)
  if (!Number.isSafeInteger(discountMinor) || discountMinor < 0) {
    throw new Error('Discount cannot be negative')
  }
  if (discountMinor > subtotalMinor) throw new Error('Discount cannot exceed the subtotal')
  if (!Number.isSafeInteger(taxRateBps) || taxRateBps < 0 || taxRateBps > 10000) {
    throw new Error('Tax rate must be between 0 and 100')
  }
  const taxableMinor = subtotalMinor - discountMinor
  const taxMinor = percentOfMinor(taxableMinor, taxRateBps)
  return {
    subtotalMinor,
    discountMinor,
    taxRateBps,
    taxMinor,
    totalMinor: taxableMinor + taxMinor,
  }
}

export function computePercentMilestones(totalMinor, milestones) {
  if (!Array.isArray(milestones) || milestones.length === 0) {
    throw new Error('Add at least one milestone')
  }
  assertSafeInteger(totalMinor, 'Invoice total')
  if (totalMinor < 0) throw new Error('Invoice total cannot be negative')
  const percentTotal = milestones.reduce((sum, item) => sum + item.percentBps, 0)
  if (percentTotal !== 10000) {
    throw new Error('Milestone percentages must total 100%')
  }
  milestones.forEach((item) => {
    if (!Number.isSafeInteger(item.percentBps) || item.percentBps <= 0) {
      throw new Error('Each milestone percentage must be greater than zero')
    }
  })
  const parts = milestones.map((item, index) => {
    const product = BigInt(totalMinor) * BigInt(item.percentBps)
    return {
      index,
      floor: Number(product / 10000n),
      remainder: Number(product % 10000n),
    }
  })
  let leftover = totalMinor - parts.reduce((sum, part) => sum + part.floor, 0)
  const order = [...parts].sort((a, b) => b.remainder - a.remainder || a.index - b.index)
  const extra = new Map()
  order.forEach((part) => {
    if (leftover <= 0) return
    extra.set(part.index, (extra.get(part.index) || 0) + 1)
    leftover -= 1
  })
  return milestones.map((item, index) => {
    const amountMinor = parts[index].floor + (extra.get(index) || 0)
    const naive = percentOfMinor(totalMinor, item.percentBps)
    return {
      ...item,
      amountMinor,
      roundingAdjustmentMinor: amountMinor - naive,
    }
  })
}

export function paymentPosition({ lifecycle, totalMinor, paidMinor, dueDate, today }) {
  const remainder = Math.max(0, totalMinor - paidMinor)
  const outstandingMinor = lifecycle === 'cancelled' ? 0 : remainder
  const collectible = lifecycle === 'issued'
  const overdue = Boolean(collectible && outstandingMinor > 0 && dueDate && dueDate < today)
  const partial = Boolean(collectible && paidMinor > 0 && outstandingMinor > 0)
  let status = lifecycle
  if (lifecycle === 'issued') {
    if (paidMinor >= totalMinor) status = 'paid'
    else if (overdue) status = 'overdue'
    else if (partial) status = 'partially_paid'
    else status = 'issued'
  }
  return {
    status,
    outstandingMinor,
    overdue,
    partial,
    collectible,
    overpaidMinor: Math.max(0, paidMinor - totalMinor),
  }
}

export function formatMinor(minor, currency = DEFAULT_CURRENCY) {
  assertSafeInteger(minor, 'Amount')
  const negative = minor < 0
  const abs = Math.abs(minor)
  const whole = Math.trunc(abs / 100)
  const frac = String(abs % 100).padStart(2, '0')
  const grouped = new Intl.NumberFormat('en-NG').format(whole)
  let symbol = currency
  try {
    const parts = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(0)
    symbol = parts.find((part) => part.type === 'currency')?.value || currency
  } catch {
    symbol = currency
  }
  const body = symbol.length > 1 ? `${symbol} ${grouped}.${frac}` : `${symbol}${grouped}.${frac}`
  return negative ? `-${body}` : body
}

export function statusMatches(position, filter) {
  if (!filter) return true
  if (filter === 'partially_paid') return position.partial || position.status === 'partially_paid'
  if (filter === 'overdue') return position.overdue
  return position.status === filter
}
