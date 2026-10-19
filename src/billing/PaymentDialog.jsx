import { useState } from 'react'
import { PAYMENT_METHODS } from '../../shared/branding.js'
import { todayISO } from '../../shared/dates.js'
import { formatMinor } from '../../shared/money.js'
import { api } from './api.js'
import { Banner, Modal, TextArea, TextInput, inputClass, primaryButton, secondaryButton } from './ui.jsx'

export default function PaymentDialog({ invoice, onClose, onSaved }) {
  const [idempotencyKey] = useState(() => crypto.randomUUID())
  const [form, setForm] = useState({
    amount: '',
    receivedOn: todayISO(),
    method: 'bank_transfer',
    methodDetail: '',
    reference: '',
    notes: '',
    confirmOverpayment: false,
  })
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [needsConfirm, setNeedsConfirm] = useState(false)

  async function submit(confirmOverpayment = form.confirmOverpayment) {
    setPending(true)
    setError('')
    try {
      const result = await api(`/api/billing/invoices/${invoice.id}/payments`, {
        method: 'POST',
        idempotencyKey: confirmOverpayment ? `${idempotencyKey}-over` : idempotencyKey,
        body: { ...form, confirmOverpayment },
      })
      onSaved(result.invoice)
    } catch (err) {
      if (err.code === 'OVERPAYMENT') {
        setNeedsConfirm(true)
        setError(`This is more than the outstanding balance of ${formatMinor(err.payload.details?.outstandingMinor || 0, invoice.currency)}.`)
      } else {
        setError(err.message)
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal title='Record payment' onClose={onClose}>
      <form className='flex flex-col gap-3' onSubmit={(event) => { event.preventDefault(); submit(false) }}>
        <p className='text-sm text-secondary'>Outstanding {formatMinor(invoice.outstandingMinor, invoice.currency)} on {invoice.number}. Recording a payment does not happen when an invoice is viewed or downloaded.</p>
        {error ? <Banner>{error}</Banner> : null}
        <TextInput label='Amount received' inputMode='decimal' required value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
        <TextInput label='Date received' type='date' required value={form.receivedOn} onChange={(event) => setForm({ ...form, receivedOn: event.target.value })} />
        <label className='text-sm text-secondary flex flex-col gap-1'>Method
          <select className={inputClass} value={form.method} onChange={(event) => setForm({ ...form, method: event.target.value })}>
            {PAYMENT_METHODS.map((method) => <option key={method.id} value={method.id}>{method.label}</option>)}
          </select>
        </label>
        {form.method === 'other' ? <TextInput label='Describe the method' value={form.methodDetail} onChange={(event) => setForm({ ...form, methodDetail: event.target.value })} /> : null}
        <TextInput label='Transaction reference (optional)' value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} />
        <TextArea label='Internal notes (not printed on the receipt)' value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
        <div className='flex justify-end gap-2'>
          <button type='button' className={secondaryButton} onClick={onClose}>Cancel</button>
          <button type='submit' className={primaryButton} disabled={pending}>{pending ? 'Saving…' : 'Save payment'}</button>
        </div>
      </form>
      {needsConfirm ? (
        <div className='mt-4 border border-ash rounded-md p-3'>
          <p className='text-sm mb-3'>Confirm the overpayment. The extra is stored separately and does not increase the invoice total.</p>
          <button type='button' className={primaryButton} disabled={pending} onClick={() => submit(true)}>Record overpayment</button>
        </div>
      ) : null}
    </Modal>
  )
}
