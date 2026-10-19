import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { amountInWords } from './words.js'

describe('amount in words', () => {
  it('spells naira amounts used on receipts', () => {
    assert.equal(amountInWords(75000000, 'NGN'), 'Seven hundred and fifty thousand naira only')
    assert.equal(amountInWords(150000000, 'NGN'), 'One million five hundred thousand naira only')
    assert.equal(amountInWords(150, 'NGN'), 'One naira and fifty kobo only')
  })
})
