import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  bpsToPercentInput,
  computePercentMilestones,
  computeTotals,
  formatMinor,
  lineTotalMinor,
  parseMoneyToMinor,
  parsePercentToBps,
  parseQuantityToMilli,
  paymentPosition,
} from './money.js'

describe('money', () => {
  it('parses naira display strings into minor units', () => {
    assert.equal(parseMoneyToMinor('1500000.00'), 150000000)
    assert.equal(parseMoneyToMinor('₦1,500,000.00'), 150000000)
    assert.equal(parseMoneyToMinor('750000'), 75000000)
  })

  it('rounds line totals half up from milli quantities', () => {
    assert.equal(lineTotalMinor(parseQuantityToMilli('2.5'), parseMoneyToMinor('100.00')), 25000)
    assert.equal(lineTotalMinor(parseQuantityToMilli('0.001'), parseMoneyToMinor('5.00')), 1)
  })

  it('applies optional discount and tax without defaults', () => {
    const totals = computeTotals({
      lines: [{ lineTotalMinor: 10000 }],
      discountMinor: 1000,
      taxRateBps: parsePercentToBps('7.5'),
    })
    assert.equal(totals.subtotalMinor, 10000)
    assert.equal(totals.taxMinor, 675)
    assert.equal(totals.totalMinor, 9675)
    const plain = computeTotals({ lines: [{ lineTotalMinor: 150000000 }] })
    assert.equal(plain.discountMinor, 0)
    assert.equal(plain.taxMinor, 0)
    assert.equal(plain.totalMinor, 150000000)
  })

  it('splits ₦1,500,000 as 50/30/20 without a rounding drift', () => {
    const total = parseMoneyToMinor('1500000.00')
    const milestones = computePercentMilestones(total, [
      { percentBps: parsePercentToBps('50') },
      { percentBps: parsePercentToBps('30') },
      { percentBps: parsePercentToBps('20') },
    ])
    assert.deepEqual(milestones.map((item) => item.amountMinor), [75000000, 45000000, 30000000])
    assert.equal(milestones.reduce((sum, item) => sum + item.amountMinor, 0), total)
    assert.deepEqual(milestones.map((item) => item.roundingAdjustmentMinor), [0, 0, 0])
    assert.equal(formatMinor(milestones[0].amountMinor), '₦750,000.00')
    assert.equal(formatMinor(total), '₦1,500,000.00')
  })

  it('puts the remainder on the largest fractional milestone', () => {
    const milestones = computePercentMilestones(100, [
      { percentBps: 3333 },
      { percentBps: 3333 },
      { percentBps: 3334 },
    ])
    assert.deepEqual(milestones.map((item) => item.amountMinor), [33, 33, 34])
    assert.equal(milestones.reduce((sum, item) => sum + item.amountMinor, 0), 100)
    assert.notEqual(milestones[2].roundingAdjustmentMinor, 0)
    assert.equal(bpsToPercentInput(3333), '33.33')
  })

  it('rejects milestone percentages that are not 100%', () => {
    assert.throws(() => computePercentMilestones(10000, [{ percentBps: 5000 }, { percentBps: 4000 }]), /100%/)
  })

  it('never marks a draft overdue and drops cancelled balances', () => {
    const draft = paymentPosition({
      lifecycle: 'draft',
      totalMinor: 100,
      paidMinor: 0,
      dueDate: '2000-01-01',
      today: '2026-10-16',
    })
    assert.equal(draft.status, 'draft')
    assert.equal(draft.overdue, false)
    const cancelled = paymentPosition({
      lifecycle: 'cancelled',
      totalMinor: 100,
      paidMinor: 40,
      dueDate: '2000-01-01',
      today: '2026-10-16',
    })
    assert.equal(cancelled.status, 'cancelled')
    assert.equal(cancelled.outstandingMinor, 0)
    assert.equal(cancelled.collectible, false)
  })
})
