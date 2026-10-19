import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { formatIsoDate } from '../../shared/dates.js'
import { api } from './api.js'
import InvoicePreview from './InvoicePreview.jsx'
import PaymentDialog from './PaymentDialog.jsx'
import { invoiceToPreview } from './preview-model.js'
import { Banner, Modal, Money, StatusBadge, TextArea, primaryButton, secondaryButton, dangerButton } from './ui.jsx'

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reverseId, setReverseId] = useState('')
  const [reason, setReason] = useState('')

  function load() {
    return api(`/api/billing/invoices/${id}`).then(setInvoice).catch((err) => setError(err.message))
  }

  useEffect(() => {
    let active = true
    api(`/api/billing/invoices/${id}`).then((payload) => {
      if (active) setInvoice(payload)
    }).catch((err) => {
      if (active) setError(err.message)
    })
    return () => { active = false }
  }, [id])

  async function run(action) {
    setPending(true)
    setError('')
    setMessage('')
    try {
      await action()
    } catch (err) {
      setError(err.message)
    } finally {
      setPending(false)
    }
  }

  if (!invoice && !error) return <p>Loading invoice…</p>
  if (!invoice) return <Banner>{error}</Banner>

  return (
    <div className='flex flex-col gap-4'>
      <div className='no-print flex flex-wrap items-center justify-between gap-3'>
        <div>
          <p className='text-sm text-secondary'>{invoice.number}</p>
          <div className='flex items-center gap-2'><h2 className='text-white text-xl'>{invoice.client.businessName || 'Invoice'}</h2><StatusBadge status={invoice.status} /></div>
        </div>
        <div className='flex flex-wrap gap-2'>
          {invoice.lifecycle === 'draft' ? <Link className={primaryButton} to={`/billing/invoices/${invoice.id}/edit`}>Edit draft</Link> : null}
          <a className={secondaryButton} href={`/api/billing/invoices/${invoice.id}/pdf`}>Download PDF</a>
          <button type='button' className={secondaryButton} onClick={() => window.print()}>Print</button>
          <button type='button' className={secondaryButton} disabled={pending} onClick={() => run(async () => {
            const copy = await api(`/api/billing/invoices/${invoice.id}/duplicate`, { method: 'POST' })
            navigate(`/billing/invoices/${copy.id}/edit`)
          })}>Duplicate</button>
          {invoice.lifecycle !== 'draft' ? <button type='button' className={secondaryButton} disabled={pending} onClick={() => run(async () => {
            const copy = await api(`/api/billing/invoices/${invoice.id}/revise`, { method: 'POST' })
            navigate(`/billing/invoices/${copy.id}/edit`)
          })}>Revise</button> : null}
          {invoice.lifecycle === 'issued' ? <button type='button' className={primaryButton} onClick={() => setPayOpen(true)}>Record payment</button> : null}
          {invoice.lifecycle === 'issued' ? <button type='button' className={dangerButton} onClick={() => { setReason(''); setCancelOpen(true) }}>Cancel invoice</button> : null}
          {invoice.lifecycle === 'draft' ? <button type='button' className={dangerButton} disabled={pending} onClick={() => run(async () => {
            if (!window.confirm('Delete this draft?')) return
            await api(`/api/billing/invoices/${invoice.id}`, { method: 'DELETE' })
            navigate('/billing/invoices')
          })}>Delete draft</button> : null}
        </div>
      </div>
      {error ? <Banner>{error}</Banner> : null}
      {message ? <Banner tone='success'>{message}</Banner> : null}
      {invoice.supersedesInvoiceId ? <p className='text-sm no-print'>This draft revises <Link className='underline' to={`/billing/invoices/${invoice.supersedesInvoiceId}`}>another invoice</Link>. The original stays unchanged until you cancel it.</p> : null}
      <InvoicePreview preview={invoiceToPreview(invoice)} />
      <section className='no-print border border-bcolor rounded-lg p-4'>
        <h3 className='text-white font-medium mb-3'>Payments and receipts</h3>
        {invoice.payments.length === 0 ? <p className='text-secondary'>No payments recorded. A receipt is created only after you save a payment.</p> : (
          <ul className='flex flex-col gap-3'>
            {invoice.payments.map((payment) => (
              <li key={payment.id} className='border border-bcolor rounded-md p-3 flex flex-col gap-2'>
                <div className='flex flex-wrap justify-between gap-2'>
                  <span><Money minor={payment.amountMinor} currency={invoice.currency} /> · {formatIsoDate(payment.receivedOn)} · {payment.methodLabel}</span>
                  <span>{payment.status === 'reversed' ? 'Reversed' : 'Recorded'}</span>
                </div>
                {payment.reference ? <p className='text-sm'>Reference {payment.reference}</p> : null}
                {payment.overpaymentMinor > 0 ? <p className='text-sm'>Includes overpayment of <Money minor={payment.overpaymentMinor} currency={invoice.currency} /></p> : null}
                {payment.notes ? <p className='text-sm text-greylight'>Internal note: {payment.notes}</p> : null}
                {payment.status === 'reversed' ? <p className='text-sm'>Reversal: {payment.reversalReason}</p> : null}
                <div className='flex flex-wrap gap-2'>
                  {payment.receipt ? <a className={secondaryButton} href={`/api/billing/receipts/${payment.receipt.id}/pdf`}>Download {payment.receipt.number}</a> : null}
                  {payment.status === 'recorded' && !payment.receipt ? (
                    <button type='button' className={primaryButton} disabled={pending} onClick={() => run(async () => {
                      const receipt = await api(`/api/billing/payments/${payment.id}/receipt`, { method: 'POST' })
                      setMessage(`Receipt ${receipt.number} issued.`)
                      await load()
                    })}>Generate receipt</button>
                  ) : null}
                  {payment.status === 'recorded' ? (
                    <button type='button' className={dangerButton} onClick={() => { setReverseId(payment.id); setReason('') }}>Reverse</button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      {payOpen ? <PaymentDialog invoice={invoice} onClose={() => setPayOpen(false)} onSaved={(next) => { setInvoice(next); setPayOpen(false); setMessage('Payment recorded.') }} /> : null}
      {cancelOpen ? (
        <Modal title='Cancel invoice' onClose={() => setCancelOpen(false)}>
          <p className='text-sm text-secondary mb-3'>Cancellation keeps payments and receipts. The balance is no longer collectible.</p>
          <TextArea label='Reason' value={reason} onChange={(event) => setReason(event.target.value)} />
          <div className='flex justify-end gap-2 mt-3'>
            <button type='button' className={secondaryButton} onClick={() => setCancelOpen(false)}>Back</button>
            <button type='button' className={dangerButton} disabled={pending} onClick={() => run(async () => {
              const next = await api(`/api/billing/invoices/${invoice.id}/cancel`, { method: 'POST', body: { reason } })
              setInvoice(next)
              setCancelOpen(false)
              setMessage('Invoice cancelled.')
            })}>Cancel invoice</button>
          </div>
        </Modal>
      ) : null}
      {reverseId ? (
        <Modal title='Reverse payment' onClose={() => setReverseId('')}>
          <p className='text-sm text-secondary mb-3'>The payment stays in the history. If a receipt was issued, it is kept and no longer counts toward the balance.</p>
          <TextArea label='Reason' value={reason} onChange={(event) => setReason(event.target.value)} />
          <div className='flex justify-end gap-2 mt-3'>
            <button type='button' className={secondaryButton} onClick={() => setReverseId('')}>Back</button>
            <button type='button' className={dangerButton} disabled={pending} onClick={() => run(async () => {
              const next = await api(`/api/billing/payments/${reverseId}/reverse`, { method: 'POST', body: { reason } })
              setInvoice(next)
              setReverseId('')
              setMessage('Payment reversed.')
            })}>Reverse payment</button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
